import { SingleFailBehaviour } from '../../../behaviours/device'
import Device from '../../../device/device'
import BasicDevice from '../../../device/specific-devices/basicDevice'
import Node from '../../../node'
import { Scenario } from '../../scenario'

export default () => {
    const nodes = [
        new Node('t1'),
        new Node('t2'),
        new Node('t3'),
        new Node('t4'),
    ]
    const devices = [
        new BasicDevice(1, {
            capabilities: ['t1', 't2', 't3', 't4'],
            asyncBehaviours: [new SingleFailBehaviour(5000, 5000, true)],
        }),
        new BasicDevice(2, { capabilities: ['t1', 't2', 't3'] }),
    ]
    return new Scenario('impossible-mem-error', nodes, devices)
}
