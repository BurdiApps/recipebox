// --- ExternalServices.mjs ---
// Handles all external API calls (Spoonacular + TikTok oEmbed)

const SPOONACULAR_BASE = 'https://api.spoonacular.com';
const API_KEY = import.meta.env.VITE_SPOONACULAR_API_KEY || '';

export default class ExternalServices {
  constructor() {
    this.baseUrl = SPOONACULAR_BASE;
    this.apiKey = API_KEY;
  }

  // Search recipes — uses mock data if no API key is set
  async searchRecipes(query = '', filters = {}) {
    // If we have a real API key, use the Spoonacular API
    if (this.apiKey && this.apiKey !== 'your_key_here') {
      return await this._fetchFromSpoonacular(query, filters);
    }
      // Otherwise, return an empty array or handle the case when no API key is provided
      return [];
  }

  // Get a single recipe by ID
  async getRecipeById(id) {
    if (this.apiKey && this.apiKey !== 'your_key_here') {
      const response = await fetch(
        `${this.baseUrl}/recipes/${id}/information?apiKey=${this.apiKey}`
      );
      return await response.json();
    }
      return null;
  }

  // TikTok oEmbed integration — uses Netlify function in production, proxy for local dev
  async getTikTokEmbed(url) {
    try {
      let fetchUrl;
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // Local dev: use a public proxy
        const proxy = 'https://corsproxy.io/?';
        const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
        fetchUrl = proxy + encodeURIComponent(oembedUrl);
      } else {
        // Production (Netlify): use our serverless function
        fetchUrl = `/.netlify/functions/tiktok-oembed?url=${encodeURIComponent(url)}`;
      }
      const res = await fetch(fetchUrl);
      if (!res.ok) throw new Error('TikTok oEmbed failed');
      const data = await res.json();
      return data;
    } catch (err) {
      // Fallback: show a direct link
      return {
        title: 'TikTok Recipe Video',
        author_name: '',
        thumbnail_url: '',
        html: `<p style="color:#c41e3d">TikTok embed failed to load.<br>Try a different video or check CORS/proxy settings.</p><p><a href="${url}" target="_blank" rel="noopener noreferrer">Open in TikTok ↗</a></p>`
      };
    }
  }

  // --- Private methods ---

  async _fetchFromSpoonacular(query, filters) {
    const params = new URLSearchParams({
      apiKey: this.apiKey,
      query: query,
      number: 5,
      addRecipeInformation: true,
      ...filters,
    });

    const response = await fetch(
      `${this.baseUrl}/recipes/complexSearch?${params}`
    );
    const data = await response.json();
    return data.results || [];






    }
}
