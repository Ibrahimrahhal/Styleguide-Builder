import { Service, Inject } from 'typedi';
import { Configuration } from 'webpack';
import Generic from './Generic';

declare type ProductBuildConfig = {id: number, config: Configuration, product: string};

@Service()
class Webpack {

    @Inject()
    protected generic: Generic;

    getConfigs(): Array<ProductBuildConfig> {
        const configs = require(
            this.generic.rootPathresolvePathRelativeToProject("webpack.config.js")
        )(
            null, { 
            watch: false, 
            includeProductInfo: true 
        }).map((config: Configuration, index: number) => {
            const { product } = config as any;
            delete (config as any).product; 
            return ({ 
                ID: index, 
                config,
                product
            })
        }).sort((a: ProductBuildConfig, b: ProductBuildConfig) => {
            return a.product.localeCompare(b.product);
        }).map((config: ProductBuildConfig, index: number) => {
            config.product = `${config.product}#${index}`;
        });
        return configs;
    }
}
export default Webpack;