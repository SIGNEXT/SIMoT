import OrchestratorBehaviour from "../behaviours/orchestrator/orchestratorBehaviour";
import MQTTBroker, { MQTTClient } from "../comms/mqtt/MQTT";
import Device from "../device/device";
import { NodeDeviceAssignment } from "../strategies/assignment/assignment-strategy";
import { EnhancedDeviceData } from "./deviceData";
import Node from "../node";
import OrchestratorDevice from "../device/specific-devices/elections/orchestratorDevice";


abstract class Orchestrator {

  public nodes: Node[];
  public version: string;
  public verbose: boolean;
  public assigning!: boolean;

  public deviceRegistry!: Map<number, Device>
  public currDeviceState!: Map<number, EnhancedDeviceData>
  public currAssignment!: NodeDeviceAssignment;

  public mqttClient: MQTTClient | null;
  protected behaviours: OrchestratorBehaviour[];
  protected enclosedDevice: OrchestratorDevice | null;

  constructor(
    version: string,
    nodes: Node[],
    mqttBroker: MQTTBroker | null,
    { verbose = false } = {},
    behaviours: OrchestratorBehaviour[] = [],
    enclosedDevice: OrchestratorDevice | null = null) {

    this.nodes = nodes;
    this.version = version;
    this.verbose = verbose;
    this.mqttClient = mqttBroker ? mqttBroker.connect({ device: -2, type: "orchestrator" }) : null;
    this.behaviours = behaviours;
    this.behaviours.forEach(
      (behaviour) => {
        behaviour.setOrchestrator(this);
      }
    )
    this.enclosedDevice = enclosedDevice;
    this.reset(nodes);
  }

  public setMQTTClient(mqttClient: MQTTClient): void {
    this.mqttClient = mqttClient;
  }

  public reset(nodes: Node[] = []) {
    this.nodes = nodes;
    this.deviceRegistry = new Map(); // Registry devices
    this.currDeviceState = new Map(); // Orchestrator devices
    this.currAssignment = new Map();
    this.assigning = false;
  }

  public abstract run(): Promise<void>;
  public abstract stop(forced: boolean): Promise<void>; 
  public abstract rpc(command: string, args: any): Promise<any>;
}

export default Orchestrator;