const zlib = require("node:zlib");
const util = require("node:util");
const brotliCompressAsync = util.promisify(zlib.brotliCompress);

const BrotliOptions = {
    params: {
      [zlib.constants.BROTLI_PARAM_QUALITY]: 11 // Maximum compression level
    }
  };

module.exports = class CompressionStreamer {
    
    env;
    enabled;

    constructor(config) {
        this.env = config.env;
        this.enabled = config.compression || false;
    }

    async Handle(context) {
        if (!this.enabled) {
            return;
        };

        if (context.url.endsWith(".br") === false) {
            //no compression requested
            return;
        }

        if (context.buffer) {
            const beforeLength = context.buffer.length;
            context.buffer = await brotliCompressAsync(context.buffer, BrotliOptions);
            const afterLength = context.buffer.length;
            console.log("compressed", beforeLength, "to", afterLength, context.url);
            context.responseHeaders["Content-Encoding"] = "br";
            delete context.responseHeaders["Content-Length"];
        } else {
            debugger; //unexpected
        }
    }
}