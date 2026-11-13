/* eslint-disable */
/* global WebImporter */

import carouselParser from './parsers/carousel.js';
import cardsParser from './parsers/cards.js';
import contactCalloutParser from './parsers/contact-callout.js';
import cleanupTransformer from './transformers/aetnastateflorida-cleanup.js';
import sectionsTransformer from './transformers/aetnastateflorida-sections.js';
// trinetaetna-* transformers belong to a different site and are intentionally not imported.

const PAGE_TEMPLATE = {
  "name": "homepage",
  "urls": [
    "https://www.aetnastateflorida.com/",
    "https://www.aetnastateflorida.com/index.php"
  ],
  "description": "Landing page with rotating photo carousel, row of three icon links, centered intro text with a PDF button and a purple contact callout band",
  "blocks": [
    {
      "name": "carousel",
      "instances": [
        "div.masthead-container > section.masthead"
      ],
      "pageInstances": {
        "https://www.aetnastateflorida.com/": [
          "body > div.masthead-container > section > div"
        ],
        "https://www.aetnastateflorida.com/index.php": [
          "body > div.masthead-container > section > div"
        ]
      }
    },
    {
      "name": "cards",
      "instances": [
        "div.homepage-threeiconlinks"
      ],
      "pageInstances": {
        "https://www.aetnastateflorida.com/": [
          "body > section:nth-child(6)"
        ],
        "https://www.aetnastateflorida.com/index.php": [
          "body > section:nth-child(6)"
        ]
      }
    },
    {
      "name": "contact-callout",
      "instances": [
        "div.textbar-callout-purple"
      ],
      "pageInstances": {
        "https://www.aetnastateflorida.com/": [
          "body > div.grid-x.align-middle.text-center.textbar-callout-purple"
        ],
        "https://www.aetnastateflorida.com/index.php": [
          "body > div.grid-x.align-middle.text-center.textbar-callout-purple"
        ]
      }
    }
  ],
  "representativeUrl": "https://www.aetnastateflorida.com/",
  "sections": [
    {
      "id": "home-carousel",
      "name": "Hero carousel",
      "selector": [
        "div.masthead-container"
      ],
      "style": null,
      "blocks": [
        "carousel"
      ],
      "defaultContent": []
    },
    {
      "id": "home-icon-links",
      "name": "Three icon links",
      "selector": [
        "section:has(div.homepage-threeiconlinks)"
      ],
      "style": null,
      "blocks": [
        "cards"
      ],
      "defaultContent": []
    },
    {
      "id": "home-welcome",
      "name": "Welcome text and temporary ID card",
      "selector": [
        "section:has(div.content-panel)"
      ],
      "style": "centered",
      "blocks": [],
      "defaultContent": [
        "div.content-panel h3.text-section-h3",
        "div.content-panel p.text-section-p-big",
        "div.content-panel p.text-section-p",
        "div.content-panel center > a.button"
      ]
    },
    {
      "id": "home-phone-callout",
      "name": "Purple phone callout",
      "selector": [
        "div.textbar-callout-purple"
      ],
      "style": "purple",
      "blocks": [
        "contact-callout"
      ],
      "defaultContent": []
    }
  ]
};

const parsers = {
  'carousel': carouselParser,
  'cards': cardsParser,
  'contact-callout': contactCalloutParser,
};
// Late transformers change the DOM (section <hr> markers, shared fragments), so their beforeTransform
// runs after block discovery.
const sectionTransformers = [sectionsTransformer];
const fragmentTransformers = [];
const lateTransformers = [...sectionTransformers, ...fragmentTransformers];
const transformers = [cleanupTransformer, ...lateTransformers];
const earlyTransformers = transformers.filter((fn) => !lateTransformers.includes(fn));
const CATALOG = Boolean(PAGE_TEMPLATE.pageCleanup || PAGE_TEMPLATE.blocks.some((b) => b.pageInstances));

function executeTransformers(hookName, element, payload, list = transformers) {
  const enhancedPayload = { ...payload, template: payload.params?.targets?.template || PAGE_TEMPLATE };
  list.forEach((fn) => {
    try { fn(hookName, element, enhancedPayload); }
    catch (e) { console.error(`Transformer failed at ${hookName}:`, e); }
  });
}

function findBlocksOnPage(document, template, url) {
  const pageBlocks = [];
  const pageKey = (u) => {
    try { const { origin, pathname } = new URL(u); return `${origin}${pathname.replace(/\/$/, '')}`; }
    catch { return u; }
  };
  const key = pageKey(url);
  const claim = (blockDef, selector) => {
    let matches = [];
    try { matches = document.querySelectorAll(selector); } catch { return; }
    matches.forEach((element) => {
      if (pageBlocks.some((b) => b.element === element || b.element.contains(element) || element.contains(b.element))) return;
      pageBlocks.push({ name: blockDef.name, selector, element });
    });
  };
  template.blocks.forEach((blockDef) => {
    const entry = Object.entries(blockDef.pageInstances || {}).find(([u]) => pageKey(u) === key);
    (entry ? entry[1] : []).forEach((selector) => claim(blockDef, selector));
  });
  template.blocks.forEach((blockDef) => (blockDef.instances || []).forEach((selector) => claim(blockDef, selector)));
  return pageBlocks;
}

function markPageTargets(payload) {
  const { document, params } = payload;
  executeTransformers('beforeTransform', document.body, payload, earlyTransformers);
  const blocks = findBlocksOnPage(document, PAGE_TEMPLATE, params.originalURL).map(({ name, selector, element }, i) => {
    element.setAttribute('data-excat-block', String(i));
    return { name, selector };
  });
  const sections = (PAGE_TEMPLATE.sections || []).map((section, i) => {
    const target = (section.selector || []).map((s) => { try { return document.querySelector(s); } catch { return null; } }).find(Boolean);
    if (!target) return section;
    target.setAttribute('data-excat-section', String(i));
    return { ...section, selector: [`[data-excat-section="${i}"]`] };
  });
  params.targets = { blocks, template: { ...PAGE_TEMPLATE, sections } };
}

export default {
  preprocess: (payload) => {
    if (CATALOG) markPageTargets(payload);
  },
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;
    params.fragments = [];

    if (!params.targets) markPageTargets(payload);
    const pageBlocks = params.targets.blocks
      .map((block, i) => ({ ...block, element: document.querySelector(`[data-excat-block="${i}"]`) }))
      .filter((block) => block.element);
    executeTransformers('beforeTransform', main, { ...payload, pageBlocks }, lateTransformers);

    pageBlocks.forEach((block) => {
      if (!main.contains(block.element)) return;
      const parser = parsers[block.name];
      if (!parser) return;
      try { parser(block.element, { document, url, params }); }
      catch (e) { console.error(`Failed to parse ${block.name} (${block.selector}):`, e); }
    });

    executeTransformers('afterTransform', main, payload);

    main.appendChild(document.createElement('hr'));
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    params.fragments.forEach(({ element }) => {
      executeTransformers('afterTransform', element, payload, earlyTransformers);
      WebImporter.rules.transformBackgroundImages(element, document);
      WebImporter.rules.adjustImageUrls(element, url, params.originalURL);
    });

    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '')
      .replace(/\.php$/i, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }, ...params.fragments];
  },
};
