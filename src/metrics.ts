import Device from "./device/device";
import { DeviceStatus } from "./device/deviceTypes";
import { Scenario } from "./scenarios/scenario";
import Node from "./node";
import { CSVWriter } from "./utils/csv-writer";

class Metrics {

    private scenario: Scenario;
    private orchestratorVersion: string | undefined;
    private devices: Device[];
    private nodes: Node[];
    private csvWriter!: CSVWriter;
    private csvMetrics!: {
        [metricName: string]: {
            headers: string[],
            dataFunc: () => {
                t: number,
                [deviceId: string]: string | number | boolean
            }
        }
    };

    private deviceMetrics: {
        [deviceId: string]: {
            id: number,
            status: DeviceStatus,
            uptime: number,
            assignedNodes: number[],
            lastPayload: {
                time: number,
                size: number,
            } | null
            resources: {
                allocRam: number,
                freeRam: number,
            },
            isOrchestrator: boolean
            inAuction: boolean
        }
    };

    private nodeMetrics: {
        [nodeId: string]: {
            uptime: number,
            uptimePerc: number,
        },
    }

    private config: {
        logConsole: boolean,
        logDevices: boolean,
        logNodes: boolean,
        logCsv: boolean,
    };


    // logConsole takes precedence over other options
    constructor(scenario: Scenario, orchestratorVersion: string | undefined, devices: Device[], nodes: Node[], config: {
        logConsole?: boolean,
        logDevices?: boolean,
        logNodes?: boolean,
        logCsv?: boolean,
    } = {}) {
        this.scenario = scenario;
        this.orchestratorVersion = orchestratorVersion;
        this.config = {
            logConsole: true,
            logDevices: true,
            logNodes: true,
            logCsv: false,
            ...config,
        };
        this.scenario.uptime = 0;
        this.devices = devices;
        this.nodes = [...nodes];
        this.deviceMetrics = {};
        this.nodeMetrics = this.nodes.reduce((acc, node) => ({
            ...acc,
            [node.id]: {
                uptime: 0,
                uptimePerc: 1,
            },
        }), {});

        if (this.config.logCsv) {
            this.setupCSVWriter();
        }
    }

    setupCSVWriter() {
        const devices: string[] = this.devices.map(({ id }) => id.toString());
        const nodes: string[] = this.nodes.map((node: Node) => node.id.toString());

        this.csvMetrics = {
            "device-uptime": {
                headers: ["t", ...devices],
                dataFunc: () => ({
                    "t": this.scenario.uptime,
                    ...Object.values(this.deviceMetrics).reduce((acc, { id, uptime }) => ({
                        ...acc,
                        [id]: uptime.toFixed(0),
                    }), {}),
                }),
            },
            "device-nodes": {
                headers: ["t", ...devices],
                dataFunc: () => ({
                    "t": this.scenario.uptime,
                    ...Object.values(this.deviceMetrics).reduce((acc, { id, assignedNodes }) => ({
                        ...acc,
                        [id]: assignedNodes.join(";"),
                    }), {}),
                }),
            },
            "device-nr-nodes": {
                headers: ["t", ...devices],
                dataFunc: () => ({
                    "t": this.scenario.uptime,
                    ...Object.values(this.deviceMetrics).reduce((acc, { id, assignedNodes, status }) => ({
                        ...acc,
                        [id]: status == DeviceStatus.OFF ? 0 : assignedNodes.length.toFixed(0),
                    }), {}),
                }),
            },
            "node-uptime": {
                headers: ["t", ...nodes],
                dataFunc: () => ({
                    "t": this.scenario.uptime,
                    ...Object.keys(this.nodeMetrics).reduce((acc, id) => ({
                        ...acc,
                        [id]: this.nodeMetrics[id].uptime.toFixed(0),
                    }), {}),
                }),
            },
            "node-uptime-perc": {
                headers: ["t", ...nodes],
                dataFunc: () => ({
                    "t": this.scenario.uptime,
                    ...Object.keys(this.nodeMetrics).reduce((acc, id) => ({
                        ...acc,
                        [id]: this.nodeMetrics[id].uptimePerc,
                    }), {}),
                }),
            },
            "device-payloads": {
                headers: ["t", ...devices],
                dataFunc: () => ({
                    "t": this.scenario.uptime - 1,
                    ...Object.values(this.deviceMetrics).reduce((acc, { id, lastPayload, status }) => ({
                        ...acc,
                        [id]: status == DeviceStatus.ON && lastPayload && lastPayload.time === this.scenario.uptime - 1 ? lastPayload.size.toFixed(0) : null,
                    }), {}),
                }),
            },
            "device-alloc-ram": {
                headers: ["t", ...devices],
                dataFunc: () => ({
                    "t": this.scenario.uptime,
                    ...Object.values(this.deviceMetrics).reduce((acc, { id, resources: { allocRam } }) => ({
                        ...acc,
                        [id]: allocRam.toFixed(0),
                    }), {}),
                }),
            },
            "device-free-ram": {
                headers: ["t", ...devices],
                dataFunc: () => ({
                    "t": this.scenario.uptime,
                    ...Object.values(this.deviceMetrics).reduce((acc, { id, resources: { freeRam } }) => ({
                        ...acc,
                        [id]: freeRam.toFixed(0),
                    }), {}),
                }),
            },
            "orchestrator": {
                headers: ["t", ...devices],
                dataFunc: () => ({
                    "t": this.scenario.uptime,
                    ...Object.values(this.deviceMetrics).reduce((acc, { id, isOrchestrator}) => ({
                        ...acc,
                        [id]: isOrchestrator ? 1 : 0,
                    }), {}),
                }),
            },
            "device-in-auction": {
                headers: ["t", ...devices],
                dataFunc: () => ({
                    "t": this.scenario.uptime,
                    ...Object.values(this.deviceMetrics).reduce((acc, { id, inAuction}) => ({
                        ...acc,
                        [id]: inAuction ? 1 : 0,
                    }), {}),
                }),
            },
            "avg-node-uptime-perc": {
                headers: ["t", "uptime"],
                dataFunc: () => ({
                    "t": this.scenario.uptime,
                    "uptime": Object.values(this.nodeMetrics).reduce((acc, { uptime: curr }) => acc + curr, 0) /
                        (Object.keys(this.nodeMetrics).length * this.scenario.uptime),
                }),
            },
        };

        this.csvWriter = new CSVWriter(this.scenario.name, this.orchestratorVersion, {
            ...Object.keys(this.csvMetrics).reduce((acc, metric) => ({
                ...acc,
                [metric]: this.csvMetrics[metric].headers,
            }), {}),
        });
    }

