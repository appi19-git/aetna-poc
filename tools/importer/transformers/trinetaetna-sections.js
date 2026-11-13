/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: TriNet Aetna sections.
 * Uses payload.template.sections. Section selectors are class/structure based
 * (e.g. section.bg-aetna_primary-600, section.bg-white) — no URL or index
 * assumptions — and sections not present on the page are simply skipped.
 *
 * beforeTransform: insert <hr> breaks (while parser targets still exist) and mark
 *   styled sections with a temporary data-excat-section-id.
 * afterTransform: insert Section Metadata blocks, remove markers and the
 *   temporary <hr> placed before a styled first section.
 */
const MARKER = 'data-excat-section-id';

function findSectionElement(root, section) {
  const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
  for (const sel of selectors) {
    if (!sel) continue;
    try {
      const el = root.querySelector(sel);
      if (el) return el;
    } catch (e) {
      // invalid selector in this DOM implementation; try next
    }
  }
  return null;
}

export default function transform(hookName, element, payload) {
  const sections = (payload && payload.template && payload.template.sections) || [];
  if (sections.length < 2) return;
  const doc = element.ownerDocument || document;

  if (hookName === 'beforeTransform') {
    // Resolve elements first, keeping only those found on the page (in template order)
    const found = sections
      .map((section) => ({ section, el: findSectionElement(element, section) }))
      .filter(({ el }) => el);

    for (let i = found.length - 1; i >= 0; i -= 1) {
      const { section, el } = found[i];
      const isFirst = i === 0;
      if (section.style) el.setAttribute(MARKER, section.id);
      if (!isFirst || section.style) {
        const hr = doc.createElement('hr');
        if (section.style) hr.setAttribute(MARKER, section.id);
        if (isFirst) hr.setAttribute('data-excat-first', 'true');
        el.before(hr);
      }
    }
  }

  if (hookName === 'afterTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;
      const sectionEl = element.querySelector(`:not(hr)[${MARKER}="${section.id}"]`);
      const hr = element.querySelector(`hr[${MARKER}="${section.id}"]`);
      if (!sectionEl && !hr) continue;

      const meta = WebImporter.Blocks.createBlock(doc, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });

      if (sectionEl) {
        sectionEl.after(meta);
      } else {
        // Section element was replaced; place metadata before the next section break
        let next = hr.nextElementSibling;
        while (next && next.tagName !== 'HR') next = next.nextElementSibling;
        if (next) next.before(meta);
        else hr.parentElement.append(meta);
      }

      if (sectionEl) sectionEl.removeAttribute(MARKER);
      if (hr) {
        if (hr.getAttribute('data-excat-first') === 'true') hr.remove();
        else hr.removeAttribute(MARKER);
      }
    }
    // Safety: clear any leftover markers
    element.querySelectorAll(`[${MARKER}]`).forEach((el) => el.removeAttribute(MARKER));
    element.querySelectorAll('hr[data-excat-first]').forEach((el) => el.remove());
  }
}
