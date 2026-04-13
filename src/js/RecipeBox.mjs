// --- RecipeBox.mjs ---
// Manages the recipe box — featured card carousel + side grid
// Cards animate "out of the box" and can flip to show details

import RecipeCard from './RecipeCard.mjs';
import { getRecipeBox } from './utils.mjs';

export default class RecipeBox {
  constructor({ stageId, gridId, emptyStateId, counterId, controlsId }) {
    this.stage = document.getElementById(stageId);
    this.grid = document.getElementById(gridId);
    this.emptyState = document.getElementById(emptyStateId);
    this.counter = document.getElementById(counterId);
    this.controls = document.getElementById(controlsId);
    this.currentFilter = 'all';
    this.currentSearch = '';
    this.currentIndex = 0;
    this.filteredRecipes = [];
  }

  render() {
    this._update();
  }

  setFilter(category) {
    this.currentFilter = category;
    this.currentIndex = 0;
    this._update();
  }

  setSearch(query) {
    this.currentSearch = query;
    this.currentIndex = 0;
    this._update();
  }

  refresh() {
    this._update();
  }

  next() {
    if (this.filteredRecipes.length === 0) return;
    this.currentIndex = (this.currentIndex + 1) % this.filteredRecipes.length;
    this._renderFeatured('slide-left');
    this._highlightGridCard();
  }

  prev() {
    if (this.filteredRecipes.length === 0) return;
    this.currentIndex =
      (this.currentIndex - 1 + this.filteredRecipes.length) %
      this.filteredRecipes.length;
    this._renderFeatured('slide-right');
    this._highlightGridCard();
  }

  goToIndex(index) {
    if (index < 0 || index >= this.filteredRecipes.length) return;
    const direction = index > this.currentIndex ? 'slide-left' : 'slide-right';
    this.currentIndex = index;
    this._renderFeatured(direction);
    this._highlightGridCard();
  }

  _getFilteredRecipes() {
    let recipes = getRecipeBox();

    if (this.currentFilter !== 'all') {
      recipes = recipes.filter(
        (r) => r.category && r.category.toLowerCase() === this.currentFilter
      );
    }

    if (this.currentSearch) {
      const q = this.currentSearch.toLowerCase();
      recipes = recipes.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          (r.ingredients &&
            r.ingredients.some((i) =>
              (i.name || String(i)).toLowerCase().includes(q)
            ))
      );
    }

    return recipes;
  }

  _update() {
    this.filteredRecipes = this._getFilteredRecipes();

    if (this.currentIndex >= this.filteredRecipes.length) {
      this.currentIndex = Math.max(0, this.filteredRecipes.length - 1);
    }

    if (this.filteredRecipes.length === 0) {
      this.stage.innerHTML = '';
      this.grid.innerHTML = '';
      this.counter.textContent = '';
      this.controls.style.display = 'none';
      this.emptyState.style.display = 'block';
      this.stage.closest('.recipe-box-layout').style.display = 'none';
    } else {
      this.emptyState.style.display = 'none';
      this.stage.closest('.recipe-box-layout').style.display = '';
      this.controls.style.display = '';
      this._renderFeatured('card-from-box');
      this._renderGrid();
    }
  }

  _renderFeatured(animation = '') {
    const recipe = this.filteredRecipes[this.currentIndex];
    if (!recipe) return;

    // Clean up any still-departing cards from rapid clicks
    this.stage
      .querySelectorAll('.slide-out-left, .slide-out-right')
      .forEach((el) => el.remove());

    // Slide the old card out before adding the new one
    const oldCard = this.stage.querySelector('.recipe-card-flip');
    if (oldCard && (animation === 'slide-left' || animation === 'slide-right')) {
      const outClass =
        animation === 'slide-left' ? 'slide-out-left' : 'slide-out-right';
      oldCard.classList.add(outClass);
      oldCard.addEventListener('animationend', () => oldCard.remove(), {
        once: true,
      });
    } else {
      this.stage.innerHTML = '';
    }

    const card = new RecipeCard(recipe, () => {
      this.filteredRecipes = this._getFilteredRecipes();
      this._update();
    });
    const cardEl = card.render();

    if (animation) {
      cardEl.classList.add(animation);
      cardEl.addEventListener(
        'animationend',
        () => {
          cardEl.classList.remove(animation);
          if (animation === 'card-from-box') {
            this._flyToGrid(recipe);
          }
        },
        { once: true }
      );
    }

    this.stage.appendChild(cardEl);
    this.counter.textContent = `${this.currentIndex + 1} of ${this.filteredRecipes.length}`;
  }

  _flyToGrid(recipe) {
    // Only on desktop (grid is visible)
    if (window.innerWidth < 768) return;

    const thumb = this.grid.querySelector(
      `.grid-thumb[data-index="${this.currentIndex}"]`
    );
    if (!thumb) return;

    const stageRect = this.stage.getBoundingClientRect();
    const thumbRect = thumb.getBoundingClientRect();

    // Create a flying clone
    const clone = document.createElement('div');
    clone.classList.add('card-fly-clone');
    clone.innerHTML = `
      <img src="${recipe.image || '/images/icons/placeholder.svg'}"
           alt="${recipe.title}"
           onerror="this.src='/images/icons/placeholder.svg'" />
      <p>${recipe.title}</p>
    `;

    // Start at the carousel stage position
    clone.style.left = stageRect.left + 'px';
    clone.style.top = stageRect.top + 'px';
    clone.style.width = stageRect.width + 'px';
    clone.style.height = stageRect.height * 0.4 + 'px';

    document.body.appendChild(clone);

    // Trigger reflow, then animate to the thumb position
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        clone.style.left = thumbRect.left + 'px';
        clone.style.top = thumbRect.top + 'px';
        clone.style.width = thumbRect.width + 'px';
        clone.style.height = thumbRect.height + 'px';
        clone.style.opacity = '0.6';
        clone.style.borderRadius = '0.375rem';
      });
    });

    // Remove clone after animation
    clone.addEventListener('transitionend', () => {
      clone.remove();
      // Flash the grid thumb to show it "landed"
      thumb.classList.add('thumb-landed');
      setTimeout(() => thumb.classList.remove('thumb-landed'), 400);
    }, { once: true });
  }

  _renderGrid() {
    this.grid.innerHTML = '';

    this.filteredRecipes.forEach((recipe, index) => {
      const thumb = document.createElement('div');
      thumb.classList.add('grid-thumb');
      if (index === this.currentIndex) thumb.classList.add('active');
      thumb.dataset.index = index;

      thumb.innerHTML = `
        <img src="${recipe.image || '/images/icons/placeholder.svg'}"
             alt="${recipe.title}"
             onerror="this.src='/images/icons/placeholder.svg'" />
        <p>${recipe.title}</p>
      `;

      thumb.addEventListener('click', () => {
        this.goToIndex(index);
      });

      this.grid.appendChild(thumb);
    });
  }

  _highlightGridCard() {
    const thumbs = this.grid.querySelectorAll('.grid-thumb');
    thumbs.forEach((t, i) => {
      t.classList.toggle('active', i === this.currentIndex);
    });
    // Update counter
    this.counter.textContent = `${this.currentIndex + 1} of ${this.filteredRecipes.length}`;
  }
}
