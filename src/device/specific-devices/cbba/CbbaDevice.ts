import { Message } from '../../../comms/mqtt/MQTT'
import Device from '../../device'
import Node from '../../../node'
import { DeviceParams, DeviceStatus } from '../../deviceTypes'
import CbbaAuction from './auction/CbbaAuction'
import BundleScoreCalculator, { v0_maxFirst } from './score/BundleScore'
import sha1 from 'sha1'
import { difference, sleep } from '../../../utils'
import { randomInt } from 'crypto'
import StabilityStorage from './StabilityStorage'

type DeviceAnnouncement = {
  device: number,
  capabilities: string[]
  newArrival: boolean
}

type DeviceLWT = {
  device: number,
  tasks: number[]
}

class CbbaDevice extends Device {
  // Auction related
  // private ongoingAuction: CbbaAuction | null
  private ongoingAuctionId: string | null
  private scoreCalculator: BundleScoreCalculator

  // Config
  private readonly MAX_RETRIES = 1
  private reorchestrateOnJoin: boolean
  private fullyReorchestrateOnFail: boolean

  constructor(
    id: number,
    params: DeviceParams,
    scoreCalculator: BundleScoreCalculator = v0_maxFirst,
    reorchestrateOnJoin = false,
    fullyReorchestrateOnFail = false
  ) {
    super(id, params)
    this.state.ongoingAuction = null
    this.ongoingAuctionId = null
    this.scoreCalculator = scoreCalculator
    
    this.reorchestrateOnJoin = reorchestrateOnJoin
    this.fullyReorchestrateOnFail = fullyReorchestrateOnFail
    
    this.state.currentFlow = []
    this.state.stabilityStorage = new StabilityStorage()
  }

  override async onStart(fail: boolean = false): Promise<void> {
    await super.onStart(fail)
    this.mqttClient?.setLwt({ device: this.id,  tasks: [] })

    // Update persistent storage
    if (fail) {
      this.state.stabilityStorage.updateOnFail(this.state.assignedNodes)
    }
  
    this.state.currentFlow = []
    this.clearNodes()
    this.resetAuctionVariables()
    await this.publishAnnouncement(false, false)
    await this.setupSubscriptions()
  }

  override async onStop(): Promise<void> {
    this.stopOngoingAuction('Turning OFF')
  }

  private stopOngoingAuction(reason: string = '') {
    this.state.ongoingAuction?.stop(reason)
    this.resetAuctionVariables()
  }

  private async handleNewTasks(tasks: Node[]) {
    if (tasks.length === 0) return
    this.clearNodes()
    const auctionId: string = sha1(tasks.reduce((prev: string, current: Node) => prev + current.id, ''))
    const auctionValid = this.validateAuction(auctionId)

    if (!auctionValid) return
    this.state.currentFlow = tasks
    this.ongoingAuctionId = auctionId

    const [success, assignedTasks] = await this.doAuction(auctionId, tasks)

    if (this.state.status === DeviceStatus.OFF || !success) {
      this.logger.debug(`Tasks not allocated because ${this.state.status.toString()} or ${success} `)
      return
    }

    this.assignTasks([...assignedTasks])
  }

  private async handleNewDevice(msg: Message) {
    const deviceAnnouncement: DeviceAnnouncement = msg.data

    if (deviceAnnouncement.device === this.id) {
      return
    }

    if (this.reorchestrateOnJoin) {
      await this.handleNewTasks(this.state.currentFlow)
    }
  }

