import DeviceNodeFailBehaviour from './device-node-fail'
import { OrchestratorFailBehaviour } from './orchestrator-fail'
import { ProbabilisticFailBehaviour } from './probabilistic-fail'
import RecurrentFailBehaviour from './recurrent-fail'
import { SingleFailBehaviour } from './single-fail'

const  behaviours: {[type: string]: any} = {
    DeviceNodeFailBehaviour,
    ProbabilisticFailBehaviour,
    RecurrentFailBehaviour,
    SingleFailBehaviour,
    OrchestratorFailBehaviour,
}

export {
    DeviceNodeFailBehaviour,
    ProbabilisticFailBehaviour,
    RecurrentFailBehaviour,
    SingleFailBehaviour,
    OrchestratorFailBehaviour,
    behaviours
}