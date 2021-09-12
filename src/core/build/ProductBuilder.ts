import Initializable from "../interfaces/initializable";
import WebpackUtils from '../../util/Webpack';
import Messaging from './Messaging';
import Logging from "../../util/Logging";
import { Inject, Service } from 'typedi';
import webpack, { Configuration } from "webpack";
import { exit } from "process";

@Service()
class ProductBuilder implements Initializable{

    @Inject() 
    protected webpackUtils: WebpackUtils;

    @Inject()
    protected messaging: Messaging;

    @Inject()
    protected Logging: Logging;
    
    protected productBuildConfigs: Array<{id: number, config: Configuration, product: string}>;

    public initialize(): void {
        this.productBuildConfigs = this.webpackUtils.getConfigs();
        this.messaging.subscribe("task", (payload) => {
            this.buildProduct(payload.id);
        });
        this.messaging.subscribe("exit", (payload) => exit(0));
    }

    private buildProduct(id: number): void {
        const config = this.productBuildConfigs.find(config => config.id === id)?.config;
        if(!config) return;
        try {
            const compiler = webpack(config);
            compiler.run((err, stats) => { 
                let status = 0;
                let error = '';
                if (err || (stats && stats.hasErrors())) {
                    status = 1;
                    error = err?.toString() || stats?.toString() || '';
                }
                this.messaging.emit("taskFinished", { status,  id, error })
            });
        } catch(e: any) {
            this.messaging.emit("taskFinished", { status: 1,  id, error: e.toString() })
        }
    }
}

export default ProductBuilder;