    log() {
        if (this.config.logCsv) this.logToCSV();
        if (this.config.logConsole) this.logToConsole();
    }

    logToConsole() {
        // const { logDevices, logNodes } = this.config;
        console.log(`Total uptime: ${this.scenario.uptime}s`);
        // if (logDevices) {
        //     console.log("Devices: ", Object.values(this.deviceMetrics).map((d) => this.formatDevice(d)));
        // }
        // if (logNodes) {
        //     console.log("Nodes: ", Object.keys(this.nodeMetrics).map((id) => this.formatNode(parseInt(id), this.nodeMetrics[id])));
        // }
    }

    logToCSV() {
        Object.keys(this.csvMetrics).forEach((metric) => {
            const { dataFunc } = this.csvMetrics[metric];
            this.csvWriter.writeLine(metric, dataFunc());
        });
    }

    run() {
        setInterval(() => {
            this.updateMetrics();
            this.log();
        }, 1000);
    }

    updateMetrics() {
        this.updateDevices();
        this.updateNodes();
    }

    updateDevices() {
        this.deviceMetrics = Object.values(this.devices)
            .reduce((acc, { id, state }) => ({
                ...acc,
                [id]: {
                    id: id,
                    status: state.status,
                    uptime: state.status === DeviceStatus.ON ? state.uptime : 0,
                    assignedNodes: state.assignedNodes.map((node: Node) => node.id),
                    lastPayload: state.lastPayload,
                    resources: state.resources,
                    isOrchestrator: state.isOrchestrator,
                    inAuction: state.ongoingAuction !== null
                },
            }), {});
    }

    private updateNodes(): void {
        Object.values(this.devices).forEach((d: Device) => {
            if (d.state.status === DeviceStatus.OFF) return;
            for (const { id } of d.state.assignedNodes) {
                this.nodeMetrics[id].uptime = this.nodeMetrics[id].uptime + 1;
            }
        });
        Object.values(this.nodeMetrics).forEach((m) => { m.uptimePerc = m.uptime / this.scenario.uptime });
    }

    // private formatDevice(deviceData: { id: number, status: DeviceStatus, uptime: number, assignedNodes: number[] }): { [metric: string]: string } {
    //     const devicePerceivedState: EnhancedDeviceData | undefined = this.orchestrator.currDeviceState.get(deviceData.id);
    //     return {
    //         "id": deviceData.id.toString(),
    //         "status": deviceData.status.toString(),
    //         "uptime (s)": deviceData.uptime.toString(),
    //         "mtbf": devicePerceivedState && devicePerceivedState.mtbf ?
    //             devicePerceivedState.mtbf.toFixed(2) : "-",
    //         "nr_nodes": deviceData.assignedNodes.length.toString(),
    //     };
    // }

    private formatNode(id: number, nodeData: { uptime: number, uptimePerc: number }): { [metric: string]: string } {
        return {
            "id": id.toString(),
            "uptime (s)": nodeData.uptime.toString(),
            "%": this.formatUptimePercentage(nodeData.uptimePerc),
        };
    }

    private formatUptimePercentage(num: number): string {
        const options = {
            style: "percent",
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
        };
        const formatter = new Intl.NumberFormat("en-US", options);
        return formatter.format(num);
    }
}

export { Metrics };
