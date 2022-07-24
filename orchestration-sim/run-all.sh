#!/usr/bin/env bash

tsc .
/build/src/index.js run cbba-rec-fail-final -t 305 --csv -v -s maxFirst
/build/src/index.js run cbba-rec-fail-final -t 305 --csv -v -s stability
/build/src/index.js run cbba-device-node-error3 -t 605 --csv -v -s maxFirst
/build/src/index.js run cbba-device-node-error3 -t 605 --csv -v -s node-device-stability-new-new