  private async handleFailingDevice(msg: Message) {
    const deviceLwt: DeviceLWT = msg.data

    // Don't respond to own fail or if no knowledge of deployment
    if (deviceLwt.device === this.id) {
      return
    }

    // Get device tasks
    const tasks: Node[] = this.getTasksFromIds(deviceLwt.tasks)

    if (tasks.length === 0) return
    
    if (this.fullyReorchestrateOnFail) {
      this.logger.info('Doing full auction')
      await this.handleNewTasks(this.state.currentFlow)
      return
    }

    const auctionId: string = sha1(tasks.reduce((prev: string, current: Node) => prev + current.id, ''))
    const auctionValid = this.validateAuction(auctionId)

    if (!auctionValid) return

    this.ongoingAuctionId = auctionId
    this.logger.info('Doing auction for failed tasks')
    const currentNodes =  [...this.state.assignedNodes]
    const [success, assignedTasks] = await this.doAuction(auctionId, tasks, currentNodes)

    if (this.state.status === DeviceStatus.OFF) return
    
    if (!success) {
      this.logger.info('Auction for failed tasks failed')
      await this.handleNewTasks(this.state.currentFlow)
      return
    }

    this.assignTasks([...assignedTasks, ...currentNodes])
  }

  private async doAuction(auctionId: string, tasks: Node[], currentTasks: Node[] = []): Promise<[boolean, Node[]]> {
    let assignedTasks: Node[] = []
    let success: boolean = false
    let stopped: boolean = false

    for (let retryCount = 0; retryCount < this.MAX_RETRIES && this.ongoingAuctionId && this.ongoingAuctionId === auctionId && this.state.status !== DeviceStatus.OFF; retryCount++) {
      this.state.ongoingAuction = new CbbaAuction(
        auctionId,
        this.id,
        this.properties,
        this.state,
        tasks,
        currentTasks,
        this.mqttClient!,
        this.scoreCalculator,
        this.logger);

      [success, stopped, assignedTasks] = await this.state.ongoingAuction.run()

      if (success || stopped) {
        this.logger.info(`Auction ${this.ongoingAuctionId} (succ: ${success} | stopped: ${stopped}).`)
        break
      } 
      this.logger.info(`Auction ${auctionId} unsuccessful ${retryCount + 1}/${this.MAX_RETRIES}`)
    }

    this.resetAuctionVariables()
    return [success, assignedTasks]
  }

  private async publishAnnouncement(newArrival = false, wait: boolean = false) {
    if (wait) await sleep(randomInt(1000, 2000))
    await this.mqttClient?.publish('ANNOUNCEMENTS', { device: this, newArrival: newArrival })
  }

  private async setupSubscriptions() {
    await this.subscribeToTasks(this.reorchestrateOnJoin)
    await this.mqttClient?.subscribe('ANNOUNCEMENTS', this.handleNewDevice.bind(this))
    await this.mqttClient?.subscribe('LWT', this.handleFailingDevice.bind(this))
  }

  private async subscribeToTasks(runOrchestration: boolean = false) {
    const [res, message] = await this.mqttClient!.subscribeAndGetRetained('TASKS', (msg) => this.handleNewTasks(msg.data))
    if (res && message) {
      this.state.currentFlow = message.data
      if(runOrchestration) {
        console.log('AQUI')
        await this.handleNewTasks(message.data)
      }
    }
  }

  private validateAuction(auctionId: string): boolean {
    if (this.state.ongoingAuction !== null) {
      this.stopOngoingAuction(`New auction ${auctionId}`)
      this.logger.info('Stopped ongoing auction.')
    }
    return true
  }

  private assignTasks(tasks: Node[]) {
    this.resetAuctionVariables()

    if (tasks.length === 0 || difference(tasks, this.state.assignedNodes).length === 0) {
      return
    }
    const lwt: DeviceLWT = {device: this.id, tasks: tasks.map((n) => n.id)}
    this.mqttClient?.setLwt(lwt)
    this.setNodes(tasks)
  }

  private resetAuctionVariables() {
    this.state.ongoingAuction = null
    this.ongoingAuctionId = null
  }

  override turnOff(_fail?: boolean): void {
    // Force sending LWT  
    super.turnOff(true)
  }

  private getTasksFromIds(taskIds: number[]): Node[] {
    const tasks = []
    for (const task of taskIds) {
      for (const node of this.state.currentFlow) {
        if (node.id === task) {
          tasks.push(node)
        }
      }
    }

    return tasks
  }
}

export default CbbaDevice