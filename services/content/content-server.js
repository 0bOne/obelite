const http = require('http');

module.exports = class ContentServer {
    constructor(dependencies) {

        this.port = dependencies.config.port;
        this.handlers = dependencies.handlers;
    
        this.server = http.createServer(this.handleRequest.bind(this));
    
        this.server.listen(this.port, () => {
            console.log(`content server running at http://localhost:${this.port}/`);
        });
    }

    async handleRequest(req, res) {

        const startTime = new Date().getTime();
        const urlParts = req.url.split("?");

        const context = {
            url: urlParts[0],
            query: urlParts[1],
            requestHeaders: req.headers,
            code: 0,
            stats: {},
            responseStream: null,
            responseHeaders: {}
        };

        for (let h = 0; h < this.handlers.length; h++) {
            const handler = this.handlers[h];
            console.log("invoking handler", handler.constructor.name);
            await handler.Handle(context);
            if (context.code > 0) {
                console.log("handler completed response. skipping remaining handlers");
                break;
            }
        }

        const endTime = new Date().getTime();
        context.responseHeaders["x-svr-exec-ms"] = endTime - startTime;

        //TODO: security headers
        context.code = context.code || 200;
        res.writeHead(context.code, context.responseHeaders);
    
        res.end(context.buffer);
    }
}