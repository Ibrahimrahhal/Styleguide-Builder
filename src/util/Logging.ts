import { Service, Inject } from 'typedi';
import Generic from './Generic';
import * as fs from 'fs';

@Service()
class Report {

    @Inject()
    protected generic: Generic;
    
    private get filePath(): string {
        return this.generic.rootPathresolvePathRelativeToProject('build.log');
    }

    log(message: string): void {
        const fileExist = fs.existsSync(this.filePath);
        let content = "";
        if(fileExist) {
            content = fs.readFileSync(this.filePath, 'utf8');
        }
        fs.writeFileSync(this.filePath, `${content}\n${message}\n`);
    }
}

@Service()
class Console {

    table(table: {[key: string]: string}): void {
        console.table(table);
    }

    clear(): void {
        console.clear();
    }

    log(message: string): void {
        console.log(`${message}\n`);
    }
}

@Service()
class Logging {

    @Inject()
    public console: Console;

    @Inject()
    public report: Report;
    
}

export default Logging;