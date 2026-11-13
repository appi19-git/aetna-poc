/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero (hero-card).
 * Source: https://www.trinetaetna.com/home
 * Selector: main div.container:has(> div > .hero-card)
 * Output: row 1 = image, row 2 = H1 + H2 subheading + body paragraph.
 */
export default function parse(element, { document }) {
  const cells = [];

  // Row 1: hero image. Alt comes from img alt, then img/wrapper title, then fallback.
  const lastFromSrcset = (srcset) => (srcset || '')
    .split(',').map((s) => s.trim().split(/\s+/)[0]).filter(Boolean).pop() || '';
  const bgUrl = (el) => {
    const style = (el.getAttribute('style') || '')
      + ((typeof window !== 'undefined' && window.getComputedStyle && el.ownerDocument === window.document)
        ? `;${window.getComputedStyle(el).backgroundImage}` : '');
    const m = style.match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
    return m ? m[1] : '';
  };

  // Media wrapper = first child div that is not the card holder
  const media = [...element.children].find((c) => !c.querySelector('.hero-card')) || element;
  const srcImg = media.querySelector('img') || element.querySelector('img:not(.hero-card img)');
  let src = '';
  if (srcImg) {
    src = srcImg.getAttribute('src') || '';
    if (!src || src.startsWith('data:')) {
      src = srcImg.getAttribute('data-src') || lastFromSrcset(srcImg.getAttribute('srcset')) || src;
    }
  }
  if (!src) {
    const source = media.querySelector('picture source[srcset]');
    if (source) src = lastFromSrcset(source.getAttribute('srcset'));
  }
  if (!src) {
    const bgEl = [media, ...media.querySelectorAll('*')].find((el) => bgUrl(el));
    if (bgEl) src = bgUrl(bgEl);
  }

  if (src) {
    // Unwrap Next.js optimizer URLs (/_next/image?url=...) to the original asset
    try {
      const u = new URL(src, 'https://www.trinetaetna.com');
      const inner = u.pathname.startsWith('/_next/image') && u.searchParams.get('url');
      src = inner ? new URL(inner, 'https://www.trinetaetna.com').href : u.href;
    } catch (e) { /* keep src as-is */ }
    const img = document.createElement('img');
    img.src = src;
    const wrapperTitle = (srcImg && srcImg.parentElement && srcImg.parentElement.getAttribute('title'))
      || media.getAttribute('title');
    img.alt = ((srcImg && srcImg.getAttribute('alt')) || '').trim()
      || ((srcImg && srcImg.getAttribute('title')) || '').trim()
      || (wrapperTitle || '').trim()
      || 'Women commuting together';
    cells.push([img]);
  } else {
    cells.push(['']);
  }

  // Row 2: text content from the hero card
  const card = element.querySelector('.hero-card') || element;
  const contentCell = [];

  const srcH1 = card.querySelector('h1');
  if (srcH1) {
    const h1 = document.createElement('h1');
    h1.textContent = srcH1.textContent.trim();
    contentCell.push(h1);
  }

  // Source uses an H3 subheading directly under the H1; convert to H2 for heading order
  const srcSub = card.querySelector('h2, h3');
  if (srcSub) {
    const h2 = document.createElement('h2');
    h2.textContent = srcSub.textContent.trim();
    contentCell.push(h2);
  }

  card.querySelectorAll('p').forEach((srcP) => {
    if (!srcP.textContent.trim()) return;
    const p = document.createElement('p');
    p.innerHTML = srcP.innerHTML.trim();
    contentCell.push(p);
  });

  cells.push([contentCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'Hero (hero-card)', cells });
  element.replaceWith(block);
}
