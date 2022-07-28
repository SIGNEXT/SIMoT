import { ProbabilisticFailBehaviour } from '../../../behaviours/device'
import Device from '../../../device/device'
import BasicDevice from '../../../device/specific-devices/basicDevice'
import Node from '../../../node'
import { Scenario } from '../../scenario'

export default () => {
    // Generate 72 tasks
    const nodes: Node[] = [];

    ['t1', 't2', 't3'].forEach((t) => {
        for (let i = 0; i < 24; ++i) {
            nodes.push(new Node(t))
        }
    })

    const devices = []
    for (let i = 1; i <= 50; ++i) {
        devices.push(new BasicDevice(i,
            { capabilities: ['t1', 't2', 't3'], asyncBehaviours: [new ProbabilisticFailBehaviour(0.05, 0, 10000)] },
        ))
    }
    return new Scenario('prob-fail', nodes, devices)
}
