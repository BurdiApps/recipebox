// --- OnboardingQuiz.mjs ---
// Shows an onboarding quiz for first-time users
// Collects preferences and pre-loads 5 starter recipes into the box

import ExternalServices from './ExternalServices.mjs';
import { isQuizDone, setQuizDone, saveToRecipeBox } from './utils.mjs';

const QUESTIONS = [
  {
    id: 'cookingFor',
    question: 'Who are you cooking for?',
    options: [
      { label: 'Just Me', value: 'just-me' },
      { label: 'A Couple', value: 'couple' },
      { label: 'Family with Kids', value: 'family' },
      { label: 'Meal Prep Crew', value: 'meal-prep' },
    ],
  },
  {
    id: 'cuisine',
    question: 'What cuisine do you enjoy most?',
    options: [
      { label: 'American', value: 'american' },
      { label: 'Italian', value: 'italian' },
      { label: 'Mexican', value: 'mexican' },
      { label: 'Indian', value: 'indian' },
      { label: 'Asian', value: 'asian' },
    ],
  },
  {
    id: 'time',
    question: 'How much time do you usually have to cook?',
    options: [
      { label: '15 minutes', value: '15' },
      { label: '30 minutes', value: '30' },
      { label: '1 hour', value: '60' },
      { label: 'No rush', value: '120' },
    ],
  },
  {
    id: 'skill',
    question: 'What is your skill level?',
    options: [
      { label: 'Beginner', value: 'beginner' },
      { label: 'Intermediate', value: 'intermediate' },
      { label: 'Experienced', value: 'experienced' },
    ],
  },
];

export default class OnboardingQuiz {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.currentStep = 0; // 0 = welcome, 1-4 = questions
    this.answers = {};
    this.services = new ExternalServices();
  }

  init() {
    if (isQuizDone()) {
      return; // user has already completed or skipped the quiz
    }
    this._renderWelcome();
  }

  _renderWelcome() {
    this.container.innerHTML = `
      <div class="quiz-overlay" id="quiz-overlay">
        <div class="quiz-modal">
          <h2>Looks like you are new here!</h2>
          <p>Take a few moments to answer some cooking questions to help you get started.</p>
          <div class="btn-group-quiz">
            <button class="btn btn-primary" id="quiz-yes">Yes</button>
            <button class="btn btn-outline-secondary" id="quiz-no">No Thanks</button>
          </div>
        </div>
      </div>
    `;

    this.container.querySelector('#quiz-yes').addEventListener('click', () => {
      this.currentStep = 1;
      this._renderQuestion();
    });

    this.container.querySelector('#quiz-no').addEventListener('click', () => {
      this._dismiss();
    });
  }

  _renderQuestion() {
    const q = QUESTIONS[this.currentStep - 1];
    const isLast = this.currentStep === QUESTIONS.length;

    const optionsHtml = q.options
      .map(
        (opt) =>
          `<button class="quiz-option" data-value="${opt.value}">${opt.label}</button>`
      )
      .join('');

    this.container.innerHTML = `
      <div class="quiz-overlay">
        <div class="quiz-modal">
          <p style="font-size: 0.85rem; color: #666;">Question ${this.currentStep} of ${QUESTIONS.length}</p>
          <h3>${q.question}</h3>
          <div class="quiz-options" id="quiz-options">
            ${optionsHtml}
          </div>
          <div class="quiz-nav">
            <button class="btn btn-outline-secondary btn-sm" id="quiz-back" ${this.currentStep === 1 ? 'disabled' : ''}>Back</button>
            <button class="btn btn-primary btn-sm" id="quiz-next" disabled>${isLast ? 'Finish' : 'Next'}</button>
          </div>
        </div>
      </div>
    `;

    // Option selection
    const optionBtns = this.container.querySelectorAll('.quiz-option');
    const nextBtn = this.container.querySelector('#quiz-next');

    optionBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        optionBtns.forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.answers[q.id] = btn.dataset.value;
        nextBtn.disabled = false;
      });
    });

    // Pre-select if user already answered this question (going back)
    if (this.answers[q.id]) {
      const selected = this.container.querySelector(
        `.quiz-option[data-value="${this.answers[q.id]}"]`
      );
      if (selected) {
        selected.classList.add('selected');
        nextBtn.disabled = false;
      }
    }

    // Next button
    nextBtn.addEventListener('click', async () => {
      if (isLast) {
        await this._finishQuiz();
      } else {
        this.currentStep++;
        this._renderQuestion();
      }
    });

    // Back button
    this.container.querySelector('#quiz-back').addEventListener('click', () => {
      this.currentStep--;
      if (this.currentStep < 1) {
        this._renderWelcome();
      } else {
        this._renderQuestion();
      }
    });
  }

  async _finishQuiz() {
    // Show loading state with spinner
    this.container.innerHTML = `
      <div class="quiz-overlay">
        <div class="quiz-modal">
          <div class="loading-spinner" role="status">
            <div class="spinner"></div>
            <h3>Finding recipes for you...</h3>
            <p>Setting up your recipe box with 5 starter recipes!</p>
          </div>
        </div>
      </div>
    `;

    const params = mapQuizToParams(this.answers);
    const recipes = await this.services.searchRecipes('', params);

    // Save the starter recipes to localStorage
    recipes.forEach((recipe) => {
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
      };
      saveToRecipeBox(recipeToSave);
    });

    setQuizDone();
    this._dismiss();

    // Reload the page to show the new recipes
    window.location.reload();
  }

  _dismiss() {
    setQuizDone();
    this.container.innerHTML = '';
  }
}

// Maps quiz answers to Spoonacular API-compatible parameters
export function mapQuizToParams(answers) {
  const params = {};

  if (answers.cuisine && answers.cuisine !== 'american') {
    params.cuisine = answers.cuisine;
  }

  if (answers.time) {
    params.maxReadyTime = answers.time;
  }

  // Map "cooking for" to servings range
  switch (answers.cookingFor) {
    case 'just-me':
      params.minServings = 1;
      params.maxServings = 2;
      break;
    case 'couple':
      params.minServings = 2;
      params.maxServings = 3;
      break;
    case 'family':
      params.minServings = 4;
      params.maxServings = 6;
      break;
    case 'meal-prep':
      params.minServings = 4;
      params.maxServings = 8;
      break;
  }

  return params;
}
