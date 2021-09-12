import {Container} from 'typedi';
import DependencyInstaller from './DependencyInstaller';

const installer = Container.get(DependencyInstaller);

installer.initialize().finally(() => {
    console.clear();
    console.log("Installing Finished... \n");
}); 