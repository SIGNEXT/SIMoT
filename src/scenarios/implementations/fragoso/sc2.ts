import { SingleFailBehaviour } from '../../../behaviours/device'
import Device from '../../../device/device'
import BasicDevice from '../../../device/specific-devices/basicDevice'
import Node from '../../../node'
import { Scenario } from '../../scenario'

export default () => {
    const nodes = []

    for (let i = 0; i < 12; ++i) {
        nodes.push(new Node('t1'))
        nodes.push(new Node('t2'))
        nodes.push(new Node('t3'))
    }

    const devices = [
        new BasicDevice(1, { capabilities: ['t1', 't2', 't3'], asyncBehaviours: [new SingleFailBehaviour(15000, 15000)] }),
        new BasicDevice(2, { capabilities: ['t1', 't2', 't3'], asyncBehaviours: [new SingleFailBehaviour(45000, 15000)] }),
        new BasicDevice(3, { capabilities: ['t1', 't2', 't3'], asyncBehaviours: [new SingleFailBehaviour(75000, 15000)] }),
        new BasicDevice(4, { capabilities: ['t1', 't2', 't3'], asyncBehaviours: [new SingleFailBehaviour(105000, 15000)] }),
    ]
    return new Scenario('sc2', nodes,  devices)
}
