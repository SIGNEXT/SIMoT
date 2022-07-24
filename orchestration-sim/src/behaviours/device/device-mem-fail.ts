import Node from "../../node";
import Behaviour from "./behaviour";

const DEFAULT_BOOT_TIME_MS = 2000;

class DeviceMemFailBehaviour extends Behaviour {

    private percentage: number;
    private bootTimeMs: number;

    constructor(percentage: number, bootTimeMs = DEFAULT_BOOT_TIME_MS) {
        super();
        this.percentage = percentage;
        this.bootTimeMs = bootTimeMs;
    }

    override run(): void {        
        setTimeout(() => {
            const footprint: number =this.device.state.assignedNodes.reduce((acc: number, n: Node) => acc + n.properties.ramSize, 0);
            if (footprint <= this.percentage * this.device.properties.resources.totalRam) {
                return;
            }

            this.device.turnOff(true);
            setTimeout(() => {
                this.device.turnOn(true);
            }, this.bootTimeMs);
        }, 1000);
    }

    override toJSON() {
        return {
            type: "DeviceMemFailBehaviour",
            percentage: this.percentage,
            bootTime: this.bootTimeMs,
        };
    }

    static fromJSON(jsonData: { failNodeId: number, bootTimeMs: number }) {
        return new DeviceMemFailBehaviour(jsonData.failNodeId, jsonData.bootTimeMs);
    }
}

export default DeviceMemFailBehaviour;
