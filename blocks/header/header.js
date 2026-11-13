/**
 * Header block.
 * Reads all content from the nav fragment (content/nav.plain.html):
 *   section 1 = brand (logo link), section 2 = site title (heading + tagline),
 *   section 3 = navigation links (list).
 * Builds the layout, the mobile "Menu" toggle bar and the current-page state.
 */

const DESKTOP_MQ = window.matchMedia('(width >= 600px)');

async function fetchNavFragment() {
  // metadata-independent: /content first (local preview), then root (DA/EDS)
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  const html = await resp.text();
  const tpl = document.createElement('div');
  tpl.innerHTML = html;
  return tpl;
}

function normalizePath(path) {
  return (path || '/').replace(/\/index$/, '/').replace(/\.html$/, '').replace(/\/$/, '') || '/';
}

function currentPath() {
  // local preview serves pages under /content
  return normalizePath(window.location.pathname.replace(/^\/content(?=\/)/, ''));
}

function decorateLinks(list) {
  const here = currentPath();
  list.querySelectorAll('a[href]').forEach((a) => {
    const url = new URL(a.getAttribute('href'), window.location.href);
    if (url.origin !== window.location.origin) {
      a.target = '_blank';
      a.rel = 'noopener';
    } else if (normalizePath(url.pathname) === here) {
      a.setAttribute('aria-current', 'page');
    }
  });
}

function setMenuOpen(nav, open) {
  nav.setAttribute('aria-expanded', open ? 'true' : 'false');
  const toggle = nav.querySelector('.nav-toggle button');
  if (toggle) {
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  }
}

function buildToggle(nav, label) {
  const bar = document.createElement('div');
  bar.className = 'nav-toggle';
  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-controls', 'nav-sections');
  const text = document.createElement('span');
  text.className = 'nav-toggle-label';
  text.textContent = label;
  const icon = document.createElement('span');
  icon.className = 'nav-toggle-icon';
  icon.setAttribute('aria-hidden', 'true');
  button.append(text, icon);
  button.addEventListener('click', () => {
    setMenuOpen(nav, nav.getAttribute('aria-expanded') !== 'true');
  });
  bar.append(button);
  return bar;
}

/**
 * loads and decorates the header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNavFragment();
  block.textContent = '';
  if (!fragment) return;

  const sections = [...fragment.children].filter((el) => el.tagName === 'DIV');
  const [brandSrc, titleSrc, linksSrc] = sections;

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main navigation');

  const top = document.createElement('div');
  top.className = 'nav-top';

  if (brandSrc) {
    const brand = document.createElement('div');
    brand.className = 'nav-brand';
    brand.append(...brandSrc.childNodes);
    top.append(brand);
  }

  if (titleSrc) {
    const title = document.createElement('div');
    title.className = 'nav-title';
    title.append(...titleSrc.childNodes);
    top.append(title);
  }

  nav.append(top);

  if (linksSrc) {
    // the link list itself becomes the nav sections (nav > ul > li > a)
    const sectionsEl = linksSrc.querySelector('ul') || document.createElement('ul');
    sectionsEl.classList.add('nav-sections');
    sectionsEl.id = 'nav-sections';
    decorateLinks(sectionsEl);
    // "Menu" label comes from the source's mobile title bar
    nav.append(buildToggle(nav, 'Menu'));
    nav.append(sectionsEl);
  }

  setMenuOpen(nav, false);

  // viewport resize: close the mobile menu when crossing breakpoints
  DESKTOP_MQ.addEventListener('change', () => setMenuOpen(nav, false));

  // close the mobile menu with Escape
  nav.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !DESKTOP_MQ.matches && nav.getAttribute('aria-expanded') === 'true') {
      setMenuOpen(nav, false);
      nav.querySelector('.nav-toggle button')?.focus();
    }
  });

  const wrapper = document.createElement('div');
  wrapper.className = 'nav-wrapper';
  wrapper.append(nav);
  block.append(wrapper);
}
