import { DeviceStatus } from '../../device/deviceTypes'
import { EnhancedDeviceData } from '../../orchestrator/deviceData'
import { EnhancedOrchestrator } from '../../orchestrator/enhanced-orchestrator'
import { AssignmentStrategy, NodeDeviceAssignment } from './assignment-strategy'
import Node from '../../node'
import { compareArrays } from '../../utils'
import { DeviceResponseStatus } from '../../device/response'

class AssignmentStrategyV5 extends AssignmentStrategy {
    private score: number
    private assigning: boolean

    constructor(orchestrator: EnhancedOrchestrator) {
        super(orchestrator)
        this.score = -1
        this.assigning = false
    }


    async distributeFlow() {
        if (this.orchestrator.nodes.length === 0) {
            this.orchestrator.assigning = false
            return
        }

        this.orchestrator.assigning = true

        if (this.orchestrator.verbose) console.log('Distributing flows')

        const failedDevices = Array.from(this.orchestrator.failedDevices)

        if (failedDevices.length > 0) { // minimum set of changes

            const failedNodes = failedDevices.flatMap((id) => [...(this.orchestrator.currAssignment.get(id) || [])])
            failedDevices.forEach((id) => { this.orchestrator.currAssignment.set(id, []) })
            this.orchestrator.failedDevices.clear()

            if (failedNodes.length > 0) {
                const availableDevices = Array.from(this.orchestrator.currDeviceState.keys())
                    .filter((k) => this.orchestrator.currDeviceState.get(k)!.status === DeviceStatus.ON)
                    .map((k) => this.orchestrator.currDeviceState.get(k)!)

                const capabilities: { [capability: string]: number } = {}

                for (const device of availableDevices) {
                    for (const c of device.capabilities) {
                        capabilities[c] = capabilities[c] ? capabilities[c] + 1 : 1
                    }
                }

                const sortedNodes = failedNodes.sort((n1, n2) => ((capabilities[n1.task] || 0) - (capabilities[n2.task]) || 0))
                const currAssignment = new Map(this.orchestrator.currAssignment)

                const assignment = this.generateAssignment(sortedNodes, 0, availableDevices, currAssignment, currAssignment)

                if (assignment !== null) {
                    const success = await this.deploy(assignment)

                    if (success) {
                        const score = this.calculateAssignmentScore(assignment)
                        this.orchestrator.score = score
                        this.orchestrator.shouldReorchestrate = false
                        this.orchestrator.assigning = false
                        if (this.orchestrator.verbose) console.log('Finished distributing flows with MSC')
                        return
                    } else {
                        if (this.orchestrator.verbose) console.log('Minimum set of changes deployment failed')
                    }
                } else {
                    if (this.orchestrator.verbose) console.log('Impossible minimum set of changes assignment')
                }
            }
        }

        this.orchestrator.failedDevices.clear()

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

        const assignment = this.generateAssignment(sortedNodes, 0, availableDevices, emptyAssignment, emptyAssignment)

        if (assignment === null) {
            if (this.orchestrator.verbose) console.log('Impossible orchestration')
            this.orchestrator.assigning = false
            this.orchestrator.score = -1
            return
        }

        const score = (0.5 * this.calculateAssignmentScore(assignment)) +
            (0.5 * this.calculateAffectedNodesScore(this.orchestrator.currAssignment, assignment, this.orchestrator.nodes))

        if (score <= this.orchestrator.score) {
            if (this.orchestrator.verbose) console.log('New orchestration is not better than previous')
            this.orchestrator.assigning = false
            this.orchestrator.shouldReorchestrate = false
            return
        }

        const success = await this.deploy(assignment)

        if (success) {
            this.orchestrator.score = score
            this.orchestrator.shouldReorchestrate = false
        } else {
            if (this.orchestrator.verbose) console.log('Re-orchestrating due to deploy failure')
            this.orchestrator.score = -1
            this.orchestrator.shouldReorchestrate = true
        }

        if (this.orchestrator.verbose) console.log('Finished distributing flows')
        this.orchestrator.assigning = false
    }

