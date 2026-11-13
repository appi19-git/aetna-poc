/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-home.js
  var import_home_exports = {};
  __export(import_home_exports, {
    default: () => import_home_default
  });

  // tools/importer/parsers/carousel-hero.js
  function parse(element, { document: document2 }) {
    const clean = (t) => (t || "").replace(/\s+/g, " ").trim();
    let slides = [...element.querySelectorAll(".masthead-item.slick-slide:not(.slick-cloned)")];
    if (!slides.length) slides = [...element.querySelectorAll(".masthead-item")];
    const cells = [];
    slides.forEach((slide) => {
      const imageCell = [];
      const bg = slide.querySelector(".masthead-background-container");
      const srcImg = (bg || slide).querySelector("img");
      if (srcImg && srcImg.getAttribute("src")) {
        const img = document2.createElement("img");
        img.src = srcImg.getAttribute("src");
        img.alt = srcImg.getAttribute("alt") || "";
        imageCell.push(img);
      } else {
        const styled = [bg, ...bg ? bg.querySelectorAll("[style]") : []].find(
          (el) => el && /background-image\s*:\s*url\(/i.test(el.getAttribute("style") || "")
        );
        if (styled) {
          const m = styled.getAttribute("style").match(/url\((['"]?)(.*?)\1\)/i);
          if (m) {
            const img = document2.createElement("img");
            img.src = m[2];
            img.alt = "";
            imageCell.push(img);
          }
        }
      }
      const textCell = [];
      const title = slide.querySelector(".masthead-text .masthead-text-title");
      if (title && clean(title.textContent)) {
        const h = document2.createElement(/^H[1-6]$/.test(title.tagName) ? title.tagName.toLowerCase() : "h2");
        h.textContent = clean(title.textContent);
        textCell.push(h);
      }
      slide.querySelectorAll(".masthead-sub-content > .masthead-text-title-sub1, .masthead-sub-content > .masthead-text-title-sub2").forEach((sub) => {
        const text = clean(sub.textContent);
        if (!text) return;
        const tag = /^H[1-6]$/.test(sub.tagName) ? sub.tagName.toLowerCase() : "p";
        const el = document2.createElement(tag);
        el.textContent = text;
        textCell.push(el);
      });
      if (!imageCell.length && !textCell.length) return;
      cells.push([imageCell.length ? imageCell : "", textCell.length ? textCell : ""]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "Carousel (carousel-hero)", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-icon-link.js
  function parse2(element, { document: document2 }) {
    const BASE2 = "https://www.aetnastateflorida.com/";
    const clean = (t) => (t || "").replace(/\s+/g, " ").trim();
    const absolute = (href) => {
      try {
        return new URL(href, BASE2).href;
      } catch (e) {
        return href;
      }
    };
    const cells = [];
    element.querySelectorAll(":scope > .cell").forEach((item) => {
      const link = item.querySelector("a[href]");
      const href = link ? absolute(link.getAttribute("href")) : "";
      const imageCell = [];
      const srcImg = item.querySelector("img");
      if (srcImg) {
        const img = document2.createElement("img");
        img.src = srcImg.getAttribute("src");
        img.alt = srcImg.getAttribute("alt") || "";
        imageCell.push(img);
      }
      const bodyCell = [];
      const heading = item.querySelector("h1, h2, h3, h4, h5, h6");
      if (heading && clean(heading.textContent)) {
        const h3 = document2.createElement("h3");
        const text = clean(heading.textContent);
        if (href) {
          const a = document2.createElement("a");
          a.href = href;
          a.textContent = text;
          h3.append(a);
        } else {
          h3.textContent = text;
        }
        bodyCell.push(h3);
      }
      const desc = item.querySelector("p");
      if (desc && clean(desc.textContent)) {
        const p = document2.createElement("p");
        p.textContent = clean(desc.textContent);
        bodyCell.push(p);
      }
      if (!imageCell.length && !bodyCell.length) return;
      cells.push([imageCell.length ? imageCell : "", bodyCell.length ? bodyCell : ""]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "Cards (cards-icon-link)", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/hero-callout.js
  function parse3(element, { document: document2 }) {
    const clean = (t) => (t || "").replace(/\s+/g, " ").trim();
    const cells = [];
    const srcImg = element.querySelector("img");
    if (srcImg) {
      const img = document2.createElement("img");
      img.src = srcImg.getAttribute("src");
      img.alt = srcImg.getAttribute("alt") || "";
      cells.push([img]);
    } else {
      cells.push([""]);
    }
    const content = [];
    const srcH = element.querySelector("h1, h2, h3, h4, h5, h6");
    if (srcH) {
      const h3 = document2.createElement("h3");
      const after = [];
      let pastBreak = false;
      [...srcH.childNodes].forEach((node) => {
        if (node.nodeType === 1 && node.tagName === "BR") {
          pastBreak = true;
          return;
        }
        if (pastBreak) {
          after.push(node.textContent);
          return;
        }
        if (node.nodeType === 3) {
          h3.append(document2.createTextNode(node.textContent.replace(/\s+/g, " ")));
        } else if (node.nodeType === 1) {
          const text = clean(node.textContent);
          if (!text) return;
          if (node.tagName === "SPAN" || node.tagName === "STRONG" || node.tagName === "B") {
            const strong = document2.createElement("strong");
            strong.textContent = text;
            h3.append(strong);
          } else {
            h3.append(document2.createTextNode(text));
          }
        }
      });
      if (h3.firstChild && h3.firstChild.nodeType === 3) h3.firstChild.textContent = h3.firstChild.textContent.replace(/^\s+/, "");
      if (h3.lastChild && h3.lastChild.nodeType === 3) h3.lastChild.textContent = h3.lastChild.textContent.replace(/\s+$/, "");
      if (clean(h3.textContent)) content.push(h3);
      const tdd = clean(after.join(" "));
      if (tdd) {
        const p = document2.createElement("p");
        p.textContent = tdd;
        content.push(p);
      }
    }
    cells.push([content.length ? content : ""]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "Hero (hero-callout)", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/aetnastateflorida-cleanup.js
  var BASE = "https://www.aetnastateflorida.com/";
  function removeAll(root, selectors) {
    selectors.forEach((sel) => {
      root.querySelectorAll(sel).forEach((el) => el.remove());
    });
  }
  function removeComments(root) {
    const doc = root.ownerDocument || document;
    const walker = doc.createTreeWalker(
      root,
      128
      /* NodeFilter.SHOW_COMMENT */
    );
    const comments = [];
    while (walker.nextNode()) comments.push(walker.currentNode);
    comments.forEach((c) => c.remove());
  }
  function isRelative(url) {
    if (!url) return false;
    const v = url.trim();
    if (!v) return false;
    return !/^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(v);
  }
  function resolve(url) {
    try {
      return new URL(url.trim(), BASE).href;
    } catch (e) {
      return url;
    }
  }
  function resolveUrls(root) {
    root.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href");
      if (isRelative(href)) a.setAttribute("href", resolve(href));
    });
    root.querySelectorAll("img[src]").forEach((img) => {
      const src = img.getAttribute("src");
      if (/^\.\/images\/[0-9a-f]{32}\.[a-z]+$/i.test(src)) return;
      if (isRelative(src)) img.setAttribute("src", resolve(src));
    });
  }
  function isEmptySpacer(el) {
    if (el.children.length > 0) return false;
    const text = (el.textContent || "").replace(/ /g, "").trim();
    return text === "";
  }
  function transform(hookName, element, payload) {
    if (hookName === "beforeTransform") {
      removeComments(element);
      removeAll(element, [
        "header",
        "footer.footer",
        "footer",
        "a.skip-main",
        'a[href="#main"]',
        "div#main",
        // slick carousel chrome
        ".slick-cloned",
        ".slick-dots",
        ".slick-arrow",
        ".slick-prev",
        ".slick-next",
        ".play-pause-toggle",
        // thin grey rule inside rc5 (must not become an <hr>)
        ".utility-simple-rule",
        "script",
        "style",
        "noscript",
        "link",
        "iframe"
      ]);
      element.querySelectorAll("p").forEach((p) => {
        if (isEmptySpacer(p) && !p.querySelector("img")) p.remove();
      });
      element.querySelectorAll("section > br").forEach((br) => {
        const prev = br.previousElementSibling;
        if (!prev) br.remove();
      });
      const divs = Array.from(element.querySelectorAll("div")).reverse();
      divs.forEach((div) => {
        if (isEmptySpacer(div)) div.remove();
      });
      resolveUrls(element);
    }
    if (hookName === "afterTransform") {
      removeAll(element, ["script", "style", "noscript", "link", "iframe"]);
      element.querySelectorAll("[data-slick-index], [aria-hidden], [tabindex]").forEach((el) => {
        el.removeAttribute("data-slick-index");
        el.removeAttribute("aria-hidden");
        el.removeAttribute("tabindex");
      });
    }
  }

  // tools/importer/transformers/aetnastateflorida-sections.js
  var MARKER = "data-excat-section-id";
  var FIRST = "data-excat-first";
  function findSectionElement(root, section) {
    const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
    for (const sel of selectors) {
      if (!sel) continue;
      try {
        const el = root.querySelector(sel);
        if (el) return el;
      } catch (e) {
      }
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections || [];
    if (sections.length < 2) return;
    const doc = element.ownerDocument || document;
    if (hookName === "beforeTransform") {
      const found = sections.map((section) => ({ section, el: findSectionElement(element, section) })).filter(({ el }) => el);
      for (let i = found.length - 1; i >= 0; i -= 1) {
        const { section, el } = found[i];
        const isFirst = i === 0;
        if (section.style) el.setAttribute(MARKER, section.id);
        if (!isFirst || section.style) {
          const hr = doc.createElement("hr");
          if (section.style) hr.setAttribute(MARKER, section.id);
          if (isFirst) hr.setAttribute(FIRST, "true");
          el.before(hr);
        }
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const sectionEl = element.querySelector(`:not(hr)[${MARKER}="${section.id}"]`);
        const hr = element.querySelector(`hr[${MARKER}="${section.id}"]`);
        if (!sectionEl && !hr) continue;
        const meta = WebImporter.Blocks.createBlock(doc, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        if (sectionEl) {
          sectionEl.after(meta);
          sectionEl.removeAttribute(MARKER);
        } else {
          let next = hr.nextElementSibling;
          while (next && next.tagName !== "HR") next = next.nextElementSibling;
          if (next) next.before(meta);
          else hr.parentElement.append(meta);
        }
        if (hr) {
          if (hr.getAttribute(FIRST) === "true") hr.remove();
          else hr.removeAttribute(MARKER);
        }
      }
      element.querySelectorAll(`[${MARKER}]`).forEach((el) => el.removeAttribute(MARKER));
      element.querySelectorAll(`hr[${FIRST}]`).forEach((el) => el.remove());
    }
  }

  // tools/importer/import-home.js
  var PAGE_TEMPLATE = {
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
  var parsers = {
    "carousel-hero": parse,
    "cards-icon-link": parse2,
    "hero-callout": parse3
  };
  var sectionTransformers = [transform2];
  var fragmentTransformers = [];
  var lateTransformers = [...sectionTransformers, ...fragmentTransformers];
  var transformers = [transform, ...lateTransformers];
  var earlyTransformers = transformers.filter((fn) => !lateTransformers.includes(fn));
  var CATALOG = Boolean(PAGE_TEMPLATE.pageCleanup || PAGE_TEMPLATE.blocks.some((b) => b.pageInstances));
  function executeTransformers(hookName, element, payload, list = transformers) {
    var _a, _b;
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: ((_b = (_a = payload.params) == null ? void 0 : _a.targets) == null ? void 0 : _b.template) || PAGE_TEMPLATE });
    list.forEach((fn) => {
      try {
        fn(hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template, url) {
    const pageBlocks = [];
    const pageKey = (u) => {
      try {
        const { origin, pathname } = new URL(u);
        return `${origin}${pathname.replace(/\/$/, "")}`;
      } catch (e) {
        return u;
      }
    };
    const key = pageKey(url);
    const claim = (blockDef, selector) => {
      let matches = [];
      try {
        matches = document2.querySelectorAll(selector);
      } catch (e) {
        return;
      }
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
    const { document: document2, params } = payload;
    executeTransformers("beforeTransform", document2.body, payload, earlyTransformers);
    const blocks = findBlocksOnPage(document2, PAGE_TEMPLATE, params.originalURL).map(({ name, selector, element }, i) => {
      element.setAttribute("data-excat-block", String(i));
      return { name, selector };
    });
    const sections = (PAGE_TEMPLATE.sections || []).map((section, i) => {
      const target = (section.selector || []).map((s) => {
        try {
          return document2.querySelector(s);
        } catch (e) {
          return null;
        }
      }).find(Boolean);
      if (!target) return section;
      target.setAttribute("data-excat-section", String(i));
      return __spreadProps(__spreadValues({}, section), { selector: [`[data-excat-section="${i}"]`] });
    });
    params.targets = { blocks, template: __spreadProps(__spreadValues({}, PAGE_TEMPLATE), { sections }) };
  }
  var import_home_default = {
    preprocess: (payload) => {
      if (CATALOG) markPageTargets(payload);
    },
    transform: (payload) => {
      const { document: document2, url, params } = payload;
      const main = document2.body;
      params.fragments = [];
      if (!params.targets) markPageTargets(payload);
      const pageBlocks = params.targets.blocks.map((block, i) => __spreadProps(__spreadValues({}, block), { element: document2.querySelector(`[data-excat-block="${i}"]`) })).filter((block) => block.element);
      executeTransformers("beforeTransform", main, __spreadProps(__spreadValues({}, payload), { pageBlocks }), lateTransformers);
      pageBlocks.forEach((block) => {
        if (!main.contains(block.element)) return;
        const parser = parsers[block.name];
        if (!parser) return;
        try {
          parser(block.element, { document: document2, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      });
      executeTransformers("afterTransform", main, payload);
      main.appendChild(document2.createElement("hr"));
      WebImporter.rules.createMetadata(main, document2);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      params.fragments.forEach(({ element }) => {
        executeTransformers("afterTransform", element, payload, earlyTransformers);
        WebImporter.rules.transformBackgroundImages(element, document2);
        WebImporter.rules.adjustImageUrls(element, url, params.originalURL);
      });
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: { title: document2.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) }
      }, ...params.fragments];
    }
  };
  return __toCommonJS(import_home_exports);
})();
