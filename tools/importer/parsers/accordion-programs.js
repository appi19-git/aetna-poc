/* eslint-disable */
/* global WebImporter */

/**
 * Parser for accordion-programs (custom accordion).
 * Sources: https://www.aetnastateflorida.com/extras.php, /well-being-library.php, /tools.php
 * Selector: dl.pcaccordion
 * Source item: <dt><button.pcaccordion-trigger><p.pcaccordion-title>TITLE</p><span.pcaccordion-icon/></button></dt>
 *              <dd.pcaccordion-panel hidden><div>...content...</div></dd>
 * Output: one row per dt/dd pair -> [title, body]
 *  - title: the trimmed title text (inline <sup> etc. kept, e.g. Teladoc<sup>®</sup>); button/icon chrome dropped
 *  - body: the dd content moved verbatim; layout <div>s (grids/cells) are unwrapped,
 *    loose inline runs are wrapped in <p>; images keep src/alt; hrefs untouched
 *  - hidden panels are read regardless of visibility; commented-out items are ignored
 */
const BLOCK_TAGS = new Set([
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'table', 'blockquote', 'pre', 'hr', 'dl', 'figure',
]);

function trimEdges(el) {
  const isBlank = (n) => n && ((n.nodeType === 3 && !n.textContent.trim()) || n.nodeName === 'BR');
  while (isBlank(el.firstChild)) el.firstChild.remove();
  while (isBlank(el.lastChild)) el.lastChild.remove();
  if (el.firstChild && el.firstChild.nodeType === 3) {
    el.firstChild.textContent = el.firstChild.textContent.replace(/^\s+/, '');
  }
  if (el.lastChild && el.lastChild.nodeType === 3) {
    el.lastChild.textContent = el.lastChild.textContent.replace(/\s+$/, '');
  }
}

function buildTitle(dt, document) {
  const titleEl = dt.querySelector('.pcaccordion-title')
    || dt.querySelector('button')
    || dt;
  const p = document.createElement('p');
  [...titleEl.childNodes].forEach((n) => {
    if (n.nodeType === 8) return;
    if (n.nodeType === 1 && n.classList.contains('pcaccordion-icon')) return;
    p.append(n);
  });
  // collapse source indentation whitespace inside text nodes
  [...p.childNodes].forEach((n) => {
    if (n.nodeType === 3) n.textContent = n.textContent.replace(/\s+/g, ' ');
  });
  trimEdges(p);
  return p.childNodes.length ? p : '';
}

function buildBody(dd, document) {
  const out = [];
  let para = null;

  const flush = () => {
    if (para) {
      trimEdges(para);
      if (para.childNodes.length) out.push(para);
    }
    para = null;
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
        addInline(node);
        return;
      }
      if (node.nodeType !== 1) return; // drop comments
      const tag = node.tagName.toLowerCase();

      if (tag === 'button' || tag === 'script' || tag === 'style') return;

      if (['div', 'section', 'article'].includes(tag)
        || (tag === 'span' && node.querySelector('p, div, ul, ol, table, h1, h2, h3, h4, h5, h6'))) {
        // layout wrapper (grid-x / cell / plain div): unwrap
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

      if (tag === 'img' || tag === 'picture') {
        flush();
        const p = document.createElement('p');
        p.append(node);
        out.push(p);
        return;
      }

      // inline content (a, strong, em, b, i, sup, br, span, ...) stays in the running paragraph
      addInline(node);
    });
  };

  walk(dd);
  flush();
  return out.length ? out : '';
}

export default function parse(element, { document }) {
  const cells = [];
  const children = [...element.children];

  children.forEach((child, i) => {
    if (child.tagName !== 'DT') return;
    // pair with the next <dd> sibling (stop at the next <dt>)
    let dd = null;
    for (let j = i + 1; j < children.length; j += 1) {
      if (children[j].tagName === 'DT') break;
      if (children[j].tagName === 'DD') { dd = children[j]; break; }
    }
    const title = buildTitle(child, document);
    const body = dd ? buildBody(dd, document) : '';
    if (!title && !body) return;
    cells.push([title, body]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'Accordion-programs', cells });
  element.replaceWith(block);
}
