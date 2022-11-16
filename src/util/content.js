import fs from 'fs';

/** Returns true if this is a plain object, not created from a class/prototype */
export function isPlainObject(obj) {
  // Detect obvious negatives
  // Use toString instead of jQuery.type to catch host objects
  if (!obj || {}.toString.call(obj) !== '[object Object]') {
    return false;
  }

  const proto = Object.getPrototypeOf(obj);
  const fnToString = Object.prototype.hasOwnProperty.toString;
  const ObjectFunctionString = fnToString.call(Object);

  // Objects with no prototype (e.g., `Object.create( null )`) are plain
  if (!proto) {
    return true;
  }

  // Objects with prototype are plain iff they were constructed by a global Object function
  const Ctor =
    Object.prototype.hasOwnProperty.call(proto, 'constructor') &&
    proto.constructor;
  return (
    typeof Ctor === 'function' && fnToString.call(Ctor) === ObjectFunctionString
  );
}

function searchObject(obj, storeLink) {
  const entries = Object.entries(obj);
  entries.forEach(([k, v]) => {
    if (typeof v === 'string') {
      if (v.startsWith('{"')) {
        // JSON string
        try {
          const parsed = JSON.parse(v);
          searchObject(parsed, storeLink);
        } catch {
          /* oh well */
        }
      } else if (k.includes('mobile') && v.includes('cloudinary.com')) {
        storeLink(v);
      }
    } else if (isPlainObject(v)) searchObject(v, storeLink);
  });
}

function getContent() {
  const data = JSON.parse(fs.readFileSync('./rendered.json'));

  delete data?.category?.breadcrumbs;
  (data?.categories || []).forEach((c) => {
    delete c?.breadcrumbs;
  });

  const top = data?.category?.content_blocks?.top || [];
  const aboveFold = top.slice(0, 2);
  const links = new Set();
  aboveFold.forEach((block) => searchObject(block, (link) => links.add(link)));

  const category = `<script type="application/json" id="data-ssr-category" class="sn-json">${JSON.stringify(
    data.category,
  )}</script>`;

  const categories = `<script type="application/json" id="data-ssr-categories" class="sn-json">${JSON.stringify(
    data.categories,
  )}</script>`;

  return { html: data.html, category, categories, links: [...links] };
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
