import { EnhancedOrchestrator } from "./orchestrator/enhanced-orchestrator";
import { BasicOrchestrator } from "./orchestrator/basic-orchestrator";
import BundleScoreCalculator, { v0_maxFirst, v0_minFirst, v2_maxFirst_stability, v5_maxFirst_nodeDeviceStability } from "./device/specific-devices/cbba/score/BundleScore";

const orchestratorVersions: {[version: string]: NewableFunction} = {
    "v0": BasicOrchestrator,
    "v1": EnhancedOrchestrator,
    "v2": EnhancedOrchestrator,
    "v3": EnhancedOrchestrator,
    "v4": EnhancedOrchestrator,
    "v5": EnhancedOrchestrator,
}

const scoreFunctionVersions: {[version: string]: BundleScoreCalculator} = {
    "maxFirst": v0_maxFirst,
    "minFirst": v0_minFirst,
    "stability": v2_maxFirst_stability,
    "node-stability": v5_maxFirst_nodeDeviceStability,
}

export { orchestratorVersions, scoreFunctionVersions };
