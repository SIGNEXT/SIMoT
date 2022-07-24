import Device from "../device/device";
import { DeviceResponseStatus } from "../device/response";
import { sleepSeconds } from "../utils";
import { DeviceData, EnhancedDeviceData } from "./deviceData";
import Node from "../node";
import MQTTBroker, { Message, SubscriptionCallback } from "../comms/mqtt/MQTT";
import { DeviceAnnouncement, DeviceStatus } from "../device/deviceTypes";
import { NodeDeviceAssignment } from "../strategies/assignment/assignment-strategy";
import Orchestrator from "./orchestrator";
import OrchestratorBehaviour from "../behaviours/orchestrator/orchestratorBehaviour";
import OrchestratorDevice from "../device/specific-devices/elections/orchestratorDevice";

class BasicOrchestrator extends Orchestrator {
    private first!: boolean;
    private healthCheckInterval?: NodeJS.Timeout;

    constructor(
        version: string,
        nodes: Node[],
        mqttBroker: MQTTBroker | null,
        { verbose = false } = {},
        behaviours: OrchestratorBehaviour[] = [],
        enclosedDevice: OrchestratorDevice | null = null
    ) {
        super(version, nodes, mqttBroker, { verbose }, behaviours, enclosedDevice);
        this.reset(nodes);
    }

    public override run(): Promise<void> {
        if (this.verbose) {
            console.log('Starting orchestrator');
        }

        this.setupAnnouncementListener();

        this.healthCheckInterval = setInterval(() => {
            this.checkHealth();
        }, 8000);

        return Promise.resolve();
    }

    public override reset(nodes: Node[] = []) {
        super.reset(nodes);
        this.first = true;
    }

    public override stop(forced: boolean = false) {
        if (this.verbose) {
            console.log('Stopping orchestrator');
        }

        if (this.healthCheckInterval)
            clearInterval(this.healthCheckInterval);

        if (this.mqttClient)
            this.mqttClient.disconnect(forced);

        return Promise.resolve();
    }

