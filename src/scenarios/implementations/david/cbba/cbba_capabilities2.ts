import CbbaDevice from '../../../../device/specific-devices/cbba/CbbaDevice'
import BundleScoreCalculator, { v0_maxFirst } from '../../../../device/specific-devices/cbba/score/BundleScore'
import Node from '../../../../node'
import { Scenario } from '../../../scenario'
export default (_: string = '', scoreFunction: BundleScoreCalculator = v0_maxFirst) => {
    const nodes = [
        new Node('t1', {payloadSize: 0, ramSize: 15}),  
        new Node('t2', {payloadSize: 0, ramSize: 40}),
        new Node('t2', {payloadSize: 0, ramSize: 40}),
    ]
    const devices = [
        new CbbaDevice(1, { capabilities: ['t1', 't2'], totalRam: 90 }, scoreFunction),
        new CbbaDevice(2, { capabilities: ['t2'], totalRam: 40 }, scoreFunction),
        new CbbaDevice(3, { capabilities: ['t2'], totalRam: 40 }, scoreFunction),
    ]

    const startFlow = (scenario: Scenario) => setTimeout( () => scenario.mqttBroker.publish('TASKS', { sender: -1, data: nodes }, true),3000)

    return new Scenario('cbba_capabilities2', nodes, devices, startFlow, [], true)
}
