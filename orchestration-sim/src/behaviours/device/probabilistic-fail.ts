import { getRandom } from "../../utils";
import Behaviour from "./behaviour";

const DEFAULT_PROBABILITY = 0.05;
const DEFAULT_MIN_RESET_TIME = 0;
const DEFAULT_MAX_RESET_TIME = 10000;
const CHECK_INTERVAL = 1000;

class ProbabilisticFailBehaviour extends Behaviour {

    private probabilityOfFailure: number;
    private minResetTime: number;
    private maxResetTime: number;

    constructor(probability: number = DEFAULT_PROBABILITY, minResetTime: number = DEFAULT_MIN_RESET_TIME, maxResetTime: number = DEFAULT_MAX_RESET_TIME) {
        super();
        this.probabilityOfFailure = probability;
        this.minResetTime = minResetTime;
        this.maxResetTime = maxResetTime;
        this.interval = null;
    }

    override run(): void {

        if(this.interval) {
            clearInterval(this.interval);
        }

        this.interval = setInterval(() => {
            {
                if (!this.device) {
                    return;
                }

                if (getRandom() < this.probabilityOfFailure) {
                    this.device.turnOff();
                    setTimeout(() => {
                        this.device.turnOn(true);
                    }, getRandom(this.minResetTime, this.maxResetTime));
                }
            }
        }, CHECK_INTERVAL);
    }

    override toJSON() {
        return {
            type: "ProbabilisticFailBehaviour",
            probability: this.probabilityOfFailure,
            minResetTime: this.minResetTime,
            maxResetTime: this.maxResetTime,
        };
    }

    static fromJSON(jsonData: { probability: number, minResetTime: number, maxResetTime: number }): ProbabilisticFailBehaviour {
        return new ProbabilisticFailBehaviour(jsonData.probability, jsonData.minResetTime, jsonData.maxResetTime);
    }
}

export { ProbabilisticFailBehaviour };
