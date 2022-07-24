import { RecurrentFailBehaviour } from "../../../behaviours/device";
import Device from "../../../device/device";
import Node from "../../../node";
import { Scenario } from "../../scenario";

export default () => {
    const nodes = [];

    for (let i = 0; i < 12; ++i) {
        nodes.push(new Node("t1"));
        nodes.push(new Node("t2"));
        nodes.push(new Node("t3"));
    }

    const devices = [
        new Device(1, { capabilities: ["t1", "t2", "t3"] }),
        new Device(2, { capabilities: ["t1", "t2", "t3"], asyncBehaviours: [new RecurrentFailBehaviour(5000, 15000)] }),
        new Device(3, { capabilities: ["t1", "t2", "t3"] }),
        new Device(4, { capabilities: ["t1", "t2", "t3"], asyncBehaviours: [new RecurrentFailBehaviour(5000, 15000)] }),
    ];
    return new Scenario("rec-fail", nodes, devices);
};