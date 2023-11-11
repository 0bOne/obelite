module.exports = class CacheReader {
    
    env;
    enabled;
    cache;

    constructor(config) {
        this.env = config.env;
        this.enabled = config.cache || false;
        
        config.cachedItems = config.cachedItems || {};
        this.cache = config.cachedItems;
    }

    async Handle(context) {
        if (!this.enabled) {
            return;
        }
        const cacheEntry = this.cache[context.url];
        if (cacheEntry) {
            cacheEntry.headers["x-cache-hit"] = "1";
            context.buffer = cacheEntry.buffer;
            context.responseHeaders = cacheEntry.headers;  
            context.stats = cacheEntry.stats;  
            context.fileType = cacheEntry.fileType;
            context.code = 200;
        }


    }
}