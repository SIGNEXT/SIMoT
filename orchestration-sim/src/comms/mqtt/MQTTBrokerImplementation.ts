import { getRandomInt, sleep } from "../../utils";
import MQTTBroker, { Message, MQTTClient, SubscriptionCallback } from "./MQTT";
import MQTTClientImplementation from "./MQTTClientImplementation";
import * as winston from "winston";

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/mqtt.log',  options: { flags: 'w' } }, ),
  ],
});

const logger2 = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/messages.log',  options: { flags: 'w' } }, ),
  ],
});

const simulateNetworkDelay = async () => {
  return sleep(getRandomInt(25, 100));
}

class MQTTBrokerImplementation implements MQTTBroker {

  private readonly brokerId: number = -1;
  private currentId: number;
  private topics: { [topicId: string]: Topic }
  private connectedClients: { [clientId: string]: MQTTClient }
  private sentMessages: number;

  constructor() {
    this.currentId = 0;
    this.sentMessages = 0;
    this.topics = { "LWT": new Topic("LWT") };
    this.connectedClients = {};
    setInterval(() =>logger2.info(`${this.sentMessages}`), 1000)
  }


  async publish(topic: string, msg: Message, retain?: boolean): Promise<boolean> {
    // await simulateNetworkDelay();
    if (!this.topics[topic]) {
      this.topics[topic] = new Topic(topic);
    }
    this.sentMessages++;
    this.topics[topic].publish(msg, retain);
    return Promise.resolve(true);
  }

  async subscribe(clientId: number, topic: string, callback: SubscriptionCallback): Promise<boolean> {
    // await simulateNetworkDelay();
    if (!this.topics[topic]) {
      this.topics[topic] = new Topic(topic);
    }

    this.topics[topic].subscribe(clientId, callback);
    return Promise.resolve(true);
  }

  async subscribeAndGetRetained(clientId: number, topic: string, callback: SubscriptionCallback): Promise<[boolean, Message | null]> {
    // await simulateNetworkDelay();
    if (!this.topics[topic]) {
      this.topics[topic] = new Topic(topic);
    }

    return [true, await this.topics[topic].subscribeAndGetRetained(clientId, callback)];
  }

  async unsubscribe(clientId: number, topic: string): Promise<boolean> {
    if (!this.topics[topic]) {
      return Promise.resolve(true);
    }

    this.topics[topic].unsubscribe(clientId);
    return Promise.resolve(true);
  }

  public connect(lwt: any = null): MQTTClient {
    const newClient: MQTTClient = new MQTTClientImplementation(this.currentId, this, lwt);
    this.connectedClients[this.currentId] = newClient;
    logger.info(`[BROKER] Client ${this.currentId} just connected (LWT=${lwt})`);
    this.currentId++;
    return newClient;
  }

  public disconnect(clientId: number, ungraceful: boolean = false): Promise<boolean> {
    logger.info(`[BROKER] Client ${clientId} just disconnected ${ungraceful ? "ungracefully" : "gracefully"}`);
    Object.values(this.topics).forEach(
      (topic: Topic) => {
        topic.unsubscribe(clientId);
      }
    )

    if (ungraceful && this.connectedClients[clientId].getLwt()) {
      this.publish("LWT", { sender: this.brokerId, data: this.connectedClients[clientId].getLwt()})
    }

    return Promise.resolve(true);
  }

  public reconnect(client: MQTTClient, lwt?: any): MQTTClient {
    this.connectedClients[client.getId()] = client;
    logger.info(`[BROKER] Client ${client.getId()} just connected (LWT=${lwt})`);
    return client;
  }
}

class Topic {
  public topic: string;
  private retainedMessage: Message | null;
  private subscribers: { [subId: number]: SubscriptionCallback };

  constructor(topic: string) {
    this.topic = topic;
    this.retainedMessage = null;
    this.subscribers = {}
  }

  public async subscribe(clientId: number, callback: SubscriptionCallback): Promise<boolean> {
    this.subscribers[clientId] = callback;
    logger.info(`[${this.topic}] Client ${clientId} just subscribed`)

    if (this.retainedMessage) {
      await callback(this.retainedMessage);
    }

    return Promise.resolve(true);
  }

  public async subscribeAndGetRetained(clientId: number, callback: SubscriptionCallback): Promise<Message | null> {
    this.subscribers[clientId] = callback;
    logger.info(`[${this.topic}] Client ${clientId} just subscribed`)

    if (this.retainedMessage) {
      return Promise.resolve(this.retainedMessage);
    }

    return Promise.resolve(null);
  }

  public async unsubscribe(clientId: number): Promise<boolean> {
    if (!this.subscribers[clientId]) {
      return Promise.resolve(true);
    }

    delete this.subscribers[clientId];

    return Promise.resolve(true);
  }

  public async publish(msg: Message, retain: boolean = false): Promise<void> {
    if (retain) {
      this.retainedMessage = msg;
    }

    const shuffledArray = Object.values(this.subscribers).map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
    // logger.info(`[${this.topic}] Sending message from ${msg.sender} (${retain}) to ${shuffledArray.length} subscribers: ${msg.data}`)
    // Publish values to subscribers
    const promises = shuffledArray.map(
      async (callback: SubscriptionCallback) => {
        await callback(msg);
      }
    )

    await Promise.all(promises);
  }
}

export default MQTTBrokerImplementation;
