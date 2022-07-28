import Device from '../../../device/device'
import BasicDevice from '../../../device/specific-devices/basicDevice'
import Node from '../../../node'
import { Scenario } from '../../scenario'
export default () => {
    const nodes = [
        new Node('t1', { ramSize: 2 }),
        new Node('t1', { ramSize: 3 }),
        new Node('t2', { ramSize: 4 }),
        new Node('t2', { ramSize: 2 }),
        new Node('t3', { ramSize: 4 }),
    ]
    const devices = [
        new BasicDevice(1, { capabilities: ['t1', 't2', 't3'], totalRam: 5 }),
        new BasicDevice(2, { capabilities: ['t1', 't2', 't3'], totalRam: 6 }),
        new BasicDevice(3, { capabilities: ['t1', 't2', 't3'], totalRam: 4 }),
    ]
    return new Scenario('ram-error', nodes,  devices)
}
