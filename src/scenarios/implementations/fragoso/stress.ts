import Device from "../../../device/device";
import Node from "../../../node";
import { Scenario } from "../../scenario";
export default () => {
    const nodes: Node[] = [];
    for (let i = 0; i < 36; i++) {
        nodes.push(new Node("t1"));
    }

    const devices = [
        new Device(1, { capabilities: ["t1"], totalRam: 10 }),
        new Device(2, { capabilities: ["t1"], totalRam: 10 }),
        new Device(3, { capabilities: ["t1"], totalRam: 10 }),
        new Device(4, { capabilities: ["t1"], totalRam: 10 }),
    ];
    return new Scenario("stress", nodes, devices);
};
