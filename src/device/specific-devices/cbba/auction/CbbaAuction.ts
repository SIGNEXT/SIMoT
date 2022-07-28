import { difference, getMsTimestamp, indexOfMaxes, initMap, sleep } from '../../../../utils'
import Node from '../../../../node'
import { Message, MQTTClient } from '../../../../comms/mqtt/MQTT'
import { DeviceProperties, DeviceState } from '../../../deviceTypes'
import { randomInt } from 'crypto'
import BundleScoreCalculator from '../score/BundleScore'

// z is winning devices, y is winning bids, b is bundle, t is win timestamp. Names used to conform with Choi et al. publication
type Beliefs = {
  z: Map<number, number>
  y: Map<number, number>
  b: Node[]
  t: Map<number, number>
}

type TaskAuctionState = {
  taskId: number
  z: number,
  y: number,
  t: number
}

enum RebroadcastDecision {
  SELF,
  INCOMING,
  EMPTY,
  NONE,
}

type TaskBidInfo = { senderId: number, auctionId: string } & TaskAuctionState

const NONE = -1

class CbbaAuction {
  public static internalIdCounter = 0
  public internalID: number = CbbaAuction.internalIdCounter++
  public id: string
  private stopReason: string
  private i: number //device id
  private deviceProperties: DeviceProperties
  private deviceState: DeviceState
  private tasks: Node[]
  private currentTasks: Node[]
  private mqttClient: MQTTClient
  private storedBeliefs: Beliefs
  private bundleScoreCalculator: BundleScoreCalculator
  private round = 0

  private incomingBuffer1: Map<number, TaskBidInfo> // taskId -> taskBid
  private incomingBuffer2: Map<number, TaskBidInfo> // taskId -> taskBid
  private incomingBuffer: Map<number, TaskBidInfo> // taskId -> taskBid
  private outgoingBuffer: Map<number, TaskBidInfo>

  private readonly UNCHANGED_COUNT: number = 4
  private readonly eT: number = 1
  private logger: any
  private stopped: boolean = false

  constructor(
    id: string,
    currentDeviceId: number,
    deviceProperties: DeviceProperties,
    deviceState: DeviceState,
    tasks: Node[],
    currentTasks: Node[],
    mqttClient: MQTTClient,
    bundleScoreCalculator: BundleScoreCalculator,
    logger: any
  ) {
    // Input
    this.id = id
    this.i = currentDeviceId
    this.tasks = tasks
    this.currentTasks = currentTasks
    this.deviceState = deviceState
    this.bundleScoreCalculator = bundleScoreCalculator
    this.deviceProperties = deviceProperties
    this.mqttClient = mqttClient
    
    // Helper
    this.incomingBuffer1 = new Map()
    this.incomingBuffer2 = new Map()
    this.incomingBuffer = this.incomingBuffer1
    this.outgoingBuffer = new Map()
    this.logger = logger
    this.stopReason = ''
    const taskIds = tasks.map((task: Node) => task.id)
    this.storedBeliefs = {
      z: initMap(taskIds, NONE),
      y: initMap(taskIds, 0),
      b: [],
      t: initMap(taskIds, 0)
    }
  }

  public async run(): Promise<[boolean, boolean, Node[]]> {
    await this.mqttClient?.subscribe('CONSENSUS', this.handleIncomingBid.bind(this))
    let unchanged = 0
    console.log(`Device ${this.i} started auction ${this.id}  ${this.internalID}`)

    while(unchanged < this.UNCHANGED_COUNT && !this.stopped) {
      const previousWinners = new Map(this.storedBeliefs.z)
      await this.updateBeliefs()
      this.buildBundle(this.storedBeliefs)

      if (this.stopped) continue

      await this.publishAuctionBeliefs()
      await sleep(randomInt(100, 300)) // TODO: remove awkward timing

      if (this.logger) this.logBeliefs(this.round)
      unchanged = this.areBeliefsEqual(previousWinners) ? unchanged + 1 : 0
      this.round++
    }

    const unassigned = Array.from(this.storedBeliefs.z.values()).filter((val) => val === -1)
    const success = unassigned.length === 0 && !this.stopped
    console.log(this.getStateString(this.round, success, this.stopped))
    // this.mqttClient?.unsubscribe('CONSENSUS')
    return [success && !this.stopped, this.stopped, this.storedBeliefs.b]
  }

