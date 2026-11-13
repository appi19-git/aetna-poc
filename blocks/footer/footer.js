/**
 * Footer block.
 * Reads all content from the footer fragment (content/footer.plain.html) and
 * lays it out: each top-level fragment section becomes a footer row. Inside a
 * row, every list and every paragraph becomes a column cell.
 * Links that leave this site open in a new tab.
 */

async function fetchFooterFragment() {
  // metadata-independent: /content first (local preview), then root (DA/EDS)
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
  if (!resp.ok) return null;
  const tpl = document.createElement('div');
  tpl.innerHTML = await resp.text();
  return tpl;
}

function decorateExternalLinks(root) {
  root.querySelectorAll('a[href]').forEach((a) => {
    const url = new URL(a.getAttribute('href'), window.location.href);
    if (url.origin !== window.location.origin) {
      a.target = '_blank';
      a.rel = 'noopener';
    }
  });
}

function classifyCell(cell) {
  const links = [...cell.querySelectorAll('a')];
  const imageLinks = links.filter((a) => a.querySelector('img') && !a.textContent.trim());
  if (links.length > 1 && imageLinks.length === links.length) return 'footer-icons';
  if (cell.tagName === 'UL') return 'footer-links';
  return 'footer-text';
}

function buildRow(section, index) {
  const row = document.createElement('div');
  row.className = `footer-row footer-row-${index + 1}`;
  const cells = [...section.children];
  if (cells.length > 1) row.classList.add('footer-row-columns');
  cells.forEach((child) => {
    const cell = document.createElement('div');
    cell.className = `footer-cell ${classifyCell(child)}`;
    cell.append(child);
    row.append(cell);
  });
  return row;
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const fragment = await fetchFooterFragment();
  block.textContent = '';
  if (!fragment) return;

  const inner = document.createElement('div');
  inner.className = 'footer-inner';
  [...fragment.children]
    .filter((el) => el.tagName === 'DIV')
    .forEach((section, i) => inner.append(buildRow(section, i)));

  decorateExternalLinks(inner);
  block.append(inner);
}
