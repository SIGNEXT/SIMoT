
type SubscriptionCallback = (msg: Message) => Promise<void>;

interface MQTTBroker {
  connect(lwt?: any): MQTTClient;
  reconnect(client: MQTTClient, lwt?: any): MQTTClient;
  disconnect(clientId: number, ungraceful: boolean): Promise<boolean>;
  publish(topic: string, msg: Message, retain?: boolean): Promise<boolean>;
  subscribe(clientId: number, topic: string, callback: SubscriptionCallback): Promise<boolean>;
  subscribeAndGetRetained(clientId: number, topic: string, callback: SubscriptionCallback): Promise<[boolean, Message | null]>;
  unsubscribe(clientId: number, topic: string): Promise<boolean>;
}

interface MQTTClient {
  publish(topic: string, data: any, retain?: boolean): Promise<boolean>;
  subscribe(topic: string, callback: SubscriptionCallback): Promise<boolean>;
  subscribeAndGetRetained(topic: string, callback: SubscriptionCallback): Promise<[boolean, Message | null]>;
  unsubscribe(topic: string): Promise<boolean>;
  getId(): number;
  connect(lwt?: any): MQTTClient;
  disconnect(ungraceful: boolean): Promise<boolean>;
  getLwt(): any;
  setLwt(lwt: any): void;
}

type Message = {
  sender: number,
  data: any
}

export default MQTTBroker;

export { MQTTBroker, MQTTClient, Message, SubscriptionCallback };