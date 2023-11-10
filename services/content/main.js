const fs = require("node:fs");
const path = require("node:path");
const yaml = require("yaml");
const ContentServer = require("./content-server");

const RouteHandler = require("./handlers/route-handler");
const ContentExpander = require("./handlers/content-expander");
const CacheReader = require("./handlers/cache-reader");
const CacheWriter = require("./handlers/cache-writer");
const CompressionRouter = require("./handlers/compression-router");
const CompressionStreamer = require("./handlers/compression-streamer");


const env = process.env.ENV;
if (!env) throw "missing environment variable ENV";

const configPath = path.join(__dirname, "configurations", env + ".yaml");
if (!fs.existsSync(configPath)) throw "missing enviroment config file " + configPath;
const configYaml = "" + fs.readFileSync(configPath);
const config = yaml.parse(configYaml);

if (!isFinite(process.env.port)) throw "please set env variable 'port'";
config.port = process.env.port;
config.env = env;

const fileTypePath = path.join(__dirname, "configurations", "file-types.yaml");
const fileTypeYaml = "" + fs.readFileSync(fileTypePath);
config.fileTypes = yaml.parse(fileTypeYaml);

const dependencies = {
	config: config,
	handlers: [
		//always first as it figures out default documents, underlying yaml, and file stats
		new RouteHandler(config),  
		//additional routing when the browser supports compression. appends .br extension if browser header present
		new CompressionRouter(config),  
		//EARLY RETURN ON CACHE HIT
		new CacheReader(config),
		//converts yaml to html and json as needed, or creates a read stream for other files
		new ContentExpander(config),
		//creates a compression stream if browser header present
		new CompressionStreamer(config),
		//writes to the cache AND returns to the client if enabled
		new CacheWriter(config)
	]
};

const server = new ContentServer(dependencies);


