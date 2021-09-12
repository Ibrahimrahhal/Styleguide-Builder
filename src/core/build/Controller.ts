import * as cluster from 'cluster';
import * as os from 'os';
import { Inject, Service } from 'typedi';
import Configs from '../../util/Configs';
import WebpackUtils from '../../util/Webpack';
import Messaging from './Messaging';
import BuildState from './State';
import {Configuration} from 'webpack';
import Initializable from '../interfaces/initializable';
import Logging from '../../util/Logging';

@Service()
class BuildController implements Initializable {

    @Inject() 
    protected configs: Configs;

    @Inject()
    protected messaging: Messaging;

    @Inject()
    protected buildState: BuildState;

    @Inject() 
    protected webpackUtils: WebpackUtils;

    @Inject()
    protected logging: Logging;

    protected productBuildConfigs: Array<{id: number, config: Configuration, product: string}>;

    public initialize(): void {
        let numberOfThreads: number = parseInt(this.configs.get("THREADS", os.cpus().length.toString()));
        this.productBuildConfigs = this.webpackUtils.getConfigs();
        this.startBuilders(numberOfThreads);
        cluster.on("online", this.handleProductAssignment.bind(this));
        this.messaging.subscribe("taskFinished", (payload: any, builder: cluster.Worker | undefined) => {
            const config = this.productBuildConfigs.find(item => item.id === payload.id);
            if(config && builder) {
                this.buildState.onBuildStateChange(config.product, (payload.status === 0)?'success':'failed');
                if(payload.status === 1)
                    this.logging.report.log(payload.error);
                this.handleProductAssignment(builder);
            }
        })
    }

    protected startBuilders(numberOfBuilder: number): void {
        for(let i = 0; i < numberOfBuilder; i++) 
            cluster.fork();
    }

    protected handleProductAssignment(worker: cluster.Worker): void {
        try {
            this.assignBuilderToProduct(worker);
        } catch {
            this.checkQueueStatusAndTerminate();
        }
    }

    protected assignBuilderToProduct(builder: cluster.Worker): void {
        const newProductConfigToBuild = this.productBuildConfigs.find(item => {
            return this.buildState.state(item.product) !== 'inProgress';
        });
        if(newProductConfigToBuild) {
            this.buildState.onBuildStateChange(newProductConfigToBuild.product, "inProgress");
            this.messaging.emit("task", { id: newProductConfigToBuild.id }, builder);
        } else {
            throw new Error("no task found");
        }
    }

    protected checkQueueStatusAndTerminate(): void {
        const inFinishedBuilds = this.productBuildConfigs.find(item => {
            const state = this.buildState.state(item.product);
            return (state !== 'failed' && state !== 'success');
        });

        if(!inFinishedBuilds) 
            this.terminate();
    }

    protected async terminate(): Promise<void> {
        for (const id in cluster.workers) 
            this.messaging.emit("exit", {}, cluster.workers[id]);
        this.buildState.showFailedProducts();
        process.exit(0);
    }

}

export default BuildController;