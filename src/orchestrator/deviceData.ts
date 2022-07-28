import { DeviceStatus } from '../device/deviceTypes'
import Node from '../node'

type DeviceData = {
  id: number,
  status: DeviceStatus,
  capabilities: string[],
  lastAssignment: Node[],
  memoryErrorNodes: number
}

interface EnhancedDeviceData extends DeviceData {
  uptime: number
  resources: {
    allocRam: number,
    freeRam: number,
    totalRam: number,
  }
  fails: number,
  mtbf: number,
  totalUptime: number
  detectedFail: boolean
}


export { DeviceData, EnhancedDeviceData }