    getDeviceScores(node: Node, devices: EnhancedDeviceData[], currentAssignment: NodeDeviceAssignment, prevAssignment: NodeDeviceAssignment) {
        const scores = []

        for (const device of devices) {

            // Ignores if the device's RAM cannot handle this node given the current assignment
            const currAssignmentRam = (currentAssignment.get(device.id) || []).reduce((acc, nodeInfo) => acc + nodeInfo.properties.ramSize, 0)

            if (device.resources.totalRam < (currAssignmentRam + node.properties.ramSize)) {
                continue
            }

            // Ignores if device cannot perform task
            // if (predicateIntersection.length < nodePredicates.length) continue
            if (!device.capabilities.includes(node.task)) continue

            // If previous assignment contained assigned nodes to this device AND the current assignment hasn't added any nodes
            // then the no. of affected nodes is the number of previously assigned nodes
            // else there are no affected nodes
            const affectedNodes = prevAssignment.get(device.id) && prevAssignment.get(device.id)!.length === currentAssignment.get(device.id)!.length ?
                prevAssignment.get(device.id)!.length : 0
            const changeIndex = 1 / (affectedNodes + 1)

            const currNodes = (currentAssignment.get(device.id) || []).length
            const nodeIndex = 1 / (currNodes + 1)

            const stabilityIndex = this.getDeviceNodeStability(device.id, node.id)

            const matchIndex = (changeIndex * 0.15) + (nodeIndex * 0.15) + (stabilityIndex * 0.7)

            scores.push({ device: device.id, score: matchIndex })
        }

        scores.sort((d1, d2) => d2.score - d1.score)

        return scores
    }

    generateAssignment(nodes: Node[], index: number, devices: EnhancedDeviceData[], currAssignment: NodeDeviceAssignment, prevAssignment: NodeDeviceAssignment): NodeDeviceAssignment | null {
        if (index >= nodes.length) {
            return currAssignment
        }
        const node = nodes[index]
        const scores = this.getDeviceScores(node, devices, currAssignment, prevAssignment)

        for (const { device } of scores) {
            const newDeviceAssignment = currAssignment.get(device) ? [...currAssignment.get(device)!, node] : [node]
            const newAssignment = new Map(currAssignment)
            newAssignment.set(device, newDeviceAssignment)
            const next = this.generateAssignment(nodes, index + 1, devices, newAssignment, prevAssignment)
            if (next !== null) {
                return next
            }
        }
        return null
    }

    async deploy(assignment: NodeDeviceAssignment) {
        let success = true
        const prevAssignment = new Map(this.orchestrator.currAssignment)
        this.orchestrator.currAssignment = new Map(assignment)
        this.orchestrator.mqttClient?.publish('ALLOCATION', assignment, true)
        await Promise.all(Array.from(assignment.keys()).map(async (id: number) => {
            const nodes: Node[] = assignment.get(id)!
            if (!compareArrays(prevAssignment.get(id)!, nodes)) {
                const { status } = await this.orchestrator.deviceRegistry.get(id)!.rpc('setNodes', { nodes: [...nodes] })
                if (status === DeviceResponseStatus.SUCCESS) {
                    this.orchestrator.currDeviceState.get(id)!.lastAssignment = [...nodes]
                } else if (status === DeviceResponseStatus.MEM_ERROR) {
                    if (this.orchestrator.verbose) console.log(`Error deploying nodes to device ${id}: memory error`)
                    this.orchestrator.currDeviceState.get(id)!.memoryErrorNodes = nodes.length
                    this.orchestrator.failedDevices.add(id)
                    success = false
                } else if (status === DeviceResponseStatus.FAIL && nodes.length > 0) {
                    if (this.orchestrator.verbose) console.log(`Error deploying nodes to device ${id}: general fail`)
                    this.orchestrator.failedDevices.add(id)
                    success = false
                }
            }
        }))
        return success
    }

    getDeviceNodeStability(deviceId: number, nodeId: number) {
        const nodeMTBF = this.orchestrator.nodeMTBF.get(nodeId)!.get(deviceId)
        const operand = nodeMTBF &&
            nodeMTBF.mtbf ?
            Math.min(nodeMTBF.mtbf / 20, 1) :
            1
        return (0.5 * this.getDeviceStability(deviceId)) + (0.5 * operand)
    }
}

export { AssignmentStrategyV5 }