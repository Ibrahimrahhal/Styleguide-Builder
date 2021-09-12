import { Service, Inject } from 'typedi';
import Logging from '../../util/Logging';

declare type BuildeState = "inProgress" | "failed" | "success";

@Service()
class State {
    
    @Inject()
    protected logging: Logging;

    protected productsStatus: {[key: string]: BuildeState};

    constructor() {
        this.productsStatus = {};
    }

    public onBuildStateChange(product: string, state: BuildeState): void {
        if(this.productsStatus[product] !== 'failed') 
            this.productsStatus[product] = state;
        this.showBuildReport();
    }

    protected showBuildReport(): void {
        this.logging.console.clear();
        this.logging.console.table(this.productsStatus);
    }

    public state(product: string): BuildeState {
        return this.productsStatus[product];
    }
    
    public showFailedProducts(): void {
        this.logging.console.clear();
        let failedProject = Object.entries(this.productsStatus).filter(([key, value]) => {
            return value === 'failed';
        }).map(([key, value]) => {
            return key.split('#')[0];
        });

        failedProject = [...new Set(failedProject)];
       this.logging.console.log(failedProject.toString());
    }

}

export default State;