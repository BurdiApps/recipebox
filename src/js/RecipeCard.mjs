// --- RecipeCard.mjs ---
// Renders a single recipe card with flip animation
// Front: image + title. Back: ingredients, instructions, TikTok embed, delete button

import { removeFromRecipeBox } from './utils.mjs';
import ExternalServices from './ExternalServices.mjs';

export default class RecipeCard {
  constructor(recipe, onDelete) {
    this.recipe = recipe;
    this.onDelete = onDelete || (() => {});
    this.services = new ExternalServices();
  }

  render() {
    const card = document.createElement('div');
    card.classList.add('recipe-card-flip');
    card.dataset.id = this.recipe.id;
    card.setAttribute('draggable', 'true');

    const ingredients = (this.recipe.ingredients || [])
      .map((i) => `<li>${i.amount ? i.amount + ' ' : ''}${i.unit ? i.unit + ' ' : ''}${i.name || i}</li>`)
      .join('');

    const cuisineLabel =
      this.recipe.cuisines && this.recipe.cuisines.length
        ? this.recipe.cuisines[0]
        : '';
    const categoryLabel = this.recipe.category
      ? this.recipe.category.charAt(0).toUpperCase() + this.recipe.category.slice(1)
      : 'Recipe';

    card.innerHTML = `
      <div class="card-inner">
        <!-- FRONT -->
        <div class="card-front">
          <img src="${this.recipe.image || '/images/icons/placeholder.svg'}"
               alt="${this.recipe.title}"
               onerror="this.src='/images/icons/placeholder.svg'" />
          <div class="card-front-body">
            <h4>${this.recipe.title}</h4>
            <p class="card-meta">
              ${categoryLabel}
              ${cuisineLabel ? ' · ' + cuisineLabel : ''}
              ${this.recipe.readyInMinutes ? ' · ' + this.recipe.readyInMinutes + ' min' : ''}
            </p>
          </div>
          <button class="btn-flip" aria-label="Flip card to see details">View Details ↻</button>
        </div>

        <!-- BACK -->
        <div class="card-back">
          <div class="card-back-scroll">
            <h4>${this.recipe.title}</h4>

            ${ingredients ? `<div class="card-section"><h5>Ingredients</h5><ul class="card-ingredients">${ingredients}</ul></div>` : ''}

            ${this.recipe.instructions ? `<div class="card-section"><h5>Instructions</h5><p class="card-instructions">${this.recipe.instructions}</p></div>` : ''}

            <div class="card-section tiktok-section" id="tiktok-${this.recipe.id}">
              <h5>TikTok Video</h5>
              ${this.recipe.tiktokUrl ? `<div class="tiktok-embed-container" data-url="${this.recipe.tiktokUrl}"></div>` : '<p class="tiktok-placeholder">No TikTok video linked yet.</p>'}
              <div class="tiktok-input-group">
                <input type="url" class="form-control form-control-sm tiktok-url-input"
                       placeholder="Paste TikTok URL..." aria-label="TikTok video URL" />
                <button class="btn btn-sm btn-primary tiktok-add-btn" type="button">Add</button>
              </div>
            </div>

            ${this.recipe.sourceUrl ? `<a href="${this.recipe.sourceUrl}" target="_blank" rel="noopener noreferrer" class="card-source-link">View Full Recipe ↗</a>` : ''}
          </div>

          <div class="card-back-actions">
            <button class="btn-flip-back" aria-label="Flip back to front">← Back</button>
            <button class="btn-delete-card" aria-label="Delete recipe from box">🗑 Delete</button>
          </div>
        </div>
      </div>
    `;

    this._bindEvents(card);
    return card;
  }

