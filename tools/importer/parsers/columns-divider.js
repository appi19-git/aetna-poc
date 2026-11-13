/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns (columns-divider).
 * Source: https://www.trinetaetna.com/home
 * Selector: main section > div.container.md\:flex-row
 * Output: 1 row x 2 cells. The decorative vertical divider div is skipped.
 * Tailwind wrappers are flattened into clean semantic HTML.
 */
export default function parse(element, { document }) {
  // Copy inline content (text, links, strong/em, br) without source classes/wrappers
  function copyInline(src, target) {
    src.childNodes.forEach((node) => {
      if (node.nodeType === 3) {
        target.append(document.createTextNode(node.textContent));
        return;
      }
      if (node.nodeType !== 1) return;
      const tag = node.tagName.toLowerCase();
      if (tag === 'a') {
        const a = document.createElement('a');
        a.href = node.getAttribute('href') || '';
        a.textContent = node.textContent.trim();
        target.append(a);
      } else if (['strong', 'b', 'em', 'i', 'code', 'sup', 'sub'].includes(tag)) {
        const el = document.createElement(tag === 'b' ? 'strong' : tag === 'i' ? 'em' : tag);
        copyInline(node, el);
        target.append(el);
      } else if (tag === 'br') {
        target.append(document.createElement('br'));
      } else if (tag === 'ul' || tag === 'ol') {
        // handled by caller (nested list)
      } else {
        // span/div wrappers: unwrap
        copyInline(node, target);
      }
    });
  }

  function buildList(srcList) {
    const list = document.createElement(srcList.tagName.toLowerCase());
    srcList.querySelectorAll(':scope > li').forEach((srcLi) => {
      const li = document.createElement('li');
      copyInline(srcLi, li);
      // normalise whitespace from the wrapper indentation
      li.normalize();
      li.childNodes.forEach((n) => {
        if (n.nodeType === 3) n.textContent = n.textContent.replace(/\s+/g, ' ');
      });
      if (li.firstChild && li.firstChild.nodeType === 3) li.firstChild.textContent = li.firstChild.textContent.replace(/^\s+/, '');
      if (li.lastChild && li.lastChild.nodeType === 3) li.lastChild.textContent = li.lastChild.textContent.replace(/\s+$/, '');
      const nested = srcLi.querySelector('ul, ol');
      if (nested) li.append(buildList(nested));
      list.append(li);
    });
    return list;
  }

  function buildColumn(col) {
    const out = [];
    const root = col.querySelector('.rich-text-markdown') || col;
    [...root.children].forEach((child) => {
      const tag = child.tagName.toLowerCase();
      if (/^h[1-6]$/.test(tag)) {
        const h = document.createElement(tag);
        h.textContent = child.textContent.trim();
        out.push(h);
      } else if (tag === 'p') {
        if (!child.textContent.trim()) return;
        const p = document.createElement('p');
        copyInline(child, p);
        p.innerHTML = p.innerHTML.trim();
        out.push(p);
      } else if (tag === 'ul' || tag === 'ol') {
        out.push(buildList(child));
      } else {
        // Button wrapper divs -> <p><strong><a></a></strong></p> (EDS primary button)
        const links = child.querySelectorAll('a[href]');
        if (links.length) {
          links.forEach((srcA) => {
            const p = document.createElement('p');
            const strong = document.createElement('strong');
            const a = document.createElement('a');
            a.href = srcA.getAttribute('href');
            a.textContent = srcA.textContent.trim();
            strong.append(a);
            p.append(strong);
            out.push(p);
          });
        } else if (child.textContent.trim()) {
          const p = document.createElement('p');
          copyInline(child, p);
          p.innerHTML = p.innerHTML.trim();
          out.push(p);
        }
      }
    });
    return out;
  }

  // Content columns only (the divider is an empty div without .flex-1)
  let columns = [...element.querySelectorAll(':scope > div.flex-1')];
  if (!columns.length) {
    columns = [...element.children].filter((c) => c.textContent.trim());
  }

  const row = columns.map((col) => buildColumn(col));
  while (row.length < 2) row.push('');

  const cells = [row];
  const block = WebImporter.Blocks.createBlock(document, { name: 'Columns (columns-divider)', cells });
  element.replaceWith(block);
}
