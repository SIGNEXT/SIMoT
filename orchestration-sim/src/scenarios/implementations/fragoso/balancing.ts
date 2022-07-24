import Device from "../../../device/device";
import Node from "../../../node";
import { Scenario } from "../../scenario";
export default () => {
    const nodes = [
        new Node("t1"),
        new Node("t1"),
        new Node("t2"),
        new Node("t3"),
        new Node("t2"),
        new Node("t3"),
        new Node("t4"),
        new Node("t4"),
        new Node("t4"),
        new Node("t4"),
    ];
    const devices = [
        new Device(1, { capabilities: ["t1", "t2", "t3", "t4"] }),
        new Device(2, { capabilities: ["t1", "t2", "t3"] }),
    ];
    return new Scenario("bad-balancing", nodes,  devices);
};
