const path = require("node:path");
const fsp = require("node:fs").promises;

const YAML_ALIASES = ["html", "json"];

module.exports = class RouteHandler {
    constructor(config) {
        this.env = config.env;
        this.fileTypes = config.fileTypes;
        if (this.fileTypes.yaml) throw "yaml can only be used internally. it is returned to the client as html or json";
        this.docRoot = config.docRoot;
    }

    async Handle(context) {
        context.source = context.url;
  
        if (context.source === "/"){
            context.source = "/index.html";
        }

        if (context.source === "/config.json") {
            //root "config.json" expands to environment specific json under configurations.
            //later, that routes to a yaml file that gets expanded to json
            context.source = "/configurations/" + this.env + ".json";         
        }

        const parsed = path.parse(context.source);
        delete parsed.base; //prevents ext substitution, so delete
        parsed.dir = path.join(__dirname, this.docRoot, parsed.dir);
        let ext = parsed.ext || ".html"; //original extension for mime type later
        ext = ext.substring(1);

        context.fileType = this.fileTypes[ext];
        if (!context.fileType) {
            context.code = 415
            return;
        }
        context.fileType.ext = ext;

        //html and json files are stored as yaml, so the source name if needed
        if (YAML_ALIASES.includes(ext)) {
            parsed.ext = ".yaml";
        }        
        context.source = path.format(parsed).split("\\").join("/");

        await this.loadfileStats(context);
        if (context.stats.size === -1) {
            context.code = 404;
            context.stats.size = 0;
            return;
        }
    }

    async loadfileStats(context) {
        try {
            await fsp.access(context.source, fsp.constants.F_OK);
            const stats = await fsp.stat(context.source);

            context.stats = {
                size: stats.size,
                mtime: stats.mtime,
                mTimeMs: stats.mTimeMs 
            };

        } catch (e) {
            context.stats = {
                size: -1
            };
        }
    }
}
