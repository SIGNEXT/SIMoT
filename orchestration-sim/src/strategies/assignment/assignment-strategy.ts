import { EnhancedOrchestrator } from "../../orchestrator/enhanced-orchestrator";
import Node from "../../node";
import { compareArrays } from "../../utils";

const STABILITY_FACTOR = 60;

type NodeDeviceAssignment = Map<number, Node[]>;

abstract class AssignmentStrategy {

    protected orchestrator: EnhancedOrchestrator;
    protected stabilityFactor: number;

    constructor(orchestrator: EnhancedOrchestrator) {
        this.orchestrator = orchestrator;
        this.stabilityFactor = STABILITY_FACTOR;
    }

    public abstract distributeFlow(): void;

    // common utility methods
    protected validateAssignment(assignment: NodeDeviceAssignment) {
        const s = new Set();
        for (const nodes of Object.values(assignment)) {
            for (const node of nodes) {
                if (s.has(node.id)) {
                    console.log("Repeated nodes");
                    process.exit(2);
                } else {
                    s.add(node.id);
                }
            }
        }
    }

    protected getDeviceStability(id: number): number {
        const device = this.orchestrator.currDeviceState.get(id)!;
        return device.fails > 0 ? Math.min(device.mtbf / this.stabilityFactor, 1) : 1;
    }

    protected calculateAssignmentScore(assignment: NodeDeviceAssignment): number {
        const nrDevices = assignment.size;
        const nrNodes = this.orchestrator.nodes.length;
        const avgNodesPerDevice = nrNodes / nrDevices;
        const metrics = { sumDeviation: 0, sumStability: 0, sumNodes: 0 };

        for (const [deviceId, nodes] of assignment) {
            const nodeCount = nodes.length
            metrics.sumDeviation += Math.abs(avgNodesPerDevice - nodeCount);
            metrics.sumStability += (nodeCount * this.getDeviceStability(deviceId));
            metrics.sumNodes += nodeCount;
        }

        if (metrics.sumNodes !== nrNodes) {
            return -1;
        }

        const balancingIndex = 1 - (metrics.sumDeviation / (((nrDevices - 1) * avgNodesPerDevice) + (nrNodes - avgNodesPerDevice)));
        const stabilityIndex = metrics.sumStability / nrNodes;

        return (balancingIndex * 0.5) + (stabilityIndex * 0.5);
    }

    protected calculateAffectedNodesScore(currAssignment: NodeDeviceAssignment, newAssignment: NodeDeviceAssignment, nodes: Node[]): number {
        let affectedNodes = 0;
        for (const [id, assignedNodes] of currAssignment) {
            if (!compareArrays(newAssignment.get(id)!, assignedNodes)) {
                affectedNodes += assignedNodes.length;
            }
        }
        return 1 - (affectedNodes / nodes.length);
    }
}

export { AssignmentStrategy, NodeDeviceAssignment };