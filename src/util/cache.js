import zlib from 'zlib';
import NodeCache from 'node-cache';

const cache = new NodeCache();

/**
 * Create an in-memory cache to mimic edge-level server speed
 * @param {number} duration - duration in seconds to cache requests
 */
function createCache(duration) {
  return (req, res, next) => {
    if (req.method !== 'GET') {
      console.error('Cannot cache non-GET requests');
      next();
    } else {
      const key = req.originalUrl;
      const cachedResponse = cache.get(key);
      if (cachedResponse) {
        console.log(`Cache hit for ${key}`);
        res.send(cachedResponse);
        cache.set(key, cachedResponse, duration); // update time
      } else {
        console.log(`Cache miss for ${key}`);
        res.ogSend = res.send;
        res.send = (body) => {
          zlib.unzip(body, (err, buffer) => {
            if (err) console.error(err);
            else cache.set(key, buffer.toString('utf8'), duration);
          });
          res.ogSend(body);
        };
        next();
      }
    }
  };
}

export default createCache;
