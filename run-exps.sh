#!/usr/bin/env bash

run_exp() {
		npm start -- run $1 -c -t 300 -o $2
}

run_exp sc1 v0 & \
run_exp sc2 v0 & \
run_exp rec-fail v0 & \
run_exp rec-fail v1 & \
run_exp balancing v0 & \
run_exp balancing v1 & \
run_exp mem-error-nodes-lim v1 & \
run_exp mem-error-nodes-lim v2 & \
run_exp ram-error v2 & \
run_exp ram-error v3 & \
run_exp msc-success v3 & \
run_exp msc-success v4 & \
run_exp msc-fail v3 & \
run_exp msc-fail v4 & \
run_exp device-node-error-2 v4 & \
run_exp device-node-error-2 v5