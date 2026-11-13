import * as aem from '../../scripts/aem.js';

const { createOptimizedPicture } = aem;

// fetchPlaceholders is not exported by every aem.js version; fall back to default labels.
async function loadPlaceholders() {
  try {
    return typeof aem.fetchPlaceholders === 'function' ? await aem.fetchPlaceholders() : {};
  } catch {
    return {};
  }
}

// source (slick): autoplaySpeed 15000, infinite: false
const AUTOPLAY_INTERVAL = 15000;

// carousel-hero does not wrap around: it stops at either end (source slick infinite: false)
const isLooping = (block) => !block.classList.contains('carousel-hero');

function updateActiveSlide(slide) {
  const block = slide.closest('.carousel');
  const slideIndex = parseInt(slide.dataset.slideIndex, 10);
  block.dataset.activeSlide = slideIndex;

  const slides = block.querySelectorAll('.carousel-slide');

  slides.forEach((aSlide, idx) => {
    aSlide.setAttribute('aria-hidden', idx !== slideIndex);
    aSlide.querySelectorAll('a').forEach((link) => {
      if (idx !== slideIndex) {
        link.setAttribute('tabindex', '-1');
      } else {
        link.removeAttribute('tabindex');
      }
    });
  });

  const indicators = block.querySelectorAll('.carousel-slide-indicator');
  indicators.forEach((indicator, idx) => {
    const button = indicator.querySelector('button');
    if (idx !== slideIndex) {
      button.removeAttribute('disabled');
      button.removeAttribute('aria-current');
    } else {
      button.setAttribute('disabled', true);
      button.setAttribute('aria-current', true);
    }
  });

  if (!isLooping(block)) {
    const prev = block.querySelector('.slide-prev');
    const next = block.querySelector('.slide-next');
    [[prev, slideIndex === 0, next], [next, slideIndex === slides.length - 1, prev]]
      .forEach(([button, atEnd, other]) => {
        if (!button) return;
        button.setAttribute('aria-disabled', atEnd);
        // the disabled arrow is hidden; keep keyboard focus on the opposite arrow
        if (atEnd && document.activeElement === button && other) other.focus();
      });
  }
}

export function showSlide(block, slideIndex = 0) {
  const slides = block.querySelectorAll('.carousel-slide');
  let realSlideIndex;
  if (isLooping(block)) {
    realSlideIndex = slideIndex < 0 ? slides.length - 1 : slideIndex;
    if (slideIndex >= slides.length) realSlideIndex = 0;
  } else {
    realSlideIndex = Math.min(Math.max(slideIndex, 0), slides.length - 1);
  }
  const activeSlide = slides[realSlideIndex];

  activeSlide.querySelectorAll('a').forEach((link) => link.removeAttribute('tabindex'));
  block.querySelector('.carousel-slides').scrollTo({
    top: 0,
    left: activeSlide.offsetLeft,
    behavior: 'smooth',
  });
}

/**
 * Autoplay with a user-controlled pause/play toggle (carousel-hero option).
 * Autoplay also halts while the pointer or keyboard focus is inside the block,
 * and never starts when the user prefers reduced motion.
 */
function setupAutoplay(block, placeholders) {
  const pauseLabel = placeholders.pause || 'Pause';
  const playLabel = placeholders.play || 'Play';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let userPaused = reduceMotion;
  let hovering = false;
  let focused = false;
  let timer;

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'carousel-autoplay-toggle';
  const toggleText = document.createElement('span');
  toggleText.className = 'carousel-autoplay-toggle-text';
  toggle.append(toggleText);

  const render = () => {
    toggle.classList.toggle('is-paused', userPaused);
    toggle.setAttribute('aria-label', `${userPaused ? playLabel : pauseLabel} ${placeholders.slideshow || 'slideshow'}`);
    // icon-only control (source pause/play image); the text stays for assistive tech
    toggleText.textContent = userPaused ? playLabel : pauseLabel;
  };

  const stop = () => {
    clearInterval(timer);
    timer = undefined;
  };

  const slideCount = block.querySelectorAll('.carousel-slide').length;
  const currentIndex = () => parseInt(block.dataset.activeSlide || '0', 10);

  const start = () => {
    stop();
    if (userPaused || hovering || focused) return;
    if (currentIndex() >= slideCount - 1) return;
    timer = setInterval(() => {
      const nextIndex = currentIndex() + 1;
      // no loop: autoplay ends on the last slide
      if (nextIndex >= slideCount - 1) stop();
      if (nextIndex <= slideCount - 1) showSlide(block, nextIndex);
    }, AUTOPLAY_INTERVAL);
  };

  toggle.addEventListener('click', () => {
    userPaused = !userPaused;
    render();
    start();
  });

  block.addEventListener('mouseenter', () => { hovering = true; stop(); });
  block.addEventListener('mouseleave', () => { hovering = false; start(); });
  block.addEventListener('focusin', (e) => {
    if (e.target === toggle) return;
    focused = true;
    stop();
  });
  block.addEventListener('focusout', (e) => {
    if (block.contains(e.relatedTarget)) return;
    focused = false;
    start();
  });

  render();
  block.querySelector('.carousel-slides-container').append(toggle);
  start();
}

