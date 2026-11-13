/**
 * Hero block.
 * Keeps the boilerplate behaviour: flags heroes whose first row has no picture
 * with a `no-image` class. Options (article, hero-card, hero-callout) are pure CSS
 * and are read from block.classList; unknown option tokens are ignored.
 * @param {Element} block The hero block element
 */
export default function decorate(block) {
  if (!block.querySelector(':scope > div:first-child picture')) {
    block.classList.add('no-image');
  }
}
