import { RecurrentFailBehaviour } from "../../../behaviours/device";
import Device from "../../../device/device";
import Node from "../../../node";
import { Scenario } from "../../scenario";

export default () => {
    const nodes = [
        new Node("t1"),
        new Node("t2"),
        new Node("t3"),
        new Node("t3"),
        new Node("t2"),
        new Node("t1"),
    ];
    const devices = [
        new Device(1, { capabilities: ["t1", "t2", "t3"] }),
        new Device(3, { capabilities: ["t1", "t2", "t3"], asyncBehaviours: [new RecurrentFailBehaviour(1000, 1000)] }),
        new Device(2, { capabilities: ["t1", "t2", "t3"] }),
        new Device(5, { capabilities: ["t1", "t2", "t3"], asyncBehaviours: [new RecurrentFailBehaviour(1000, 1000)] }),
        new Device(4, { capabilities: ["t1", "t2", "t3"] }),
    ];
    return new Scenario("dos", nodes, devices);
};
