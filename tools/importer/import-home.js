/* eslint-disable */
/* global WebImporter */

import carouselHeroParser from './parsers/carousel-hero.js';
import cardsIconLinkParser from './parsers/cards-icon-link.js';
import heroCalloutParser from './parsers/hero-callout.js';
import cleanupTransformer from './transformers/aetnastateflorida-cleanup.js';
import sectionsTransformer from './transformers/aetnastateflorida-sections.js';

// Only this site's transformers are used; trinetaetna-* transformers belong to a different site.
const PAGE_TEMPLATE = {
  "name": "home",
  "urls": [
    "https://www.aetnastateflorida.com/"
  ],
  "representativeUrl": "https://www.aetnastateflorida.com/",
  "description": "Aetna State of Florida homepage: hero carousel, three icon links, welcome and temporary ID card text, purple phone callout",
  "urlPattern": "/",
  "blocks": [
    {
      "name": "carousel-hero",
      "instances": [
        "div.masthead-container section.masthead"
      ]
    },
    {
      "name": "cards-icon-link",
      "instances": [
        "div.homepage-threeiconlinks"
      ]
    },
    {
      "name": "hero-callout",
      "instances": [
        "div.textbar-callout-purple"
      ]
    }
  ],
  "sections": [
    {
      "id": "rc2",
      "name": "Hero carousel (masthead)",
      "selector": [
        "div.masthead-container"
      ],
      "style": null,
      "blocks": [
        "carousel-hero"
      ],
      "defaultContent": []
    },
    {
      "id": "rc4",
      "name": "Three icon links",
      "selector": [
        "section:has(> div > div.homepage-threeiconlinks)",
        "section:has(.homepage-threeiconlinks)"
      ],
      "style": null,
      "blocks": [
        "cards-icon-link"
      ],
      "defaultContent": []
    },
    {
      "id": "rc5",
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
      "id": "rc6",
      "name": "Phone callout",
      "selector": [
        "div.textbar-callout-purple"
      ],
      "style": "purple",
      "blocks": [
        "hero-callout"
      ],
      "defaultContent": []
    }
  ]
};

const parsers = {
  'carousel-hero': carouselHeroParser,
  'cards-icon-link': cardsIconLinkParser,
  'hero-callout': heroCalloutParser,
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
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }, ...params.fragments];
  },
};
