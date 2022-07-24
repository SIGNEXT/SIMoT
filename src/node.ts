import JSONAble from "./jsonable";

const DEFAULT_PAYLOAD_SIZE = 1;
const DEFAULT_RAM_SIZE = 2;

type NodeProperties = {
    payloadSize: number,
    ramSize: number
}

class Node implements JSONAble {

    private static nodeId: number = 1;
    public id: number;
    public properties: NodeProperties;
    public task: any;

    constructor(task: any, { payloadSize = DEFAULT_PAYLOAD_SIZE, ramSize = DEFAULT_RAM_SIZE } = {}) {
        this.id = Node.nodeId++;
        this.task = task;
        this.properties = {
            payloadSize: payloadSize,
            ramSize: ramSize
        };
    }

    public toJSON(): any {
        return { id: this.id, task: this.task, payloadSize: this.properties.payloadSize, ramSize: this.properties.ramSize };
    }

    public static fromJSON(nodeData: { id: number, task: any, payloadSize: number, ramSize: number }) {
        const node = new Node(nodeData.task, { payloadSize: nodeData.payloadSize, ramSize: nodeData.ramSize });
        node.id = nodeData.id;
        return node;
    }

    public static resetStaticId(): void {
        Node.nodeId = 1;
    }
}

export default Node;
