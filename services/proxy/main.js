const ProxyServer = require("./proxy-server");
const VirtualHost = require("./virtual-host");
const VirtualPath = require("./virtual-path");

//dependency inject classes
const proxy = new ProxyServer(VirtualHost, VirtualPath);
proxy.initialize();

