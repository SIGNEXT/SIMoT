import Device from '../../device/device'
import JSONAble from '../../jsonable'

abstract class Behaviour implements JSONAble{
    protected interval: NodeJS.Timeout | null
    protected device: Device

    constructor(interval: NodeJS.Timeout | null = null) {
        this.interval = interval
        this.device = Device.getNull()
    }
    
    public setDevice(device: Device): void {
        this.device = device
    }

    public stop() {
        if (this.interval) {
            clearInterval(this.interval)
            this.interval = null
        }
    }

    public abstract toJSON(): Object

    public abstract run(): void
}

export default Behaviour