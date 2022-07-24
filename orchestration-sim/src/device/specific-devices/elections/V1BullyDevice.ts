import { Message } from "../../../comms/mqtt/MQTT";
import { getRandomInt } from "../../../utils";
import { DeviceParams } from "../../deviceTypes";
import OrchestratorDevice from "./orchestratorDevice";


type BullyPost = {
  deviceId: number,
  bid: number,
}

class V1BullyDevice extends OrchestratorDevice {

  private waitTime: number;
  private inElection!: boolean;
  private selfElectionTimeout!: NodeJS.Timeout | null;
  private largestBid!: number;

  constructor(
    id: number,
    params: DeviceParams,
    orchestratorVersion: string,
    waitTime: number = 2000,
  ) {
    super(id, params, orchestratorVersion);
    this.reset();
    this.waitTime = waitTime;
  }

  private reset(): void {
    this.cleanElectionVariables();
  }

  override async onStart(): Promise<void> {
    await super.onStart();
    this.reset();
    this.mqttClient?.subscribe("ELECTIONS", this.handleBid.bind(this));
  }

  override async onStop(): Promise<void> {
    await super.onStop();
    if (this.selfElectionTimeout) {
      clearInterval(this.selfElectionTimeout);
    }
  }

  override handleLWT(msg: Message): Promise<void> {
    const receivedMsg: { device: number, type: string } = msg.data;

    if (receivedMsg.type === 'orchestrator') {
      return this.handleOrchestratorFail(msg);
    } else if (receivedMsg.type === 'device') {
      return this.handleDeviceFail(msg);
    }

    return Promise.resolve();
  }

  private async handleOrchestratorFail(msg: Message): Promise<void> {
    if (this.inElection || msg.sender === this.mqttClient?.getId()) {
      return Promise.resolve();
    }
    this.logger.info("Placing bid due to orchestrator failure");
    this.inElection = true;
    this.placeBid();

    return Promise.resolve();
  }

  override async handleNewOrchestrator(msg: Message): Promise<void> {
    await super.handleNewOrchestrator(msg);
    this.cleanElectionVariables();
    return Promise.resolve();
  }

  private async handleDeviceFail(_: Message): Promise<void> {
    // purposefuly empty
  }

  override async handleNoOrchestrator(): Promise<void> {
    this.logger.info("No orchestrator found, starting election");
    this.handleOrchestratorFail({ sender: -1, data: null })
  }

  private async handleBid(msg: Message): Promise<void> {
    const adBid: BullyPost = msg.data;
    if (adBid.deviceId === this.id || adBid.bid < this.largestBid) {
      return;
    }

    if (!this.inElection) {
      this.inElection = true;
    }

    const ownBid = this.getBid();

    if (ownBid.bid < adBid.bid) {
      if (adBid.bid > this.largestBid) {
        this.largestBid = adBid.bid;
      }

      this.stopSelfElection()
      return;
    }
    this.logger.info("Placing bid due in response to received bid");
    this.placeBid();
  }

  private placeBid(): void {
    const ownBid = this.getBid();
    this.mqttClient?.publish("ELECTIONS", ownBid);
    this.prepareSelfElection();
  }

  private prepareSelfElection(): void {
    this.stopSelfElection();
    this.selfElectionTimeout = setTimeout(
      () => {
        console.log(`Device ${this.id} is the new orchestrator`);
        this.makeOrchestrator();
      },
      this.waitTime * 2);
  }


  private stopSelfElection(): void {
    if (this.selfElectionTimeout) {
      clearTimeout(this.selfElectionTimeout)
      this.selfElectionTimeout = null;
    }
  }

  private tieBreakerTerm: number = getRandomInt(0, 255) * 0.0001;

  private getBid(): BullyPost {
    const score =
      this.properties.resources.flashSize * 0.7 +
      this.properties.resources.totalRam * 0.3 -
      this.properties.capabilities.length * 3 +
      this.tieBreakerTerm;
    return { deviceId: this.id, bid: score };
  }

  private cleanElectionVariables(): void {
    if (this.selfElectionTimeout)
      clearTimeout(this.selfElectionTimeout);
    this.selfElectionTimeout = null;
    this.inElection = false;
    this.largestBid = -1;
  }
}

export default V1BullyDevice;