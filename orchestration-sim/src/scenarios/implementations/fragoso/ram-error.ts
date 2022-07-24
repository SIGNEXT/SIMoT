import Device from "../../../device/device";
import Node from "../../../node";
import { Scenario } from "../../scenario";
export default () => {
    const nodes = [
        new Node("t1", { ramSize: 2 }),
        new Node("t1", { ramSize: 3 }),
        new Node("t2", { ramSize: 4 }),
        new Node("t2", { ramSize: 2 }),
        new Node("t3", { ramSize: 4 }),
    ];
    const devices = [
        new Device(1, { capabilities: ["t1", "t2", "t3"], totalRam: 5 }),
        new Device(2, { capabilities: ["t1", "t2", "t3"], totalRam: 6 }),
        new Device(3, { capabilities: ["t1", "t2", "t3"], totalRam: 4 }),
    ];
    return new Scenario("ram-error", nodes,  devices);
};
