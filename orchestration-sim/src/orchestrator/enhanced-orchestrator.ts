import Device from "../device/device";
import { DeviceAnnouncement, DeviceStateReport, DeviceStatus } from "../device/deviceTypes";
import { DeviceResponseStatus } from "../device/response";
import Node from "../node";
import { AssignmentStrategy } from "../strategies/assignment/assignment-strategy";
import { getStrategies } from "../strategies";
import MQTTBroker, { Message, MQTTClient, SubscriptionCallback } from "../comms/mqtt/MQTT";
import OrchestratorBehaviour from "../behaviours/orchestrator/orchestratorBehaviour";
import Orchestrator from "./orchestrator";
import { EnhancedDeviceData } from "./deviceData";
import { getRandom, sleepSeconds } from "../utils";
import OrchestratorDevice from "../device/specific-devices/elections/orchestratorDevice";
// nodeId -> deviceId
type NodeDeviceMTBFInfo = { ticks: number, fails: number, mtbf: number | null };
type NodeDeviceMTBFMap = Map<number, Map<number, NodeDeviceMTBFInfo>>;

class EnhancedOrchestrator extends Orchestrator {
    public thisId = -1;
    private assignmentStrategy!: AssignmentStrategy;
    public shouldReorchestrate!: boolean;
    public shouldFail!: boolean;
    private startupLock!: boolean;
    public score!: number;
    public failedDevices!: Set<number>;
    private healthCheckInterval?: NodeJS.Timeout;
    private reorchestrationInterval?: NodeJS.Timeout;

    public nodeMTBF!: NodeDeviceMTBFMap;

    constructor(
        version: string,
        nodes: Node[],
        mqttBroker: MQTTBroker | null,
        { verbose = false } = {},
        behaviours: OrchestratorBehaviour[] = [],
        enclosedDevice: OrchestratorDevice | null = null) {

        super(version, nodes, mqttBroker, { verbose }, behaviours, enclosedDevice);
        this.setupVersion(version);
        this.reset(nodes);
    }

    public override reset(nodes: Node[] = []) {
        super.reset(nodes)
        this.shouldReorchestrate = false;
        this.score = -1;
        this.failedDevices = new Set();
        this.setupNodeMTBF();

        if (this.nodes && this.nodes.length > 0) {
            this.mqttClient?.publish("FLOW", nodes, true);
        }
    }

    public override stop(forced: boolean = false): Promise<void> {
        if (this.verbose) {
            console.log('Stopping orchestrator');
        }

        if (this.healthCheckInterval)
            clearInterval(this.healthCheckInterval);

        if (this.reorchestrationInterval)
            clearInterval(this.reorchestrationInterval);

        if (this.mqttClient)
            this.mqttClient.disconnect(forced);

        return Promise.resolve()
    }

    public override async run(): Promise<void> {
        if (this.verbose) {
            console.log('Starting orchestrator');
        }

        this.startupLock = true;
        setTimeout(() => this.startupLock = false, 3000)

        this.setupAnnouncementListener();

        if (this.nodes && this.nodes.length === 0) {
            const [_, message] = await this.mqttClient!.subscribeAndGetRetained("FLOW", (msg: Message) => Promise.resolve());
            this.mqttClient?.unsubscribe("FLOW");
            if (message !== null) {
                this.nodes = message.data;
                this.setupNodeMTBF();
            }
        }

        this.healthCheckInterval = setInterval(() => {
            this.checkHealth();
        }, 3000);

        this.reorchestrationInterval = setInterval(() => {
            if (this.shouldReorchestrate && !this.assigning && !this.startupLock) {
                if (this.shouldFail) {
                    this.enclosedDevice?.turnOff(true);
                    return Promise.resolve();
                }

                this.assignmentStrategy.distributeFlow();
            }
        }, 500);

        this.behaviours.forEach(
            (behaviour: OrchestratorBehaviour) => {
                behaviour.run();
            }
        )
        return Promise.resolve();
    }

    public override async rpc(command: string, args: any = {}): Promise<any> {
        await this.asyncResponseTimer();
        switch (command) {
            case "announce":
                return this.announce(args.device, args.failure);
            default:
                return;
        }
    }

    private setupAnnouncementListener(): void {

        const callback: SubscriptionCallback = async (msg: Message) => {
            const announcement: DeviceAnnouncement = msg.data;
            this.announce(announcement.device, announcement.failure);
        };
        if (this.mqttClient)
            this.mqttClient.subscribe("ANNOUNCE", callback);
    }

    private setupVersion(version: string): void {
        const strat: {
            assignment: any;
        } = getStrategies(version);
        this.assignmentStrategy = new strat.assignment(this);
    }

    private setupNodeMTBF(): void {
        this.nodeMTBF = new Map<number, Map<number, NodeDeviceMTBFInfo>>();

        for (const node of this.nodes) {
            this.nodeMTBF.set(node.id, new Map<number, NodeDeviceMTBFInfo>());
        }
    }

    private handleNewDeviceAnnounce(device: Device): void {
        this.deviceRegistry.set(device.id, device);
        this.currDeviceState.set(device.id, {
            id: device.id,
            capabilities: device.properties.capabilities,
            status: device.state.status,
            lastAssignment: [],
            totalUptime: 0,
            uptime: 0,
            mtbf: 0,
            fails: 0,
            detectedFail: false,
            resources: { ...device.state.resources, ...device.properties.resources },
            memoryErrorNodes: 0 // TODO: check
        });
    }

