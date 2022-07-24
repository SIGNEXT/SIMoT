import { Scenario } from "./scenario";
import balancing from "./implementations/fragoso/balancing";
import counterMsc from "./implementations/fragoso/counter-msc";
import deviceNodeError from "./implementations/fragoso/device-node-error";
import deviceNodeError2 from "./implementations/fragoso/device-node-error-2";
import deviceNodeError3 from "./implementations/fragoso/device-node-error-3";
import dos from "./implementations/fragoso/dos";
import example from "./implementations/fragoso/example";
import impossibleMemError from "./implementations/fragoso/impossible-mem-error";
import memErrorNodesLim from "./implementations/fragoso/mem-error-nodes-lim";
import memoryError from "./implementations/fragoso/memory-error";
import mscFail from "./implementations/fragoso/msc-fail";
import mscSuccess from "./implementations/fragoso/msc-success";
import probFail from "./implementations/fragoso/prob-fail";
import ramError from "./implementations/fragoso/ram-error";
import recFail from "./implementations/fragoso/rec-fail";
import sc1 from "./implementations/fragoso/sc1";
import sc2 from "./implementations/fragoso/sc2";
import stress from "./implementations/fragoso/stress";
import exampleOrch from "./implementations/david/example";
import bully_example from "./implementations/david/bully_example";
import trivial_nofail from "./implementations/david/trivial_nofail";
import cbba_trivial1 from "./implementations/david/cbba/cbba_trivial1";
import cbba_trivial2 from "./implementations/david/cbba/cbba_trivial2";
import cbba_capabilities1 from "./implementations/david/cbba/cbba_capabilities1";
import cbba_capabilities2 from "./implementations/david/cbba/cbba_capabilities2";
import cbba_large1 from "./implementations/david/cbba/cbba_large1";
import BundleScoreCalculator from "../device/specific-devices/cbba/score/BundleScore";
import cbba_rec_fail from "./implementations/david/cbba/cbba_rec_fail";
import cbba_rec_fail_small from "./implementations/david/cbba/cbba_rec_fail_small";
import cbba_device_node_error3 from "./implementations/david/cbba/cbba_device_node_error3";
import cbba_device_node_error_small from "./implementations/david/cbba/cbba_device_node_error_small";
import capabilities1 from "./implementations/david/basic/capabilities1";
import capabilities2 from "./implementations/david/basic/capabilities2";
import trivial2 from "./implementations/david/basic/trivial2";
import cbba_rec_fail_final from "./implementations/david/cbba/cbba_rec_fail_final";
import cbba_showcase from "./implementations/david/cbba/cbba_showcase";

const scenarios: {[id: string]: (version: string, scoreFunction: BundleScoreCalculator) => Scenario} = {
    example,
    "dos": dos,
    "prob-fail": probFail,
    "balancing": balancing,
    "impossible-mem-error": impossibleMemError,
    "device-node-error": deviceNodeError,
    "device-node-error-2": deviceNodeError2,
    "device-node-error-3": deviceNodeError3,
    "memory-error": memoryError,
    "ram-error": ramError,
    "msc-success": mscSuccess,
    "msc-fail": mscFail,
    "counter-msc": counterMsc,
    "sc1": sc1,
    "sc2": sc2,
    "stress": stress,
    "rec-fail": recFail,
    "mem-error-nodes-lim": memErrorNodesLim,
    "example-orch": exampleOrch,
    "bully-example": bully_example,
    "trivial-nofail": trivial_nofail,
    "cbba-trivial1": cbba_trivial1,
    "cbba-trivial2": cbba_trivial2,
    "cbba-capabilities1": cbba_capabilities1,
    "cbba-capabilities2": cbba_capabilities2,
    "cbba-large1": cbba_large1,
    "cbba-rec-fail": cbba_rec_fail,
    "cbba-rec-fail-small": cbba_rec_fail_small,
    "cbba-rec-fail-final": cbba_rec_fail_final,
    "cbba-device-node-error3": cbba_device_node_error3,
    "cbba-device-node-error-small": cbba_device_node_error_small,
    "trivial2": trivial2,
    "capabilities2": capabilities2,
    "capabilities1": capabilities1,
    "cbba-showcase": cbba_showcase
};

export {
    scenarios
}