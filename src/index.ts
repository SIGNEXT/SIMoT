import { Scenario } from "./scenarios/scenario";
import * as fs from "fs";
import { Command, Option } from "commander";
import { orchestratorVersions, scoreFunctionVersions } from "./versioner";
import { ScenarioGenerator } from "./scenarios/generator";
import { scenarios } from "./scenarios";
import BundleScoreCalculator from "./device/specific-devices/cbba/score/BundleScore";

function main() {
    const program = new Command();
    program
        .command("run <scenario>")
        .option("-v, --verbose", "display orchestration logs")
        .option("-d, --console", "log to console")
        .option("-c, --csv", "log to csv file")
        .option("-t , --time-limit <limit>", "time limit")
        .addOption(new Option("-o, --orchestrator <version>").choices(Object.keys(orchestratorVersions)).default("v5"))
        .addOption(new Option("-s, --score <version>").choices(Object.keys(scoreFunctionVersions)).default("maxValue"))
        .action(async (scenario: any, options: any) => {
            const s: Scenario | null = parseScenario(scenario, options.orchestrator, options.score);
            if (!s) {
                console.error("Invalid scenario name");
                process.exit(1);
            }
            console.log("Starting simulation");
            await s.run({
                version: options.orchestrator,
                verbose: options.verbose || false,
                logConsole: options.console || false,
                logCsv: options.csv || false,
                timeLimit: options.timeLimit,
            });
        });

    program
        .command("generate <n>")
        .action((n) => {
            console.log(`Generating ${n} scenarios.`);
            ScenarioGenerator.generate(n);
            console.log("Done.");
        });
    program.parse(process.argv);
}

function parseScenario(name: string, version: string, scoreFunction: string): Scenario | null {
    if (scenarios[name]) {
        const scoreFn: BundleScoreCalculator = scoreFunctionVersions[scoreFunction];
        return scenarios[name](version, scoreFn);
    } else if (fs.existsSync(`./synthetic-scenarios/${name}.json`)) {
        const file = fs.readFileSync(`./synthetic-scenarios/${name}.json`, "utf-8");
        try {
            return Scenario.fromJSON(file);
        } catch (err) {
            console.error(err);
            console.log("Couldn't import file.");
        }
    }
    return null;
}

main();
