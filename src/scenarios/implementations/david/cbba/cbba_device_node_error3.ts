import { Scenario } from "../../../scenario";
import Node from "../../../../node";
import { DeviceNodeFailBehaviour } from "../../../../behaviours/device";
import CbbaDevice from "../../../../device/specific-devices/cbba/CbbaDevice";
import BundleScoreCalculator, { v0_maxFirst } from "../../../../device/specific-devices/cbba/score/BundleScore";

export default (_: string = "", scoreFunction: BundleScoreCalculator = v0_maxFirst) => {
    const nodes: Node[] = [];

    for (let i = 0; i < 12; ++i) {
        nodes.push(new Node("t1"));
    }

    const customScenarioBehaviour = (scenario: Scenario) => {
        setInterval(() => {
            console.log('Publishing tasks');
            scenario.mqttBroker.publish("TASKS", { sender: -1, data: nodes }, true);
        }, 25000);
        setTimeout(() => scenario.mqttBroker.publish("TASKS", { sender: -1, data: nodes }, true), 3000);
    };

    const bootTime = 2000;

    const devices = [
        new CbbaDevice(1, { totalRam: 6, capabilities: ["t1"], syncBehaviours: [new DeviceNodeFailBehaviour(1, bootTime)] }, scoreFunction, true, true),
        new CbbaDevice(2, { totalRam: 6, capabilities: ["t1"], syncBehaviours: [new DeviceNodeFailBehaviour(4, bootTime)] }, scoreFunction, true, true),
        new CbbaDevice(3, { totalRam: 6, capabilities: ["t1"], syncBehaviours: [new DeviceNodeFailBehaviour(7, bootTime)] }, scoreFunction, true, true),
        new CbbaDevice(4, { totalRam: 6, capabilities: ["t1"], syncBehaviours: [new DeviceNodeFailBehaviour(10, bootTime), new DeviceNodeFailBehaviour(12, bootTime)] }, scoreFunction, true, true),
    ];

    return new Scenario("cbba-device-node-error-3", nodes, devices, customScenarioBehaviour, [], true);
};
