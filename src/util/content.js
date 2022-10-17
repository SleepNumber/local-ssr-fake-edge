import fs from 'fs';

function getContent() {
  const data = JSON.parse(fs.readFileSync('./rendered.json'));

  const category = `<script type="application/json" id="data-ssr-category" class="sn-json">${JSON.stringify(
    data.category
  )}</script>`;

  const categories = `<script type="application/json" id="data-ssr-categories" class="sn-json">${JSON.stringify(
    data.categories
  )}</script>`;

  return { html: data.html, category, categories };
}

/**
 * Add the burnin data as text to the response
 * @param {string} res
 * @param {string} data
 */
export function injectData(res, data) {
  const marker = '<!-- Page Bundle';
  return res.replace(marker, `${data}\n${marker}`);
}

export default getContent;
