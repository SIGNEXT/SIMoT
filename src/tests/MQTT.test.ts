
import MQTTBroker, { MQTTClient } from '../comms/mqtt/MQTT'
import MQTTBrokerImplementation from '../comms/mqtt/MQTTBrokerImplementation'

let broker: MQTTBroker = new MQTTBrokerImplementation()
let pubClient: MQTTClient
let subClient: MQTTClient

beforeEach(() => {
  broker = new MQTTBrokerImplementation()
  pubClient = broker.connect()
  subClient = broker.connect()
})

describe('mqtt', () => {
  test('Simple pubsub works', async () => {
    const callback = jest.fn((data: any) => {
      return Promise.resolve()
    })

    subClient.subscribe('mytopic', callback)
    pubClient.publish('mytopic', 'helloworld')

    expect(callback).toHaveBeenCalledWith({ data: 'helloworld', sender: pubClient.getId() })
  })

  test('Multiple subs pubsub works (multiple topics)', async () => {

    const callback1 = jest.fn((data: any) => {
      return Promise.resolve()
    })

    const callback2 = jest.fn((data: any) => {
      return Promise.resolve()
    })

    const callback3 = jest.fn((data: any) => {
      return Promise.resolve()
    })


    subClient.subscribe('mytopic', callback1)
    subClient.subscribe('mytopic2', callback2)
    subClient.subscribe('mytopic', callback3)
    pubClient.publish('mytopic2', 'helloworld2')
    pubClient.publish('mytopic', 'helloworld')

    expect(callback1).toHaveBeenCalledTimes(0)
    expect(callback2).toHaveBeenCalledWith({ sender: pubClient.getId(), data: 'helloworld2' })
    expect(callback3).toHaveBeenCalledWith({ sender: pubClient.getId(), data: 'helloworld' })
  })

  test('Retain works', async () => {
    pubClient.publish('mytopic', 'helloworld')
    pubClient.publish('mytopic', 'goodbye', true)

    const callback1 = jest.fn((data: any) => {
      return Promise.resolve()
    })


    subClient.subscribe('mytopic', callback1)

    expect(callback1).toHaveBeenCalledTimes(1)
    expect(callback1).toHaveBeenCalledWith({ sender: pubClient.getId(), data: 'goodbye' })
  })

  test('Retain works (keep 1)', async () => {
    pubClient.publish('mytopic', 'helloworld')
    pubClient.publish('mytopic', 'goodbye', true)
    pubClient.publish('mytopic', 'hello again', true)

    const callback1 = jest.fn((data: any) => {
      return Promise.resolve()
    })


    subClient.subscribe('mytopic', callback1)

    expect(callback1).toHaveBeenCalledTimes(1)
    expect(callback1).toHaveBeenCalledWith({ sender: pubClient.getId(), data: 'hello again' })
  })

  test('Unsubscribe works', async () => {
    const callback1 = jest.fn((data: any) => {
      return Promise.resolve()
    })

    subClient.subscribe('mytopic', callback1)
    pubClient.publish('mytopic', 'helloworld')

    subClient.unsubscribe('mytopic')
    pubClient.publish('mytopic', 'goodbye', true)

    expect(callback1).toHaveBeenCalledTimes(1)
    expect(callback1).toHaveBeenCalledWith({ sender: pubClient.getId(), data: 'helloworld' })
  })
})