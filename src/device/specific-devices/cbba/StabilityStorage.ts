import Node from '../../../node'

class StabilityStorage {
  private mtbfMap: Map<number, [number, number]>
  private deviceFails: number

  constructor() {
    this.mtbfMap = new Map<number, [number, number]>()
    this.deviceFails = 0
  }

  public updateOnFail(nodes: Node[]) {
    nodes.forEach(
      (node) => {
        if (this.mtbfMap.has(node.id)) {
          const currentVal = this.mtbfMap.get(node.id)!
          this.mtbfMap.set(node.id, [currentVal[0], currentVal[1] + 1])
        } else {
          this.mtbfMap.set(node.id, [0, 1])
        }
      }
    )

    this.deviceFails++
  }

  public getDeviceFails() {
    return this.deviceFails
  }
  

  public getFailPercentage(nodeId: number): number {
    if (!this.mtbfMap.has(nodeId)) {
      return 0
    }
    const [succs, fails] = this.mtbfMap.get(nodeId)!

    return fails / (succs + fails)
  }

  public getFailCount(nodeId: number): number {
    if (!this.mtbfMap.has(nodeId)) {
      return 0
    }
    return this.mtbfMap.get(nodeId)![1]
  }

  public getFailAvg(): number {
    let res = 0

    for (const [_, [_2, failCount]] of this.mtbfMap) {
      res += failCount 
    }

    return this.mtbfMap.size === 0 ? 0 : res / this.mtbfMap.size
  }

  public getFailPercAverage(): number {
    let res = 0

    for (const [_, [succCount, failCount]] of this.mtbfMap) {
      res += failCount/(failCount + succCount) 
    }

    return this.mtbfMap.size === 0 ? 0 : res / this.mtbfMap.size
  }

  public getFailVariance(): number {
    const avg = this.getFailPercAverage()
    let variance = 0

    for (const [_, [succCount, failCount]] of this.mtbfMap) {
      const failAvg: number = failCount/(failCount + succCount) 
      variance += (avg - failAvg) * (avg - failAvg)
    }

    return this.mtbfMap.size <= 1 ? 0 : variance / (this.mtbfMap.size - 1)
  }

  public getStateString(): string {
    let result = 'MTBF: '

    for (const [key, _value] of this.mtbfMap) {
      result += `${key} - ${this.getFailPercentage(key)} | `
    }

    result += `avg: ${this.getFailPercAverage()} var: ${this.getFailVariance()}`

    return result
  }

  public updateOnSucess(nodes: Node[]) {
    nodes.forEach(
      (node) => {
        if (this.mtbfMap.has(node.id)) {
          const currentVal = this.mtbfMap.get(node.id)!
          this.mtbfMap.set(node.id, [currentVal[0] + 1, currentVal[1]])
        } else {
          this.mtbfMap.set(node.id, [1, 0])
        }
      }
    )
  }
}

export default StabilityStorage