import { Message } from "../../../comms/mqtt/MQTT";
import { EnhancedOrchestrator } from "../../../orchestrator/enhanced-orchestrator";
import { orchestratorVersions } from "../../../versioner";
import Device from "../../device";
import { DeviceAnnouncement, DeviceParams } from "../../deviceTypes";

class OrchestratorDevice extends Device {
  public ownOrchestrator: EnhancedOrchestrator;
  private isCentralOrchestrator: boolean;
  constructor(
    id: number,
    params: DeviceParams,
    orchestratorVersion: string,
    isCentralOrchestrator: boolean = false
  ) {
    super(id, params)
    this.isCentralOrchestrator = isCentralOrchestrator;
    const Orchestrator: any = orchestratorVersions[orchestratorVersion];
    this.ownOrchestrator = new Orchestrator(orchestratorVersion, [], null, { verbose: true }, [], this);
    this.ownOrchestrator.thisId = id;
  }

  protected announceSelf(fail: boolean = false): void {
    const announcement: DeviceAnnouncement = {
        failure: fail,
        device: this
    }

    if (this.mqttClient === null) {
        console.log("Could not announce self because MQTT client is null");
        return;
    }

    this.mqttClient.publish("ANNOUNCE", announcement);
}

  override async onStart(fail: boolean = false) {
    this.clearNodes();  
    this.announceSelf(fail);
    this.setupSubscriptions();
    this.ownOrchestrator.setMQTTClient(this.mqttClient!);

    if (this.isCentralOrchestrator) {
      this.makeOrchestrator();
      return
    }

    this.state.isOrchestrator = false;
    this.mqttClient?.setLwt({ device: this.id, type: "device" })
    this.ownOrchestrator.reset();
    const [_, message] = await this.mqttClient!.subscribeAndGetRetained("ORCHESTRATOR", this.handleNewOrchestrator.bind(this));

    if (message === null) {
      this.handleNoOrchestrator();
    }
  }


  override async onStop() {
    if (this.state.isOrchestrator) {
      this.ownOrchestrator.stop();
      this.state.isOrchestrator = false;
    }
  }

  protected async handleNewOrchestrator(msg: Message): Promise<void> {
    if (this.isCentralOrchestrator) {
      return Promise.resolve();
    }

    this.perceivedOrchestrator = msg.data.orchestrator;
    this.perceivedOrchestrator!.rpc("announce", { device: this, fail: false });
    return Promise.resolve();
  }

  protected async handleNoOrchestrator(): Promise<void> {
    return Promise.resolve();
  }

  protected makeOrchestrator(): void {
    this.state.isOrchestrator = true;
    this.mqttClient?.setLwt({ device: this.id, type: "orchestrator" })
    this.ownOrchestrator.run();
    this.mqttClient?.publish("ORCHESTRATOR", { device: this.id, orchestrator: this.ownOrchestrator }, true);
  }

  protected setupSubscriptions() {
    this.mqttClient?.subscribe('LWT', this.handleLWT.bind(this));
  }

  protected async handleLWT(msg: Message) {
    console.log(`Detected orchestrator failure: ${msg}`);
  }
}

export default OrchestratorDevice;