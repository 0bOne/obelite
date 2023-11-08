const yaml = require("yaml");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const url = require("node:url");

module.exports = class ProxyServer {
    
    hosts = {};

    constructor(VirtualHost, VirtualPath) {

        this.env = process.env.ENV;
        if (!this.env) throw "please defined environment variable ENV";

        const configPath = path.join(__dirname, "configurations", this.env + ".yaml");
        if (!fs.existsSync(configPath)) throw "cound not find config file " + configPath;

        const configYaml = "" + fs.readFileSync(configPath);    
        this.config = yaml.parse(configYaml);

        if (!isFinite(this.config.port)) throw "invalid port specified in " + configPath;

        this.config.hosts.forEach(hostConfig => {
            this.hosts[hostConfig.name] = new VirtualHost(VirtualPath, hostConfig);
            if (hostConfig.name === this.config.defaultHost) {
                this.defaultHost = this.hosts[hostConfig.name];
            }
        });

        if (!this.defaultHost) throw "default host not configured or not recognized in " + configPath;


        process.on('SIGINT', this.handleShutdown.bind(this));
        this.server = http.createServer(this.handleRequest.bind(this));
        this.server.listen(this.config.port);
        console.log("proxy listening on port", this.config.port);
    }

    async initialize() {
        for (let [name, host] of Object.entries(this.hosts)) {
            await host.initialize();
        } 
    }

    handleRequest(clientReq, clientRes) {
        const hostname = clientReq.headers.host.split(':')[0];
        const host = this.hosts[hostname] || this.defaultHost;
        host.handleRequest(clientReq, clientRes);
    }

    handleShutdown() {
        console.log("shutting down all hosts");
        for (let [name, host] of Object.entries(this.hosts)) {
            host.shutdown();
        }
        console.log("exiting proxy process");
        process.exit(0);
    }
}