import BasicDevice from "../../../../device/specific-devices/basicDevice";
import Node from "../../../../node";
import { Scenario } from "../../../scenario";
export default (_: string = "") => {
    const nodes = [
        new Node("t1", { payloadSize: 0, ramSize: 10 }),
        new Node("t1", { payloadSize: 0, ramSize: 10 }),
        new Node("t1", { payloadSize: 0, ramSize: 10 }),
        new Node("t1", { payloadSize: 0, ramSize: 10 }),
        new Node("t2", { payloadSize: 0, ramSize: 30 }),
    ];
    const devices = [
        new BasicDevice(1, { capabilities: ["t1", "t2"], totalRam: 40 }),
        new BasicDevice(2, { capabilities: ["t1"], totalRam: 30 }),
    ];

    return new Scenario("capabilities1", nodes, devices);
};
