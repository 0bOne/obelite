
const { Readable } = require('node:stream');

module.exports = class CacheWriter {
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

        if (!context.stats) {
            debugger; //unexpected
        }

        const cacheItem = {
            buffer: context.buffer,
            fileType: context.fileType,
            headers: context.responseHeaders,
            stats: {
                size: context.stats.size,
                mtime: context.stats.mtime,
                mTimeMs: context.stats.mTimeMs 
            }
        };

        this.cache[context.url] = cacheItem;

    }
}