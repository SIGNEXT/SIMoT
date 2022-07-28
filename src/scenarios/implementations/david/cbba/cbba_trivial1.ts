import CbbaDevice from '../../../../device/specific-devices/cbba/CbbaDevice'
import BundleScoreCalculator, { v0_maxFirst } from '../../../../device/specific-devices/cbba/score/BundleScore'
import Node from '../../../../node'
import { Scenario } from '../../../scenario'
export default (_: string = '', scoreFunction: BundleScoreCalculator = v0_maxFirst) => {
    const nodes = [
        new Node('t1', { ramSize: 50 }),
        new Node('t2', { ramSize: 50 }),
        new Node('t3', { ramSize: 50 }),
    ]
    const devices = [
        new CbbaDevice(1, { capabilities: ['t1'], totalRam: 50 }, scoreFunction, true),
        new CbbaDevice(2, { capabilities: ['t2'], totalRam: 50 }, scoreFunction, true),
        new CbbaDevice(3, { capabilities: ['t3'], totalRam: 50 }, scoreFunction, true),
    ]

    const startFlow = async (scenario: Scenario) => setTimeout(() => scenario.mqttBroker.publish('TASKS', { sender: -1, data: nodes }, true), 3000) 

    return new Scenario('cbba_trivial1', nodes, devices, startFlow, [], true)
}