  private buildBundle(beliefs: Beliefs) {
    const newZ: Map<number, number> = new Map(beliefs.z)
    const newY: Map<number, number> = new Map(beliefs.y)
    const newT: Map<number, number> = new Map(beliefs.t)
    const newB: Node[] = [...beliefs.b]

    while (true) {
      const nonChosenTasks: Node[] = difference(this.tasks, newB)
      if (nonChosenTasks.length === 0) break
      
      const scoreArray: number[] = nonChosenTasks.map((node: Node) => this.bundleScoreCalculator(newB, this.currentTasks, node, this.deviceProperties, this.deviceState))
      const newMaxes: number[] = scoreArray.map((score, index) => score > newY.get(nonChosenTasks[index].id)! ? 1 : 0)
      const [bestTaskIndexes, bestScore] = indexOfMaxes(newMaxes.map((val, index) => val * scoreArray[index]))

      if (bestScore <= 0)  break
       
      // Choose at random from similar ranked tasks
      // const bestTask = nonChosenTasks[bestTaskIndexes[0]]
      // TODO: change to random
      const bestTask = nonChosenTasks[bestTaskIndexes[Math.floor(Math.random()*bestTaskIndexes.length)]]
      
      const bidTimestamp = getMsTimestamp()
      newZ.set(bestTask.id, this.i)
      newY.set(bestTask.id, bestScore)
      newT.set(bestTask.id, bidTimestamp)
      newB.push(bestTask)
      this.outgoingBuffer.set(bestTask.id,
        {
          auctionId: this.id,
          senderId: this.i,
          taskId: bestTask.id,
          z: this.i,
          y: bestScore,
          t: bidTimestamp,
        }
      )
    }

    this.storedBeliefs = { z: newZ, y: newY, t: newT, b: newB }
  }

  private async publishAuctionBeliefs() {
    for (const [_taskId, bid] of this.outgoingBuffer) {
      await this.rebroadcastBelief(bid)
    }
    this.outgoingBuffer.clear()
  }

  private async rebroadcastBelief(bid: TaskBidInfo) {
    await this.mqttClient.publish('CONSENSUS', bid, false)
  }

  private async handleIncomingBid(msg: Message) {
    const bid: TaskBidInfo = msg.data

    if (bid.senderId === this.i || bid.auctionId !== this.id || this.stopped) {
      return
    }

    this.incomingBuffer.set(bid.taskId, bid)
  }

  private async updateBeliefs() {
    const buffer = this.incomingBuffer
    this.switchBuffers()
    for (const [taskId, kBid] of buffer) {
      await this.updateTaskBeliefs(kBid, {
        taskId: taskId,
        z: this.storedBeliefs.z.get(taskId)!,
        y: this.storedBeliefs.y.get(taskId)!,
        t: this.storedBeliefs.t.get(taskId)!,
      })
    }

    buffer.clear()
  }

  private switchBuffers() {
    if (this.incomingBuffer == this.incomingBuffer1) {
      this.incomingBuffer = this.incomingBuffer2
    } else {
      this.incomingBuffer = this.incomingBuffer1
    }
  }

  private areBeliefsEqual(prev: Map<number, number>): boolean {
    for (const [key, value] of this.storedBeliefs.z) {
      if (prev.get(key) !== value) {
        return false
      }
    }

    return true
  }

  public stop(reason: string) {
    this.stopped = true
    this.stopReason = reason
  }

  private logBeliefs(round?: number) {
    let state = ''

    for (const task of this.tasks) {
      state += `(${task.id}-${this.storedBeliefs.z.get(task.id)}|${this.storedBeliefs.y.get(task.id)}|${this.storedBeliefs.t.get(task.id)}) `
    }

    this.logger.info(`---(${this.internalID}) Round ${round ?? '?'}: ${state}`)
  }

  private getStateString(round: number,success: boolean, stopped: boolean): string {
    let state = `Device ${this.i} finished auction (${this.id} - ${this.internalID}) (sucessful=${success}) (stopped=${stopped} - ${this.stopReason}}) (round ${round})`
    const unassigned: number[] = []
    const assigned: number[] = this.storedBeliefs.b.map((n) => n.id)
    
    if (success) {
      state += `\n. local assigned: ${assigned.length === 0 ? 'None' : assigned}(/${this.tasks.length}) \t`

      for (const [key, value] of this.storedBeliefs.z) {
        if (value === NONE) {
          unassigned.push(key)
        }
      }
      state += `. global unassigned: ${unassigned.length === 0 ? 'None' : unassigned}`
  
    }
    
    return state
  }

