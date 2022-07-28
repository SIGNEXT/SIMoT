import RecurrentFailBehaviour from '../../../../behaviours/device/recurrent-fail'
import CbbaDevice from '../../../../device/specific-devices/cbba/CbbaDevice'
import BundleScoreCalculator, { v0_maxFirst, v2_maxFirst_stability } from '../../../../device/specific-devices/cbba/score/BundleScore'
import Node from '../../../../node'
import { Scenario } from '../../../scenario'

export default (_: string = '', scoreFunction: BundleScoreCalculator = v0_maxFirst) => {
    const nodes: Node[] = []

    for (let i = 0; i < 12; ++i) {
        nodes.push(new Node('t1', {ramSize: 1}))
        nodes.push(new Node('t2', {ramSize: 1}))
        nodes.push(new Node('t3', {ramSize: 1}))
    }

    const devices = [
        new CbbaDevice(1, {totalRam: 36, capabilities: ['t1', 't2', 't3'] }, scoreFunction),
        new CbbaDevice(2, {totalRam: 36, capabilities: ['t1', 't2', 't3'], asyncBehaviours: [new RecurrentFailBehaviour(10000, 8000)] }, scoreFunction),
        new CbbaDevice(3, {totalRam: 36, capabilities: ['t1', 't2', 't3'] }, scoreFunction),
        new CbbaDevice(4, {totalRam: 36, capabilities: ['t1', 't2', 't3'], asyncBehaviours: [new RecurrentFailBehaviour(10000, 8000)] }, scoreFunction),
    ]

    const startFlow = async (scenario: Scenario) => scenario.mqttBroker.publish('TASKS', { sender: -1, data: nodes }, true)
    return new Scenario('cbba_rec_fail', nodes, devices, startFlow, [], true)
}
