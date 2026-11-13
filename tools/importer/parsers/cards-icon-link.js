/* eslint-disable */
/* global WebImporter */
// cards-icon-link parser

/**
 * Parser for cards (cards-icon-link).
 * Source: https://www.aetnastateflorida.com/
 * Selector: div.homepage-threeiconlinks
 * Output: one row per .cell -> [icon image, H3 linked title + description].
 */
export default function parse(element, { document }) {
  const BASE = 'https://www.aetnastateflorida.com/';
  const clean = (t) => (t || '').replace(/\s+/g, ' ').trim();
  const absolute = (href) => {
    try { return new URL(href, BASE).href; } catch (e) { return href; }
  };

  const cells = [];
  element.querySelectorAll(':scope > .cell').forEach((item) => {
    const link = item.querySelector('a[href]');
    const href = link ? absolute(link.getAttribute('href')) : '';

    const imageCell = [];
    const srcImg = item.querySelector('img');
    if (srcImg) {
      const img = document.createElement('img');
      img.src = srcImg.getAttribute('src');
      img.alt = srcImg.getAttribute('alt') || '';
      imageCell.push(img);
    }

    const bodyCell = [];
    const heading = item.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading && clean(heading.textContent)) {
      const h3 = document.createElement('h3');
      const text = clean(heading.textContent);
      if (href) {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = text;
        h3.append(a);
      } else {
        h3.textContent = text;
      }
      bodyCell.push(h3);
    }
    const desc = item.querySelector('p');
    if (desc && clean(desc.textContent)) {
      const p = document.createElement('p');
      p.textContent = clean(desc.textContent);
      bodyCell.push(p);
    }

    if (!imageCell.length && !bodyCell.length) return;
    cells.push([imageCell.length ? imageCell : '', bodyCell.length ? bodyCell : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards (cards-icon-link)', cells });
  element.replaceWith(block);
}
