// --- recipebox.js ---
// Entry point for the Recipe Box page (recipebox/index.html)

import { loadHeaderFooter, getRecipeBox } from './utils.mjs';
import OnboardingQuiz from './OnboardingQuiz.mjs';

loadHeaderFooter();

// --- Initialize onboarding quiz for first-time users ---
const quiz = new OnboardingQuiz('quiz-container');
quiz.init();

// --- Render saved recipe cards ---
function renderRecipeCards(filterCategory = 'all', searchQuery = '') {
  const grid = document.getElementById('recipe-card-grid');
  const emptyBox = document.getElementById('empty-box');
  let recipes = getRecipeBox();

  // Filter by category
  if (filterCategory !== 'all') {
    recipes = recipes.filter(
      (r) => r.category && r.category.toLowerCase() === filterCategory
    );
  }

  // Filter by search query
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    recipes = recipes.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.ingredients &&
          r.ingredients.some((i) =>
            (i.name || '').toLowerCase().includes(q)
          ))
    );
  }

  // Clear grid
  grid.innerHTML = '';

  if (recipes.length === 0) {
    grid.style.display = 'none';
    emptyBox.style.display = 'block';
  } else {
    grid.style.display = '';
    emptyBox.style.display = 'none';

    recipes.forEach((recipe) => {
      const card = document.createElement('div');
      card.classList.add('recipe-card');
      card.innerHTML = `
        <img src="${recipe.image || '/images/icons/placeholder.svg'}" alt="${recipe.title}" onerror="this.src='/images/icons/placeholder.svg'" />
        <div class="recipe-card-body">
          <h4>${recipe.title}</h4>
          <p>${recipe.category ? recipe.category.charAt(0).toUpperCase() + recipe.category.slice(1) : 'Recipe'}</p>
        </div>
      `;
      grid.appendChild(card);
    });
  }
}

// --- Filter tab click handlers ---
const filterTabs = document.getElementById('filter-tabs');
if (filterTabs) {
  filterTabs.addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-tab')) {
      // Update active state
      filterTabs
        .querySelectorAll('.filter-tab')
        .forEach((tab) => tab.classList.remove('active'));
      e.target.classList.add('active');

      const filter = e.target.dataset.filter;
      const searchInput = document.getElementById('box-search');
      renderRecipeCards(filter, searchInput ? searchInput.value : '');
    }
  });
}

// --- Search within box ---
const searchBtn = document.getElementById('box-search-btn');
const searchInput = document.getElementById('box-search');

if (searchBtn && searchInput) {
  searchBtn.addEventListener('click', () => {
    const activeFilter =
      filterTabs.querySelector('.filter-tab.active')?.dataset.filter || 'all';
    renderRecipeCards(activeFilter, searchInput.value);
  });

  searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      const activeFilter =
        filterTabs.querySelector('.filter-tab.active')?.dataset.filter || 'all';
      renderRecipeCards(activeFilter, searchInput.value);
    }
  });
}

// --- Initial render ---
renderRecipeCards();
