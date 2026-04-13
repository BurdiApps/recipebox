// --- RecipeSearch.mjs ---
// Handles recipe search UI and interactions
// Calls ExternalServices to fetch results, renders them with save-to-box buttons

import ExternalServices from './ExternalServices.mjs';
import { saveToRecipeBox, getRecipeBox } from './utils.mjs';

export default class RecipeSearch {
  constructor(containerId, onRecipeSaved) {
    this.container = document.getElementById(containerId);
    this.services = new ExternalServices();
    this.onRecipeSaved = onRecipeSaved || (() => {});
    this.filters = {};
  }

  init() {
    this._renderSearchUI();
  }

  _renderSearchUI() {
    this.container.innerHTML = `
      <div class="search-panel">
        <h3>Find New Recipes</h3>
        <div class="search-panel-bar input-group">
          <input type="text" id="recipe-search-input" class="form-control"
                 placeholder="Search by name or ingredient..." aria-label="Search recipes" />
          <button class="btn btn-primary" id="recipe-search-btn" type="button">Search</button>
        </div>

        <!-- Search Filters -->
        <div class="search-filters" id="search-filters">
          <select id="filter-cuisine" class="form-select form-select-sm" aria-label="Filter by cuisine">
            <option value="">Any Cuisine</option>
            <option value="american">American</option>
            <option value="italian">Italian</option>
            <option value="mexican">Mexican</option>
            <option value="indian">Indian</option>
            <option value="asian">Asian</option>
          </select>
          <select id="filter-time" class="form-select form-select-sm" aria-label="Filter by cook time">
            <option value="">Any Time</option>
            <option value="15">Under 15 min</option>
            <option value="30">Under 30 min</option>
            <option value="60">Under 1 hour</option>
          </select>
          <select id="filter-diet" class="form-select form-select-sm" aria-label="Filter by diet">
            <option value="">Any Diet</option>
            <option value="vegetarian">Vegetarian</option>
            <option value="vegan">Vegan</option>
            <option value="gluten free">Gluten Free</option>
          </select>
        </div>

        <!-- Search Results -->
        <div class="search-results" id="search-results"></div>
      </div>
    `;

    this._bindEvents();
  }

  _bindEvents() {
    const searchBtn = this.container.querySelector('#recipe-search-btn');
    const searchInput = this.container.querySelector('#recipe-search-input');

    searchBtn.addEventListener('click', () => this._doSearch());
    searchInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') this._doSearch();
    });
  }

  _getFilters() {
    const cuisine = this.container.querySelector('#filter-cuisine').value;
    const time = this.container.querySelector('#filter-time').value;
    const diet = this.container.querySelector('#filter-diet').value;
    const filters = {};

    if (cuisine) filters.cuisine = cuisine;
    if (time) filters.maxReadyTime = time;
    if (diet) filters.diet = diet;

    return filters;
  }

  async _doSearch() {
    const input = this.container.querySelector('#recipe-search-input');
    const resultsContainer = this.container.querySelector('#search-results');
    const query = input.value.trim();

    if (!query) return;

    resultsContainer.innerHTML = '<p class="search-loading">Searching...</p>';

    const filters = this._getFilters();
    const results = await this.services.searchRecipes(query, filters);

    if (results.length === 0) {
      resultsContainer.innerHTML = '<p class="search-empty">No recipes found. Try a different search.</p>';
      return;
    }

    this._renderResults(results);
  }

  _renderResults(results) {
    const resultsContainer = this.container.querySelector('#search-results');
    const savedIds = getRecipeBox().map((r) => r.id);

    resultsContainer.innerHTML = results
      .map((recipe) => {
        const alreadySaved = savedIds.includes(recipe.id);
        return `
        <div class="search-result-card" data-id="${recipe.id}">
          <img src="${recipe.image || '/images/icons/placeholder.svg'}"
               alt="${recipe.title}"
               onerror="this.src='/images/icons/placeholder.svg'" />
          <div class="search-result-info">
            <h4>${recipe.title}</h4>
            <p>
              ${recipe.readyInMinutes ? recipe.readyInMinutes + ' min' : ''}
              ${recipe.cuisines && recipe.cuisines.length ? ' · ' + recipe.cuisines[0] : ''}
              ${recipe.servings ? ' · ' + recipe.servings + ' servings' : ''}
            </p>
          </div>
          <button class="btn-save-recipe ${alreadySaved ? 'saved' : ''}"
                  data-id="${recipe.id}"
                  ${alreadySaved ? 'disabled' : ''}
                  aria-label="${alreadySaved ? 'Already saved' : 'Save to recipe box'}">
            ${alreadySaved ? '✓ Saved' : '+ Save'}
          </button>
        </div>`;
      })
      .join('');

    // Bind save buttons
    resultsContainer.querySelectorAll('.btn-save-recipe:not(.saved)').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = Number(e.target.dataset.id);
        this._saveRecipe(id, results, e.target);
      });
    });
  }

  _saveRecipe(id, results, btnEl) {
    const recipe = results.find((r) => r.id === id);
    if (!recipe) return;

    const recipeToSave = {
      id: recipe.id,
      title: recipe.title,
      image: recipe.image || '',
      ingredients: recipe.extendedIngredients || [],
      category: recipe.category || 'dinner',
      dateAdded: new Date().toISOString(),
      sourceUrl: recipe.sourceUrl || '',
      tiktokUrl: '',
      notes: '',
      readyInMinutes: recipe.readyInMinutes || 0,
      instructions: recipe.instructions || '',
      cuisines: recipe.cuisines || [],
      servings: recipe.servings || 0,
    };

    const saved = saveToRecipeBox(recipeToSave);

    if (saved) {
      btnEl.textContent = '✓ Saved';
      btnEl.classList.add('saved');
      btnEl.disabled = true;
      this.onRecipeSaved(recipeToSave);
    } else {
      btnEl.textContent = 'Already in box';
      btnEl.classList.add('saved');
      btnEl.disabled = true;
    }
  }
}
