// --- recipebox.js ---
// Entry point for the Recipe Box page (recipebox/index.html)

import { loadHeaderFooter, saveToRecipeBox, removeFromRecipeBox } from './utils.mjs';
import OnboardingQuiz from './OnboardingQuiz.mjs';
import RecipeBox from './RecipeBox.mjs';
import RecipeSearch from './RecipeSearch.mjs';

loadHeaderFooter();

// --- Initialize onboarding quiz for first-time users ---
const quiz = new OnboardingQuiz('quiz-container');
quiz.init();

// --- Retake Quiz button ---
document.getElementById('retake-quiz-btn')?.addEventListener('click', () => {
  localStorage.removeItem('grb-quiz-done');
  quiz.init();
});

// --- Initialize Recipe Box (carousel + grid) ---
const recipeBox = new RecipeBox({
  stageId: 'carousel-stage',
  gridId: 'recipe-box-grid',
  emptyStateId: 'empty-box',
  counterId: 'carousel-counter',
  controlsId: 'carousel-controls',
});
// --- Open the box lid, then render cards rising from the open box ---
setTimeout(() => {
  const boxVisual = document.getElementById('box-visual');
  if (boxVisual) boxVisual.classList.add('box-open');
  // Wait for lid to finish opening before rendering cards
  setTimeout(() => recipeBox.render(), 500);
}, 400);

// --- Carousel Controls ---
document.getElementById('carousel-prev')?.addEventListener('click', () => {
  recipeBox.prev();
});

document.getElementById('carousel-next')?.addEventListener('click', () => {
  recipeBox.next();
});

// --- Keyboard navigation for carousel (left/right arrows) ---
document.addEventListener('keydown', (e) => {
  // Only when carousel area is in focus (not typing in an input)
  const tag = document.activeElement?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  if (e.key === 'ArrowLeft') recipeBox.prev();
  if (e.key === 'ArrowRight') recipeBox.next();
});

// --- Initialize Recipe Search ---
const recipeSearch = new RecipeSearch('recipe-search-container', () => {
  recipeBox.refresh();
});
recipeSearch.init();

// --- + button opens custom card modal ---
const overlay = document.getElementById('custom-card-overlay');
const customForm = document.getElementById('custom-card-form');

function openCustomModal() {
  overlay.style.display = 'flex';
  const titleInput = document.getElementById('custom-title');
  if (titleInput) titleInput.focus();
}

function closeCustomModal() {
  overlay.style.display = 'none';
  customForm.reset();
  // Return focus to the add button
  document.getElementById('carousel-add')?.focus();
}

document.getElementById('carousel-add')?.addEventListener('click', openCustomModal);

document.getElementById('custom-card-cancel')?.addEventListener('click', closeCustomModal);

// Close overlay on background click
overlay?.addEventListener('click', (e) => {
  if (e.target === overlay) closeCustomModal();
});

// Close overlay on Escape key + focus trap
overlay?.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeCustomModal();
    return;
  }
  // Focus trap: keep Tab within the modal
  if (e.key === 'Tab') {
    const focusable = overlay.querySelectorAll('input, select, textarea, button, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});

// Handle custom card form submit
customForm?.addEventListener('submit', (e) => {
  e.preventDefault();

  const title = document.getElementById('custom-title').value.trim();
  if (!title) return;

  const recipe = {
    id: Date.now(),
    title: title,
    image: '',
    ingredients: [],
    category: document.getElementById('custom-category').value,
    dateAdded: new Date().toISOString(),
    sourceUrl: document.getElementById('custom-link').value.trim(),
    tiktokUrl: document.getElementById('custom-tiktok').value.trim(),
    notes: document.getElementById('custom-notes').value.trim(),
    readyInMinutes: 0,
    instructions: document.getElementById('custom-notes').value.trim(),
    cuisines: [],
    servings: 0,
  };

  const saved = saveToRecipeBox(recipe);
  if (saved) {
    overlay.style.display = 'none';
    customForm.reset();
    recipeBox.refresh();
  } else {
    const titleInput = document.getElementById('custom-title');
    titleInput.setCustomValidity('A recipe with this name already exists!');
    titleInput.reportValidity();
    titleInput.addEventListener('input', () => titleInput.setCustomValidity(''), { once: true });
  }
});

// --- Filter tab click handlers ---
const filterTabs = document.getElementById('filter-tabs');
if (filterTabs) {
  filterTabs.addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-tab')) {
      filterTabs
        .querySelectorAll('.filter-tab')
        .forEach((tab) => {
          tab.classList.remove('active');
          tab.setAttribute('aria-selected', 'false');
        });
      e.target.classList.add('active');
      e.target.setAttribute('aria-selected', 'true');
      recipeBox.setFilter(e.target.dataset.filter);
    }
  });
}

// --- Search within box ---
const searchBtn = document.getElementById('box-search-btn');
const searchInput = document.getElementById('box-search');

if (searchBtn && searchInput) {
  searchBtn.addEventListener('click', () => {
    recipeBox.setSearch(searchInput.value);
  });

  searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      recipeBox.setSearch(searchInput.value);
    }
  });
}

// --- "Add Your First Recipe" button opens custom card modal ---
document.getElementById('open-search-btn')?.addEventListener('click', () => {
  openCustomModal();
});

// --- Trash Zone: drag-and-drop delete ---
const trashZone = document.getElementById('trash-zone');
if (trashZone) {
  trashZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    trashZone.classList.add('trash-over');
  });

  trashZone.addEventListener('dragleave', () => {
    trashZone.classList.remove('trash-over');
  });

  trashZone.addEventListener('drop', (e) => {
    e.preventDefault();
    const id = Number(e.dataTransfer.getData('text/plain'));
    if (id) {
      removeFromRecipeBox(id);
      trashZone.classList.remove('trash-over', 'trash-visible');
      recipeBox.refresh();
    }
  });
}