  /*
    BELIEF UPDATE
  */


  // i is receiver, k is sender. Names used to conform with Choi et al. publication
  private async updateTaskBeliefs(kBid: TaskBidInfo, taskLocalState: TaskAuctionState) {
    const j = kBid.taskId
    const k = kBid.senderId
    const i = this.i
    let rebroadcastDecision = RebroadcastDecision.SELF

    if (kBid.z === k) {
      if (taskLocalState.z === i) {
        const ykj = kBid.y
        const yij = taskLocalState.y
        if (ykj > yij) {
          this.update(j, kBid)
          rebroadcastDecision = RebroadcastDecision.INCOMING
        } else if (ykj === yij && kBid.z < taskLocalState.z) {
          this.update(j, kBid)
          rebroadcastDecision = RebroadcastDecision.INCOMING
        } else if (ykj < yij) {
          this.storedBeliefs.t.set(j, getMsTimestamp())
          rebroadcastDecision = RebroadcastDecision.SELF
        }
      } else if (taskLocalState.z === k) {
        const tkj = kBid.t
        const tij = taskLocalState.t
        if (tkj > tij) {
          this.update(j, kBid)
          rebroadcastDecision = RebroadcastDecision.INCOMING
        } else if (Math.abs(tkj - tij) < this.eT) {
          rebroadcastDecision = RebroadcastDecision.NONE
        } else if (tkj < tij) {
          rebroadcastDecision = RebroadcastDecision.NONE
        }
      } else if (taskLocalState.z === NONE) {
        this.update(j, kBid)
        rebroadcastDecision = RebroadcastDecision.INCOMING
      } else {
        const ykj = kBid.y
        const tkj = kBid.t
        const yij = taskLocalState.y
        const tij = taskLocalState.t

        if (ykj > yij && tkj >= tij) {
          this.update(j, kBid)
          rebroadcastDecision = RebroadcastDecision.INCOMING
        } else if (ykj < yij && tkj <= tij) {
          rebroadcastDecision = RebroadcastDecision.SELF
        } else if (ykj == yij) {
          rebroadcastDecision = RebroadcastDecision.SELF
        } else if (ykj < yij && tkj > tij) {
          this.update(j, kBid)
          rebroadcastDecision = RebroadcastDecision.INCOMING
        } else if (ykj > yij && tkj < tij) {
          this.update(j, kBid)
          rebroadcastDecision = RebroadcastDecision.INCOMING
        }
      }
    } else if (kBid.z === i) {
      if (taskLocalState.z === i) {
        const tkj = kBid.t
        const tij = taskLocalState.t
        if (Math.abs(tkj - tij) < this.eT) {
          rebroadcastDecision = RebroadcastDecision.NONE
        }
      } else if (taskLocalState.z === k) {
        this.reset(j)
        rebroadcastDecision = RebroadcastDecision.EMPTY
      } else if (taskLocalState.z === NONE) {
        rebroadcastDecision = RebroadcastDecision.EMPTY
      } else {
        rebroadcastDecision = RebroadcastDecision.SELF
      }
    } else if (kBid.z === NONE) {
      if (taskLocalState.z === i) {
        rebroadcastDecision = RebroadcastDecision.SELF
      } else if (taskLocalState.z === k) {
        this.update(j, kBid)
        rebroadcastDecision = RebroadcastDecision.INCOMING
      } else if (taskLocalState.z === NONE) {
        rebroadcastDecision = RebroadcastDecision.NONE
      } else {
        const tkj = kBid.t
        const tij = taskLocalState.t
        if (tkj > tij) {
          this.update(j, kBid)
          rebroadcastDecision = RebroadcastDecision.INCOMING
        }
      }
    } else {
      if (taskLocalState.z === i) {
        const ykj = kBid.y
        const yij = taskLocalState.y
        if (ykj > yij) {
          this.update(j, kBid)
          rebroadcastDecision = RebroadcastDecision.INCOMING
        } else if (ykj === yij && kBid.z < taskLocalState.z) {
          this.update(j, kBid)
          rebroadcastDecision = RebroadcastDecision.INCOMING
        } else if (ykj < yij) {
          this.storedBeliefs.t.set(j, getMsTimestamp())
          rebroadcastDecision = RebroadcastDecision.SELF
        }
      } else if (taskLocalState.z === k) {
        this.update(j, kBid)
        rebroadcastDecision = RebroadcastDecision.INCOMING
      } else if (taskLocalState.z === NONE) {
        this.update(j, kBid)
        rebroadcastDecision = RebroadcastDecision.INCOMING
      } else if (taskLocalState.z === kBid.z) {
        const tkj = kBid.t
        const tij = taskLocalState.t
        if (tkj > tij) {
          this.update(j, kBid)
          rebroadcastDecision = RebroadcastDecision.INCOMING
        } else if (Math.abs(tkj - tij) < this.eT) {
          rebroadcastDecision = RebroadcastDecision.NONE
        } else if (tkj < tij) {
          rebroadcastDecision = RebroadcastDecision.SELF
        }
      } else {
        const ykj = kBid.y
        const tkj = kBid.t
        const yij = taskLocalState.y
        const tij = taskLocalState.t

        if (ykj > yij && tkj >= tij) {
          this.update(j, kBid)
          rebroadcastDecision = RebroadcastDecision.INCOMING
        } else if (ykj < yij && tkj <= tij) {
          rebroadcastDecision = RebroadcastDecision.SELF
        } else if (ykj < yij && tkj > tij) {
          this.update(j, kBid)
          rebroadcastDecision = RebroadcastDecision.INCOMING
        } else if (ykj > yij && tkj < tij) {
          rebroadcastDecision = RebroadcastDecision.SELF
        }
      }
    }

    switch (rebroadcastDecision) {
      case RebroadcastDecision.INCOMING:
        this.outgoingBuffer.set(j, kBid)
        break
      case RebroadcastDecision.SELF:
        const selfBid: TaskBidInfo = {
          auctionId: this.id,
          senderId: i,
          taskId: j,
          z: taskLocalState.z,
          y: taskLocalState.y,
          t: this.storedBeliefs.t.get(j)!
        }
        this.outgoingBuffer.set(j, selfBid)
        break
      case RebroadcastDecision.EMPTY:
        break
      case RebroadcastDecision.NONE:
        break
    }
  }

