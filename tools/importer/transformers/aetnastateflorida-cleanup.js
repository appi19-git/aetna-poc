/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Aetna State of Florida cleanup.
 *
 * beforeTransform (affects block matching):
 *  - remove HTML comments (retired content: "Easy breezy", "Helping hands",
 *    old alert bars, webinar lists, commented utility rules)
 *  - remove global header, footer, skip link, empty #main anchor div
 *  - remove slick carousel chrome (arrows, dots, pause toggle, cloned slides)
 *  - remove .utility-simple-rule wrappers (must not become <hr>), &nbsp; spacer
 *    paragraphs, leading <br> spacers inside sections, and empty spacer divs
 *  - resolve relative links/images to absolute https://www.aetnastateflorida.com/ URLs
 *
 * afterTransform (final cleanup): scripts/styles/noscript/link/iframe leftovers.
 * HTML comments are NOT touched in afterTransform (field hints).
 */
const BASE = 'https://www.aetnastateflorida.com/';

function removeAll(root, selectors) {
  selectors.forEach((sel) => {
    root.querySelectorAll(sel).forEach((el) => el.remove());
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

function resolveUrls(root) {
  root.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    if (isRelative(href)) a.setAttribute('href', resolve(href));
  });
  root.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    // Skip locally cached scrape assets (./images/<md5>.ext) used by validation runs
    if (/^\.\/images\/[0-9a-f]{32}\.[a-z]+$/i.test(src)) return;
    if (isRelative(src)) img.setAttribute('src', resolve(src));
  });
}

function isEmptySpacer(el) {
  if (el.children.length > 0) return false;
  const text = (el.textContent || '').replace(/ /g, '').trim();
  return text === '';
}

export default function transform(hookName, element, payload) {
  if (hookName === 'beforeTransform') {
    removeComments(element);

    removeAll(element, [
      'header',
      'footer.footer',
      'footer',
      'a.skip-main',
      'a[href="#main"]',
      'div#main',
      // slick carousel chrome
      '.slick-cloned',
      '.slick-dots',
      '.slick-arrow',
      '.slick-prev',
      '.slick-next',
      '.play-pause-toggle',
      // thin grey rule inside rc5 (must not become an <hr>)
      '.utility-simple-rule',
      'script',
      'style',
      'noscript',
      'link',
      'iframe',
    ]);

    // Empty <p>&nbsp;</p> spacers
    element.querySelectorAll('p').forEach((p) => {
      if (isEmptySpacer(p) && !p.querySelector('img')) p.remove();
    });

    // Leading <br> spacers directly inside <section>
    element.querySelectorAll('section > br').forEach((br) => {
      const prev = br.previousElementSibling;
      if (!prev) br.remove();
    });

    // Empty spacer divs (reverse order so emptied parents cascade)
    const divs = Array.from(element.querySelectorAll('div')).reverse();
    divs.forEach((div) => {
      if (isEmptySpacer(div)) div.remove();
    });

    resolveUrls(element);
  }

  if (hookName === 'afterTransform') {
    removeAll(element, ['script', 'style', 'noscript', 'link', 'iframe']);
    element.querySelectorAll('[data-slick-index], [aria-hidden], [tabindex]').forEach((el) => {
      el.removeAttribute('data-slick-index');
      el.removeAttribute('aria-hidden');
      el.removeAttribute('tabindex');
    });
  }
}
