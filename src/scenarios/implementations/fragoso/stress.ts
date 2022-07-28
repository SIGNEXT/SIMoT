import Device from '../../../device/device'
import BasicDevice from '../../../device/specific-devices/basicDevice'
import Node from '../../../node'
import { Scenario } from '../../scenario'
export default () => {
    const nodes: Node[] = []
    for (let i = 0; i < 36; i++) {
        nodes.push(new Node('t1'))
    }

    const devices = [
        new BasicDevice(1, { capabilities: ['t1'], totalRam: 10 }),
        new BasicDevice(2, { capabilities: ['t1'], totalRam: 10 }),
        new BasicDevice(3, { capabilities: ['t1'], totalRam: 10 }),
        new BasicDevice(4, { capabilities: ['t1'], totalRam: 10 }),
    ]
    return new Scenario('stress', nodes, devices)
}
