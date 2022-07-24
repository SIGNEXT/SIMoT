from graphs import create_graphs
from pathlib import Path
import sys
import pandas as pd
import os
import time
from config import *

TIMESTAMP = int(time.time())
CURRENT_DIR = os.path.dirname(__file__)

def preprocess_csvs(name, folder, start_time = None, end_time=None, dx = 1):
  # Create dest directory
  Path(f"{CURRENT_DIR}/results/{TIMESTAMP}-{name}").mkdir(parents=True, exist_ok=True)

  metric_files = [v['file'] for k,v in config_metrics.items()]

  # Process CSVs
  for file in metric_files:
    try:
      df = pd.read_csv(f"{CURRENT_DIR}/keep_experiments/{folder}/{file}.csv")
    except:
      print(f'{file} not found, skipping')
      continue
    if end_time is not None: df = df[df["t"] <= end_time + 1]
    if start_time is not None: df = df[df["t"] >= start_time + 1]

    if file in ["device-payloads"]:
      output = df.astype('Int64')
    elif file in ['device-update']:
      output = df
    else:
      aggr_dict = {'t': 'first'}
      devices = df.columns[1:].to_list()
      aggr_dict.update(dict.fromkeys(devices, "min" if file in ['free-flash']  else "max"))
      output = df.groupby(df.index // dx).agg(aggr_dict)
    output.to_csv(f"{CURRENT_DIR}/results/{TIMESTAMP}-{name}/{file}.csv", index=False)

def generate_graphs(name, metrics, dx):
  metrics_df = {}
  for metric in metrics:
    metrics_df[metric] = pd.read_csv(f"{CURRENT_DIR}/results/{TIMESTAMP}-{name}/{config_metrics[metric]['file']}.csv")
    if metric in ['uptime', 'usedram', 'freeflash', 'usedflash', 'payload']:
      devices = sorted(metrics_df[metric].columns[1:])
  ranges_min = []
  ranges_max = []
  for metric in metrics:
    if metric == 'usedram':
      ranges_min.append(0)
      ranges_max.append(metrics_df['usedram'][devices].max().max()   * 1.15)
    if metric == 'usedflash':
      ranges_min.append(0)
      ranges_max.append(metrics_df['usedflash'][devices].max().max()   * 1.15)
    if metric == 'payload':
      ranges_min.append(0)
      ranges_max.append(metrics_df['payload'][devices].max().max()   * 1.15)
  create_graphs(name, TIMESTAMP, devices, metrics_df, dx, ranges_min, ranges_max)

def run_experiment(name):
  preprocess_csvs(name, config_exps[name]['measurements'], config_exps[name]['args']['start_time'], config_exps[name]['args']['end_time'], config_exps[name]['args']['dx'])
  generate_graphs(name, config_exps[name]['metrics'], config_exps[name]['args']['dx'])

def main():
    experiments = sys.argv[1].split(',')

    for experiment in experiments:
      print(f"Running experiment {experiment}")
      if experiment in list(config_exps.keys()):
        run_experiment(experiment)


if __name__ == "__main__":
    main()