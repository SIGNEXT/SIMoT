import { AssignmentStrategy } from "./assignment-strategy";
import { AssignmentStrategyV1 } from "./v1";
import { AssignmentStrategyV2 } from "./v2";
import { AssignmentStrategyV3 } from "./v3";
import { AssignmentStrategyV4 } from "./v4";
import { AssignmentStrategyV5 } from "./v5";


const strategies: {[version: string]: any} = {
    "v1": AssignmentStrategyV1,
    "v2": AssignmentStrategyV2,
    "v3": AssignmentStrategyV3,
    "v4": AssignmentStrategyV4,
    "v5": AssignmentStrategyV5,
};

export { strategies };
