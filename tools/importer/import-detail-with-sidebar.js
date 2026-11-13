/* eslint-disable */
/* global WebImporter */

import heroParser from './parsers/hero.js';
import contactCalloutParser from './parsers/contact-callout.js';
import cleanupTransformer from './transformers/aetnastateflorida-cleanup.js';
import sectionsTransformer from './transformers/aetnastateflorida-sections.js';
// trinetaetna-* transformers belong to a different site and are intentionally not imported.

const PAGE_TEMPLATE = {
  "name": "detail-with-sidebar",
  "urls": [
    "https://www.aetnastateflorida.com/healthinvestor-hmo.php",
    "https://www.aetnastateflorida.com/hmo.php"
  ],
  "description": "Inner page with photo hero and tagline bar, main text column beside a grey downloads sidebar, stacked text sections, a highlighted summary panel and a purple callout band",
  "blocks": [
    {
      "name": "hero",
      "instances": [
        "div[class*=\"subpage-feature\"]"
      ],
      "pageInstances": {
        "https://www.aetnastateflorida.com/healthinvestor-hmo.php": [
          "body > div.grid-x.align-spaced.align-middle.subpage-feature__hmo-investor"
        ],
        "https://www.aetnastateflorida.com/hmo.php": [
          "body > div.grid-x.align-spaced.align-middle.subpage-feature__hmo"
        ]
      }
    },
    {
      "name": "contact-callout",
      "instances": [
        "div.content-panel-quicklinks",
        "div.textbar-callout-purple"
      ],
      "pageInstances": {
        "https://www.aetnastateflorida.com/healthinvestor-hmo.php": [
          "body > div:nth-child(8) > div > div.cell.small-11.medium-4.large-3.content-panel-quicklinks"
        ],
        "https://www.aetnastateflorida.com/hmo.php": [
          "body > div:nth-child(8) > div > div.cell.small-11.medium-4.large-3.content-panel-quicklinks"
        ]
      }
    }
  ],
  "representativeUrl": "https://www.aetnastateflorida.com/hmo.php",
  "sections": [
    {
      "id": "subpage-hero",
      "name": "Photo hero with plan title",
      "selector": [
        "div[class*=\"subpage-feature\"]"
      ],
      "style": null,
      "blocks": [
        "hero"
      ],
      "defaultContent": []
    },
    {
      "id": "tagline-bar",
      "name": "Grey tagline bar",
      "selector": [
        "div.textbar-grey"
      ],
      "style": "grey",
      "blocks": [],
      "defaultContent": [
        "div.textbar-grey"
      ]
    },
    {
      "id": "plan-intro",
      "name": "Plan bullets beside the Downloads sidebar",
      "selector": [
        "div.grid-container:has(div.content-panel-quicklinks)"
      ],
      "style": "split",
      "blocks": [
        "contact-callout"
      ],
      "defaultContent": [
        "div.content-panel > div.cell:first-child > h3.content-panel-subhead",
        "div.content-panel > div.cell:first-child > ul"
      ]
    },
    {
      "id": "plan-details",
      "name": "How the plan works text",
      "selector": [
        "div.grid-container:has(h3.content-panel-subhead__body)"
      ],
      "style": "wide-column",
      "blocks": [],
      "defaultContent": [
        "div.content-panel > div.cell > h3",
        "div.content-panel > div.cell > p"
      ]
    },
    {
      "id": "plan-highlights",
      "name": "Plan highlights card",
      "selector": [
        "div.grid-container:has(div.content-panel--planhighlights)"
      ],
      "style": "highlights",
      "blocks": [],
      "defaultContent": [
        "div.content-panel--planhighlights__tab h3",
        "div.content-panel--planhighlights__body"
      ]
    },
    {
      "id": "doctor-callout",
      "name": "Find a PCP purple callout",
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
  'hero': heroParser,
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
