import { RecurrentFailBehaviour } from "../../../behaviours/device";
import Device from "../../../device/device";
import BasicDevice from "../../../device/specific-devices/basicDevice";
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
        new BasicDevice(1, { capabilities: ["t1", "t2", "t3"] }),
        new BasicDevice(3, { capabilities: ["t1", "t2", "t3"], asyncBehaviours: [new RecurrentFailBehaviour(1000, 1000)] }),
        new BasicDevice(2, { capabilities: ["t1", "t2", "t3"] }),
        new BasicDevice(5, { capabilities: ["t1", "t2", "t3"], asyncBehaviours: [new RecurrentFailBehaviour(1000, 1000)] }),
        new BasicDevice(4, { capabilities: ["t1", "t2", "t3"] }),
    ];
    return new Scenario("dos", nodes, devices);
};
