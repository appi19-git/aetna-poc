/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: TriNet Aetna cleanup.
 * Removes non-authorable chrome (global header, footer, scripts, tracking, etc.).
 *
 * NOTE: inline SVG data-URI <img> elements are intentionally preserved — the
 * cards-icon parser relies on the icons inside div.bg-gray-100 cards.
 */
export default function transform(hookName, element, payload) {
  if (hookName === 'beforeTransform') {
    // Global header (top bar before <main>) and footer
    WebImporter.DOMUtils.remove(element, [
      'div.min-h-screen.flex > div:nth-child(1)',
      '#page-header',
      '#page-footer',
    ]);

    // Next.js route announcer, overlays, and non-content embeds
    WebImporter.DOMUtils.remove(element, [
      'next-route-announcer',
      '#__next-route-announcer__',
      'iframe',
      'dialog',
      '[role="dialog"]',
      '[id*="cookie" i]',
      '[class*="cookie" i]',
      '#onetrust-consent-sdk',
    ]);

    // Section titles are authored as large bold <p> directly inside a <section>
    // (e.g. "Benefits and coverage"); promote them to <h2> for a valid heading outline.
    element.querySelectorAll('section > p.text-3xl.font-bold').forEach((p) => {
      const h2 = element.ownerDocument.createElement('h2');
      h2.innerHTML = p.innerHTML;
      p.replaceWith(h2);
    });
  }

  if (hookName === 'afterTransform') {
    // Remaining non-authorable elements
    WebImporter.DOMUtils.remove(element, [
      'header',
      'footer',
      'nav',
      'script',
      'style',
      'noscript',
      'link',
      'iframe',
      'source',
      'object',
      'embed',
    ]);

    // Strip tracking / framework attributes (keep data-excat-* used by sections transformer)
    element.querySelectorAll('*').forEach((el) => {
      [...el.attributes].forEach(({ name }) => {
        if (
          name.startsWith('on')
          || name === 'data-tina-field'
          || name.startsWith('data-analytics')
          || name.startsWith('data-track')
          || name.startsWith('data-gtm')
        ) {
          el.removeAttribute(name);
        }
      });
    });
  }
}
