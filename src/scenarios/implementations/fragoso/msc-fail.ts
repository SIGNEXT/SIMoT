import { SingleFailBehaviour } from "../../../behaviours/device";
import Device from "../../../device/device";
import Node from "../../../node";
import { Scenario } from "../../scenario";
export default () => {
    const nodes = [
        new Node("t1", { ramSize: 4 }),
        new Node("t1", { ramSize: 4 }),
        new Node("t1", { ramSize: 4 }),
        new Node("t2", { ramSize: 6 }),
        new Node("t2", { ramSize: 6 }),
        new Node("t2", { ramSize: 6 }),
    ];

    const devices = [
        new Device(1, { capabilities: ["t1", "t2"], totalRam: 12 }),
        new Device(2, { capabilities: ["t1", "t2"], totalRam: 20, asyncBehaviours: [new SingleFailBehaviour(10000, 10000)] }),
        new Device(3, { capabilities: ["t1", "t2"], totalRam: 18 }),
    ];
    return new Scenario("msc-fail", nodes,  devices);
};
