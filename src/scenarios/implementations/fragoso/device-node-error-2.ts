import { DeviceNodeFailBehaviour, ProbabilisticFailBehaviour } from "../../../behaviours/device";
import Device from "../../../device/device";
import Node from "../../../node";
import { Scenario } from "../../scenario";

export default () => {
    const nodes = [];

    for (let i = 0; i < 4; ++i) {
        nodes.push(new Node("t1"));
        nodes.push(new Node("t2"));
        nodes.push(new Node("t3"));
    }

    const devices = [
        new Device(1, { capabilities: ["t1", "t2", "t3"], syncBehaviours: [new DeviceNodeFailBehaviour(1)],
            asyncBehaviours: [new ProbabilisticFailBehaviour(0.03, 5000, 10000)] }),
        new Device(2, { capabilities: ["t1", "t2", "t3"], syncBehaviours: [new DeviceNodeFailBehaviour(4)],
            asyncBehaviours: [new ProbabilisticFailBehaviour(0.03, 5000, 10000)]  }),
        new Device(3, { capabilities: ["t1", "t2", "t3"], syncBehaviours: [new DeviceNodeFailBehaviour(7)],
            asyncBehaviours: [new ProbabilisticFailBehaviour(0.03, 5000, 10000)]  }),
        new Device(4, { capabilities: ["t1", "t2", "t3"],
            syncBehaviours: [new DeviceNodeFailBehaviour(10), new DeviceNodeFailBehaviour(12)],
            asyncBehaviours: [new ProbabilisticFailBehaviour(0.03, 5000, 10000)]  }),
    ];

    return new Scenario("device-node-error-2", nodes, devices);
};
