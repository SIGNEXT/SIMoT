import BasicDevice from "../../../../device/specific-devices/basicDevice";
import Node from "../../../../node";
import { Scenario } from "../../../scenario";
export default (_: string = "") => {
    const nodes = [
        new Node("t1", {payloadSize: 0, ramSize: 15}),  
        new Node("t2", {payloadSize: 0, ramSize: 40}),
        new Node("t2", {payloadSize: 0, ramSize: 40}),
    ];

    const devices = [
        new BasicDevice(1, { capabilities: ["t1", "t2"], totalRam: 90 }),
        new BasicDevice(2, { capabilities: ["t2"], totalRam: 40 }),
        new BasicDevice(3, { capabilities: ["t2"], totalRam: 40 }),
    ];

    return new Scenario("capabilities2", nodes, devices);
};
