/* eslint-disable */
/* global WebImporter */
// carousel-hero parser

/**
 * Parser for carousel (carousel-hero).
 * Source: https://www.aetnastateflorida.com/
 * Selector: div.masthead-container section.masthead
 * Output: one row per real slide -> [background image, title heading + subtitle].
 */
export default function parse(element, { document }) {
  const clean = (t) => (t || '').replace(/\s+/g, ' ').trim();

  let slides = [...element.querySelectorAll('.masthead-item.slick-slide:not(.slick-cloned)')];
  if (!slides.length) slides = [...element.querySelectorAll('.masthead-item')];

  const cells = [];
  slides.forEach((slide) => {
    // Image cell: background image (img or CSS background-image)
    const imageCell = [];
    const bg = slide.querySelector('.masthead-background-container');
    const srcImg = (bg || slide).querySelector('img');
    if (srcImg && srcImg.getAttribute('src')) {
      const img = document.createElement('img');
      img.src = srcImg.getAttribute('src');
      img.alt = srcImg.getAttribute('alt') || '';
      imageCell.push(img);
    } else {
      const styled = [bg, ...(bg ? bg.querySelectorAll('[style]') : [])].find(
        (el) => el && /background-image\s*:\s*url\(/i.test(el.getAttribute('style') || ''),
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

    // Text cell: title heading (level preserved) + subtitle (tag preserved)
    const textCell = [];
    const title = slide.querySelector('.masthead-text .masthead-text-title');
    if (title && clean(title.textContent)) {
      const h = document.createElement(/^H[1-6]$/.test(title.tagName) ? title.tagName.toLowerCase() : 'h2');
      h.textContent = clean(title.textContent);
      textCell.push(h);
    }
    slide.querySelectorAll('.masthead-sub-content > .masthead-text-title-sub1, .masthead-sub-content > .masthead-text-title-sub2').forEach((sub) => {
      const text = clean(sub.textContent);
      if (!text) return;
      const tag = /^H[1-6]$/.test(sub.tagName) ? sub.tagName.toLowerCase() : 'p';
      const el = document.createElement(tag);
      el.textContent = text;
      textCell.push(el);
    });

    if (!imageCell.length && !textCell.length) return;
    cells.push([imageCell.length ? imageCell : '', textCell.length ? textCell : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'Carousel (carousel-hero)', cells });
  element.replaceWith(block);
}
