import Device from '../device'
import { DeviceAnnouncement, DeviceParams } from '../deviceTypes'

class BasicDevice extends Device {
  constructor(
    id: number,
    params: DeviceParams,
  ) {
    super(id, params)
  }

  override async onStart(fail: boolean = false): Promise<void> {
    const announcement: DeviceAnnouncement = { failure: fail, device: this }
    await this.mqttClient?.publish('ANNOUNCE', announcement)
    return Promise.resolve()
  }
}

export default BasicDevice