import * as fs from 'fs';
import * as path from 'path';
import {Service, Inject} from 'typedi';
import Generic from '../../util/Generic';
import Logging from '../../util/Logging';
import Initializable from '../interfaces/initializable';

@Service()
class DependencyInstaller implements Initializable {

    @Inject()
    protected generic: Generic;
    
    @Inject()
    protected logging: Logging;
    
    protected rootPath: string;

    protected rootPackagesDirectory: string;

    public async initialize(): Promise<void> {
        this.rootPath = this.generic.rootPathresolvePathRelativeToProject('./');

        this.rootPackagesDirectory = await this.initializeRootModulesDirectory();
        const installDirectories = this.listProjectsDirectories(this.rootPath);
        installDirectories.push(this.rootPath);
        for(const installDirectory of installDirectories) {
            await this.initializeDirectoryForFreshInstall(installDirectory);
            await this.optimizedDependencyInstall(installDirectory);
            await this.handleGeneratedFile(installDirectory)
        }
    }

    protected async initializeRootModulesDirectory(): Promise<string> {
        const modulesPath = this.generic.rootPathresolvePathRelativeToProject('./global_node_modules');
        await this.generic.executeCommand("rm -rf global_node_modules", this.rootPath);
        await this.generic.executeCommand("mkdir global_node_modules", this.rootPath);
        return modulesPath;
    }


    protected listProjectsDirectories(directory: string): string[] {
        let directoriesFound: string[] = [];
        const subDirectories = fs.readdirSync(directory, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
        subDirectories.forEach((subDirectory) => {
            const fullPath = path.join(directory, subDirectory);
            if(fs.existsSync(path.join(fullPath, 'package.json'))) {
                directoriesFound.push(fullPath);
                directoriesFound = [...directoriesFound, ...this.listProjectsDirectories(fullPath)];
            }
        });
        return directoriesFound;
    }

    protected async initializeDirectoryForFreshInstall(directory: string): Promise<void> {
        const isNodeModulesFolderCreated = fs.existsSync(path.join(directory, 'node_modules'));
        if(isNodeModulesFolderCreated)
            await this.generic.executeCommand(`rm -rf node_modules`, directory);
        await this.generic.executeCommand(`mkdir node_modules`, directory);
    }

    protected async optimizedDependencyInstall(directory: string): Promise<void> {
        const dependencies = require(path.join(directory, 'package.json')).dependencies || {};
        this.logging.console.log(`Started Installing Dep on Project ${directory}`);

        for(const [packageName, packageVersion] of Object.entries(dependencies)) {
            this.logging.console.log(`Started Installing Package ${packageName} Version ${packageVersion}`);
            try {
                if(['ui-theme', 'ui-core', 'ui-theme-classic', 'ui-theme-photo', 'ui-theme-eureka'].includes(packageName)) {
                    await this.startFromAutomationUI();
                }
                const packageDirectoryName = this.generic.sha256(`${packageName}${packageVersion}`);
                const isPackageAlreadyInstalled = fs.existsSync(path.join(this.rootPackagesDirectory, packageDirectoryName));
                if(!isPackageAlreadyInstalled) 
                    await this.installDependencyGlobal(packageName, packageVersion as string);
                await this.generic.executeCommand(`yes | cp -rf ${path.join(this.rootPackagesDirectory, packageDirectoryName)}/* ${ path.join(directory, 'node_modules')}`)
            } catch(e: any) {
                this.logging.report.log(`Error Installing Package ${packageName} ${ e && e.toString()}`);
                this.logging.console.log(`Error Installing Package ${packageName} ${ e && e.toString()}`);
            }
        }
    }

    protected async startFromAutomationUI(): Promise<void> {
        const automationUIPath = this.generic.sha256(`ui-automationgit+ssh://git@github.com/atypon/ui-automation.git#semver:*`);
        const isPackageAlreadyInstalled = fs.existsSync(path.join(this.rootPackagesDirectory, automationUIPath));
        await this.generic.executeCommand(`rm -rf ${path.join(this.rootPackagesDirectory, 'node_modules')}`);
        await this.generic.executeCommand(`mkdir ${path.join(this.rootPackagesDirectory, 'node_modules')}`);

        if(!isPackageAlreadyInstalled)
            await this.installDependencyGlobal("ui-automation", "git+ssh://git@github.com/atypon/ui-automation.git#semver:*");
        await this.generic.executeCommand(`yes | cp -rf ${path.join(this.rootPackagesDirectory, automationUIPath)}/* ${path.join(this.rootPackagesDirectory, 'node_modules')}`);
    }

    protected async installDependencyGlobal(name: string, version: string): Promise<void> {
        fs.writeFileSync(
            path.join(this.rootPackagesDirectory, 'package.json'), 
            this.generic.generateSimplePackageJson({
                [name]: version
            })
        );
        await this.generic.executeCommand('npm i', this.rootPackagesDirectory);
        await this.generic.executeCommand(`mv node_modules ${this.generic.sha256(name+version)}`, this.rootPackagesDirectory);
    }

    protected async handleGeneratedFile(directory: string): Promise<void> {
        const files = fs.readdirSync(this.rootPackagesDirectory);
        for(const file of files) {
            if(file.length < 20 && !file.includes('package'))
                await this.generic.executeCommand(`yes | cp -rf ${path.join(this.rootPackagesDirectory, file)} ${directory}`)
        }
    }

    
}

export default DependencyInstaller;