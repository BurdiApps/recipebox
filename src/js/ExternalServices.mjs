// --- ExternalServices.mjs ---
// Handles all external API calls (Spoonacular + TikTok oEmbed)
// Currently stubbed with mock data — swap in real fetch calls when API key is ready

const SPOONACULAR_BASE = 'https://api.spoonacular.com';
const API_KEY = import.meta.env.VITE_SPOONACULAR_API_KEY || '';

// --- Mock Data (5 starter recipes) ---
const MOCK_RECIPES = [
  {
    id: 1001,
    title: 'Classic Spaghetti Carbonara',
    image: 'https://spoonacular.com/recipeImages/716429-312x231.jpg',
    readyInMinutes: 30,
    servings: 4,
    cuisines: ['Italian'],
    category: 'dinner',
    sourceUrl: 'https://spoonacular.com/classic-spaghetti-carbonara-716429',
    extendedIngredients: [
      { name: 'spaghetti', amount: 400, unit: 'g' },
      { name: 'pancetta', amount: 200, unit: 'g' },
      { name: 'eggs', amount: 4, unit: '' },
      { name: 'parmesan cheese', amount: 100, unit: 'g' },
    ],
    instructions: 'Cook pasta. Fry pancetta. Mix eggs with cheese. Combine all together off heat.',
  },
  {
    id: 1002,
    title: 'Avocado Toast with Egg',
    image: 'https://spoonacular.com/recipeImages/642539-312x231.jpg',
    readyInMinutes: 10,
    servings: 1,
    cuisines: ['American'],
    category: 'breakfast',
    sourceUrl: 'https://spoonacular.com/avocado-toast-642539',
    extendedIngredients: [
      { name: 'bread', amount: 2, unit: 'slices' },
      { name: 'avocado', amount: 1, unit: '' },
      { name: 'egg', amount: 1, unit: '' },
    ],
    instructions: 'Toast bread. Mash avocado on toast. Fry egg and place on top.',
  },
  {
    id: 1003,
    title: 'Chicken Tikka Masala',
    image: 'https://spoonacular.com/recipeImages/716342-312x231.jpg',
    readyInMinutes: 45,
    servings: 4,
    cuisines: ['Indian'],
    category: 'dinner',
    sourceUrl: 'https://spoonacular.com/chicken-tikka-masala-716342',
    extendedIngredients: [
      { name: 'chicken breast', amount: 500, unit: 'g' },
      { name: 'yogurt', amount: 200, unit: 'ml' },
      { name: 'tomato sauce', amount: 400, unit: 'ml' },
      { name: 'garam masala', amount: 2, unit: 'tbsp' },
    ],
    instructions: 'Marinate chicken in yogurt and spices. Grill chicken. Simmer in tomato sauce.',
  },
  {
    id: 1004,
    title: 'Berry Smoothie Bowl',
    image: 'https://spoonacular.com/recipeImages/715497-312x231.jpg',
    readyInMinutes: 5,
    servings: 1,
    cuisines: ['American'],
    category: 'breakfast',
    sourceUrl: 'https://spoonacular.com/berry-smoothie-bowl-715497',
    extendedIngredients: [
      { name: 'frozen berries', amount: 200, unit: 'g' },
      { name: 'banana', amount: 1, unit: '' },
      { name: 'granola', amount: 50, unit: 'g' },
      { name: 'honey', amount: 1, unit: 'tbsp' },
    ],
    instructions: 'Blend berries and banana. Pour into bowl. Top with granola and honey.',
  },
  {
    id: 1005,
    title: 'Beef Tacos',
    image: 'https://spoonacular.com/recipeImages/715594-312x231.jpg',
    readyInMinutes: 25,
    servings: 4,
    cuisines: ['Mexican'],
    category: 'dinner',
    sourceUrl: 'https://spoonacular.com/beef-tacos-715594',
    extendedIngredients: [
      { name: 'ground beef', amount: 500, unit: 'g' },
      { name: 'taco shells', amount: 8, unit: '' },
      { name: 'lettuce', amount: 1, unit: 'cup' },
      { name: 'cheese', amount: 100, unit: 'g' },
      { name: 'salsa', amount: 100, unit: 'ml' },
    ],
    instructions: 'Brown beef with seasoning. Fill taco shells. Top with lettuce, cheese, and salsa.',
  },
];

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
    // Otherwise return filtered mock data
    return this._searchMockData(query, filters);
  }

  // Get a single recipe by ID
  async getRecipeById(id) {
    if (this.apiKey && this.apiKey !== 'your_key_here') {
      const response = await fetch(
        `${this.baseUrl}/recipes/${id}/information?apiKey=${this.apiKey}`
      );
      return await response.json();
    }
    return MOCK_RECIPES.find((r) => r.id === id) || null;
  }

  // TikTok oEmbed — stub for now, real integration in Week 6
  // eslint-disable-next-line no-unused-vars
  async getTikTokEmbed(url) {
    // TODO: call https://www.tiktok.com/oembed?url=<url>
    // May need a proxy due to CORS restrictions
    return {
      title: 'TikTok Recipe Video',
      author_name: 'Chef',
      thumbnail_url: '',
      html: `<p>TikTok embed placeholder for: ${url}</p>`,
    };
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

  _searchMockData(query, filters) {
    let results = [...MOCK_RECIPES];

    if (query) {
      const q = query.toLowerCase();
      results = results.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.extendedIngredients.some((i) => i.name.toLowerCase().includes(q))
      );
    }

    if (filters.cuisine) {
      results = results.filter((r) =>
        r.cuisines.some(
          (c) => c.toLowerCase() === filters.cuisine.toLowerCase()
        )
      );
    }

    if (filters.maxReadyTime) {
      results = results.filter(
        (r) => r.readyInMinutes <= Number(filters.maxReadyTime)
      );
    }

    if (filters.type) {
      results = results.filter(
        (r) => r.category === filters.type.toLowerCase()
      );
    }

    return results;
  }
}
