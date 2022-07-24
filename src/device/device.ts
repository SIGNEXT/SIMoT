import Behaviour from "../behaviours/device/behaviour";
import { DeviceResponse } from "./response";
import { sleepSeconds, getRandom } from "../utils";
import * as behaviours from "../behaviours/device";
import { Scenario } from "../scenarios/scenario";
import MQTTBroker, { MQTTClient } from "../comms/mqtt/MQTT";
import { DeviceParams, DeviceProperties, DeviceState, DeviceStateReport, DeviceStatus } from "./deviceTypes";
import Node from "../node";
import winston from "winston";
import Orchestrator from "../orchestrator/orchestrator";

const DEFAULT_FLASH_SIZE = 99999;
const DEFAULT_RAM_SIZE = 99999;

class Device {

    public readonly id: number;
    public properties: DeviceProperties;
    public state: DeviceState;
    private scenario: Scenario | null;
    protected mqttClient: MQTTClient | null;
    protected mqttBroker: MQTTBroker | null;
    protected logger!: any;
    protected perceivedOrchestrator: Orchestrator | null;

    constructor(
        id: number,
        params: DeviceParams
    ) {

        this.id = id;
        this.properties = {
            id: id,
            capabilities: params.capabilities,
            syncBehaviours: params.syncBehaviours ?? [],
            asyncBehaviours: params.asyncBehaviours ?? [],
            onAssignBehaviours: params.onAssignBehaviours ?? [],
            resources: {
                flashSize: params.flashSize ?? DEFAULT_FLASH_SIZE,
                totalRam: params.totalRam ?? DEFAULT_RAM_SIZE
            }
        };

        // Initialize properties and setup behaviours
        this.state = {
            status: DeviceStatus.ON,
            assignedNodes: [],
            uptime: 0,
            resources: {
                freeRam: this.properties.resources.totalRam,
                allocRam: 0,
            },
            runInterval: null,
            lastPayload: null,
        }

        this.scenario = null;
        this.mqttClient = null;
        this.mqttBroker = null;
        this.perceivedOrchestrator = null;
        this.setupLogger()
        this.setupBehaviours();
    }

    public turnOff(fail = false): void {
        this.state.status = DeviceStatus.OFF;
        this.state.uptime = 0;
        this.mqttClient?.disconnect(fail);
        if (this.state.runInterval) {
            clearInterval(this.state.runInterval);
            this.state.runInterval = null;
        }
        this.properties.asyncBehaviours.forEach((b: Behaviour) => b.stop());
        this.onStop();
        console.log(`Turned off device ${this.id}`)
    }

    public turnOn(fail = false): void {
        this.state.status = DeviceStatus.ON;
        this.state.uptime = 0;
        this.mqttClient = this.mqttClient ? this.mqttClient.connect() : this.mqttBroker!.connect();
        this.run();
        this.startAsyncBehaviours();
        this.onStart(fail);
        console.log(`Turned on device ${this.id}`)
    }

    public restart(bootTimeMs: number = 1000, fail = false): void {
        this.turnOff(fail);
        setTimeout(() => { this.turnOn(fail) }, bootTimeMs);
    }

    public async rpc(command: string, args: any = {}): Promise<any> {
        await this.asyncResponseTimer();
        switch (command) {
            case "setNodes":
                return this.setNodes(args.nodes);
            case "checkHealth":
                return this.checkHealth();
            default:
                return;
        }
    }

    // Setup run interval, start async behaviours and announce itself
    public start(scenario: Scenario, broker: MQTTBroker) {
        this.scenario = scenario;
        this.mqttBroker = broker;
        this.perceivedOrchestrator = scenario.centralOrchestrator;
        this.turnOn();
    }

    public run(): void {
        if (this.state.runInterval) return;
        this.state.runInterval = setInterval(() => {
            this.state.uptime++;
            // Run tasks
            this.properties.syncBehaviours.forEach((b: Behaviour) => b.run());
        }, 1000);
    }
    
    protected onStart(fail: boolean = false): Promise<void> {
        return Promise.resolve();
    }

    protected onStop(): Promise<void> {
        this.clearNodes();
        return Promise.resolve();
    }

