import { DeviceStatus } from "../../device/deviceTypes";
import Node from "../../node";
import Behaviour from "./behaviour";

const DEFAULT_BOOT_TIME_MS = 2000;

class DeviceNodeFailBehaviour extends Behaviour {

    private failNodeId: number;
    private bootTimeMs: number;

    constructor(failNodeId: number, bootTimeMs = DEFAULT_BOOT_TIME_MS) {
        super();
        this.failNodeId = failNodeId;
        this.bootTimeMs = bootTimeMs;
    }

    override run(): void {   
        const nodes: number[] = this.device.state.assignedNodes.map((n: Node) => n.id);
        if (!nodes.includes(this.failNodeId) || this.device.state.status === DeviceStatus.OFF) {
            return;
        }

        this.device.turnOff(true);
        setTimeout(() => {
            this.device.turnOn(true);
        }, this.bootTimeMs);     
    }

    override toJSON() {
        return {
            type: "DeviceNodeFailBehaviour",
            failNodeId: this.failNodeId,
            bootTime: this.bootTimeMs,
        };
    }

    static fromJSON(jsonData: { failNodeId: number, bootTimeMs: number }) {
        return new DeviceNodeFailBehaviour(jsonData.failNodeId, jsonData.bootTimeMs);
    }
}

export default DeviceNodeFailBehaviour;
