/*
 * Contact Callout block
 * Base: full-width band — optional icon, heading, text and an optional button
 *   (e.g. "Got a Question? Call ..." or "Find a PCP or doctor in the network" / "Visit DocFind »").
 * Option `downloads`: sidebar box — "Downloads" heading (download icon added in CSS),
 *   year subheadings and PDF link lists; links stay inline (no buttons).
 * Authored model: any number of rows/cells; a cell holding only an image is the icon,
 * everything else is content. Authored text is never changed.
 */

function isIconCell(cell) {
  if (!cell.querySelector('picture, img, .icon')) return false;
  const clone = cell.cloneNode(true);
  clone.querySelectorAll('picture, img, .icon').forEach((el) => el.remove());
  return clone.textContent.trim() === '';
}

function isPdfLink(a) {
  try {
    return /\.pdf$/i.test(new URL(a.href, window.location.href).pathname);
  } catch {
    return false;
  }
}

export default function decorate(block) {
  const isDownloads = block.classList.contains('downloads');

  const icon = document.createElement('div');
  icon.className = 'contact-callout-icon';
  const content = document.createElement('div');
  content.className = 'contact-callout-content';

  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      if (!isDownloads && !icon.childElementCount && isIconCell(cell)) {
        icon.append(...cell.childNodes);
      } else {
        content.append(...cell.childNodes);
      }
    });
  });

  // drop empty text nodes / paragraphs left by authoring
  content.querySelectorAll(':scope > p').forEach((p) => {
    if (!p.textContent.trim() && !p.querySelector('img, picture, a')) p.remove();
  });

  content.querySelectorAll('a[href]').forEach((a) => {
    if (isPdfLink(a)) a.classList.add('contact-callout-pdf');
  });

  if (isDownloads) {
    // first heading is the box title ("Downloads"); others are year subheadings
    const headings = content.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headings.length) headings[0].classList.add('contact-callout-title');
    [...headings].slice(1).forEach((h) => h.classList.add('contact-callout-subheading'));
    // keep PDF links inline: undo automatic button decoration
    content.querySelectorAll('a.button').forEach((a) => {
      a.classList.remove('button', 'primary', 'secondary');
      const wrapper = a.closest('.button-container, .button-wrapper');
      if (wrapper) wrapper.classList.remove('button-container', 'button-wrapper');
    });
  } else {
    const firstHeading = content.querySelector('h1, h2, h3, h4, h5, h6');
    if (firstHeading) firstHeading.classList.add('contact-callout-title');
    // a paragraph holding only a link is the band's call to action (white button)
    content.querySelectorAll('p').forEach((p) => {
      const links = p.querySelectorAll('a');
      if (links.length === 1 && p.textContent.trim() === links[0].textContent.trim()) {
        links[0].classList.add('button', 'accent');
        links[0].classList.remove('primary', 'secondary');
      }
    });
    content.querySelectorAll('a.button').forEach((a) => {
      const p = a.closest('p');
      if (p) p.classList.add('contact-callout-action');
    });
  }

  block.replaceChildren();
  if (icon.childElementCount) block.append(icon);
  else block.classList.add('no-icon');
  block.append(content);
}