    private handleOldDeviceAnnounce(device: Device, failure: boolean): void {
        const currDeviceStateObj: EnhancedDeviceData = this.currDeviceState.get(device.id)!;
        const totalUptime = currDeviceStateObj.totalUptime + currDeviceStateObj.uptime;
        const memErrorNodesCount = failure ? currDeviceStateObj.lastAssignment.length : currDeviceStateObj.memoryErrorNodes

        // Update device perceived state
        this.currDeviceState.set(device.id, {
            ...currDeviceStateObj,
            id: device.id,
            status: device.state.status,
            memoryErrorNodes: memErrorNodesCount,
            lastAssignment: [],
            totalUptime: totalUptime,
            uptime: 0,
            mtbf: totalUptime / (currDeviceStateObj.fails + 1),
            fails: currDeviceStateObj.fails + 1,
            resources: { ...device.state.resources, ...device.properties.resources },
        });

        // If the device failed and the orchestrator had not detected it before, update
        if (!currDeviceStateObj.detectedFail &&
            this.currAssignment.get(device.id)! &&
            this.currAssignment.get(device.id)!.length > 0) {
            this.score = -1;
            this.failedDevices.add(device.id);
            this.updateNodeMTBFonFail(device.id, this.currAssignment.get(device.id)!);
        }
        this.currDeviceState.get(device.id)!.detectedFail = false;
    }

    private announce(device: Device, failure = false): void {
        if (this.verbose) console.log(`[ANNOUNCE](${this.thisId}) Device ${device.id} - Fail ${failure}`);
        if (!this.deviceRegistry.get(device.id)) {
            this.handleNewDeviceAnnounce(device);
        } else {
            this.handleOldDeviceAnnounce(device, failure);
        }

        this.shouldReorchestrate = true;
    }

    private updateDeviceDataOnFail(id: number): boolean {
        if (this.currDeviceState.get(id)!.status !== DeviceStatus.ON) {
            return false;
        }

        this.currDeviceState.get(id)!.detectedFail = true;
        this.currDeviceState.get(id)!.status = DeviceStatus.OFF;
        if (this.currAssignment.get(id)! && this.currAssignment.get(id)!.length > 0) {
            this.updateNodeMTBFonFail(id, this.currAssignment.get(id)!);
            this.score = -1;
            return true;
        }

        return false;
    }

    private async checkHealth(): Promise<void> {
        const failedDevices: number[] = [];

        const promises = Array.from(this.deviceRegistry.keys()).map(async (id) => {
            const device: Device = this.deviceRegistry.get(id)!;
            const { status, data }: { status: DeviceResponseStatus, data: DeviceStateReport } = await device.rpc("checkHealth");

            if (status === DeviceResponseStatus.SUCCESS) { // equivalent to try block
                this.currDeviceState.get(id)!.uptime = data.uptime;
                this.currDeviceState.get(id)!.resources = { ...data.resources };
                this.updateNodeMTBFonSuccess(id, this.currAssignment.get(id)!);
                if (this.currDeviceState.get(id)!.fails > 0) {
                    this.currDeviceState.get(id)!.mtbf = (this.currDeviceState.get(id)!.totalUptime + data.uptime) / this.currDeviceState.get(id)!.fails;
                }
            } else { // equivalent to catch block
                const isDevicedUsed: boolean = this.updateDeviceDataOnFail(id);
                if (isDevicedUsed)
                    failedDevices.push(id);
            }
        });

        await Promise.all(promises);
        if (failedDevices.length > 0) {
            if (this.verbose) console.log("Triggering re-orchestration because devices failed");
            this.score = -1;
            this.shouldReorchestrate = true;
            failedDevices.forEach((d: number) => { this.failedDevices.add(d) });
        }
    }

    private updateNodeMTBFonSuccess(deviceId: number, nodes: Node[]): void {
        if (!nodes || nodes.length === 0) return;

        nodes.forEach((node) => {
            const deviceNodeInfo: NodeDeviceMTBFInfo = this.nodeMTBF.get(node.id)!.get(deviceId)!;

            if (!deviceNodeInfo) {
                this.nodeMTBF.get(node.id)!.set(deviceId, {
                    ticks: 1,
                    fails: 0,
                    mtbf: null,
                });
                return;
            }

            deviceNodeInfo.ticks++;

            if (deviceNodeInfo.fails > 0)
                deviceNodeInfo.mtbf = deviceNodeInfo.ticks / deviceNodeInfo.fails
        });
    }

    private updateNodeMTBFonFail(deviceId: number, nodes: Node[]): void {
        nodes.forEach((node: Node) => {
            const deviceNodeInfo: NodeDeviceMTBFInfo = this.nodeMTBF.get(node.id)!.get(deviceId)!;

            if (!deviceNodeInfo) {
                this.nodeMTBF.get(node.id)!.set(deviceId, {
                    ticks: 0,
                    fails: 1,
                    mtbf: 0,
                });
                return;
            }
            deviceNodeInfo.fails++;
            deviceNodeInfo.mtbf = deviceNodeInfo.ticks / deviceNodeInfo.fails;
        });
    }

    private async asyncResponseTimer(): Promise<unknown> {
        return sleepSeconds(getRandom(.5, 2));
    }
}
export { EnhancedOrchestrator };
