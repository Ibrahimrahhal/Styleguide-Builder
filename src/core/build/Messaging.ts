import { Service } from 'typedi';
import * as cluster from 'cluster';

declare type messageTypes = "taskFinished" | "task" | "exit";

interface Message {
    type: messageTypes,
    payload: any
}

@Service()
class Messaging {

    private subscribedEvents: Array<{name: messageTypes, handler: (payload: any, worker: cluster.Worker | undefined) => void}>;

    constructor() {
        this.subscribedEvents = [];
        if(cluster.isMaster) {
            cluster.on("message", this.messagingHandler.bind(this));
        } else {
            process.on("message",  this.messagingHandler.bind(this));
        }
    }

    private messagingHandler(worker: cluster.Worker, message: Message): void {
            const handlers = this.subscribedEvents.filter(({name}) => name === message.type);
            handlers.forEach(({handler}) => handler(message.payload, worker));
    }

    public subscribe(event: messageTypes, handler: (payload: any, worker: cluster.Worker | undefined) => void): void {
        this.subscribedEvents.push({
            name: event,
            handler
        });
    }

    public emit(event: messageTypes, payload: any, worker?: cluster.Worker): void {
        const message: Message = {type: event, payload};
        if(worker) {
            worker.send?.(message);
        } else {
            process.send?.(message);
        }
    }

}

export default Messaging;