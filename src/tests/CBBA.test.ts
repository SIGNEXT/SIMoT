
import MQTTBroker, { MQTTClient } from "../comms/mqtt/MQTT";
import MQTTBrokerImplementation from "../comms/mqtt/MQTTBrokerImplementation";
import Device from "../device/device";
import CbbaAuction from "../device/specific-devices/cbba/auction/CbbaAuction";
import cbba_capabilities1 from "../scenarios/implementations/david/cbba/cbba_capabilities1";
import cbba_capabilities2 from "../scenarios/implementations/david/cbba/cbba_capabilities2";
import { areSetsEqual } from "../utils";
import Node from "../node";
import { Scenario } from "../scenarios/scenario";
import cbba_trivial1 from "../scenarios/implementations/david/cbba/cbba_trivial1";
import cbba_trivial2 from "../scenarios/implementations/david/cbba/cbba_trivial2";
import BundleScoreCalculator, { v0_maxFirst, v0_minFirst } from "../device/specific-devices/cbba/score/BundleScore";

let broker: MQTTBroker = new MQTTBrokerImplementation();
let pubClient: MQTTClient;
let subClient: MQTTClient;

beforeEach(() => {
  broker = new MQTTBrokerImplementation();
  pubClient = broker.connect()
  subClient = broker.connect()
});

async function runAuctionScenario(scenarioGen: () => Scenario, calculator: BundleScoreCalculator, fail = false) {
  const scenario = scenarioGen();
  const auctions = scenario.devices.map(
    (device: Device) => {
      const client = broker.connect();
      return new CbbaAuction("a", device.id, device.properties, device.state, scenario.nodes, [], client, calculator, undefined);
    }
  )

  const results = await Promise.all(auctions.map((auction) => auction.run()));
  const originalNodeIds = scenario.nodes.map((n) => n.id);
  const resultNodeIds = results[0][2].map((n) => n.id);
  const resultEquality = areSetsEqual(new Set<number>(originalNodeIds), new Set<number>(resultNodeIds));
  if(fail) {
    expect(resultEquality).toBeFalsy();
  } else {
    expect(resultEquality).toBeTruthy();
  }
}

describe('cbba', () => {
  test('Trivial 1 min', async () => {
    await runAuctionScenario(cbba_trivial1, v0_minFirst);
  });
  test('Trivial 2 min', async () => {
    await runAuctionScenario(cbba_trivial2, v0_minFirst);
  });
  test('Capabilities 1 min', async () => {
    await runAuctionScenario(cbba_capabilities1, v0_minFirst, true);
  });
  test('Capabilities 2 min', async () => {
    await runAuctionScenario(cbba_capabilities2, v0_minFirst);
  });
  test('Trivial 1 max', async () => {
    await runAuctionScenario(cbba_trivial1, v0_maxFirst);
  });
  test('Trivial 2 max', async () => {
    await runAuctionScenario(cbba_trivial2, v0_maxFirst);
  });
  test('Capabilities 1 max', async () => {
    await runAuctionScenario(cbba_capabilities1, v0_maxFirst);
  });
  test('Capabilities 2 max', async () => {
    await runAuctionScenario(cbba_capabilities2, v0_maxFirst, true);
  });
});