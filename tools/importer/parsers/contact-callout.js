/* eslint-disable */
/* global WebImporter */
// contact-callout parser

/**
 * Parser for contact-callout (custom block blocks/contact-callout).
 * Source: https://www.aetnastateflorida.com/ (purple phone band), plan pages (DocFind band,
 * grey "Downloads" sidebar box).
 * Root may be div.textbar-callout-purple, a wrapper containing it, or a downloads box
 * (e.g. div.content-panel-quicklinks).
 *
 * Base ('Contact-callout'):
 *   row 1: [icon image (src + alt verbatim)]
 *   row 2: [heading (bold spans -> <strong>; text after a <br> becomes its own <p>),
 *           paragraphs, optional button link in its own <p>]
 * Option downloads ('Contact-callout (downloads)'), single cell:
 *   "Downloads" heading, year subheadings (h4), PDF links as lists, other paragraphs kept inline.
 * Text is copied verbatim (whitespace collapsed only). Hrefs left as found.
 */
export default function parse(element, { document }) {
  const clean = (t) => (t || '').replace(/\s+/g, ' ').trim();
  const HEADINGS = 'h1, h2, h3, h4, h5, h6';
  const isHeading = (n) => n && n.nodeType === 1 && /^H[1-6]$/.test(n.tagName);
  const isBr = (n) => n && n.nodeType === 1 && n.tagName === 'BR';

  const isBoldEl = (n) => {
    if (n.nodeType !== 1) return false;
    if (n.tagName === 'STRONG' || n.tagName === 'B') return true;
    if (n.tagName !== 'SPAN') return false;
    const style = n.getAttribute('style') || '';
    return /bold/i.test(n.className || '') || /font-weight\s*:\s*(bold|[6-9]00)/i.test(style);
  };

  // Copy inline nodes into target, normalising whitespace; bold spans -> <strong>,
  // other spans unwrapped, images/comments dropped, links kept (href as found).
  const appendInline = (target, nodes) => {
    nodes.forEach((node) => {
      if (node.nodeType === 3) {
        target.append(document.createTextNode(node.textContent.replace(/\s+/g, ' ')));
        return;
      }
      if (node.nodeType !== 1) return;
      const tag = node.tagName;
      if (/^(IMG|PICTURE|SCRIPT|STYLE|BR)$/.test(tag)) return;
      if (isBoldEl(node)) {
        if (!clean(node.textContent)) return;
        const strong = document.createElement('strong');
        appendInline(strong, [...node.childNodes]);
        trim(strong);
        target.append(strong);
      } else if (tag === 'A') {
        if (!clean(node.textContent)) return;
        const a = document.createElement('a');
        a.href = node.getAttribute('href') || '';
        if (node.getAttribute('title')) a.title = node.getAttribute('title');
        appendInline(a, [...node.childNodes]);
        trim(a);
        target.append(a);
      } else if (/^(EM|I|SUP|SUB|U)$/.test(tag)) {
        const el = document.createElement(tag.toLowerCase());
        appendInline(el, [...node.childNodes]);
        target.append(el);
      } else {
        appendInline(target, [...node.childNodes]);
      }
    });
  };

  function trim(el) {
    // trim leading/trailing whitespace inside el (descending into first/last inline children)
    let first = el.firstChild;
    while (first && first.nodeType === 1 && first.firstChild) first = first.firstChild;
    if (first && first.nodeType === 3) first.textContent = first.textContent.replace(/^\s+/, '');
    let last = el.lastChild;
    while (last && last.nodeType === 1 && last.lastChild) last = last.lastChild;
    if (last && last.nodeType === 3) last.textContent = last.textContent.replace(/\s+$/, '');
    // collapse double spaces at boundaries between siblings
    return el;
  }

  // Split child nodes into lines at <br>
  const splitLines = (nodes) => {
    const lines = [[]];
    nodes.forEach((n) => {
      if (isBr(n)) lines.push([]);
      else lines[lines.length - 1].push(n);
    });
    return lines.filter((line) => line.some((n) => (n.nodeType === 3 && clean(n.textContent))
      || (n.nodeType === 1 && (clean(n.textContent) || n.tagName === 'IMG'))));
  };

  const lineText = (line) => clean(line.map((n) => n.textContent).join(' '));
  const lineEl = (tag, line) => {
    const el = document.createElement(tag);
    appendInline(el, line);
    return trim(el);
  };

  const makeImg = (srcImg) => {
    const img = document.createElement('img');
    img.src = srcImg.getAttribute('src');
    img.alt = srcImg.getAttribute('alt') || '';
    return img;
  };

  // ---- Detect downloads box ----
  const downloadsRoot = (element.matches && element.matches('.content-panel-quicklinks'))
    ? element
    : element.querySelector('.content-panel-quicklinks');
  const firstHeading = element.querySelector(HEADINGS);
  const links = [...element.querySelectorAll('a[href]')];
  const pdfLinks = links.filter((a) => /\.pdf(\?|#|$)/i.test(a.getAttribute('href') || ''));
  const isPurpleBand = (element.matches && element.matches('.textbar-callout-purple'))
    || !!element.querySelector('.textbar-callout-purple');
  const isDownloads = !isPurpleBand && (
    !!downloadsRoot
    || (firstHeading && /^downloads?$/i.test(clean(firstHeading.textContent)))
    || (pdfLinks.length >= 2 && pdfLinks.length >= links.length / 2)
  );

  const cells = [];

  if (isDownloads) {
    const root = downloadsRoot || element;
    const content = [];
    const walk = (parent) => {
      [...parent.children].forEach((child) => {
        const tag = child.tagName;
        if (isHeading(child)) {
          if (!clean(child.textContent)) return;
          // first heading is the box title; keep its level, later headings are subheadings
          const level = content.some((c) => isHeading(c)) ? 'h4' : tag.toLowerCase();
          const h = document.createElement(level);
          h.textContent = clean(child.textContent);
          content.push(h);
        } else if (tag === 'UL' || tag === 'OL') {
          const list = document.createElement(tag.toLowerCase());
          child.querySelectorAll(':scope > li').forEach((li) => {
            if (!clean(li.textContent)) return;
            list.append(lineEl('li', [...li.childNodes]));
          });
          if (list.children.length) content.push(list);
        } else if (tag === 'P') {
          const lines = splitLines([...child.childNodes]);
          if (!lines.length) return;
          // leading bold-only line without a link = year subheading
          const firstLine = lines[0];
          const firstEls = firstLine.filter((n) => n.nodeType === 1);
          const firstIsSubheading = lines.length > 1
            && firstEls.length === 1 && isBoldEl(firstEls[0])
            && !firstEls[0].querySelector('a')
            && lineText(firstLine) === clean(firstEls[0].textContent);
          let rest = lines;
          if (firstIsSubheading) {
            const sub = document.createElement('h4');
            sub.textContent = lineText(firstLine);
            content.push(sub);
            rest = lines.slice(1);
          }
          if (!rest.length) return;
          const allLinked = rest.every((line) => line.some((n) => n.nodeType === 1
            && (n.tagName === 'A' || n.querySelector('a'))));
          if (allLinked && (firstIsSubheading || rest.length > 1)) {
            const ul = document.createElement('ul');
            rest.forEach((line) => ul.append(lineEl('li', line)));
            content.push(ul);
          } else {
            const p = document.createElement('p');
            rest.forEach((line, i) => {
              if (i) p.append(document.createElement('br'));
              appendInline(p, line);
            });
            content.push(trim(p));
          }
        } else if (tag === 'A') {
          if (clean(child.textContent)) content.push(lineEl('p', [child]));
        } else if (/^(DIV|SECTION|ARTICLE|ASIDE|CENTER)$/.test(tag)) {
          walk(child);
        }
      });
    };
    walk(root);
    cells.push([content.length ? content : '']);
    const block = WebImporter.Blocks.createBlock(document, { name: 'Contact-callout (downloads)', cells });
    element.replaceWith(block);
    return;
  }

  // ---- Base contact band ----
  const band = (element.matches && element.matches('.textbar-callout-purple'))
    ? element
    : element.querySelector('.textbar-callout-purple') || element;

  // Icon: first image not inside heading/paragraph text
  const icon = [...band.querySelectorAll('img[src]')].find((img) => !img.closest('p, a, h1, h2, h3, h4, h5, h6'))
    || band.querySelector('img[src]');
  cells.push([icon ? makeImg(icon) : '']);

  const content = [];
  const walk = (parent) => {
    [...parent.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        if (clean(child.textContent)) content.push(lineEl('p', [child]));
        return;
      }
      if (child.nodeType !== 1) return;
      const tag = child.tagName;
      if (/^(IMG|PICTURE|BR|SCRIPT|STYLE)$/.test(tag)) return;
      if (isHeading(child)) {
        // heading text before the first <br>; each further line becomes a paragraph
        const lines = splitLines([...child.childNodes]);
        if (!lines.length) return;
        content.push(lineEl(tag.toLowerCase(), lines[0]));
        lines.slice(1).forEach((line) => content.push(lineEl('p', line)));
      } else if (tag === 'P') {
        if (!clean(child.textContent)) return;
        const p = document.createElement('p');
        splitLines([...child.childNodes]).forEach((line, i) => {
          if (i) p.append(document.createElement('br'));
          appendInline(p, line);
        });
        content.push(trim(p));
      } else if (tag === 'UL' || tag === 'OL') {
        const list = document.createElement(tag.toLowerCase());
        child.querySelectorAll(':scope > li').forEach((li) => {
          if (clean(li.textContent)) list.append(lineEl('li', [...li.childNodes]));
        });
        if (list.children.length) content.push(list);
      } else if (tag === 'A') {
        // button / CTA link in its own paragraph (text verbatim)
        if (!clean(child.textContent)) return;
        const p = document.createElement('p');
        const a = document.createElement('a');
        a.href = child.getAttribute('href') || '';
        if (child.getAttribute('title')) a.title = child.getAttribute('title');
        a.textContent = clean(child.textContent);
        p.append(a);
        content.push(p);
      } else {
        walk(child);
      }
    });
  };
  walk(band);
  cells.push([content.length ? content : '']);

  const block = WebImporter.Blocks.createBlock(document, { name: 'Contact-callout', cells });
  element.replaceWith(block);
}
