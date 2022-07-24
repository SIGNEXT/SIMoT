import { DeviceNodeFailBehaviour } from "../../../behaviours/device";
import Device from "../../../device/device";
import Node from "../../../node";
import { Scenario } from "../../scenario";

export default () => {
    const customScenarioBehaviour = (scenario: Scenario) => {
        const fails = [[1, 2, 3, 4], [2, 3, 4, 1], [3, 4, 1, 2], [4, 1, 2, 3]];
        let failIndex = 0;
        setInterval(() => {
            const failOrder = fails[failIndex % fails.length];
            for (const index of failOrder) {
                scenario.devices[index - 1].restart(2000);
            }
            failIndex++;
        }, 40000);
    };

    const nodes = [];

    for (let i = 0; i < 4; ++i) {
        nodes.push(new Node("t1"));
        nodes.push(new Node("t2"));
        nodes.push(new Node("t3"));
    }

    const devices = [
        new Device(1, { capabilities: ["t1", "t2", "t3"], syncBehaviours: [new DeviceNodeFailBehaviour(1)] }),
        new Device(2, { capabilities: ["t1", "t2", "t3"], syncBehaviours: [new DeviceNodeFailBehaviour(4)] }),
        new Device(3, { capabilities: ["t1", "t2", "t3"], syncBehaviours: [new DeviceNodeFailBehaviour(7)] }),
        new Device(4, { capabilities: ["t1", "t2", "t3"], syncBehaviours: [new DeviceNodeFailBehaviour(10), new DeviceNodeFailBehaviour(12)] }),
    ];

    return new Scenario("device-node-error-3", nodes, devices, customScenarioBehaviour);
};
