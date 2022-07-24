import Node from "../../../node";
import Device from "../../../device/device";
import { SingleFailBehaviour } from "../../../behaviours/device";
import { Scenario } from "../../scenario";
export default () => {
    const nodes = [];

    for (let i = 0; i < 12; ++i) {
        nodes.push(new Node("t1"));
        nodes.push(new Node("t2"));
        nodes.push(new Node("t3"));
    }

    const devices = [
        new Device(1, { capabilities: ["t1", "t2", "t3"], asyncBehaviours: [new SingleFailBehaviour(40000, 0)] }),
        new Device(2, { capabilities: ["t1", "t2", "t3"], asyncBehaviours: [new SingleFailBehaviour(80000, 0)] }),
        new Device(3, { capabilities: ["t1", "t2", "t3"], asyncBehaviours: [new SingleFailBehaviour(120000, 0)] }),
        new Device(4, { capabilities: ["t1", "t2", "t3"] }),
    ];
    return new Scenario("sc1", nodes,  devices);
};
