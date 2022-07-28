import MQTTBroker, { Message, MQTTClient, SubscriptionCallback } from './MQTT'

class MQTTClientImplementation implements MQTTClient {

  private broker: MQTTBroker
  private id: number
  private subscriptions: string[]
  private lwt: any

  constructor(id: number, broker: MQTTBroker, lwt: any = null) {
    this.broker = broker
    this.id = id
    this.subscriptions = []
    this.lwt = lwt
  }


  public async disconnect(ungraceful: boolean = false): Promise<boolean> {
    return this.broker.disconnect(this.id, ungraceful)
  }
  public getId(): number {
    return this.id
  }
  
  public async publish(topic: string, data: any, retain: boolean = false): Promise<boolean> {
    return this.broker.publish(topic, { sender: this.id, data }, retain)
  }

  public async subscribe(topic: string, callback: SubscriptionCallback): Promise<boolean> {
    const result: boolean = await this.broker.subscribe(this.id, topic, callback)

    if(result) {
      this.subscriptions.push(topic)
    }

    return result
  }

  public async subscribeAndGetRetained(topic: string, callback: SubscriptionCallback): Promise<[boolean, Message | null]> {
    const result: [boolean, Message | null] = await this.broker.subscribeAndGetRetained(this.id, topic, callback)

    if(result[0]) {
      this.subscriptions.push(topic)
    }

    return result
  }

  public async unsubscribe(topic: string): Promise<boolean> {
    return this.broker.unsubscribe(this.id, topic)
  }

  public getLwt(): any {
    return this.lwt
  }

  public setLwt(lwt: any): void {
    this.lwt = lwt
  }

  public connect(lwt?: any): MQTTClient {
    return this.broker.reconnect(this, lwt)
  }
}

export default MQTTClientImplementation