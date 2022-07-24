import CbbaDevice from "../../../../device/specific-devices/cbba/CbbaDevice";
import BundleScoreCalculator, { v0_maxFirst } from "../../../../device/specific-devices/cbba/score/BundleScore";
import Node from "../../../../node";
import { Scenario } from "../../../scenario";
export default (_: string = "", scoreFunction: BundleScoreCalculator = v0_maxFirst) => {
    const nodes: Node[] = [];

    for (let _ = 0; _ < 36; _++) {
        nodes.push(new Node("t1", { ramSize: 10 }))
        // nodes.push(new Node("t1", { ramSize: 10 }))
        // nodes.push(new Node("t1", { ramSize: 10 }))
    }

    const devices = [
        new CbbaDevice(1, { capabilities: ["t1"], totalRam: 190 }, scoreFunction),
        new CbbaDevice(2, { capabilities: ["t1"], totalRam: 190 }, scoreFunction),
        new CbbaDevice(3, { capabilities: ["t1"], totalRam: 190 }, scoreFunction),
        new CbbaDevice(4, { capabilities: ["t1"], totalRam: 190 }, scoreFunction),
        // new CbbaDevice(4, { capabilities: ["t1"], totalRam: 9999 }, scoreFunction),
        // new CbbaDevice(5, { capabilities: ["t3"], totalRam: 160 }, scoreFunction),
        // new CbbaDevice(6, { capabilities: ["t3"], totalRam: 80 }, scoreFunction),
    ];

    const startFlow = async (scenario: Scenario) => setTimeout(() => scenario.mqttBroker.publish("TASKS", { sender: -1, data: nodes }, true), 3000) ;

    return new Scenario("cbba_large1", nodes, devices, startFlow, [], true);
};
