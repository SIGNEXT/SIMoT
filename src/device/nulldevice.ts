import Device from './device'

class NullDevice extends Device {

  constructor() {
    super(-1, { capabilities: []})
  }

  public turnOff(): void {
    return
  }

  public turnOn(fail = false): void {
    return
  }

  public restart(bootTimeMs: number = 1000): void {
    return
  }
}

export { NullDevice }