/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Aetna State of Florida cleanup (catalog mode, shared by all templates:
 * homepage, content-page, detail-with-sidebar, two-column-page, accordion-page).
 *
 * beforeTransform (runs before block discovery, chrome still in place because
 * catalog selectors are nth-child paths captured with header/footer present):
 *  - replay payload.template.pageCleanup for the current page: each selector in
 *    order, removing the single element it matches (skip when 0 or >1 matches)
 *  - replay catalog cleanup.rules[] (site-wide, outside main) for pages not listed
 *    in the rule's page list (currently none)
 *  - remove HTML comments (retired content must not migrate)
 *
 * afterTransform (final cleanup, after parsers):
 *  - site chrome: header, footer.footer, skip link / #main anchor
 *  - slick carousel controls (.slick-arrow, .slick-dots, pause toggle, .slick-cloned)
 *  - .utility-simple-rule (never an <hr>), empty <p>&nbsp;</p> spacers
 *  - scripts/styles/noscript/link/iframe
 *  - resolve relative links/images to absolute https://www.aetnastateflorida.com/ URLs
 *    (local ./images/<hash> scraper paths kept as-is)
 * HTML comments are NOT touched in afterTransform (parser field hints).
 */
const BASE = 'https://www.aetnastateflorida.com/';

// Site-wide cleanup rules from migration-work/catalog-template.json cleanup.rules[]
// (shape: { selector, type?, pages?: string[] } - pages listed are exempt). Currently none.
const CATALOG_RULES = [];

function pageKey(u) {
  try {
    const { origin, pathname } = new URL(u);
    return `${origin}${pathname.replace(/\/$/, '')}`;
  } catch (e) {
    return (u || '').replace(/\/$/, '');
  }
}

function toSelector(entry) {
  if (!entry) return null;
  if (typeof entry === 'string') return entry;
  return entry.selector || null;
}

/** Resolve pageCleanup (array, or object keyed by page URL) to selector list for this page. */
function pageCleanupSelectors(pageCleanup, url) {
  if (!pageCleanup) return [];
  if (Array.isArray(pageCleanup)) return pageCleanup.map(toSelector).filter(Boolean);
  if (typeof pageCleanup === 'object') {
    const key = pageKey(url);
    const entry = Object.entries(pageCleanup).find(([u]) => pageKey(u) === key);
    if (!entry) return [];
    const list = Array.isArray(entry[1]) ? entry[1] : (entry[1] && entry[1].selectors) || [];
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
      // unsupported selector; skip
    }
  });
}

function removeComments(root) {
  const doc = root.ownerDocument || document;
  const walker = doc.createTreeWalker(root, 128 /* NodeFilter.SHOW_COMMENT */);
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

// Same-site .php pages are migrated to clean paths (/hmo.php -> /hmo, /index.php -> /);
// downloads (PDFs) and other sites keep their absolute URLs.
function toMigratedPath(href) {
  try {
    const u = new URL(href, BASE);
    if (u.hostname !== new URL(BASE).hostname || !/\.php$/i.test(u.pathname)) return href;
    const clean = u.pathname.replace(/\.php$/i, '').replace(/\/index$/i, '/');
    return `${clean || '/'}${u.search}${u.hash}`;
  } catch (e) {
    return href;
  }
}

function resolveUrls(root) {
  root.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    if (isRelative(href)) a.setAttribute('href', resolve(href));
    a.setAttribute('href', toMigratedPath(a.getAttribute('href')));
  });
  root.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    // Keep locally cached scrape assets (./images/<hash>.ext)
    if (/^\.\/images\//i.test(src)) return;
    if (isRelative(src)) img.setAttribute('src', resolve(src));
  });
}

function isNbspSpacer(p) {
  if (p.children.length > 0) return false;
  return (p.textContent || '').replace(/ /g, '').trim() === '';
}

