import Behaviour from "./behaviour";

const DEFAULT_BOOT_TIME_MS = 2000;
const DEFAULT_RESET_INTERVAL_MS = 1000;

class RecurrentFailBehaviour extends Behaviour {

    private resetIntervalMs: number;
    private bootTimeMs: number;

    constructor(resetIntervalMs = DEFAULT_RESET_INTERVAL_MS, bootTimeMs = DEFAULT_BOOT_TIME_MS) {
        super();
        this.resetIntervalMs = resetIntervalMs;
        this.bootTimeMs = bootTimeMs;
    }

    override run(): void {
        this.interval = setInterval(() => {
            this.device.turnOff(true);
            setTimeout(() => {
                this.device.turnOn(true);
            }, this.bootTimeMs);
        }, this.resetIntervalMs);
    }

    override toJSON() {
        return {
            type: "RecurrentFailBehaviour",
            resetInterval: this.resetIntervalMs,
            bootTime: this.bootTimeMs,
        };
    }

    static fromJSON(jsonData: { resetInterval: number, bootTime: number }) {
        return new RecurrentFailBehaviour(jsonData.resetInterval, jsonData.bootTime);
    }
}

export default RecurrentFailBehaviour;