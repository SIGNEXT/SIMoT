import { DeviceStatus } from '../../device/deviceTypes'
import { EnhancedDeviceData } from '../../orchestrator/deviceData'
import { EnhancedOrchestrator } from '../../orchestrator/enhanced-orchestrator'
import { DeviceResponseStatus } from '../../device/response'
import { compareArrays } from '../../utils'
import { AssignmentStrategy, NodeDeviceAssignment } from './assignment-strategy'
import Node from '../../node'

class AssignmentStrategyV3 extends AssignmentStrategy {
    private score: number
    private assigning: boolean

    constructor(orchestrator: EnhancedOrchestrator) {
        super(orchestrator)
        this.score = -1
        this.assigning = false
    }

    async distributeFlow(): Promise<void> {
        if (this.orchestrator.nodes.length === 0) {
            this.orchestrator.assigning = false
            return
        }

        this.orchestrator.assigning = true

        if (this.orchestrator.verbose) console.log('Distributing flows')

        const availableDevices = Array.from(this.orchestrator.currDeviceState.keys())
            .filter((k) => this.orchestrator.currDeviceState.get(k)!.status === DeviceStatus.ON)
            .map((k) => this.orchestrator.currDeviceState.get(k)!)

        const capabilities: { [capability: string]: number } = {}

        for (const device of availableDevices) {
            for (const c of device.capabilities) {
                capabilities[c] = capabilities[c] ? capabilities[c] + 1 : 1
            }
        }

        const sortedNodes = [...this.orchestrator.nodes].sort((n1, n2) => ((capabilities[n1.task] || 0) - (capabilities[n2.task]) || 0))

        const emptyAssignment = new Map<number, Node[]>()

        for (const data of availableDevices) {
            emptyAssignment.set(data.id, [])
        }

        const assignment = this.generateAssignment(sortedNodes, 0, availableDevices, emptyAssignment)

        if (assignment === null) {
            if (this.orchestrator.verbose) console.log('Impossible orchestration')
            this.orchestrator.assigning = false
            this.orchestrator.score = -1
            return
        }

        const score = this.calculateAssignmentScore(assignment)

        if (score <= this.orchestrator.score) {
            if (this.orchestrator.verbose) console.log('New orchestration is not better than previous')
            this.orchestrator.assigning = false
            this.orchestrator.shouldReorchestrate = false
            return
        }

        const changes: { [id: string]: { status?: DeviceStatus, nodes: number[] } } = {}

        const prevAssignment = new Map(this.orchestrator.currAssignment)
        this.orchestrator.currAssignment = new Map(assignment)

        await Promise.all(Array.from(assignment.keys()).map(async (id: number) => {
            const nodes: Node[] = assignment.get(id)!
            if (!compareArrays(prevAssignment.get(id)!, nodes)) {
                const { status } = await this.orchestrator.deviceRegistry.get(id)!.rpc('setNodes', { nodes: [...nodes] })
                if (status === DeviceResponseStatus.SUCCESS) {
                    this.orchestrator.currDeviceState.get(id)!.lastAssignment = [...nodes]
                    this.orchestrator.currAssignment.set(id, [...nodes])
                } else if (status === DeviceResponseStatus.MEM_ERROR) {
                    if (this.orchestrator.verbose) console.log(`Error deploying nodes to device ${id}: memory error`)
                    this.orchestrator.currDeviceState.get(id)!.memoryErrorNodes = nodes.length
                    changes[id] = { nodes: [] }
                } else if (status === DeviceResponseStatus.FAIL) {
                    if (this.orchestrator.verbose) console.log(`Error deploying nodes to device ${id}: general fail`)
                    changes[id] = { nodes: [], status: DeviceStatus.OFF }
                }
            }
        }))

        if (Object.keys(changes).length) {
            if (this.orchestrator.verbose) console.log('Re-orchestrating due to deploy failure')
            this.orchestrator.score = -1
            this.orchestrator.shouldReorchestrate = true
        } else {
            this.orchestrator.score = score
            this.orchestrator.shouldReorchestrate = false
        }

        if (this.orchestrator.verbose) console.log('Finished distributing flows')
        this.orchestrator.assigning = false
    }

    getDeviceScores(node: Node, devices: EnhancedDeviceData[], currentAssignment: NodeDeviceAssignment) {
        const scores = []

        for (const device of devices) {
            const assignedNodes = currentAssignment.get(device.id)!
            const nrNodes = assignedNodes.length

            // Ignores if the device's RAM cannot handle this node given the current assignment
            const currAssignmentRam = assignedNodes.reduce((acc, assignedNode) => acc + assignedNode.properties.ramSize, 0)

            if (device.resources.totalRam < (currAssignmentRam + node.properties.ramSize)) {
                continue
            }

            // Ignores if device cannot perform task
            // if (predicateIntersection.length < nodePredicates.length) continue
            if (!device.capabilities.includes(node.task)) continue

            const nodeIndex = 1 / (nrNodes + 1)

            // Devices are considered stable (index = 1) if its MTBF is greater or equal to STABILITY_FACTOR
            const stabilityIndex = this.getDeviceStability(device.id)

            const matchIndex = (nodeIndex * 0.3) + (stabilityIndex * 0.7)

            scores.push({ device: device.id, score: matchIndex })
        }

        scores.sort((d1, d2) => d2.score - d1.score)

        return scores
    }

    generateAssignment(nodes: Node[], index: number, devices: EnhancedDeviceData[], currAssignment: NodeDeviceAssignment): NodeDeviceAssignment | null {
        if (index >= nodes.length) {
            return currAssignment
        }
        const node = nodes[index]
        const scores = this.getDeviceScores(node, devices, currAssignment)

        for (const { device } of scores) {
            const newDeviceAssignment = currAssignment.get(device) ? [...currAssignment.get(device)!, node] : [node]
            const newAssignment = new Map(currAssignment)
            newAssignment.set(device, newDeviceAssignment)
            const next = this.generateAssignment(nodes, index + 1, devices, newAssignment)
            if (next !== null) {
                return next
            }
        }
        return null
    }
}

export { AssignmentStrategyV3 }
