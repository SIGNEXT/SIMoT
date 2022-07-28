import CbbaDevice from '../../../../device/specific-devices/cbba/CbbaDevice'
import BundleScoreCalculator, { v0_maxFirst } from '../../../../device/specific-devices/cbba/score/BundleScore'
import Node from '../../../../node'
import { Scenario } from '../../../scenario'
export default (_: string = '', scoreFunction: BundleScoreCalculator = v0_maxFirst) => {
    const nodes: Node[] = []

    for (let _ = 0; _ < 18; _++) {
        nodes.push(new Node('t1', { ramSize: 10 }))
    }

    const devices = [
        new CbbaDevice(1, { capabilities: ['t1'], totalRam: 190 }, scoreFunction, true, false),
        new CbbaDevice(2, { capabilities: ['t1'], totalRam: 190 }, scoreFunction, true, false),
        new CbbaDevice(3, { capabilities: ['t1'], totalRam: 190 }, scoreFunction, true, false),
        new CbbaDevice(4, { capabilities: ['t1'], totalRam: 190 }, scoreFunction, true, false),
    ]

    const startFlow = async (scenario: Scenario) => setTimeout(
        () => {
            scenario.mqttBroker.publish('TASKS', { sender: -1, data: nodes }, true)
            setTimeout(() => scenario.devices[0].restart(70000, true), 70000)
        }, 12000) 

    return new Scenario('cbba_showcase', nodes, devices, startFlow, [], true)
}
