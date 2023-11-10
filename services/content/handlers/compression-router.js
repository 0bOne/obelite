module.exports = class CompressionRouter {
    
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

        const acceptedEncoding = context.requestHeaders["accept-encoding"] || "";
        const acceptedEncodings = acceptedEncoding.replaceAll(" ", "").split(",");

        if (acceptedEncodings.includes("br") === false) {
            return;
        }
        context.url += ".br";
    }
}