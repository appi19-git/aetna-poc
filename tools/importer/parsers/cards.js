/* eslint-disable */
/* global WebImporter */
// cards parser

/**
 * Parser for cards.
 * Source: https://www.aetnastateflorida.com/ (homepage three icon links)
 * Root may be:
 *  - div.homepage-threeiconlinks (generalized instance), or
 *  - the enclosing <section> (catalog pageInstances path), or another card grid on later templates.
 * Output:
 *  - 'Cards (cards-icon-link)' when items are icon + linked title items:
 *      [icon img (src + alt)] [H3 > a (title text incl. "»") + description p]
 *  - plain 'Cards' for any other card shape: [image or ''] [heading + text + links].
 * Hrefs are left as found (cleanup transformer resolves relative URLs afterwards).
 */
export default function parse(element, { document }) {
  const clean = (t) => (t || '').replace(/\s+/g, ' ').trim();
  const HEADINGS = 'h1, h2, h3, h4, h5, h6';

  // Locate the grid container holding the items
  const container = (element.matches && element.matches('.homepage-threeiconlinks'))
    ? element
    : element.querySelector('.homepage-threeiconlinks')
      || element.querySelector('.grid-x')
      || element;

  let items = [...container.querySelectorAll(':scope > .cell')];
  if (!items.length) items = [...container.children];
  items = items.filter((item) => clean(item.textContent) || item.querySelector('img'));

  const makeImg = (srcImg) => {
    const img = document.createElement('img');
    img.src = srcImg.getAttribute('src');
    img.alt = srcImg.getAttribute('alt') || '';
    return img;
  };

  const isIconLink = items.length > 0 && items.every((item) => item.querySelector('img[src]')
    && item.querySelector(HEADINGS)
    && item.querySelector('a[href]'));

  const cells = [];
  items.forEach((item) => {
    const imageCell = [];
    const srcImg = item.querySelector('img[src]');
    if (srcImg) imageCell.push(makeImg(srcImg));

    const bodyCell = [];
    const heading = item.querySelector(HEADINGS);
    const link = (heading && heading.closest('a[href]'))
      || (heading && heading.querySelector('a[href]'))
      || item.querySelector('a[href]');
    const href = link ? link.getAttribute('href') : '';

    if (heading && clean(heading.textContent)) {
      const h = document.createElement(isIconLink ? 'h3' : heading.tagName.toLowerCase());
      const text = clean(heading.textContent);
      if (href) {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = text;
        h.append(a);
      } else {
        h.textContent = text;
      }
      bodyCell.push(h);
    }

    item.querySelectorAll('p').forEach((p) => {
      const text = clean(p.textContent);
      if (!text) return;
      const out = document.createElement('p');
      // Keep separate links inside the description (not the overlay link wrapping the whole card)
      const innerLinks = [...p.querySelectorAll('a[href]')];
      if (innerLinks.length && !isIconLink) {
        const clone = p.cloneNode(true);
        clone.querySelectorAll('img').forEach((n) => n.remove());
        out.append(...clone.childNodes);
      } else {
        out.textContent = text;
      }
      bodyCell.push(out);
    });

    // Standalone CTA links not already captured (generic cards only)
    if (!isIconLink) {
      item.querySelectorAll('a[href]').forEach((a) => {
        if (a === link || a.closest('p') || a.querySelector(HEADINGS) || !clean(a.textContent)) return;
        const p = document.createElement('p');
        const cta = document.createElement('a');
        cta.href = a.getAttribute('href');
        cta.textContent = clean(a.textContent);
        p.append(cta);
        bodyCell.push(p);
      });
    }

    if (!imageCell.length && !bodyCell.length) return;
    cells.push([imageCell.length ? imageCell : '', bodyCell.length ? bodyCell : '']);
  });

  const name = isIconLink ? 'Cards (cards-icon-link)' : 'Cards';
  const block = WebImporter.Blocks.createBlock(document, { name, cells });
  element.replaceWith(block);
}
