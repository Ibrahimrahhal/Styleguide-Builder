import { Service } from 'typedi';

@Service()
class Configs {
    public get(config: string, defaultValue: string): string {
        return process.env[config] || defaultValue;
    }
}

export default Configs;