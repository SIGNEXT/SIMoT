import { EnhancedOrchestrator } from '../../orchestrator/enhanced-orchestrator'
import JSONAble from '../../jsonable';
import Orchestrator from '../../orchestrator/orchestrator';

abstract class OrchestratorBehaviour implements JSONAble{
    protected interval: NodeJS.Timeout | null;
    protected orchestrator: Orchestrator | null;

    constructor(interval: NodeJS.Timeout | null = null) {
        this.interval = interval;
        this.orchestrator =  null;
    }
    
    public setOrchestrator(orchestrator: Orchestrator): void {
        this.orchestrator = orchestrator;
    }

    public stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    public abstract toJSON(): Object;

    public abstract run(): void;
}

export default OrchestratorBehaviour;
