import * as fs from 'fs'

class CSVWriter {

    private delimiter: string
    private metrics: { [metric: string]: string[] }
    private dirPath: string
    private fileStreams: { [metric: string]: fs.WriteStream }

    constructor(scenarioName: string, orchestratorVersion: string | undefined, metrics: { [metric: string]: string[] }, delimiter = ',') {
        this.delimiter = delimiter
        this.metrics = metrics
        const orchVersion = orchestratorVersion  ?? '?'
        const dateStr = (new Date()).toISOString()
        this.dirPath = `./measurements/${scenarioName}-${orchVersion}-${dateStr}`
        this.createScenarioDir()
        this.fileStreams = this.openFileStreams()
        this.writeHeaders()
    }

    private createScenarioDir(): string | undefined {
        return fs.mkdirSync(this.dirPath, { recursive: true })
    }

    private openFileStreams() {
        return Object.keys(this.metrics).reduce((acc, metric) => ({
            ...acc,
            [metric]: fs.createWriteStream(`${this.dirPath}/${metric}.csv`),
        }), {})
    }

    public writeLine(metric: string, data: { [header: string]: string | number | boolean }): void {
        const stream = this.fileStreams[metric]
        const headers: string[] = this.metrics[metric]
        const items: string[] = headers.map((h) => data[h] === null || data[h] === undefined || data[h] === '' ? '' : data[h].toString())
        const line = `${items.join(this.delimiter)}\n`
        stream.write(line)
    }

    private writeHeaders(): void {
        for (const metric in this.fileStreams) {
            const stream = this.fileStreams[metric]
            const headers = this.metrics[metric]
            stream.write(`${headers.join(this.delimiter)}\n`)
        }
    }
}

export { CSVWriter }
