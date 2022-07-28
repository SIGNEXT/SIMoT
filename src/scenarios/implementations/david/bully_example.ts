import { OrchestratorFailBehaviour, DeviceNodeFailBehaviour, SingleFailBehaviour } from '../../../behaviours/device'

import V1BullyDevice from '../../../device/specific-devices/elections/V1BullyDevice'
import Node from '../../../node'
import { Scenario } from '../../scenario'
export default (version: string) => {
    const nodes = [
        new Node('t1', { ramSize: 12 }),
        new Node('t2'),
        new Node('t3'),
        new Node('t3'),
        new Node('t3'),
        new Node('t3'),
        new Node('t3'),
        new Node('t3'),
    ]
    const devices = [
        new V1BullyDevice(1, { capabilities: ['t1', 't2', 't3'], totalRam: 25}, version),
        new V1BullyDevice(2, { capabilities: ['t1', 't2', 't3'], totalRam: 50 }, version),
        new V1BullyDevice(3, { capabilities: ['t1', 't2', 't3'], totalRam: 75 }, version),
        new V1BullyDevice(4, { capabilities: ['t1', 't2', 't3'], totalRam: 100 }, version),
        new V1BullyDevice(5, { capabilities: ['t1', 't2', 't3'], totalRam: 125 }, version),
        new V1BullyDevice(6, { capabilities: ['t1', 't2', 't3'], totalRam: 150, asyncBehaviours: [new DeviceNodeFailBehaviour(6, 15000)] }, version),
        new V1BullyDevice(7, { capabilities: ['t1', 't2', 't3'], totalRam: 200, asyncBehaviours: [new OrchestratorFailBehaviour()] }, version),
    ]
    return new Scenario('bully-example', nodes, devices, () => null, [new SingleFailBehaviour(7000, -1, true)])
}
