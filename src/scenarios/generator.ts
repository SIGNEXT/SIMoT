import * as fs from 'fs'
import { DeviceNodeFailBehaviour, ProbabilisticFailBehaviour, RecurrentFailBehaviour, SingleFailBehaviour } from '../behaviours/device'
import Behaviour from '../behaviours/device/behaviour'
import Device from '../device/device'
import Node from '../node'
import { getRandom, getRandomInt, getRandomItemsInSet } from '../utils'
import { Scenario } from './scenario'


class ScenarioGenerator {
    public static generate(n = 1) {
        if (!fs.existsSync('./synthetic-scenarios'))
            fs.mkdirSync('./synthetic-scenarios')

        const files = fs.readdirSync('./synthetic-scenarios')
        const baseNumber = files.length

        for (let i = 0; i < n; ++i) {
            const number = baseNumber + i
            const name = `synth-${number.toString().padStart(3, '0')}`
            const scenario = this.newScenario(name)
            fs.writeFileSync(`./synthetic-scenarios/${scenario.name}.json`, JSON.stringify(scenario.toJSON(), null, 2))
        }
    }

    private static newScenario(name = 'synth-000'): Scenario {
        Node.resetStaticId() // reset static id counter so that all scenarios start with Node 1
        const tasks: string[] = this.generateTasks()
        const nodes: Node[] = this.generateNodes(tasks)
        const devices: Device[] = this.generateDevices(tasks, nodes)
        return new Scenario(name, nodes, devices)
    }

    private static generateTasks(): string[] {
        // between 1 and 6 tasks
        const nrAvailableTasks = getRandomInt(1, 6)
        const tasks: string[] = []
        for (let i = 1; i <= nrAvailableTasks; ++i) {
            tasks.push(`t${i}`)
        }
        return tasks
    }

    private static generateNodes(tasks: string[]): Node[] {
        // between 4 and 50 nodes
        const nrNodes = getRandomInt(4, 50)
        const nodes: Node[] = []
        for (let i = 0; i < nrNodes; ++i) {
            const task = tasks[getRandomInt(0, tasks.length - 1)]
            nodes.push(new Node(task))
        }
        return nodes
    }

    private static generateDevices(tasks: string[], nodes: Node[]): Device[] {
        const nrDevices = getRandomInt(4, 50)
        const devices: Device[] = []
        for (let i = 1; i <= nrDevices; ++i) {
            devices.push(this.generateDevice(i, tasks, nodes))
        }
        return devices
    }

    private static generateDevice(id: number, tasks: string[], nodes: Node[]) {
        const nrCapabilities: number = getRandomInt(1, tasks.length)
        const capabilities: string[] = getRandomItemsInSet(nrCapabilities, tasks)!
        const syncBehaviours: Behaviour[] = this.generateSyncBehaviours(nodes)
        const asyncBehaviours: Behaviour[] = this.generateAsyncBehaviours()
        return new Device(id, { capabilities, syncBehaviours, asyncBehaviours })
    }

    private static generateSyncBehaviours(nodes: Node[]): Behaviour[] {
        if (getRandom() < 0.2) {
            const nrBehaviours = getRandomInt(1, Math.floor(nodes.length / 3))
            return getRandomItemsInSet(nrBehaviours, nodes).map(({ id }) => new DeviceNodeFailBehaviour(id))
        } else {
            return []
        }
    }

    private static generateAsyncBehaviours(): Behaviour[] {
        const behaviours = []

        // Single fail
        let r = getRandom()
        if (r < 0.4) {
            behaviours.push(new SingleFailBehaviour(getRandomInt(5000, 30000)))
            if (r < 0.2) {
                behaviours.push(new SingleFailBehaviour(getRandomInt(10000, 60000)))
            }
        }

        r = getRandom()
        if (r < 0.5) {
            // Recurrent fail
            if (r < 0.1) {
                behaviours.push(new RecurrentFailBehaviour(getRandomInt(5000, 60000)))
            }
        } else {
            // Prob. fail
            if (r >= 0.9) {
                behaviours.push(new ProbabilisticFailBehaviour(getRandom(0, 0.05)))
            }
        }
        return behaviours
    }
}

export { ScenarioGenerator }
