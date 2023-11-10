module.exports = class VirtualHost {

    pathKeys = [];
    pathHandlers = {};
    defaultHandler;
    name;

    constructor(VirtualPath, config) {
        this.name = config.name;
        console.log("initializing virtual host handler", this.name);
        config.paths.forEach(pathConfig => {
            this.pathHandlers[pathConfig.path] = new VirtualPath(pathConfig);
        });
        this.pathKeys = Object.keys(this.pathHandlers);
    }

    async initialize() {
        for (let [key, value] of Object.entries(this.pathHandlers)) {
            await value.initialize();
        }
    }

    handleRequest(clientReq, clientRes) {
        console.log("handling request for host", this.name);
        let url = clientReq.url;
        let pathHandler = this.defaultHandler;

        for (let k = 0; k < this.pathKeys.length; k++) {
            if (url.startsWith(this.pathKeys[k])) {
                pathHandler = this.pathHandlers[this.pathKeys[k]];
                break;
            }
        }
        if (pathHandler) {        
            pathHandler.handleRequest(clientReq, clientRes);
        } else {
            clientRes.writeHead(404);
            clientRes.end();
        }
    }

    shutdown() {
        console.log("shutting down virtual path handlers for host", this.name);
        for(let [name, instance] of Object.entries(this.pathHandlers)) {
            instance.shutdown();
        }
    }
}