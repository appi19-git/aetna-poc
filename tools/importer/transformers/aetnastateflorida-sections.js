/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Aetna State of Florida sections (shared by all templates).
 * Reads payload.template.sections ({ id, selector: string[], style }); selectors
 * tried in order. In catalog mode the import script rewrites matched selectors to
 * [data-excat-section="i"] before this runs.
 *
 * beforeTransform (late: runs after block discovery, before parsers): walk sections
 *   in reverse, insert <hr> before every non-first section; styled sections get a
 *   temporary data-excat-section-id on both the element and its <hr>. A styled
 *   first section gets a temporary marked <hr> (removed in afterTransform).
 * afterTransform: walk reverse, insert Section Metadata (style) after the surviving
 *   section element, or - when a block parser replaced it - at the end of the
 *   section (just before the next <hr>), then drop markers and the temporary <hr>.
 */
const MARKER = 'data-excat-section-id';
const FIRST = 'data-excat-first';

function findSectionElement(root, section) {
  const raw = section.selector;
  const selectors = Array.isArray(raw) ? raw : [raw];
  for (const sel of selectors) {
    if (!sel) continue;
    try {
      const el = root.querySelector(sel);
      if (el) return el;
    } catch (e) {
      // unsupported selector in this DOM implementation; try next
    }
  }
  return null;
}

function nextBreakAfter(node) {
  // Walk forward in document order (siblings, then ancestors' siblings) to the next <hr>
  let cur = node;
  while (cur) {
    let sib = cur.nextElementSibling;
    while (sib) {
      if (sib.tagName === 'HR') return sib;
      const inner = sib.querySelector && sib.querySelector('hr');
      if (inner) return inner;
      sib = sib.nextElementSibling;
    }
    cur = cur.parentElement;
  }
  return null;
}

export default function transform(hookName, element, payload) {
  const sections = (payload && payload.template && payload.template.sections) || [];
  if (sections.length < 2) return;
  const doc = element.ownerDocument || document;

  if (hookName === 'beforeTransform') {
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
        if (isFirst) hr.setAttribute(FIRST, 'true');
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
        // Section element replaced by its block parser: metadata closes this section
        const next = nextBreakAfter(hr);
        if (next) next.before(meta);
        else element.append(meta);
      }

      if (hr) {
        if (hr.getAttribute(FIRST) === 'true') hr.remove();
        else hr.removeAttribute(MARKER);
      }
    }
    element.querySelectorAll(`[${MARKER}]`).forEach((el) => el.removeAttribute(MARKER));
    element.querySelectorAll(`hr[${FIRST}]`).forEach((el) => el.remove());
  }
}
