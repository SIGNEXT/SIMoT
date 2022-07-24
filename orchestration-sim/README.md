# Orchestration simulator

⚠️ For the original simulator by Tiago Fragoso visit [this repository](https://github.com/S-R-MSc/2021-tiagofragoso) ⚠️

## Setup

Make sure Node.js `>= 14.15.4` and yarn is installed and run:

```bash
yarn
```

## Usage

1. Running the simulation

```bash
Usage: yarn start run <scenario> [options] 

Arguments:
  scenario            scenario name

Options:
  -v, --verbose              display orchestration logs
  -d, --console              log to console
  -c, --csv                  log to csv file
  -t, --time-limit <limit>  time limit
  -o, --orchestrator <type>  (choices: "v0", "v1", "v2", "v3", "v4", "v5")
```

2. Generating synthetic scenarios

```bash
Usage: yarn start generate <N>

Arguments:
  N                 number of scenarios
```
