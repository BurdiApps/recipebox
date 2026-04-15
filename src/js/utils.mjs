// --- utils.mjs ---
// Shared utility functions for Grandma's Recipe Box
// Mirrors the pattern from WDD-330 SleepOutside project

export function qs(selector, parent = document) {
  return parent.querySelector(selector);
}

export function getLocalStorage(key) {
  return JSON.parse(localStorage.getItem(key));
}

export function setLocalStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// --- Recipe Box helpers ---

const RECIPE_BOX_KEY = 'grb-recipe-box';
const QUIZ_DONE_KEY = 'grb-quiz-done';

export function getRecipeBox() {
  const box = getLocalStorage(RECIPE_BOX_KEY);
  if (Array.isArray(box)) {
    return box;
  }
  return [];
}

export function saveToRecipeBox(recipe) {
  const box = getRecipeBox();
  // prevent duplicates by id OR title
  const exists = box.find(
    (r) => r.id === recipe.id || r.title.toLowerCase() === recipe.title.toLowerCase()
  );
  if (!exists) {
    box.push(recipe);
    setLocalStorage(RECIPE_BOX_KEY, box);
    return true;
  }
  return false;
}

export function removeFromRecipeBox(id) {
  let box = getRecipeBox();
  box = box.filter((r) => r.id !== id);
  setLocalStorage(RECIPE_BOX_KEY, box);
}

export function isQuizDone() {
  return getLocalStorage(QUIZ_DONE_KEY) === true;
}

export function setQuizDone() {
  setLocalStorage(QUIZ_DONE_KEY, true);
}

// --- Partial loading (header/footer) ---

async function loadTemplate(path) {
  const res = await fetch(path);
  return await res.text();
}

export function renderWithTemplate(template, parentElement) {
  parentElement.innerHTML = template;
}

export async function loadHeaderFooter() {
  const headerElement = document.querySelector('#main-header');
  const footerElement = document.querySelector('#main-footer');

  if (headerElement) {
    const headerTemplate = await loadTemplate('/partials/header.html');
    renderWithTemplate(headerTemplate, headerElement);
    _initNavbarToggle(headerElement);
  }

  if (footerElement) {
    const footerTemplate = await loadTemplate('/partials/footer.html');
    renderWithTemplate(footerTemplate, footerElement);
  }
}

// Vanilla JS hamburger toggle (no Bootstrap JS needed)
function _initNavbarToggle(header) {
  const toggler = header.querySelector('.navbar-toggler');
  const menu = header.querySelector('.navbar-collapse');
  if (!toggler || !menu) return;

  toggler.addEventListener('click', () => {
    const isOpen = menu.classList.contains('show');
    menu.classList.toggle('show');
    toggler.setAttribute('aria-expanded', String(!isOpen));
  });

  // Close menu when a nav link is clicked (mobile UX)
  menu.querySelectorAll('.nav-link, .badge-github').forEach((link) => {
    link.addEventListener('click', () => {
      menu.classList.remove('show');
      toggler.setAttribute('aria-expanded', 'false');
    });
  });
}
