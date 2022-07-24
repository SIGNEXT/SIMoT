import Behaviour from "../behaviours/device/behaviour"
import Device from "./device"
import Node from "../node"

enum DeviceStatus {
  ON,
  OFF
}

type DeviceResources = {
  flashSize: number,
  totalRam: number
}

type DeviceState = {
  status: DeviceStatus,
  uptime: number,
  runInterval: NodeJS.Timeout | null,
  assignedNodes: Node[],
  resources: {
      allocRam: number,
      freeRam: number,
  }
  lastPayload: {
      time: number,
      size: number,
  } | null

  [other: string]: any
}

type DeviceProperties = {
  id: number
  capabilities: string[],
  syncBehaviours: Behaviour[],
  asyncBehaviours: Behaviour[],
  onAssignBehaviours: Behaviour[],
  resources: DeviceResources
}

type DeviceStateReport = {
  id: number,
  uptime: number,
  assigned_nodes: number[],
  nr_nodes: number,
  last_payload_size: number | null,
  last_payload_t: number,
  resources: {
      allocRam: number,
      freeRam: number,
      flashSize: number,
      totalRam: number
  }
}

type DeviceParams = {
  capabilities: string[],
  syncBehaviours?: Behaviour[],
  asyncBehaviours?: Behaviour[],
  onAssignBehaviours?: Behaviour[],
  flashSize?: number,
  totalRam?: number
}

type DeviceAnnouncement = {
  failure: boolean
  device: Device
}

export {
  DeviceState,
  DeviceStatus,
  DeviceParams,
  DeviceStateReport,
  DeviceAnnouncement,
  DeviceProperties
}
