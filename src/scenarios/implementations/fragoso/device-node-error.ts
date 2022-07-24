import { DeviceNodeFailBehaviour } from "../../../behaviours/device";
import Device from "../../../device/device";
import BasicDevice from "../../../device/specific-devices/basicDevice";
import Node from "../../../node";
import { sleepSeconds } from "../../../utils";
import { Scenario } from "../../scenario";

export default () => {
    const customScenarioBehaviour = (scenario: Scenario) => {
        const fails = [[1, 2, 3, 4], [2, 3, 4, 1], [3, 4, 1, 2], [4, 1, 2, 3]];
        let failIndex = 0;
        setInterval(async () => {
            const failOrder = fails[failIndex % fails.length];
            for (const index of failOrder) {
                scenario.devices[index - 1].turnOff();
                setTimeout(() => { scenario.devices[index - 1].turnOn() }, 5000);
                await sleepSeconds(3);
            }
            failIndex++;
        }, 20000);
    };

    const failNode = new Node("t3");
    const nodes = [
        new Node("t1"),
        new Node("t2"),
        new Node("t3"),
        new Node("t1"),
        new Node("t2"),
        new Node("t3"),
        new Node("t3"),
        failNode,
    ];

    const devices = [
        new BasicDevice(1, { capabilities: ["t1", "t2", "t3"] }),
        new BasicDevice(2, { capabilities: ["t1", "t2", "t3"] }),
        new BasicDevice(3, { capabilities: ["t1", "t2", "t3"] }),
        new BasicDevice(4, { capabilities: ["t1", "t2", "t3"], syncBehaviours: [new DeviceNodeFailBehaviour(failNode.id)] }),
    ];

    return new Scenario("device-node-error", nodes, devices, customScenarioBehaviour);
};
