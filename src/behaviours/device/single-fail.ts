import Behaviour from './behaviour'

const DEFAULT_FAIL = 1000
const DEFAULT_BOOT_TIME = 2000

class SingleFailBehaviour extends Behaviour {

    private hasFailed: boolean
    private memError: boolean
    private bootTime: number
    private timeToFailure: number

    constructor(timeToFailure = DEFAULT_FAIL, bootTime = DEFAULT_BOOT_TIME, memError = false) {
        super()
        this.timeToFailure = timeToFailure
        this.bootTime = bootTime
        this.memError = memError
        this.hasFailed = false
    }

    override run(): void {
        if (this.hasFailed) return
        setTimeout(() => {
            this.device.turnOff(this.memError)
            this.hasFailed = true
            if (this.bootTime > 0) {
                setTimeout(() => { this.device.turnOn(this.memError) }, this.bootTime)
            }
        }, this.timeToFailure)
    }

    override toJSON() {
        return {
            type: 'SingleFailBehaviour',
            failIn: this.timeToFailure,
            bootTime: this.bootTime,
            memError: this.memError,
        }
    }

    static fromJSON(jsonData: { failIn: number, bootTime: number, memError: boolean }) {
        return new SingleFailBehaviour(jsonData.failIn, jsonData.bootTime, jsonData.memError)
    }
}

export { SingleFailBehaviour }