  _bindEvents(card) {
    // Flip to back
    card.querySelector('.btn-flip').addEventListener('click', (e) => {
      e.stopPropagation();
      card.classList.add('flipped');
    });

    // Flip to front
    card.querySelector('.btn-flip-back').addEventListener('click', (e) => {
      e.stopPropagation();
      card.classList.remove('flipped');
    });

    // Delete
    card.querySelector('.btn-delete-card').addEventListener('click', (e) => {
      e.stopPropagation();
      this._confirmDelete(card);
    });

    // --- Drag to trash ---
    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', String(this.recipe.id));
      card.classList.add('dragging');
      const trashZone = document.getElementById('trash-zone');
      if (trashZone) trashZone.classList.add('trash-visible');
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      const trashZone = document.getElementById('trash-zone');
      if (trashZone) trashZone.classList.remove('trash-visible', 'trash-over');
    });

    // --- Right-click context menu delete ---
    card.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this._showContextMenu(card, e.clientX, e.clientY);
    });

    // TikTok add button
    const tiktokBtn = card.querySelector('.tiktok-add-btn');
    const tiktokInput = card.querySelector('.tiktok-url-input');
    if (tiktokBtn && tiktokInput) {
      tiktokBtn.addEventListener('click', () => {
        this._addTikTok(tiktokInput.value.trim(), card);
      });
      tiktokInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
          this._addTikTok(tiktokInput.value.trim(), card);
        }
      });
    }

    // Load existing TikTok embed if URL is set
    if (this.recipe.tiktokUrl) {
      this._loadTikTokEmbed(this.recipe.tiktokUrl, card);
    }
  }

  _confirmDelete(card) {
    const existing = card.querySelector('.delete-confirm');
    if (existing) return; // already showing

    const confirm = document.createElement('div');
    confirm.classList.add('delete-confirm');
    confirm.innerHTML = `
      <p>Remove this recipe?</p>
      <button class="btn btn-sm btn-danger confirm-yes">Yes, Remove</button>
      <button class="btn btn-sm btn-outline-secondary confirm-no">Cancel</button>
    `;

    card.querySelector('.card-back-actions').appendChild(confirm);

    confirm.querySelector('.confirm-yes').addEventListener('click', () => {
      removeFromRecipeBox(this.recipe.id);
      card.classList.add('card-removing');
      setTimeout(() => {
        card.remove();
        this.onDelete(this.recipe.id);
      }, 300);
    });

    confirm.querySelector('.confirm-no').addEventListener('click', () => {
      confirm.remove();
    });
  }

  _showContextMenu(card, x, y) {
    // Remove any existing context menu
    document.querySelector('.card-context-menu')?.remove();

    const menu = document.createElement('div');
    menu.classList.add('card-context-menu');
    menu.innerHTML = `<button class="ctx-delete">🗑 Delete Recipe</button>`;
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';

    document.body.appendChild(menu);

    menu.querySelector('.ctx-delete').addEventListener('click', () => {
      menu.remove();
      removeFromRecipeBox(this.recipe.id);
      card.classList.add('card-removing');
      setTimeout(() => {
        card.remove();
        this.onDelete(this.recipe.id);
      }, 300);
    });

    // Close menu on any click outside
    const closeMenu = (e) => {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 0);
  }

  async _addTikTok(url, card) {
    if (!url || !url.includes('tiktok.com')) return;

    const section = card.querySelector(`#tiktok-${this.recipe.id}`);
    const placeholder = section.querySelector('.tiktok-placeholder');
    let embedContainer = section.querySelector('.tiktok-embed-container');

    if (!embedContainer) {
      embedContainer = document.createElement('div');
      embedContainer.classList.add('tiktok-embed-container');
      section.insertBefore(embedContainer, section.querySelector('.tiktok-input-group'));
    }

    embedContainer.innerHTML = '<p>Loading TikTok embed...</p>';

    const embedData = await this.services.getTikTokEmbed(url);
    embedContainer.innerHTML = embedData.html;

    // Ensure TikTok embed script runs
    this._injectTikTokScript();

    if (placeholder) placeholder.remove();

    // Update recipe in localStorage
    this.recipe.tiktokUrl = url;
    this._updateRecipeInStorage();
  }

  async _loadTikTokEmbed(url, card) {
    const section = card.querySelector(`#tiktok-${this.recipe.id}`);
    const embedContainer = section.querySelector('.tiktok-embed-container');
    if (!embedContainer) return;

    const embedData = await this.services.getTikTokEmbed(url);
    embedContainer.innerHTML = embedData.html;
    this._injectTikTokScript();

  }

  _injectTikTokScript() {
    // Remove any existing TikTok embed.js script to avoid duplicates
    const oldScript = document.querySelector('script[src^="https://www.tiktok.com/embed.js"]');
    if (oldScript) oldScript.remove();
    const script = document.createElement('script');
    script.src = 'https://www.tiktok.com/embed.js';
    script.async = true;
    document.body.appendChild(script);
  }

  _updateRecipeInStorage() {
    const key = 'grb-recipe-box';
    const box = JSON.parse(localStorage.getItem(key)) || [];
    const idx = box.findIndex((r) => r.id === this.recipe.id);
    if (idx !== -1) {
      box[idx] = { ...box[idx], tiktokUrl: this.recipe.tiktokUrl };
      localStorage.setItem(key, JSON.stringify(box));
    }
  }
}
