import RecurrentFailBehaviour from '../../../../behaviours/device/recurrent-fail'
import CbbaDevice from '../../../../device/specific-devices/cbba/CbbaDevice'
import BundleScoreCalculator, { v0_maxFirst } from '../../../../device/specific-devices/cbba/score/BundleScore'
import Node from '../../../../node'
import { Scenario } from '../../../scenario'

export default (_: string = '', scoreFunction: BundleScoreCalculator = v0_maxFirst) => {
    const nodes: Node[] = []

    nodes.push(new Node('t1', {ramSize: 4}))
    nodes.push(new Node('t1', {ramSize: 4}))
    nodes.push(new Node('t1', {ramSize: 4}))
    nodes.push(new Node('t2', {ramSize: 4}))
    nodes.push(new Node('t2', {ramSize: 4}))
    nodes.push(new Node('t2', {ramSize: 4}))
    nodes.push(new Node('t3', {ramSize: 4}))
    nodes.push(new Node('t3', {ramSize: 4}))
    nodes.push(new Node('t3', {ramSize: 4}))

    const devices = [
        new CbbaDevice(1, {totalRam: 16,  capabilities: ['t1', 't2', 't3'] }, scoreFunction, true),
        new CbbaDevice(2, {totalRam: 12,  capabilities: ['t1', 't2', 't3'], asyncBehaviours: [new RecurrentFailBehaviour(5000, 8000)] }, scoreFunction, true),
        new CbbaDevice(3, {totalRam: 20,  capabilities: ['t1', 't2', 't3'] }, scoreFunction, true)  ]

    const startFlow = async (scenario: Scenario) => setTimeout(() => scenario.mqttBroker.publish('TASKS', { sender: -1, data: nodes }, true), 3000) 
    return new Scenario('cbba_rec_fail_small', nodes, devices, startFlow, [], true)
}
