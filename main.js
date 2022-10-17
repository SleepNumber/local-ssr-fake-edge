import fs from 'fs';
import proxy from 'express-http-proxy';
import spdy from 'spdy';
import express from 'express';
import compression from 'compression';

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

const app = express();
const PORT = 8090;

/** Gzip compression filter */
function shouldCompress(req, res) {
  if (req.headers['x-no-compression']) {
    // don't compress responses with this request header
    return false;
  }

  // fallback to standard filter function
  return compression.filter(req, res);
}

const lcpPrinter = `
<script>
new PerformanceObserver(entryList => {
  for (const entry of entryList.getEntries()) {
    console.log('LCP candidate:', entry.startTime, entry);
  }
}).observe({ type: 'largest-contentful-paint', buffered: true });
</script>
`;

const {html, category, categories} = JSON.parse(
  fs.readFileSync('./rendered.json'),
);

const categoryBurnin = `<script type="application/json" id="data-ssr-category" class="sn-json">${JSON.stringify(
  category,
)}</script>`;

const categoriesBurnin = `<script type="application/json" id="data-ssr-categories" class="sn-json">${JSON.stringify(
  categories,
)}</script>`;

// Add some gzipping to get close to production parity
app.use(compression({filter: shouldCompress}));

app.use(
  '/categories/beds-on-sale',
  proxy('https://sleepnumber.test/', {
    preserveHostHdr: true,

    // Proxy requests that aren't sale page html to the right spot
    proxyReqPathResolver: (req) => `/categories/beds-on-sale/${req.url}`,

    userResDecorator(_, proxyResData) {
      let response = proxyResData.toString();
      response = response.replace('</head>', `${lcpPrinter}</head>`);

      // Inject pre-rendered React
      response = response.replace(
        `<div id='react-app'></div>`,
        `<div id='react-app'>${html}</div>`,
      );

      response = response.replace(
        '<!-- Page Bundle',
        `${categoryBurnin}\n<!-- Page Bundle`,
      );
      response = response.replace(
        '<!-- Page Bundle',
        `${categoriesBurnin}\n<!-- Page Bundle`,
      );

      return response;
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
    return process.exit(1);
  } else {
    console.log(`Server listening on ${PORT}`);
  }
});
