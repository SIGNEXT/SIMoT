import { Scenario } from "../../../scenario";
import Node from "../../../../node";
import { DeviceNodeFailBehaviour } from "../../../../behaviours/device";
import CbbaDevice from "../../../../device/specific-devices/cbba/CbbaDevice";
import BundleScoreCalculator, { v0_maxFirst } from "../../../../device/specific-devices/cbba/score/BundleScore";

export default (_: string = "", scoreFunction: BundleScoreCalculator = v0_maxFirst) => {
    const nodes: Node[] = [];

    for (let i = 0; i < 3; ++i) {
        nodes.push(new Node("t1"));
        nodes.push(new Node("t2"));
        nodes.push(new Node("t3"));
    }

    const customScenarioBehaviour = (scenario: Scenario) => {
        const fails = [[1, 2, 3, 4], [2, 3, 4, 1], [3, 4, 1, 2], [4, 1, 2, 3]];
        let failIndex = 0;
        setInterval(() => {
            const failOrder = fails[failIndex % fails.length];
            for (const index of failOrder) {
                scenario.devices[index - 1].restart(5000, false);
            }
            failIndex++;
        }, 40000);

        setTimeout(() => scenario.mqttBroker.publish("TASKS", { sender: -1, data: nodes }, true), 3000);
    };

    const devices = [
        new CbbaDevice(1, { totalRam: 36, capabilities: ["t1", "t2", "t3"], syncBehaviours: [new DeviceNodeFailBehaviour(1)] }, scoreFunction, true, true),
        new CbbaDevice(2, { totalRam: 36, capabilities: ["t1", "t2", "t3"], syncBehaviours: [new DeviceNodeFailBehaviour(3)] }, scoreFunction, true, true),
        new CbbaDevice(3, { totalRam: 36, capabilities: ["t1", "t2", "t3"], syncBehaviours: [new DeviceNodeFailBehaviour(6)] }, scoreFunction, true, true),
        new CbbaDevice(4, { totalRam: 36, capabilities: ["t1", "t2", "t3"], syncBehaviours: [new DeviceNodeFailBehaviour(9), new DeviceNodeFailBehaviour(7)] }, scoreFunction, true, true),
    ];

    return new Scenario("cbba-device-node-error-small", nodes, devices, customScenarioBehaviour, [], true);
};
