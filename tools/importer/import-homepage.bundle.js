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

  // tools/importer/import-homepage.js
  var import_homepage_exports = {};
  __export(import_homepage_exports, {
    default: () => import_homepage_default
  });

  // tools/importer/parsers/carousel.js
  function parse(element, { document: document2 }) {
    const clean = (t) => (t || "").replace(/\s+/g, " ").trim();
    const isHeading = (el) => /^H[1-6]$/.test(el.tagName);
    const inlineCopy = (src, tag) => {
      const el = document2.createElement(tag);
      const clone = src.cloneNode(true);
      clone.querySelectorAll("img, picture, script, style, br").forEach((n) => n.remove());
      el.append(...clone.childNodes);
      const walker = document2.createTreeWalker(el, 4 | 128);
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach((n) => {
        if (n.nodeType === 8) n.remove();
        else n.textContent = n.textContent.replace(/\s+/g, " ");
      });
      if (el.firstChild && el.firstChild.nodeType === 3) el.firstChild.textContent = el.firstChild.textContent.replace(/^\s+/, "");
      if (el.lastChild && el.lastChild.nodeType === 3) el.lastChild.textContent = el.lastChild.textContent.replace(/\s+$/, "");
      return el;
    };
    const notCloned = (el) => !el.closest(".slick-cloned");
    let slides = [...element.querySelectorAll(".masthead-item")].filter(notCloned);
    if (!slides.length && element.matches && element.matches(".masthead-item")) slides = [element];
    if (!slides.length) {
      slides = [...element.querySelectorAll(".slick-slide")].filter(notCloned);
      if (!slides.length) {
        const track = element.querySelector(".slick-track") || element;
        slides = [...track.children].filter((c) => c.querySelector("img"));
      }
    }
    const cells = [];
    slides.forEach((slide) => {
      const imageCell = [];
      const bg = slide.querySelector(".masthead-background-container") || slide;
      const srcImg = bg.querySelector("img[src]") || slide.querySelector("img[src]");
      if (srcImg) {
        const img = document2.createElement("img");
        img.src = srcImg.getAttribute("src");
        img.alt = srcImg.getAttribute("alt") || "";
        imageCell.push(img);
      } else {
        const styled = [bg, ...bg.querySelectorAll("[style]")].find(
          (el) => /background-image\s*:\s*url\(/i.test(el.getAttribute("style") || "")
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
      const textRoot = slide.querySelector(".masthead-text");
      if (textRoot) {
        const title = textRoot.querySelector(".masthead-text-title") || textRoot.querySelector("h1, h2, h3, h4, h5, h6");
        if (title && clean(title.textContent)) {
          textCell.push(inlineCopy(title, isHeading(title) ? title.tagName.toLowerCase() : "h2"));
        }
        let subs = [...textRoot.querySelectorAll(".masthead-text-title-sub1, .masthead-text-title-sub2")];
        if (!subs.length) {
          subs = [...textRoot.querySelectorAll("h1, h2, h3, h4, h5, h6, p")].filter((el) => el !== title && !el.contains(title) && !el.parentElement.closest("p, h1, h2, h3, h4, h5, h6"));
        }
        subs.forEach((sub) => {
          if (!clean(sub.textContent)) return;
          textCell.push(inlineCopy(sub, isHeading(sub) ? sub.tagName.toLowerCase() : "p"));
        });
        textRoot.querySelectorAll("a[href]").forEach((a) => {
          if (subs.some((s) => s.contains(a)) || title && title.contains(a)) return;
          if (!clean(a.textContent)) return;
          const p = document2.createElement("p");
          const link = document2.createElement("a");
          link.href = a.getAttribute("href");
          link.textContent = clean(a.textContent);
          p.append(link);
          textCell.push(p);
        });
      }
      if (!imageCell.length && !textCell.length) return;
      cells.push([imageCell.length ? imageCell : "", textCell.length ? textCell : ""]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "Carousel (carousel-hero)", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards.js
  function parse2(element, { document: document2 }) {
    const clean = (t) => (t || "").replace(/\s+/g, " ").trim();
    const HEADINGS = "h1, h2, h3, h4, h5, h6";
    const container = element.matches && element.matches(".homepage-threeiconlinks") ? element : element.querySelector(".homepage-threeiconlinks") || element.querySelector(".grid-x") || element;
    let items = [...container.querySelectorAll(":scope > .cell")];
    if (!items.length) items = [...container.children];
    items = items.filter((item) => clean(item.textContent) || item.querySelector("img"));
    const makeImg = (srcImg) => {
      const img = document2.createElement("img");
      img.src = srcImg.getAttribute("src");
      img.alt = srcImg.getAttribute("alt") || "";
      return img;
    };
    const isIconLink = items.length > 0 && items.every((item) => item.querySelector("img[src]") && item.querySelector(HEADINGS) && item.querySelector("a[href]"));
    const cells = [];
    items.forEach((item) => {
      const imageCell = [];
      const srcImg = item.querySelector("img[src]");
      if (srcImg) imageCell.push(makeImg(srcImg));
      const bodyCell = [];
      const heading = item.querySelector(HEADINGS);
      const link = heading && heading.closest("a[href]") || heading && heading.querySelector("a[href]") || item.querySelector("a[href]");
      const href = link ? link.getAttribute("href") : "";
      if (heading && clean(heading.textContent)) {
        const h = document2.createElement(isIconLink ? "h3" : heading.tagName.toLowerCase());
        const text = clean(heading.textContent);
        if (href) {
          const a = document2.createElement("a");
          a.href = href;
          a.textContent = text;
          h.append(a);
        } else {
          h.textContent = text;
        }
        bodyCell.push(h);
      }
      item.querySelectorAll("p").forEach((p) => {
        const text = clean(p.textContent);
        if (!text) return;
        const out = document2.createElement("p");
        const innerLinks = [...p.querySelectorAll("a[href]")];
        if (innerLinks.length && !isIconLink) {
          const clone = p.cloneNode(true);
          clone.querySelectorAll("img").forEach((n) => n.remove());
          out.append(...clone.childNodes);
        } else {
          out.textContent = text;
        }
        bodyCell.push(out);
      });
      if (!isIconLink) {
        item.querySelectorAll("a[href]").forEach((a) => {
          if (a === link || a.closest("p") || a.querySelector(HEADINGS) || !clean(a.textContent)) return;
          const p = document2.createElement("p");
          const cta = document2.createElement("a");
          cta.href = a.getAttribute("href");
          cta.textContent = clean(a.textContent);
          p.append(cta);
          bodyCell.push(p);
        });
      }
      if (!imageCell.length && !bodyCell.length) return;
      cells.push([imageCell.length ? imageCell : "", bodyCell.length ? bodyCell : ""]);
    });
    const name = isIconLink ? "Cards (cards-icon-link)" : "Cards";
    const block = WebImporter.Blocks.createBlock(document2, { name, cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/contact-callout.js
  function parse3(element, { document: document2 }) {
    const clean = (t) => (t || "").replace(/\s+/g, " ").trim();
    const HEADINGS = "h1, h2, h3, h4, h5, h6";
    const isHeading = (n) => n && n.nodeType === 1 && /^H[1-6]$/.test(n.tagName);
    const isBr = (n) => n && n.nodeType === 1 && n.tagName === "BR";
    const isBoldEl = (n) => {
      if (n.nodeType !== 1) return false;
      if (n.tagName === "STRONG" || n.tagName === "B") return true;
      if (n.tagName !== "SPAN") return false;
      const style = n.getAttribute("style") || "";
      return /bold/i.test(n.className || "") || /font-weight\s*:\s*(bold|[6-9]00)/i.test(style);
    };
    const appendInline = (target, nodes) => {
      nodes.forEach((node) => {
        if (node.nodeType === 3) {
          target.append(document2.createTextNode(node.textContent.replace(/\s+/g, " ")));
          return;
        }
        if (node.nodeType !== 1) return;
        const tag = node.tagName;
        if (/^(IMG|PICTURE|SCRIPT|STYLE|BR)$/.test(tag)) return;
        if (isBoldEl(node)) {
          if (!clean(node.textContent)) return;
          const strong = document2.createElement("strong");
          appendInline(strong, [...node.childNodes]);
          trim(strong);
          target.append(strong);
        } else if (tag === "A") {
          if (!clean(node.textContent)) return;
          const a = document2.createElement("a");
          a.href = node.getAttribute("href") || "";
          if (node.getAttribute("title")) a.title = node.getAttribute("title");
          appendInline(a, [...node.childNodes]);
          trim(a);
          target.append(a);
        } else if (/^(EM|I|SUP|SUB|U)$/.test(tag)) {
          const el = document2.createElement(tag.toLowerCase());
          appendInline(el, [...node.childNodes]);
          target.append(el);
        } else {
          appendInline(target, [...node.childNodes]);
        }
      });
    };
    function trim(el) {
      let first = el.firstChild;
      while (first && first.nodeType === 1 && first.firstChild) first = first.firstChild;
      if (first && first.nodeType === 3) first.textContent = first.textContent.replace(/^\s+/, "");
      let last = el.lastChild;
      while (last && last.nodeType === 1 && last.lastChild) last = last.lastChild;
      if (last && last.nodeType === 3) last.textContent = last.textContent.replace(/\s+$/, "");
      return el;
    }
    const splitLines = (nodes) => {
      const lines = [[]];
      nodes.forEach((n) => {
        if (isBr(n)) lines.push([]);
        else lines[lines.length - 1].push(n);
      });
      return lines.filter((line) => line.some((n) => n.nodeType === 3 && clean(n.textContent) || n.nodeType === 1 && (clean(n.textContent) || n.tagName === "IMG")));
    };
    const lineText = (line) => clean(line.map((n) => n.textContent).join(" "));
    const lineEl = (tag, line) => {
      const el = document2.createElement(tag);
      appendInline(el, line);
      return trim(el);
    };
    const makeImg = (srcImg) => {
      const img = document2.createElement("img");
      img.src = srcImg.getAttribute("src");
      img.alt = srcImg.getAttribute("alt") || "";
      return img;
    };
    const downloadsRoot = element.matches && element.matches(".content-panel-quicklinks") ? element : element.querySelector(".content-panel-quicklinks");
    const firstHeading = element.querySelector(HEADINGS);
    const links = [...element.querySelectorAll("a[href]")];
    const pdfLinks = links.filter((a) => /\.pdf(\?|#|$)/i.test(a.getAttribute("href") || ""));
    const isPurpleBand = element.matches && element.matches(".textbar-callout-purple") || !!element.querySelector(".textbar-callout-purple");
    const isDownloads = !isPurpleBand && (!!downloadsRoot || firstHeading && /^downloads?$/i.test(clean(firstHeading.textContent)) || pdfLinks.length >= 2 && pdfLinks.length >= links.length / 2);
    const cells = [];
    if (isDownloads) {
      const root = downloadsRoot || element;
      const content2 = [];
      const walk2 = (parent) => {
        [...parent.children].forEach((child) => {
          const tag = child.tagName;
          if (isHeading(child)) {
            if (!clean(child.textContent)) return;
            const level = content2.some((c) => isHeading(c)) ? "h4" : tag.toLowerCase();
            const h = document2.createElement(level);
            h.textContent = clean(child.textContent);
            content2.push(h);
          } else if (tag === "UL" || tag === "OL") {
            const list = document2.createElement(tag.toLowerCase());
            child.querySelectorAll(":scope > li").forEach((li) => {
              if (!clean(li.textContent)) return;
              list.append(lineEl("li", [...li.childNodes]));
            });
            if (list.children.length) content2.push(list);
          } else if (tag === "P") {
            const lines = splitLines([...child.childNodes]);
            if (!lines.length) return;
            const firstLine = lines[0];
            const firstEls = firstLine.filter((n) => n.nodeType === 1);
            const firstIsSubheading = lines.length > 1 && firstEls.length === 1 && isBoldEl(firstEls[0]) && !firstEls[0].querySelector("a") && lineText(firstLine) === clean(firstEls[0].textContent);
            let rest = lines;
            if (firstIsSubheading) {
              const sub = document2.createElement("h4");
              sub.textContent = lineText(firstLine);
              content2.push(sub);
              rest = lines.slice(1);
            }
            if (!rest.length) return;
            const allLinked = rest.every((line) => line.some((n) => n.nodeType === 1 && (n.tagName === "A" || n.querySelector("a"))));
            if (allLinked && (firstIsSubheading || rest.length > 1)) {
              const ul = document2.createElement("ul");
              rest.forEach((line) => ul.append(lineEl("li", line)));
              content2.push(ul);
            } else {
              const p = document2.createElement("p");
              rest.forEach((line, i) => {
                if (i) p.append(document2.createElement("br"));
                appendInline(p, line);
              });
              content2.push(trim(p));
            }
          } else if (tag === "A") {
            if (clean(child.textContent)) content2.push(lineEl("p", [child]));
          } else if (/^(DIV|SECTION|ARTICLE|ASIDE|CENTER)$/.test(tag)) {
            walk2(child);
          }
        });
      };
      walk2(root);
      cells.push([content2.length ? content2 : ""]);
      const block2 = WebImporter.Blocks.createBlock(document2, { name: "Contact-callout (downloads)", cells });
      element.replaceWith(block2);
      return;
    }
    const band = element.matches && element.matches(".textbar-callout-purple") ? element : element.querySelector(".textbar-callout-purple") || element;
    const icon = [...band.querySelectorAll("img[src]")].find((img) => !img.closest("p, a, h1, h2, h3, h4, h5, h6")) || band.querySelector("img[src]");
    cells.push([icon ? makeImg(icon) : ""]);
    const content = [];
    const walk = (parent) => {
      [...parent.childNodes].forEach((child) => {
        if (child.nodeType === 3) {
          if (clean(child.textContent)) content.push(lineEl("p", [child]));
          return;
        }
        if (child.nodeType !== 1) return;
        const tag = child.tagName;
        if (/^(IMG|PICTURE|BR|SCRIPT|STYLE)$/.test(tag)) return;
        if (isHeading(child)) {
          const lines = splitLines([...child.childNodes]);
          if (!lines.length) return;
          content.push(lineEl(tag.toLowerCase(), lines[0]));
          lines.slice(1).forEach((line) => content.push(lineEl("p", line)));
        } else if (tag === "P") {
          if (!clean(child.textContent)) return;
          const p = document2.createElement("p");
          splitLines([...child.childNodes]).forEach((line, i) => {
            if (i) p.append(document2.createElement("br"));
            appendInline(p, line);
          });
          content.push(trim(p));
        } else if (tag === "UL" || tag === "OL") {
          const list = document2.createElement(tag.toLowerCase());
          child.querySelectorAll(":scope > li").forEach((li) => {
            if (clean(li.textContent)) list.append(lineEl("li", [...li.childNodes]));
          });
          if (list.children.length) content.push(list);
        } else if (tag === "A") {
          if (!clean(child.textContent)) return;
          const p = document2.createElement("p");
          const a = document2.createElement("a");
          a.href = child.getAttribute("href") || "";
          if (child.getAttribute("title")) a.title = child.getAttribute("title");
          a.textContent = clean(child.textContent);
          p.append(a);
          content.push(p);
        } else {
          walk(child);
        }
      });
    };
    walk(band);
    cells.push([content.length ? content : ""]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "Contact-callout", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/aetnastateflorida-cleanup.js
  var BASE = "https://www.aetnastateflorida.com/";
  var CATALOG_RULES = [];
  function pageKey(u) {
    try {
      const { origin, pathname } = new URL(u);
      return `${origin}${pathname.replace(/\/$/, "")}`;
    } catch (e) {
      return (u || "").replace(/\/$/, "");
    }
  }
  function toSelector(entry) {
    if (!entry) return null;
    if (typeof entry === "string") return entry;
    return entry.selector || null;
  }
  function pageCleanupSelectors(pageCleanup, url) {
    if (!pageCleanup) return [];
    if (Array.isArray(pageCleanup)) return pageCleanup.map(toSelector).filter(Boolean);
    if (typeof pageCleanup === "object") {
      const key = pageKey(url);
      const entry = Object.entries(pageCleanup).find(([u]) => pageKey(u) === key);
      if (!entry) return [];
      const list = Array.isArray(entry[1]) ? entry[1] : entry[1] && entry[1].selectors || [];
      return list.map(toSelector).filter(Boolean);
    }
    return [];
  }
  function removeUnique(root, selector) {
    let matches;
    try {
      matches = root.querySelectorAll(selector);
    } catch (e) {
      return;
    }
    if (matches.length === 1) matches[0].remove();
  }
  function removeAll(root, selectors) {
    selectors.forEach((sel) => {
      try {
        root.querySelectorAll(sel).forEach((el) => el.remove());
      } catch (e) {
      }
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
  function toMigratedPath(href) {
    try {
      const u = new URL(href, BASE);
      if (u.hostname !== new URL(BASE).hostname || !/\.php$/i.test(u.pathname)) return href;
      const clean = u.pathname.replace(/\.php$/i, "").replace(/\/index$/i, "/");
      return `${clean || "/"}${u.search}${u.hash}`;
    } catch (e) {
      return href;
    }
  }
  function resolveUrls(root) {
    root.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href");
      if (isRelative(href)) a.setAttribute("href", resolve(href));
      a.setAttribute("href", toMigratedPath(a.getAttribute("href")));
    });
    root.querySelectorAll("img[src]").forEach((img) => {
      const src = img.getAttribute("src");
      if (/^\.\/images\//i.test(src)) return;
      if (isRelative(src)) img.setAttribute("src", resolve(src));
    });
  }
  function isNbspSpacer(p) {
    if (p.children.length > 0) return false;
    return (p.textContent || "").replace(/ /g, "").trim() === "";
  }
  function transform(hookName, element, payload) {
    if (hookName === "beforeTransform") {
      const doc = element.ownerDocument || document;
      const url = payload && payload.params && payload.params.originalURL || payload && payload.url || "";
      const template = payload && payload.template || {};
      pageCleanupSelectors(template.pageCleanup, url).forEach((sel) => removeUnique(doc, sel));
      const key = pageKey(url);
      CATALOG_RULES.forEach((rule) => {
        const sel = toSelector(rule);
        if (!sel) return;
        const listed = (rule.pages || []).some((u) => pageKey(u) === key);
        if (listed) return;
        try {
          doc.querySelectorAll(sel).forEach((el) => {
            if (!el.closest("main")) el.remove();
          });
        } catch (e) {
        }
      });
      removeComments(element);
    }
    if (hookName === "afterTransform") {
      removeAll(element, [
        "header",
        "footer.footer",
        "a.skip-main",
        'a[href="#main"]',
        // slick carousel chrome
        ".slick-cloned",
        ".slick-dots",
        ".slick-arrow",
        ".play-pause-toggle",
        // thin grey rule (must not become an <hr>)
        ".utility-simple-rule",
        "script",
        "style",
        "noscript",
        "link",
        "iframe"
      ]);
      element.querySelectorAll("a.button").forEach((a) => {
        if (a.closest("strong, b, table")) return;
        const strong = element.ownerDocument.createElement("strong");
        a.replaceWith(strong);
        strong.append(a);
      });
      const mainAnchor = element.querySelector("div#main");
      if (mainAnchor && !mainAnchor.children.length && !mainAnchor.textContent.trim()) mainAnchor.remove();
      element.querySelectorAll("p").forEach((p) => {
        if (isNbspSpacer(p)) p.remove();
      });
      resolveUrls(element);
      element.querySelectorAll("[data-slick-index], [aria-hidden], [tabindex], [data-excat-block], [data-excat-section]").forEach((el) => {
        ["data-slick-index", "aria-hidden", "tabindex", "data-excat-block", "data-excat-section"].forEach((a) => el.removeAttribute(a));
      });
    }
  }

  // tools/importer/transformers/aetnastateflorida-sections.js
  var MARKER = "data-excat-section-id";
  var FIRST = "data-excat-first";
  function findSectionElement(root, section) {
    const raw = section.selector;
    const selectors = Array.isArray(raw) ? raw : [raw];
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
  function nextBreakAfter(node) {
    let cur = node;
    while (cur) {
      let sib = cur.nextElementSibling;
      while (sib) {
        if (sib.tagName === "HR") return sib;
        const inner = sib.querySelector && sib.querySelector("hr");
        if (inner) return inner;
        sib = sib.nextElementSibling;
      }
      cur = cur.parentElement;
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
        } else {
          const next = nextBreakAfter(hr);
          if (next) next.before(meta);
          else element.append(meta);
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

  // tools/importer/import-homepage.js
  var PAGE_TEMPLATE = {
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
  var parsers = {
    "carousel": parse,
    "cards": parse2,
    "contact-callout": parse3
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
    const pageKey2 = (u) => {
      try {
        const { origin, pathname } = new URL(u);
        return `${origin}${pathname.replace(/\/$/, "")}`;
      } catch (e) {
        return u;
      }
    };
    const key = pageKey2(url);
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
      const entry = Object.entries(blockDef.pageInstances || {}).find(([u]) => pageKey2(u) === key);
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
  var import_homepage_default = {
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
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "").replace(/\.php$/i, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: { title: document2.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) }
      }, ...params.fragments];
    }
  };
  return __toCommonJS(import_homepage_exports);
})();
