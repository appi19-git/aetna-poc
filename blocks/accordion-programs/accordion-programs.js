/*
 * Accordion Programs block
 * Expandable program rows built on native <details>/<summary> (keyboard accessible).
 * Authored model: one row per item — cell 1 = title, cell 2 = body (text, links, PDF lists).
 * A body holding only a link to a /fragments/ page is replaced by that fragment's content.
 */

const FRAGMENT_PATH = /\/fragments\//;

async function loadBodyFragment(body) {
  const links = body.querySelectorAll('a[href]');
  if (links.length !== 1 || body.textContent.trim() !== links[0].textContent.trim()) return;
  const url = new URL(links[0].href, window.location.href);
  if (url.origin !== window.location.origin || !FRAGMENT_PATH.test(url.pathname)) return;
  try {
    const { loadFragment } = await import('../fragment/fragment.js');
    const fragment = await loadFragment(url.pathname);
    if (fragment) body.replaceChildren(...fragment.childNodes);
  } catch (e) {
    // fragment block unavailable — keep the authored link
  }
}

export default function decorate(block) {
  let index = 0;
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (!cells.length) return;

    let labelNodes;
    let body;
    if (cells.length > 1) {
      labelNodes = [...cells[0].childNodes];
      [, body] = cells;
    } else {
      // single-cell row: first element is the title, the rest is the body
      const [cell] = cells;
      const first = cell.firstElementChild;
      labelNodes = first ? [...first.childNodes] : [...cell.childNodes];
      if (first) first.remove();
      body = cell;
    }

    index += 1;
    const summary = document.createElement('summary');
    summary.className = 'accordion-programs-item-label';
    const title = document.createElement('span');
    title.className = 'accordion-programs-item-title';
    // unwrap a single paragraph/heading so the summary holds inline content
    if (labelNodes.length === 1 && labelNodes[0].nodeType === Node.ELEMENT_NODE
      && /^(P|H[1-6])$/.test(labelNodes[0].tagName)) {
      title.append(...labelNodes[0].childNodes);
    } else {
      title.append(...labelNodes);
    }
    const icon = document.createElement('span');
    icon.className = 'accordion-programs-item-icon';
    icon.setAttribute('aria-hidden', 'true');
    summary.append(icon, title);

    body.className = 'accordion-programs-item-body';
    body.id = body.id || `accordion-programs-body-${index}`;

    const details = document.createElement('details');
    details.className = 'accordion-programs-item';
    details.append(summary, body);
    row.replaceWith(details);

    loadBodyFragment(body);
  });
}
