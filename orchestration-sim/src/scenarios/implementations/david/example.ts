import { SingleFailBehaviour } from "../../../behaviours/device";

import Device from "../../../device/device";
import OrchestratorDevice from "../../../device/specific-devices/elections/orchestratorDevice";
import Node from "../../../node";
import { Scenario } from "../../scenario";
export default (version: string) => {
    const nodes = [
        new Node("t1", { ramSize: 12 }),
        new Node("t2"),
        new Node("t3"),
        new Node("t3"),
    ];
    const devices = [
        new OrchestratorDevice(1, { capabilities: ["t1", "t2", "t3"] }, version),
        new OrchestratorDevice(2,  { capabilities: ["t1", "t2", "t3"], totalRam: 4 , asyncBehaviours: [] }, version),
    ];
    return new Scenario("example", nodes, devices, () => null, [new SingleFailBehaviour(5000, -1, true)]);
};
