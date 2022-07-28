
import Device from '../device/device'
import JSONAble from '../jsonable'
import { Metrics } from '../metrics'
import Node from '../node'
import MQTTBroker from '../comms/mqtt/MQTT'
import MQTTBrokerImplementation from '../comms/mqtt/MQTTBrokerImplementation'
import Orchestrator from '../orchestrator/orchestrator'
import OrchestratorDevice from '../device/specific-devices/elections/orchestratorDevice'
import Behaviour from '../behaviours/device/behaviour'

class Scenario implements JSONAble {

    public name: string
    private metrics!: Metrics

    public nodes: Node[]
    public devices: Device[]
    public uptime: number
    public mqttBroker: MQTTBroker

    private customBehaviour: (scenario: Scenario) => void
    private orchBehaviours: Behaviour[]
    public centralOrchestrator!: Orchestrator
    private noOrchestrator: boolean

    constructor(name: string, nodes: Node[], devices: Device[], customBehaviour: (scenario: Scenario) => void = (scenario: Scenario) => null, orchestratorBehaviours: Behaviour[] = [], noOrchestrator: boolean = false) {
        this.name = name
        this.nodes = nodes
        this.devices = devices
        this.customBehaviour = customBehaviour
        this.uptime = 0
        this.mqttBroker = new MQTTBrokerImplementation()
        this.orchBehaviours = orchestratorBehaviours
        this.noOrchestrator = noOrchestrator
    }

    public async run(params: { version?: string, verbose?: boolean, logConsole?: boolean, logCsv?: boolean, timeLimit?: number } = {}) {
        console.log(`Running ${this.name} scenario`)
        setInterval(() => {
            if (params.timeLimit && this.uptime >= params.timeLimit) {
                this.stop()
            }
            this.uptime++
        }, 1000)

        const logging: any = {}

        if (params.logCsv) {
            logging.logCsv = params.logCsv
        }

        if (params.logConsole) {
            logging.logConsole = params.logConsole
        }
    
        if(!this.noOrchestrator) {
            const orchestratorDevice: OrchestratorDevice = new OrchestratorDevice(-1, { capabilities: [], syncBehaviours: [], asyncBehaviours: this.orchBehaviours }, params.version || 'v5', true)
            this.centralOrchestrator = orchestratorDevice.ownOrchestrator
            // this.devices.unshift(orchestratorDevice)
            orchestratorDevice.start(this, this.mqttBroker)
            this.centralOrchestrator.reset(this.nodes)
        }

        this.metrics = new Metrics(this, params.version, this.devices, this.nodes, logging)
        this.metrics.run()
        this.startDevices()
        if (this.customBehaviour) {
            await this.customBehaviour(this)
        }
    }

    public startDevices(): void {
        for (const device of this.devices) {
            if(device.id !== -1) {
                device.start(this, this.mqttBroker)
            }
        }
    }

    public stop(): void {
        // Add stop logic
        console.log('Time limit exceeded. Stopping.')
        process.exit(0)
    }

    public toJSON(): Object {
        return {
            name: this.name,
            nodes: this.nodes.map((n) => n.toJSON()),
            devices: this.devices.map((d) => d.toJSON()),
        }
    }

    static fromJSON(json: string) {
        const data = JSON.parse(json)
        const nodes: Node[] = data.nodes.map((n: any) => Node.fromJSON(n))
        const devices: Device[] = data.devices.map((d: any) => Device.fromJSON(d))
        return new Scenario(data.name, nodes, devices) //TODO: check
    }
}

export { Scenario }
