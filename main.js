import proxy from 'express-http-proxy';
import express from 'express';
import fs from 'fs';

const {styles, html, category, categories} = JSON.parse(
  fs.readFileSync('./rendered.json'),
);

const app = express();
const PORT = 8090;

const categoryBurnin = `<script type="application/json" id="data-ssr-category" class="sn-json">${JSON.stringify(
  category,
)}</script>`;
const categoriesBurnin = `<script type="application/json" id="data-ssr-categories" class="sn-json">${JSON.stringify(
  categories,
)}</script>`;

app.use(
  '/categories/beds-on-sale',
  proxy('http://sleepnumber.test/', {
    preserveHostHdr: true,

    // Proxy reequests that aren't sale page html to the right spot
    proxyReqPathResolver: (req) => `/categories/beds-on-sale/${req.url}`,

    userResDecorator: function (_, proxyResData) {
      const htmlDoc = proxyResData.toString();

      // Inject emotion styles
      const withStyles = htmlDoc.replace('</head>', `${styles}\n</head>`);

      // Inject pre-rendered React
      const withHtml = withStyles.replace(
        `<div id='react-app'></div>`,
        `<div id='react-app'>${html}</div>`,
      );

      // // Add hardcoded burnin
      // const categoryBurnedIn = withHtml.replace(
      //   '<!-- Page Bundle',
      //   `${categoryBurnin}\n<!-- Page Bundle`,
      // );
      // const result = categoryBurnedIn.replace(
      //   '<!-- Page Bundle',
      //   `${categoriesBurnin}\n<!-- Page Bundle`,
      // );

      return withHtml;
    },
  }),
);

app.use(
  '/',
  proxy('http://sleepnumber.test/', {
    preserveHostHdr: true,
    parseReqBody: false,
    userResHeaderDecorator: (headers) => {
      headers['Access-Control-Allow-Origin'] = '*';
      return headers;
    },
  }),
);

app.listen(PORT, () => console.log(`Server listening on ${PORT}`));