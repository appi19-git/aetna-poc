/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero (plain base Hero).
 * Source: https://www.aetnastateflorida.com/contact-us.php (shared by all inner pages:
 * contact-us, hmo, healthinvestor-hmo, tools, extras, well-being-library).
 * Selector: div[class*="subpage-feature"]
 * The photo is a CSS background-image on the root (stylesheet rule per
 * subpage-feature__<suffix> class), so it is read from computed style, with a
 * fallback derived from the class: /img/feature-<suffix>.jpg.
 * Output: row 1 = image, row 2 = H1 (+ optional H2 subtitle, + any paragraphs/links).
 */
const BASE = 'https://www.aetnastateflorida.com/';

function urlFromBg(value) {
  if (!value || value === 'none') return null;
  const m = /url\(\s*(['"]?)(.*?)\1\s*\)/i.exec(value);
  return m && m[2] ? m[2] : null;
}

function findBackgroundImage(root) {
  const doc = root.ownerDocument;
  const win = doc && doc.defaultView;
  const nodes = [root, ...root.querySelectorAll('*')];
  for (const node of nodes) {
    let url = null;
    try {
      if (win && win.getComputedStyle) url = urlFromBg(win.getComputedStyle(node).backgroundImage);
    } catch (e) {
      // computed style unavailable (non-browser DOM)
    }
    if (!url) url = urlFromBg(node.style && node.style.backgroundImage);
    if (!url) {
      const attr = node.getAttribute && node.getAttribute('style');
      if (attr) url = urlFromBg((/background(?:-image)?\s*:[^;]*/i.exec(attr) || [])[0]);
    }
    if (url) return url;
  }
  // Fallback: subpage-feature__<suffix> -> img/feature-<suffix>.jpg
  const cls = [...root.classList].find((c) => c.startsWith('subpage-feature__'));
  if (cls) return `${BASE}img/feature-${cls.slice('subpage-feature__'.length)}.jpg`;
  return null;
}

export default function parse(element, { document }) {
  const cells = [];

  // Row 1: background photo
  const src = findBackgroundImage(element);
  if (src) {
    let abs = src;
    try { abs = new URL(src, BASE).href; } catch (e) { /* keep as-is */ }
    const img = document.createElement('img');
    img.src = abs;
    img.alt = '';
    cells.push([img]);
  } else {
    cells.push(['']);
  }

  // Row 2: heading, subtitle and any other text content, verbatim and in order
  const text = [];
  element.querySelectorAll('h1, h2, h3, h4, h5, h6, p, ul, ol').forEach((node) => {
    if (node.parentElement && node.parentElement.closest('h1, h2, h3, h4, h5, h6, p, ul, ol')) return;
    if (!node.textContent.trim()) return;
    const tag = node.tagName.toLowerCase();
    const out = document.createElement(tag);
    out.innerHTML = node.innerHTML.trim();
    text.push(out);
  });
  element.querySelectorAll('a[href]').forEach((a) => {
    if (a.closest('h1, h2, h3, h4, h5, h6, p, ul, ol')) return;
    if (!a.textContent.trim()) return;
    const p = document.createElement('p');
    const link = document.createElement('a');
    link.href = a.getAttribute('href');
    link.textContent = a.textContent.trim();
    p.append(link);
    text.push(p);
  });
  cells.push([text.length ? text : '']);

  const block = WebImporter.Blocks.createBlock(document, { name: 'Hero', cells });
  element.replaceWith(block);
}