    public override async rpc(command: string, args: any = {}): Promise<any> {
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

    private announce(device: Device, failure = false): void {
        if (this.verbose) console.log(`[ANNOUNCE] Device ${device.id} - Fail ${failure}`);

        if (!this.deviceRegistry.get(device.id)) {
            this.deviceRegistry.set(device.id, device);
        }

        const currentPerceivedDeviceData: EnhancedDeviceData = this.currDeviceState.get(device.id)!;

        this.currDeviceState.set(device.id, {
            ...currentPerceivedDeviceData,
            id: device.id,
            capabilities: device.properties.capabilities,
            status: DeviceStatus.OFF,
            memoryErrorNodes: failure ?
                currentPerceivedDeviceData.lastAssignment.length :
                currentPerceivedDeviceData?.memoryErrorNodes,
            lastAssignment: [],
        });
        const changes = {
            [device.id]: {
                status: DeviceStatus.ON,
                nodes: [],
            },
        };
        // this.distributeFlow(changes);
    }

    private async checkHealth(): Promise<void> {
        if (this.assigning) {
            return;
        }

        const changes: { [id: string]: { status?: DeviceStatus, nodes: number[] } } = {};

        const promises = Array.from(this.deviceRegistry.keys()).map(async (id) => {
            const device = this.deviceRegistry.get(id)!;
            const { status } = await device.rpc("checkHealth");
            const perceivedState = this.currDeviceState.get(id)!;
            if (status === DeviceResponseStatus.SUCCESS) { // equivalent to try block
                if (perceivedState.status === DeviceStatus.OFF) {
                    perceivedState.status = DeviceStatus.ON;
                    changes[id] = { status: DeviceStatus.ON, nodes: [] };
                }
            } else { // equivalent to catch block
                if (perceivedState.status === DeviceStatus.ON) {
                    perceivedState.status = DeviceStatus.OFF;
                    changes[id] = { status: DeviceStatus.OFF, nodes: [] };
                }
            }
        });

        await Promise.all(promises);
        if (Object.keys(changes).length) {
            if (this.verbose) console.log(`Triggering re-orch beacause of ${Object.keys(changes).join(", ")}`);
            this.distributeFlow(changes);
        }
    }

    // Do we need changes?
    private async distributeFlow(_changes: { [id: string]: { status?: DeviceStatus, nodes: number[] } }) {
        if (this.nodes.length === 0) {
            this.assigning = false;
            return;
        }

        if (this.first) {
            await sleepSeconds(1);
            this.first = false;
        }

        this.assigning = true;

        if (this.verbose) console.log("Distributing flows");

        const assignment: NodeDeviceAssignment = new Map();
        const availableDevices = Array.from(this.currDeviceState.keys())
            .filter((k) => this.currDeviceState.get(k)!.status === DeviceStatus.ON)
            .map((k) => this.currDeviceState.get(k)!);

        // await sleepSeconds(2);

        for (const node of this.nodes) {
            const device = this.getBestDevice(node, availableDevices, assignment);
            if (!device) {
                if (this.verbose) console.log("error distributing flow");
                this.assigning = false;
                return;
            } else {
                let assignedNodes: Node[] = assignment.get(device.id)!;
                if (!assignedNodes) {
                    assignment.set(device.id, []);
                }
                assignedNodes = assignment.get(device.id)!;
                assignment.set(device.id, [...assignedNodes, node]);
            }
        }

        this.currAssignment = new Map(assignment);

        const changes: { [id: string]: { status?: DeviceStatus, nodes: number[] } } = {};

        await Promise.all(Array.from(assignment.keys()).map(async (id: number) => {
            const assignedNodes: Node[] = assignment.get(id)!;
            const perceivedState: EnhancedDeviceData = this.currDeviceState.get(id)!
            perceivedState.lastAssignment = [...assignedNodes];
            const { status } = await this.deviceRegistry.get(id)!.rpc("setNodes", { nodes: [...assignedNodes] });
            if (status === DeviceResponseStatus.MEM_ERROR) {
                if (this.verbose) console.log(`Error deploying nodes to device ${id}: memory error`);
                perceivedState.memoryErrorNodes = perceivedState.lastAssignment.length;
                changes[id] = { nodes: [] };
            } else if (status === DeviceResponseStatus.FAIL) {
                if (this.verbose) console.log(`Error deploying nodes to device ${id}: general fail`);
                changes[id] = { nodes: [], status: DeviceStatus.OFF };
            }
        }));

        if (Object.keys(changes).length) {
            if (this.verbose) console.log("Re-orchestrating due to deploy failure");
            this.distributeFlow(changes);
        }

        if (this.verbose) console.log("Finished distributing flows");
        this.assigning = false;
    }

    private getBestDevice(
        node: Node,
        devices: DeviceData[],
        currentAssignment: NodeDeviceAssignment
    ): DeviceData | null {
        // Not relevant at the moment
        // const nodePredicates = node.predicates;
        // const nodePriorities = node.priorities;

        let bestMatchIndex = 0;
        let bestDevice = null;

        for (const device of devices) {
            // Ignores if the number of nodes assigned to the device with a new one is
            // equal or greater than a previous assignment that resulted in memory error
            const assignedNodes: Node[] | undefined = currentAssignment.get(device.id);
            const nrNodes = assignedNodes ? assignedNodes.length : 0;

            if (device.memoryErrorNodes &&
                (nrNodes + 1) >= device.memoryErrorNodes) {
                continue;
            }

            // Not relevant at the moment
            // Filter device capabilities to check if the device complies with the
            // node predicates, which are requirements that cannot be violated
            // const predicateIntersection = nodePredicates.filter((tag) => device.capabilities.includes(tag));

            // Ignores if there is no intersection or the intersection
            // does not contain all the tags from the node. Node-red is the default
            // if (predicateIntersection.length < nodePredicates.length) continue;
            if (!device.capabilities.includes(node.task)) continue;
            // const predicateIndex = (predicateIntersection.length / device.capabilities.length);
            const predicateIndex = 1;

            //  Filter device capabilities to check if the device has any priority
            // requested by the node, which makes the device more attractive for assignment
            // const prioritiesIntersection = nodePriorities.filter((tag) => device.capabilities.includes(tag));
            // const prioritiesIndex = prioritiesIntersection.length === 0 ? 0 : (prioritiesIntersection.length / nodePriorities.length);
            const prioritiesIndex = 1;
            // Nodes with less nodes assigned, more priorities complied and
            // more specific intersections have a better match index

            const nodeIndex = 1 / (nrNodes + 1);
            const matchIndex = (prioritiesIndex * 0.5) + (nodeIndex * 0.4) + (predicateIndex * 0.1);

            if (matchIndex > bestMatchIndex) {
                bestMatchIndex = matchIndex;
                bestDevice = device;
            }
        }

        return bestDevice;
    }
}

export {
    BasicOrchestrator
};
