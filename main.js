import fs from 'fs';
import proxy from 'express-http-proxy';
import spdy from 'spdy';
import express from 'express';
import compression from 'compression';

import createCache from './src/util/cache.js';
import lcpPrinter from './src/util/lcp.js';
import shouldCompress from './src/util/compression.js';
import getContent, { injectData } from './src/util/content.js';

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

const { html, category, categories, links } = getContent();

const markup = [
  '<link fetchpriority="high" rel="preload" href="',
  '" as="image">',
];
const preloads = links.map((l) => markup.join(l)).join('');

const PORT = 8090;
const app = express();
// Add some gzipping to get close to production parity
app.use(compression({ filter: shouldCompress }));

app.use(
  '/categories/beds-on-sale',
  createCache(60),
  proxy('https://sleepnumber.test/', {
    preserveHostHdr: true,

    // Proxy requests that aren't sale page html to the right spot
    proxyReqPathResolver: (req) => `/categories/beds-on-sale/${req.url}`,

    // Inject ssr content into response
    userResDecorator(_, proxyResData) {
      let res = proxyResData.toString();
      res = res.replace(`<head>`, `<head>${preloads}`);
      res = res.replace('</head>', `${lcpPrinter}</head>`);

      // Inject pre-rendered React
      res = res.replace(
        `<div id='react-app'></div>`,
        `<div id='react-app'>${html}</div>`,
      );
      res = injectData(res, category);
      res = injectData(res, categories);
      return res;
    },
  }),
);

app.use(
  '/',
  proxy('https://sleepnumber.test/', {
    preserveHostHdr: true,
    parseReqBody: false,
    userResHeaderDecorator: (headers) => {
      headers['Access-Control-Allow-Origin'] = '*';
      return headers;
    },
  }),
);

const options = {
  cert: fs.readFileSync('./certs/certificate.pem'),
  key: fs.readFileSync('./certs/key.pem'),
};

spdy.createServer(options, app).listen(PORT, (error) => {
  if (error) {
    console.error(error);
    process.exit(1);
  } else {
    console.log(`Server started at https://sleepnumber.test:${PORT}`);
  }
});
