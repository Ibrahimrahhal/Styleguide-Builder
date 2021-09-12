import { Service, Inject } from 'typedi';
import * as path from 'path';
import * as crypto from 'crypto';
import * as child_process from 'child_process';
import Logging from './Logging';

@Service()
class Generic {

    @Inject()
    protected logging: Logging;
    
    protected rootPath = '../';

    public rootPathresolvePathRelativeToProject(filename: string): string {
       return path.resolve(__dirname, this.rootPath, filename);
    }

    public sha256(content: string): string {
        return crypto.createHash("sha256")
        .update(content)
        .digest("hex");
    }

    public executeCommand(
        command: string, 
        path: string = this.rootPathresolvePathRelativeToProject('.')
        ): Promise<any> {
        return new Promise((resolve, reject) => {
            const options = {
                cwd: path
            };

            child_process.exec(command, options, (error, stdout, stderr) => {
                if (error) {
                    this.logging.report.log(`${options.cwd}-${error.toString()}`);
                    reject(error);
                    return;
                }
                if (stderr) {
                    this.logging.report.log(`${options.cwd}-${stderr}`);
                }
                this.logging.report.log(`${options.cwd}-${stdout}`);
                resolve(stdout);
            });
        })
    }

    public generateSimplePackageJson(dependencies: {[key: string]: string}): string {
        return JSON.stringify({
            "name": "rootPackageJson",
            "version": "0.1.0",
            "dependencies": dependencies
        });
    }

}

export default Generic;