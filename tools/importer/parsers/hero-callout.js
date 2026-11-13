/* eslint-disable */
/* global WebImporter */
// hero-callout parser

/**
 * Parser for hero (hero-callout).
 * Source: https://www.aetnastateflorida.com/
 * Selector: div.textbar-callout-purple
 * Output: row 1 [phone icon image], row 2 [H3 callout with strong parts + TDD paragraph].
 */
export default function parse(element, { document }) {
  const clean = (t) => (t || '').replace(/\s+/g, ' ').trim();
  const cells = [];

  // Row 1: image
  const srcImg = element.querySelector('img');
  if (srcImg) {
    const img = document.createElement('img');
    img.src = srcImg.getAttribute('src');
    img.alt = srcImg.getAttribute('alt') || '';
    cells.push([img]);
  } else {
    cells.push(['']);
  }

  // Row 2: heading (nodes before <br>) + paragraph (nodes after <br>)
  const content = [];
  const srcH = element.querySelector('h1, h2, h3, h4, h5, h6');
  if (srcH) {
    const h3 = document.createElement('h3');
    const after = [];
    let pastBreak = false;
    [...srcH.childNodes].forEach((node) => {
      if (node.nodeType === 1 && node.tagName === 'BR') { pastBreak = true; return; }
      if (pastBreak) { after.push(node.textContent); return; }
      if (node.nodeType === 3) {
        h3.append(document.createTextNode(node.textContent.replace(/\s+/g, ' ')));
      } else if (node.nodeType === 1) {
        const text = clean(node.textContent);
        if (!text) return;
        if (node.tagName === 'SPAN' || node.tagName === 'STRONG' || node.tagName === 'B') {
          const strong = document.createElement('strong');
          strong.textContent = text;
          h3.append(strong);
        } else {
          h3.append(document.createTextNode(text));
        }
      }
    });
    // normalise leading/trailing whitespace
    if (h3.firstChild && h3.firstChild.nodeType === 3) h3.firstChild.textContent = h3.firstChild.textContent.replace(/^\s+/, '');
    if (h3.lastChild && h3.lastChild.nodeType === 3) h3.lastChild.textContent = h3.lastChild.textContent.replace(/\s+$/, '');
    if (clean(h3.textContent)) content.push(h3);
    const tdd = clean(after.join(' '));
    if (tdd) {
      const p = document.createElement('p');
      p.textContent = tdd;
      content.push(p);
    }
  }
  cells.push([content.length ? content : '']);

  const block = WebImporter.Blocks.createBlock(document, { name: 'Hero (hero-callout)', cells });
  element.replaceWith(block);
}