function bindEvents(block) {
  const slideIndicators = block.querySelector('.carousel-slide-indicators');
  if (!slideIndicators) return;

  slideIndicators.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', (e) => {
      const slideIndicator = e.currentTarget.parentElement;
      showSlide(block, parseInt(slideIndicator.dataset.targetSlide, 10));
    });
  });

  block.querySelector('.slide-prev').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide, 10) - 1);
  });
  block.querySelector('.slide-next').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide, 10) + 1);
  });

  const slideObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) updateActiveSlide(entry.target);
    });
  }, { threshold: 0.5 });
  block.querySelectorAll('.carousel-slide').forEach((slide) => {
    slideObserver.observe(slide);
  });
}

function optimizeImages(slide, eager) {
  slide.querySelectorAll('img').forEach((img) => {
    // Only optimize same-origin, non-SVG images; keep the authored image otherwise
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    const optimizedPic = createOptimizedPicture(img.src, img.alt, eager, [
      { media: '(min-width: 900px)', width: '2000' },
      { width: '900' },
    ]);
    (img.closest('picture') || img).replaceWith(optimizedPic);
  });
}

function createSlide(row, slideIndex, carouselId) {
  const slide = document.createElement('li');
  slide.dataset.slideIndex = slideIndex;
  slide.setAttribute('id', `carousel-${carouselId}-slide-${slideIndex}`);
  slide.classList.add('carousel-slide');

  row.querySelectorAll(':scope > div').forEach((column, colIdx) => {
    column.classList.add(`carousel-slide-${colIdx === 0 ? 'image' : 'content'}`);
    slide.append(column);
  });

  const labeledBy = slide.querySelector('h1, h2, h3, h4, h5, h6');
  if (labeledBy && labeledBy.id) {
    slide.setAttribute('aria-labelledby', labeledBy.id);
  }

  return slide;
}

let carouselId = 0;
export default async function decorate(block) {
  carouselId += 1;
  block.setAttribute('id', `carousel-${carouselId}`);
  const rows = block.querySelectorAll(':scope > div');
  const isSingleSlide = rows.length < 2;
  const isHero = block.classList.contains('carousel-hero');

  const placeholders = await loadPlaceholders();

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', placeholders.carousel || 'Carousel');

  const container = document.createElement('div');
  container.classList.add('carousel-slides-container');

  const slidesWrapper = document.createElement('ul');
  slidesWrapper.classList.add('carousel-slides');
  block.prepend(slidesWrapper);

  let slideIndicators;
  if (!isSingleSlide) {
    const slideIndicatorsNav = document.createElement('nav');
    slideIndicatorsNav.setAttribute('aria-label', placeholders.carouselSlideControls || 'Carousel Slide Controls');
    slideIndicators = document.createElement('ol');
    slideIndicators.classList.add('carousel-slide-indicators');
    slideIndicatorsNav.append(slideIndicators);
    block.append(slideIndicatorsNav);

    const slideNavButtons = document.createElement('div');
    slideNavButtons.classList.add('carousel-navigation-buttons');
    slideNavButtons.innerHTML = `
      <button type="button" class="slide-prev" aria-label="${placeholders.previousSlide || 'Previous Slide'}"></button>
      <button type="button" class="slide-next" aria-label="${placeholders.nextSlide || 'Next Slide'}"></button>
    `;

    container.append(slideNavButtons);
  }

  rows.forEach((row, idx) => {
    const slide = createSlide(row, idx, carouselId);
    optimizeImages(slide, isHero && idx === 0);
    slidesWrapper.append(slide);

    if (slideIndicators) {
      const indicator = document.createElement('li');
      indicator.classList.add('carousel-slide-indicator');
      indicator.dataset.targetSlide = idx;
      indicator.innerHTML = `<button type="button" aria-label="${placeholders.showSlide || 'Show Slide'} ${idx + 1} ${placeholders.of || 'of'} ${rows.length}"></button>`;
      slideIndicators.append(indicator);
    }
    row.remove();
  });

  container.append(slidesWrapper);
  block.prepend(container);

  if (!isSingleSlide) {
    bindEvents(block);
    if (isHero) setupAutoplay(block, placeholders);
  }
}
