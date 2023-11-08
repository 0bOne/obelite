const { spawn } = require('node:child_process');
const http = require("node:http");
const path = require("node:path");
const fs = require("node:fs");

module.exports = class VirtuaPath{

    name;
    childProcess;
    running;
    host;
    path;
    
    constructor(config) {

        this.name = config.name;
        this.path = config.path;
        this.protocol = config.protocol;
        this.port = config.port;

        console.log("initializing virtual path handler", this.name);
        this.scriptPath = path.resolve(__dirname, config.entryPoint);

        if (!fs.existsSync(this.scriptPath)) throw `virtual path handler ${this.name} has invalid entryPoint: ${this.scriptPath}`;

        this.options = {
            cwd: path.dirname(this.scriptPath),
            env: { ...process.env, ...config.env}
        };
        this.options.env.port = config.port;
    }

    async initialize() {
        this.childProcess = await spawn('node', [this.scriptPath], this.options);
        if (this.childProcess.error) throw this.childProcess.error;
        this.running = true;

        this.childProcess.stdout.on("data", this.onStdOutData.bind(this));
        this.childProcess.stderr.on("data", this.onStdErrData.bind(this));
        this.childProcess.on("close", this.onClose.bind(this));
    }

    onStdOutData(data) {
        console.log(this.name, "" + data);
    }

    onStdErrData(data) {
        console.error(this.name, "" + data);
    }

    handleRequest(clientReq, clientRes) {
        console.log("handling request for virtual path", this.path);

        //ensure the downstream server gets the path it would have received if no proxy path existed
        const pathlessUrl = clientReq.url.replace(this.path, "") || "/";

        const options = {
            protocol: this.protocol,
            hostname: "localhost", //hardcoded, so that proxy can't use external downstream hosts
            port: this.port,
            path: pathlessUrl,
            method: clientReq.method,
            headers: clientReq.headers
        };

        const downstreamReq = http.request(options, (downstreamRes) => {
            clientRes.writeHead(downstreamRes.statusCode, downstreamRes.headers);
            downstreamRes.pipe(clientRes, {end: true});
        });

        downstreamReq.on('error', (e) => {
            console.error(`problem with request: ${e.message}`);
            clientRes.end();
        });

        clientReq.pipe(downstreamReq, {end: true});
    }

    onClose(code) {
        console.log(`[${name}] child process exited with code ${code}`);
    }

    shutdown() {
        if (this.childProcess) {
            console.log("shutting down child process", this.name);
            this.childProcess.kill();
            this.killedProcess = this.childProcess;
            this.childProcess = null;
        } else {
            console.log("shutting down child process", this.name, "unnecessary: not running.");
        }
    }
}