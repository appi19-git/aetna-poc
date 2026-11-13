/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns (base Columns).
 * Source: https://www.aetnastateflorida.com/contact-us.php
 * Selector: div.content-panel:has(> .cell + .cell)
 * Output: 1 row, one cell per direct .cell child, content moved verbatim in order.
 *  - div.utility-simple-rule -> <hr>
 *  - other layout divs are unwrapped
 *  - loose inline runs (spans, text, img, links) become paragraphs; <br> between
 *    top-level inline nodes splits paragraphs, <br> inside a span is kept
 *  - large styled spans (font-size >= 1.2em) are wrapped in <strong>
 */
const BLOCK_TAGS = new Set([
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'table', 'blockquote', 'pre', 'hr', 'dl', 'figure',
]);

function isEmphasisSpan(node) {
  const style = (node.getAttribute && node.getAttribute('style')) || '';
  const m = /font-size\s*:\s*([\d.]+)\s*(em|rem)/i.exec(style);
  return !!(m && parseFloat(m[1]) >= 1.2);
}

function buildCell(cellEl, document) {
  const out = [];
  let para = null;
  let pendingBreaks = 0;

  const flush = () => {
    if (para) {
      // trim leading/trailing whitespace text and stray <br>
      while (para.firstChild && ((para.firstChild.nodeType === 3 && !para.firstChild.textContent.trim())
        || (para.firstChild.nodeName === 'BR'))) para.firstChild.remove();
      while (para.lastChild && ((para.lastChild.nodeType === 3 && !para.lastChild.textContent.trim())
        || (para.lastChild.nodeName === 'BR'))) para.lastChild.remove();
      if (para.firstChild && para.firstChild.nodeType === 3) {
        para.firstChild.textContent = para.firstChild.textContent.replace(/^\s+/, '');
      }
      if (para.lastChild && para.lastChild.nodeType === 3) {
        para.lastChild.textContent = para.lastChild.textContent.replace(/\s+$/, '');
      }
      if (para.childNodes.length) out.push(para);
    }
    para = null;
    pendingBreaks = 0;
  };

  const addInline = (node) => {
    if (!para) para = document.createElement('p');
    para.append(node);
  };

  const walk = (container) => {
    [...container.childNodes].forEach((node) => {
      if (node.nodeType === 3) {
        if (!node.textContent.trim()) {
          if (para) para.append(node);
          return;
        }
        if (pendingBreaks && para) { /* text continues after a single br */ }
        addInline(node);
        pendingBreaks = 0;
        return;
      }
      if (node.nodeType !== 1) return;
      const tag = node.tagName.toLowerCase();

      if (tag === 'div') {
        if (node.classList.contains('utility-simple-rule')) {
          flush();
          out.push(document.createElement('hr'));
          return;
        }
        // layout wrapper: unwrap
        flush();
        walk(node);
        flush();
        return;
      }

      if (BLOCK_TAGS.has(tag)) {
        flush();
        if (tag === 'p' && !node.textContent.trim() && !node.querySelector('img, picture')) return;
        out.push(node);
        return;
      }

      if (tag === 'br') {
        // a <br> between top-level inline items separates paragraphs
        pendingBreaks += 1;
        if (para) flush();
        return;
      }

      if (tag === 'img' || tag === 'picture') {
        flush();
        const p = document.createElement('p');
        p.append(node);
        out.push(p);
        return;
      }

      if (tag === 'span') {
        flush();
        const p = document.createElement('p');
        const target = isEmphasisSpan(node) ? document.createElement('strong') : p;
        [...node.childNodes].forEach((c) => target.append(c));
        if (target !== p) p.append(target);
        para = p;
        flush();
        return;
      }

      // other inline content (a, strong, em, i, b, sup, ...) stays in the running paragraph
      addInline(node);
      pendingBreaks = 0;
    });
  };

  walk(cellEl);
  flush();
  return out;
}

export default function parse(element, { document }) {
  let columns = [...element.children].filter((c) => c.classList.contains('cell'));
  if (columns.length < 2) {
    columns = [...element.children].filter((c) => c.textContent.trim() || c.querySelector('img'));
  }

  const row = columns.map((col) => {
    const content = buildCell(col, document);
    return content.length ? content : '';
  });
  while (row.length < 2) row.push('');

  const cells = [row];
  const block = WebImporter.Blocks.createBlock(document, { name: 'Columns', cells });
  element.replaceWith(block);
}