export default function transform(hookName, element, payload) {
  if (hookName === 'beforeTransform') {
    const doc = element.ownerDocument || document;
    const url = (payload && payload.params && payload.params.originalURL)
      || (payload && payload.url) || '';
    const template = (payload && payload.template) || {};

    // 1. Per-page catalog cleanup, in order, unique matches only
    pageCleanupSelectors(template.pageCleanup, url).forEach((sel) => removeUnique(doc, sel));

    // 2. Site-wide catalog rules outside main, unless this page is listed
    const key = pageKey(url);
    CATALOG_RULES.forEach((rule) => {
      const sel = toSelector(rule);
      if (!sel) return;
      const listed = (rule.pages || []).some((u) => pageKey(u) === key);
      if (listed) return;
      try {
        doc.querySelectorAll(sel).forEach((el) => {
          if (!el.closest('main')) el.remove();
        });
      } catch (e) {
        // unsupported selector; skip
      }
    });

    // 3. Retired content lives in HTML comments
    removeComments(element);
  }

  if (hookName === 'afterTransform') {
    removeAll(element, [
      'header',
      'footer.footer',
      'a.skip-main',
      'a[href="#main"]',
      // slick carousel chrome
      '.slick-cloned',
      '.slick-dots',
      '.slick-arrow',
      '.play-pause-toggle',
      // thin grey rule (must not become an <hr>)
      '.utility-simple-rule',
      'script',
      'style',
      'noscript',
      'link',
      'iframe',
    ]);

    // Source CTA buttons (a.button, e.g. brand-button-purple) in default content:
    // author them as bold links so EDS decorates them as primary buttons.
    element.querySelectorAll('a.button').forEach((a) => {
      if (a.closest('strong, b, table')) return;
      const doc = element.ownerDocument;
      const strong = doc.createElement('strong');
      a.replaceWith(strong);
      strong.append(a);
      // a bare CTA in a layout div needs its own paragraph to become a button
      if (!strong.closest('p, li, td, th')) {
        const p = doc.createElement('p');
        strong.replaceWith(p);
        p.append(strong);
      }
    });

    // Bold label spans (content-panel-body__bold) are semantic bold text.
    element.querySelectorAll('span.content-panel-body__bold').forEach((span) => {
      const strong = element.ownerDocument.createElement('strong');
      strong.append(...span.childNodes);
      span.replaceWith(strong);
    });

    // Plan highlight bodies mix block elements with loose inline runs
    // (e.g. "<strong>Prescription Drugs</strong> (administered by Optum Rx®) <br>Retail …"):
    // wrap each loose run in a paragraph so no text is lost or merged.
    const BLOCK_TAGS = ['P', 'UL', 'OL', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'TABLE', 'HR', 'DL', 'BLOCKQUOTE'];
    element.querySelectorAll('.content-panel--planhighlights__body').forEach((body) => {
      let run = [];
      const flush = (before) => {
        const meaningful = run.some((n) => (n.nodeType === 3 ? n.textContent.trim() : n.nodeName !== 'BR'));
        if (meaningful) {
          const p = element.ownerDocument.createElement('p');
          body.insertBefore(p, before);
          run.forEach((n) => p.append(n));
          while (p.lastChild && (p.lastChild.nodeName === 'BR' || (p.lastChild.nodeType === 3 && !p.lastChild.textContent.trim()))) p.lastChild.remove();
        } else {
          run.forEach((n) => n.remove());
        }
        run = [];
      };
      [...body.childNodes].forEach((node) => {
        if (node.nodeType === 1 && BLOCK_TAGS.includes(node.nodeName)) flush(node);
        else if (node.nodeType === 1 || node.nodeType === 3) run.push(node);
      });
      flush(null);
    });

    // Grey tagline bars hold bare text in layout divs: author it as a paragraph.
    element.querySelectorAll('.textbar-grey').forEach((bar) => {
      if (bar.querySelector('p, h1, h2, h3, h4, h5, h6')) return;
      const text = bar.textContent.trim();
      if (!text) return;
      const p = element.ownerDocument.createElement('p');
      p.textContent = text;
      bar.replaceChildren(p);
    });

    // Empty #main anchor target
    const mainAnchor = element.querySelector('div#main');
    if (mainAnchor && !mainAnchor.children.length && !mainAnchor.textContent.trim()) mainAnchor.remove();

    // Empty <p>&nbsp;</p> spacers
    element.querySelectorAll('p').forEach((p) => {
      if (isNbspSpacer(p)) p.remove();
    });

    resolveUrls(element);

    element.querySelectorAll('[data-slick-index], [aria-hidden], [tabindex], [data-excat-block], [data-excat-section]').forEach((el) => {
      ['data-slick-index', 'aria-hidden', 'tabindex', 'data-excat-block', 'data-excat-section']
        .forEach((a) => el.removeAttribute(a));
    });
  }
}
