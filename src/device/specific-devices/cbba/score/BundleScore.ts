import { DeviceProperties, DeviceState } from "../../../deviceTypes";
import Node from "../../../../node";
import { sigmoid } from "../../../../utils";
import StabilityStorage from "../StabilityStorage";

function calculateBundleMemoryFootprint(b: Node[], currentTasks: Node[], addAlreadyAssigned: boolean = true): number {
  const bundleFP = b.reduce((previousValue, currentValue) => previousValue + currentValue.properties.ramSize, 0);
  const alreadyFP =  currentTasks.reduce((previousValue, currentValue) => previousValue + currentValue.properties.ramSize, 0);
  return bundleFP + (addAlreadyAssigned ? alreadyFP : 0);
}

type BundleScoreCalculator = (currentBundle: Node[], currentTasks: Node[], candidateTask: Node, properties: DeviceProperties, state: DeviceState) => number

function v0_minFirst(currentBundle: Node[], currentTasks: Node[], candidateTask: Node, deviceProperties: DeviceProperties, _: DeviceState): number {
  if (!deviceProperties.capabilities.includes(candidateTask.task)) {
    return 0;
  }

  const currentBundleFootprint = calculateBundleMemoryFootprint(currentBundle, currentTasks);
  const currentAvailableMem =  deviceProperties.resources.totalRam - currentBundleFootprint;
  const futureAvailableMem = currentAvailableMem - candidateTask.properties.ramSize;

  if (futureAvailableMem < 0) {
    return 0;
  }

  return futureAvailableMem + 1;
}

function v0_maxFirst(currentBundle: Node[], currentTasks: Node[], candidateTask: Node, deviceProperties: DeviceProperties, _: DeviceState): number {
  if (!deviceProperties.capabilities.includes(candidateTask.task)) {
    return 0;
  }

  const currentBundleFootprint = calculateBundleMemoryFootprint(currentBundle, currentTasks);
  const currentAvailableMem =  deviceProperties.resources.totalRam - currentBundleFootprint;
  const futureAvailableMem = currentAvailableMem - candidateTask.properties.ramSize;

  if (futureAvailableMem < 0) {
    return 0;
  } 

  return  candidateTask.properties.ramSize + currentAvailableMem;
}

function v2_maxFirst_stability(currentBundle: Node[], currentTasks: Node[], candidateTask: Node, deviceProperties: DeviceProperties, state: DeviceState): number {
  if (!deviceProperties.capabilities.includes(candidateTask.task)) {
    return 0;
  }

  const currentBundleFootprint = calculateBundleMemoryFootprint(currentBundle, currentTasks);
  const sigmoidValue = sigmoid(state.stabilityStorage.getDeviceFails(), 2, 4);
  const cutoff = sigmoidValue < 0.1  ? 0 : sigmoidValue;
  const currentAvailableMem =  deviceProperties.resources.totalRam * (1 - cutoff) - currentBundleFootprint;
  const futureAvailableMem = currentAvailableMem - candidateTask.properties.ramSize;

  if (futureAvailableMem < 0) {
    return 0;
  }


  return  candidateTask.properties.ramSize + currentAvailableMem;
}

function v5_maxFirst_nodeDeviceStability(currentBundle: Node[], currentTasks: Node[], candidateTask: Node, deviceProperties: DeviceProperties, state: DeviceState): number {
  if (!deviceProperties.capabilities.includes(candidateTask.task)) {
    return 0;
  }

  const currentBundleFootprint = calculateBundleMemoryFootprint(currentBundle, currentTasks);
  const currentAvailableMem =  deviceProperties.resources.totalRam - currentBundleFootprint;
  const futureAvailableMem = currentAvailableMem - candidateTask.properties.ramSize;

  if (futureAvailableMem < 0) {
    return 0;
  }
  const stabilityMap: StabilityStorage = state.stabilityStorage;
  const failPerc = stabilityMap.getFailCount(candidateTask.id);
  const failAvg = stabilityMap.getFailAvg();
  let factor = 0;
  if (failPerc > failAvg) {
    factor = sigmoid(stabilityMap.getFailCount(candidateTask.id), 5, 3);
  }

  return (1 - factor) * (candidateTask.properties.ramSize + currentAvailableMem);
}


export default BundleScoreCalculator
export {
  calculateBundleMemoryFootprint,
  v2_maxFirst_stability,
  v5_maxFirst_nodeDeviceStability,
  v0_minFirst,
  v0_maxFirst
}