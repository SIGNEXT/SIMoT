import OrchestratorDevice from '../../device/specific-devices/elections/orchestratorDevice'
import Behaviour from './behaviour'

class OrchestratorFailBehaviour extends Behaviour {

    private hasFailed: boolean

    constructor() {
        super()
        this.hasFailed = false
    }

    override run(): void {
        if (this.hasFailed) return
        const orchDevice = this.device as OrchestratorDevice

        orchDevice.ownOrchestrator.shouldFail = true
        this.hasFailed = true
    }

    override toJSON() {
        return {
            type: 'OrchestratorFailBehaviour',
        }
    }

    static fromJSON() {
        return new OrchestratorFailBehaviour()
    }
}

export { OrchestratorFailBehaviour }