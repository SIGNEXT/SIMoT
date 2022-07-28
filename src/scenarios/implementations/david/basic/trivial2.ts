import BasicDevice from '../../../../device/specific-devices/basicDevice'
import Node from '../../../../node'
import { Scenario } from '../../../scenario'

export default (_: string = '') => {
    const nodes = [
        new Node('t1', { ramSize: 20 }),
        new Node('t1', { ramSize: 20 }),
        new Node('t1', { ramSize: 20 }),
        new Node('t1', { ramSize: 20 }),
        new Node('t1', { ramSize: 20 }),
        new Node('t1', { ramSize: 20 }),
        new Node('t2', { ramSize: 20 }),
        new Node('t3', { ramSize: 20 }),
    ]
    const devices = [
        new BasicDevice(1, { capabilities: ['t1'], totalRam: 100 }),
        new BasicDevice(2, { capabilities: ['t1'], totalRam: 100 }),
        new BasicDevice(3, { capabilities: ['t1'], totalRam: 100 }),
        new BasicDevice(4, { capabilities: ['t2', 't3'], totalRam: 50 }),
        new BasicDevice(5, { capabilities: ['t4'], totalRam: 50 }),
    ]
    return new Scenario('trivial2', nodes, devices)
}
