import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1
        && (div.querySelector('picture') || div.querySelector(':scope > p > img'))) {
        div.className = 'cards-card-image';
      } else {
        div.className = 'cards-card-body';
        const tag = div.querySelector(':scope > p:first-child');
        if (tag && !tag.querySelector('a, img')) tag.classList.add('tag-pill');
      }
    });
    // Wrap entire card in its link for full-surface clickability
    // (cards-icon keeps its authored "Learn more" button link instead)
    const link = li.querySelector('.cards-card-body a');
    if (link && !block.classList.contains('cards-icon')) {
      const wrapper = document.createElement('a');
      wrapper.href = link.href;
      wrapper.className = 'cards-card-link';
      while (li.firstChild) wrapper.append(li.firstChild);
      // Remove the original link from the heading to avoid nested <a>
      const innerLink = wrapper.querySelector('.cards-card-body a');
      if (innerLink) {
        const parent = innerLink.parentElement;
        while (innerLink.firstChild) parent.append(innerLink.firstChild);
        innerLink.remove();
      }
      li.append(wrapper);
    }
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    // Only optimize same-origin, non-SVG images; keep the authored picture otherwise
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.textContent = '';
  block.append(ul);
}