    protected calculateAssignmentFootprint(nodes: Node[]): [number, number] {
        const [payloadSize, ramSize] = nodes.reduce(
            (acc: [number, number], node: Node): [number, number] => [acc[0] + node.properties.payloadSize, acc[1] + node.properties.ramSize],
            [0, 0]
        );

        return [payloadSize, ramSize]
    }

    private setupBehaviours(): void {
        [...this.properties.syncBehaviours, ...this.properties.asyncBehaviours, ...this.properties.onAssignBehaviours].forEach((b) => b.setDevice(this));
    }

    private startAsyncBehaviours(): void {
        this.properties.asyncBehaviours.forEach((b: Behaviour) => b.run());
    }

    protected clearNodes(): void {
        this.state.assignedNodes = [];
        this.state.resources.freeRam = this.properties.resources.totalRam;
        this.state.resources.allocRam = 0;
    }

    protected setNodes(nodes: Node[]): DeviceResponse {

        if (this.scenario === null) {
            return DeviceResponse.fail();
        }

        if (this.state.status === DeviceStatus.OFF)
            return DeviceResponse.fail();

        this.clearNodes();

        const [payloadSize, ramSize] = this.calculateAssignmentFootprint(nodes);

        this.state.lastPayload = { size: payloadSize, time: this.scenario.uptime };

        if (payloadSize > this.properties.resources.flashSize || ramSize > this.state.resources.freeRam) {
            this.restart(2000, true);
            return DeviceResponse.memError();
        }

        this.state.assignedNodes = [...nodes];
        this.state.resources = {
            allocRam: ramSize,
            freeRam: this.properties.resources.totalRam - ramSize
        }

        for (const behaviour of this.properties.onAssignBehaviours) {
            behaviour.run();
        }

        return DeviceResponse.success();
    }

    protected async checkHealth(): Promise<DeviceResponse> {
        if (this.state.status === DeviceStatus.OFF)
            return Promise.resolve(DeviceResponse.fail());

        const report = this.generateReport();
        return DeviceResponse.success(report);
    }

    protected generateReport(): DeviceStateReport {
        return {
            "id": this.id,
            "uptime": this.state.uptime,
            "assigned_nodes": this.state.assignedNodes.map((node: Node) => node.id),
            "nr_nodes": this.state.assignedNodes.length,
            "last_payload_size": this.state.lastPayload ? this.state.lastPayload.size : null,
            "last_payload_t": this.state.lastPayload ? this.state.lastPayload.time : -1,
            resources: { ... this.state.resources, ...this.properties.resources },
        };
    }

    // Helper

    private async asyncResponseTimer(): Promise<unknown> {
        return sleepSeconds(getRandom(.5, 2));
    }

    public toJSON(): any {
        return {
            id: this.id,
            capabilities: this.properties.capabilities,
            syncBehaviours: this.properties.syncBehaviours.map((b: Behaviour) => b.toJSON()),
            asyncBehaviours: this.properties.asyncBehaviours.map((b: Behaviour) => b.toJSON()),
            resources: {
                flashSize: this.properties.resources.flashSize,
                totalRam: this.properties.resources.totalRam,
            },
        };
    }

    public static fromJSON(deviceData:
        {
            id: number,
            capabilities: string[],
            syncBehaviours: any[],
            asyncBehaviours: any[],
            resources: {
                flashSize: number,
                totalRam: number
            }
        }): Device {
        return new Device(deviceData.id,
            {
                capabilities: deviceData.capabilities,
                syncBehaviours: deviceData.syncBehaviours.map((behaviour: { data: any, type: string }) => behaviours.behaviours[behaviour.type].fromJSON(behaviour.data)),
                asyncBehaviours: deviceData.asyncBehaviours.map((behaviour: any) => behaviours.behaviours[behaviour.type].fromJSON(behaviour.data)),
                ...deviceData.resources,
            }
        );
    }

    static getNull(): Device {
        return new this(-1, { capabilities: [] });
    }

    private setupLogger() {
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.File({ filename: `logs/${this.id}.log`, options: { flags: 'w' }, eol: '\n' },),
            ],
        });
    }
}

export default Device;