/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards (cards-icon).
 * Source: https://www.trinetaetna.com/home
 * Selector: main section > div.container.flex-wrap:has(> div.bg-gray-100)
 * Output: one row per card -> [icon image cell, body cell (H3 title + Learn more button)].
 */
export default function parse(element, { document }) {
  // Derive alt text from the inline SVG <title> when the img has none
  function iconAlt(srcImg) {
    const alt = (srcImg.getAttribute('alt') || '').trim();
    if (alt) return alt;
    const src = srcImg.getAttribute('src') || '';
    const m = src.match(/^data:image\/svg\+xml;base64,(.+)$/);
    if (m) {
      try {
        const svg = atob(m[1]);
        const t = svg.match(/<title>([^<]+)<\/title>/i);
        if (t) return t[1].trim();
      } catch (e) { /* ignore */ }
    }
    return '';
  }

  const cards = element.querySelectorAll(':scope > div.bg-gray-100');
  const cells = [];

  cards.forEach((card) => {
    // Image cell: keep the inline SVG data-URI img
    const imageCell = [];
    const srcImg = card.querySelector('img');
    const srcSvg = !srcImg && card.querySelector('svg');
    if (srcSvg) {
      // Live DOM renders the icon as inline <svg>; convert to a data-URI img so it survives import
      const svgClone = srcSvg.cloneNode(true);
      if (!svgClone.getAttribute('xmlns')) svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      const titleEl = svgClone.querySelector('title');
      const markup = svgClone.outerHTML;
      const img = document.createElement('img');
      img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(markup)))}`;
      img.alt = titleEl ? titleEl.textContent.trim() : '';
      imageCell.push(img);
    } else if (srcImg) {
      const img = document.createElement('img');
      img.src = srcImg.getAttribute('src');
      img.alt = iconAlt(srcImg);
      imageCell.push(img);
    }

    // Body cell: H3 title (source p.title-font) + Learn more button
    const bodyCell = [];
    const title = card.querySelector('.title-font, h2, h3, h4');
    if (title && title.textContent.trim()) {
      const h3 = document.createElement('h3');
      h3.textContent = title.textContent.trim();
      bodyCell.push(h3);
    }

    const rich = card.querySelector('.rich-text-markdown');
    if (rich) {
      rich.querySelectorAll(':scope > p').forEach((srcP) => {
        if (!srcP.textContent.trim() || srcP.querySelector('a')) return;
        const p = document.createElement('p');
        p.textContent = srcP.textContent.trim();
        bodyCell.push(p);
      });
    }

    card.querySelectorAll('a[href]').forEach((srcA) => {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      const a = document.createElement('a');
      a.href = srcA.getAttribute('href');
      a.textContent = srcA.textContent.trim();
      strong.append(a);
      p.append(strong);
      bodyCell.push(p);
    });

    cells.push([imageCell.length ? imageCell : '', bodyCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards (cards-icon)', cells });
  element.replaceWith(block);
}
