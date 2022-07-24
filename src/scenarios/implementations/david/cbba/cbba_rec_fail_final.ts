import DeviceMemFailBehaviour from "../../../../behaviours/device/device-mem-fail";
import RecurrentFailBehaviour from "../../../../behaviours/device/recurrent-fail";
import CbbaDevice from "../../../../device/specific-devices/cbba/CbbaDevice";
import BundleScoreCalculator, { v0_maxFirst } from "../../../../device/specific-devices/cbba/score/BundleScore";
import Node from "../../../../node";
import { Scenario } from "../../../scenario";

export default (_: string = "", scoreFunction: BundleScoreCalculator = v0_maxFirst) => {
  const nodes: Node[] = [];

    for (let i = 0; i < 10; i++) {
      nodes.push(new Node("t1", {ramSize: 30}));
    }

    const fullyReorchOnFail = true;
    const reorchestrateOnJoin = true;

    const devices = [
        new CbbaDevice(1, {totalRam: 100,  capabilities: ["t1"] }, scoreFunction, reorchestrateOnJoin, fullyReorchOnFail),
        new CbbaDevice(2, {totalRam: 100,  capabilities: ["t1"] }, scoreFunction, reorchestrateOnJoin, fullyReorchOnFail),
        new CbbaDevice(3, {totalRam: 100,  capabilities: ["t1"], syncBehaviours: [new DeviceMemFailBehaviour(0.5, 3000)] }, scoreFunction, reorchestrateOnJoin, fullyReorchOnFail),
        new CbbaDevice(4, {totalRam: 100,  capabilities: ["t1"], syncBehaviours: [new DeviceMemFailBehaviour(0.01, 7000)] }, scoreFunction, reorchestrateOnJoin, fullyReorchOnFail),
        new CbbaDevice(5, {totalRam: 100,  capabilities: ["t1"] }, scoreFunction, reorchestrateOnJoin, fullyReorchOnFail)
      ];

    const startFlow = async (scenario: Scenario) => setTimeout(() => scenario.mqttBroker.publish("TASKS", { sender: -1, data: nodes }, true), 3000) ;
    return new Scenario("cbba_rec_fail_final", nodes, devices, startFlow, [], true);
};
