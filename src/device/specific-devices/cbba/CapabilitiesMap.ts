class CapabilitiesMap {
  private deviceId: number
  private deviceCapabilities: string[]
  private deviceToCapMap!: Map<number, Set<string>>
  private capToDeviceMap!: Map<string, Set<number>>

  constructor(deviceId: number, deviceCapabilities: string[]) {
    this.deviceId = deviceId
    this.deviceCapabilities = deviceCapabilities
    this.reset()
  }

  public copy(): CapabilitiesMap {
    const newMap = new CapabilitiesMap(this.deviceId, this.deviceCapabilities)
    newMap.deviceToCapMap = new Map<number, Set<string>>()

    for (const [key, value] of this.deviceToCapMap) {
      newMap.deviceToCapMap.set(key, new Set<string>(value))
    }

    newMap.capToDeviceMap = new Map<string, Set<number>>()

    for (const [key, value] of this.capToDeviceMap) {
      newMap.capToDeviceMap.set(key, new Set<number>(value))
    }

    return newMap
  }

  public reset() {
    this.deviceToCapMap = new Map<number, Set<string>>()
    this.capToDeviceMap = new Map<string, Set<number>>()

    this.deviceToCapMap.set(this.deviceId, new Set([...this.deviceCapabilities]))
    this.deviceCapabilities.forEach((capability) => this.capToDeviceMap.set(capability, new Set([this.deviceId])))
  }

  public add(deviceId: number, capabilities: string[]) {
    const existentCapabilities: Set<string> = this.deviceToCapMap.get(deviceId) ?? new Set<string>()
    capabilities.forEach((c) => existentCapabilities.add(c))
    this.deviceToCapMap.set(deviceId, existentCapabilities)

    this.deviceCapabilities.forEach((capability) => {
      const existentDevices: Set<number> = this.capToDeviceMap.get(capability) ?? new Set<number>()
      existentDevices.add(deviceId)
      this.capToDeviceMap.set(capability, existentDevices)
    })
  }

  public remove(deviceId: number) {
    this.deviceToCapMap.delete(deviceId)

    for (const [_, devices] of this.capToDeviceMap) {
      devices.delete(deviceId)
    }
  }
}

export default CapabilitiesMap