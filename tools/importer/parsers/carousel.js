/* eslint-disable */
/* global WebImporter */
// carousel parser

/**
 * Parser for carousel -> 'Carousel (carousel-hero)' (full-bleed photo carousel).
 * Source: https://www.aetnastateflorida.com/ (homepage masthead, slick slider)
 * Root may be:
 *  - div.masthead-container > section.masthead (generalized instance), or
 *  - div.slick-list inside it (catalog pageInstances path), or any wrapper of slides.
 * Output: one row per real slide (.masthead-item, .slick-cloned skipped):
 *   [image (src + alt)] [title heading (level kept) + subtitle(s) (tag kept)].
 * Text is copied verbatim (whitespace collapsed only).
 */
export default function parse(element, { document }) {
  const clean = (t) => (t || '').replace(/\s+/g, ' ').trim();
  const isHeading = (el) => /^H[1-6]$/.test(el.tagName);

  // Copy an element's inline content (text, strong/em/sup/links...) into a new tag.
  const inlineCopy = (src, tag) => {
    const el = document.createElement(tag);
    const clone = src.cloneNode(true);
    clone.querySelectorAll('img, picture, script, style, br').forEach((n) => n.remove());
    el.append(...clone.childNodes);
    // drop comment nodes, collapse whitespace in text nodes
    const walker = document.createTreeWalker(el, 4 | 128);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((n) => {
      if (n.nodeType === 8) n.remove();
      else n.textContent = n.textContent.replace(/\s+/g, ' ');
    });
    if (el.firstChild && el.firstChild.nodeType === 3) el.firstChild.textContent = el.firstChild.textContent.replace(/^\s+/, '');
    if (el.lastChild && el.lastChild.nodeType === 3) el.lastChild.textContent = el.lastChild.textContent.replace(/\s+$/, '');
    return el;
  };

  // Real slides only: skip slick clones (and anything inside a clone)
  const notCloned = (el) => !el.closest('.slick-cloned');
  let slides = [...element.querySelectorAll('.masthead-item')].filter(notCloned);
  if (!slides.length && element.matches && element.matches('.masthead-item')) slides = [element];
  if (!slides.length) {
    // Tolerant fallback for other slider shapes: slick slides or direct children with an image
    slides = [...element.querySelectorAll('.slick-slide')].filter(notCloned);
    if (!slides.length) {
      const track = element.querySelector('.slick-track') || element;
      slides = [...track.children].filter((c) => c.querySelector('img'));
    }
  }

  const cells = [];
  slides.forEach((slide) => {
    // Image cell
    const imageCell = [];
    const bg = slide.querySelector('.masthead-background-container') || slide;
    const srcImg = bg.querySelector('img[src]') || slide.querySelector('img[src]');
    if (srcImg) {
      const img = document.createElement('img');
      img.src = srcImg.getAttribute('src');
      img.alt = srcImg.getAttribute('alt') || '';
      imageCell.push(img);
    } else {
      const styled = [bg, ...bg.querySelectorAll('[style]')].find(
        (el) => /background-image\s*:\s*url\(/i.test(el.getAttribute('style') || ''),
      );
      if (styled) {
        const m = styled.getAttribute('style').match(/url\((['"]?)(.*?)\1\)/i);
        if (m) {
          const img = document.createElement('img');
          img.src = m[2];
          img.alt = '';
          imageCell.push(img);
        }
      }
    }

    // Text cell: title (heading level kept) + subtitle(s) (tag kept)
    const textCell = [];
    const textRoot = slide.querySelector('.masthead-text');
    if (textRoot) {
      const title = textRoot.querySelector('.masthead-text-title')
        || textRoot.querySelector('h1, h2, h3, h4, h5, h6');
      if (title && clean(title.textContent)) {
        textCell.push(inlineCopy(title, isHeading(title) ? title.tagName.toLowerCase() : 'h2'));
      }
      let subs = [...textRoot.querySelectorAll('.masthead-text-title-sub1, .masthead-text-title-sub2')];
      if (!subs.length) {
        subs = [...textRoot.querySelectorAll('h1, h2, h3, h4, h5, h6, p')]
          .filter((el) => el !== title && !el.contains(title) && !el.parentElement.closest('p, h1, h2, h3, h4, h5, h6'));
      }
      subs.forEach((sub) => {
        if (!clean(sub.textContent)) return;
        textCell.push(inlineCopy(sub, isHeading(sub) ? sub.tagName.toLowerCase() : 'p'));
      });
      // Optional call-to-action links inside the slide text
      textRoot.querySelectorAll('a[href]').forEach((a) => {
        if (subs.some((s) => s.contains(a)) || (title && title.contains(a))) return;
        if (!clean(a.textContent)) return;
        const p = document.createElement('p');
        const link = document.createElement('a');
        link.href = a.getAttribute('href');
        link.textContent = clean(a.textContent);
        p.append(link);
        textCell.push(p);
      });
    }

    if (!imageCell.length && !textCell.length) return;
    cells.push([imageCell.length ? imageCell : '', textCell.length ? textCell : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'Carousel (carousel-hero)', cells });
  element.replaceWith(block);
}