  private update(j: number, beliefs: TaskBidInfo) {
    let spliceIndex = Infinity
    for (let index = 0; index < this.storedBeliefs.b.length; index++) {
      const task = this.storedBeliefs.b[index]
      if (task.id === j) {
        spliceIndex = index
      } else if (index > spliceIndex) {
        this.storedBeliefs.z.set(task.id, NONE)
        this.storedBeliefs.y.set(task.id, 0)
        this.storedBeliefs.t.set(task.id, 0)
        this.outgoingBuffer.set(task.id, {taskId: task.id, senderId: this.i, auctionId: this.id, z: NONE, y: 0, t: 0})
      }
    }
    if (this.logger) this.logger.info(`(${this.internalID}) Updated task ${j}-Sender:${beliefs.senderId}-Z:${beliefs.z}-Y:${beliefs.y}-T:${beliefs.t}`)

    if (spliceIndex < Infinity) {
      this.storedBeliefs.b.splice(spliceIndex)
    }

    this.storedBeliefs.z.set(j, beliefs.z)
    this.storedBeliefs.y.set(j, beliefs.y)
    this.storedBeliefs.t.set(j, beliefs.t)
  }

  private reset(j: number) {
    this.update(j, {
      auctionId: this.id,
      senderId: -1,
      taskId: j,
      z: NONE,
      y: 0,
      t: 0
    })
  }

  private printBeliefs() {
    let Z = 'Z: '
    let Y = 'Y: '
    let T = 'T: '
    for (const [key, value] of this.storedBeliefs.z) {
      const tString = this.storedBeliefs.t.get(key)!.toString()
      Z += `(${key})-${value} `
      Y += `(${key})-${this.storedBeliefs.y.get(key)!} `
      T += `(${key})-${tString.substring(tString.length - 6)} `
    }
    console.log(`-- Report dev ${this.i} round ${this.round}`)
    console.log(Z)
    console.log(Y)
    console.log(T)
  }

}

export default CbbaAuction