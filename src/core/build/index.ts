import * as cluster from 'cluster';
import { Container } from 'typedi';
import ProductBuilder from './ProductBuilder';
import BuildController from './Controller';

let contoller;

if(cluster.isMaster) {
    contoller = Container.get(BuildController);
} else {
    contoller = Container.get(ProductBuilder);
}

contoller.initialize();
