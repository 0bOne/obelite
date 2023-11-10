const http = require('http');
const { connected } = require('process');

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


        const urlParts = req.url.split("?");

        const context = {
            url: urlParts[0],
            query: urlParts[1],
            requestHeaders: req.headers,
            code: 0,
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


        //TODO: additional headers
        if (context.buffer) {
            context.code = context.code || 200;
            res.writeHead(context.code, context.responseHeaders);
            res.end(context.buffer);
        } else {
            debugger; //unexpected
        }
    }
}