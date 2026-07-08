const STORAGE_KEY = 'kainos-todo:todos';
const API_KEY_STORAGE_KEY = 'kainos-todo:apiKey';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = 'openai/gpt-4o-mini';
const FILTERS = new Set([
  TodoCore.FILTER_ALL,
  TodoCore.FILTER_ACTIVE,
  TodoCore.FILTER_DONE,
]);
const STORAGE_MODE_EXTENSION = 'extension';
const STORAGE_MODE_LOCAL = 'local';
const STORAGE_MODE_NONE = 'none';
const chromeStorageArea = globalThis.chrome?.storage?.local ?? null;

function detectStorageMode() {
  if (chromeStorageArea) {
    return STORAGE_MODE_EXTENSION;
  }

  try {
    if (globalThis.localStorage) {
      return STORAGE_MODE_LOCAL;
    }
  } catch (_error) {
    return STORAGE_MODE_NONE;
  }

  return STORAGE_MODE_NONE;
}

const storageMode = detectStorageMode();

const state = {
  todos: [],
  filter: 'all',
  aiLoading: null,
};

function updateStorageCaption() {
  const caption = document.getElementById('storage-caption');
  const badge = document.getElementById('storage-mode-badge');
  const modeClasses = ['mode-extension', 'mode-local', 'mode-none'];

  if (badge) {
    badge.classList.remove(...modeClasses);
  }

  if (!caption) {
    if (!badge) {
      return;
    }
  }

  if (storageMode === STORAGE_MODE_EXTENSION) {
    if (caption) {
      caption.textContent = 'Tasks stored via Chrome extension storage';
    }
    if (badge) {
      badge.textContent = 'Extension';
      badge.classList.add('mode-extension');
    }
    return;
  }

  if (storageMode === STORAGE_MODE_LOCAL) {
    if (caption) {
      caption.textContent = 'Tasks stored via local browser storage (tab mode)';
    }
    if (badge) {
      badge.textContent = 'Browser tab';
      badge.classList.add('mode-local');
    }
    return;
  }

  if (caption) {
    caption.textContent = 'Storage unavailable in this browser context.';
  }
  if (badge) {
    badge.textContent = 'No storage';
    badge.classList.add('mode-none');
  }
}

// ── Persistence ────────────────────────────────────────────────

function parseStoredValue(rawValue) {
  if (typeof rawValue !== 'string') {
    return undefined;
  }

  try {
    return JSON.parse(rawValue);
  } catch (_error) {
    return undefined;
  }
}

function localStorageGet(key) {
  const rawValue = globalThis.localStorage.getItem(key);
  return { [key]: parseStoredValue(rawValue) };
}

function localStorageSet(items) {
  Object.entries(items).forEach(([key, value]) => {
    globalThis.localStorage.setItem(key, JSON.stringify(value));
  });
}

function storageGet(key) {
  if (storageMode === STORAGE_MODE_LOCAL) {
    return Promise.resolve(localStorageGet(key));
  }

  if (storageMode !== STORAGE_MODE_EXTENSION) {
    return Promise.resolve({});
  }

  return new Promise((resolve, reject) => {
    try {
      const maybePromise = chromeStorageArea.get(key, (result) => {
        const error = globalThis.chrome?.runtime?.lastError;
        if (error) {
          reject(new Error(error.message));
          return;
        }

        resolve(result ?? {});
      });

      if (maybePromise && typeof maybePromise.then === 'function') {
        maybePromise.then(
          (result) => resolve(result ?? {}),
          reject,
        );
      }
    } catch (error) {
      reject(error);
    }
  });
}

function storageSet(items) {
  if (storageMode === STORAGE_MODE_LOCAL) {
    localStorageSet(items);
    return Promise.resolve();
  }

  if (storageMode !== STORAGE_MODE_EXTENSION) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    try {
      const maybePromise = chromeStorageArea.set(items, () => {
        const error = globalThis.chrome?.runtime?.lastError;
        if (error) {
          reject(new Error(error.message));
          return;
        }

        resolve();
      });

      if (maybePromise && typeof maybePromise.then === 'function') {
        maybePromise.then(() => resolve(), reject);
      }
    } catch (error) {
      reject(error);
    }
  });
}

async function loadState() {
  updateStorageCaption();

  const stored = await storageGet(STORAGE_KEY);
  state.todos = TodoCore.normalizeTodos(stored[STORAGE_KEY]);
  render();
}

async function saveState() {
  if (storageMode === STORAGE_MODE_NONE) {
    return;
  }

  await storageSet({ [STORAGE_KEY]: state.todos });
}

// ── Business logic ─────────────────────────────────────────────

async function addTodo(text, dueDate) {
  const todo = TodoCore.createTodo(text, { dueDate });
  if (!todo) {
    return false;
  }

  state.todos = [todo, ...state.todos];
  render();

  await saveState();
  return true;
}

async function toggleTodo(id) {
  const exists = state.todos.some((todo) => todo.id === id);
  if (!exists) {
    return;
  }

  const nextTodos = TodoCore.toggleTodoById(state.todos, id);
  state.todos = nextTodos;
  render();
  await saveState();
}

async function deleteTodo(id) {
  const nextTodos = TodoCore.deleteTodoById(state.todos, id);
  if (nextTodos.length === state.todos.length) {
    return;
  }

  state.todos = nextTodos;
  render();
  await saveState();
}

function setFilter(filter) {
  if (!FILTERS.has(filter) || state.filter === filter) {
    return;
  }

  state.filter = filter;
  render();
}

function getVisibleTodos() {
  return TodoCore.getVisibleTodos(state.todos, state.filter);
}

function setPriority(id, priority) {
  const nextTodos = TodoCore.setPriorityById(state.todos, id, priority);
  if (nextTodos === state.todos) {
    return;
  }

  state.todos = nextTodos;
  render();
  void saveState();
}

// ── Render ─────────────────────────────────────────────────────

function renderList() {
  const list = document.getElementById('todo-list');
  const visible = getVisibleTodos();
  list.innerHTML = visible.map(todo => `
    <li class="todo-item${todo.done ? ' done' : ''}" data-id="${todo.id}">
      <input class="todo-checkbox" type="checkbox" ${todo.done ? 'checked' : ''} />
      <span class="todo-text">${todo.text}</span>
      ${renderDueDateBadge(todo)}
      ${todo.priority ? `<span class="priority-badge priority-${todo.priority}">${todo.priority}</span>` : ''}
      <button class="btn-ai" title="Suggest priority" ${state.aiLoading ? 'disabled' : ''}>
        ${state.aiLoading === todo.id ? '<span class="ai-spinner" aria-hidden="true"></span>' : 'AI'}
      </button>
      <button class="btn-delete" title="Delete">✕</button>
    </li>
  `).join('');
}

function renderDueDateBadge(todo) {
  const urgency = TodoCore.classifyDueDate(todo.dueDate);
  if (urgency.status === TodoCore.URGENCY_NONE) {
    return '';
  }

  return `<span class="due-badge due-${urgency.status}">${urgency.label}</span>`;
}

function renderEmptyState() {
  const empty = document.getElementById('empty-state');
  empty.style.display = getVisibleTodos().length === 0 ? 'block' : 'none';
}

function renderFilterBar() {
  document.querySelectorAll('#filter-bar .filter-btn').forEach((button) => {
    const isActive = button.dataset.filter === state.filter;
    button.classList.toggle('active', isActive);
  });
}

function renderStats() {
  const total  = state.todos.length;
  const done   = state.todos.filter(t => t.done).length;
  const active = TodoCore.countActiveTodos(state.todos);

  document.getElementById('stats').textContent = `${active} task${active !== 1 ? 's' : ''} left`;

  const bar = document.getElementById('progress-bar');
  if (bar) bar.style.width = (total === 0 ? 0 : Math.round((done / total) * 100)) + '%';

  const countEl = document.getElementById('task-count');
  if (countEl) countEl.textContent = total === 0 ? '' : `${done} / ${total} done`;
}

function render() {
  renderList();
  renderEmptyState();
  renderFilterBar();
  renderStats();
}

// ── Event wiring ───────────────────────────────────────────────

function initHandlers() {
  const addForm = document.getElementById('add-form');
  const dueDateInput = document.getElementById('due-date-input');
  const filterBar = document.getElementById('filter-bar');
  const todoInput = document.getElementById('todo-input');
  const todoList = document.getElementById('todo-list');

  addForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const added = await addTodo(todoInput.value, dueDateInput.value);
    if (added) {
      todoInput.value = '';
      dueDateInput.value = '';
    }
    todoInput.focus();
  });

  filterBar.addEventListener('click', (event) => {
    const button = event.target.closest('.filter-btn');
    if (!button) {
      return;
    }

    setFilter(button.dataset.filter);
  });

  todoList.addEventListener('click', async (event) => {
    const item = event.target.closest('.todo-item');
    if (!item) {
      return;
    }

    const { id } = item.dataset;
    if (!id) {
      return;
    }

    if (event.target.closest('.btn-delete')) {
      await deleteTodo(id);
      return;
    }

    if (event.target.closest('.btn-ai')) {
      await suggestPriority(id);
      return;
    }

    if (event.target.matches('.todo-checkbox')) {
      await toggleTodo(id);
    }
  });

  // Options link
  document.getElementById('options-link').addEventListener('click', (e) => {
    e.preventDefault();
    window.open('options.html');
  });
}

// ── AI Feature (Task 5) ────────────────────────────────────────

async function suggestPriority(id) {
  if (state.aiLoading) {
    return;
  }

  const todo = state.todos.find((item) => item.id === id);
  if (!todo) {
    return;
  }

  const stored = await storageGet(API_KEY_STORAGE_KEY);
  const apiKey = typeof stored[API_KEY_STORAGE_KEY] === 'string' ? stored[API_KEY_STORAGE_KEY].trim() : '';
  if (!apiKey) {
    window.alert('Add your OpenRouter API key in Settings before using AI priority suggestions.');
    return;
  }

  state.aiLoading = id;
  render();

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          {
            role: 'system',
            content: 'Classify task urgency as exactly one word: high, medium, or low.',
          },
          {
            role: 'user',
            content: `Task: ${todo.text}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    const priority = TodoCore.extractPrioritySuggestion(content);
    if (!priority) {
      throw new Error('Invalid priority response');
    }

    setPriority(id, priority);
  } catch (_error) {
    window.alert('Unable to get an AI priority suggestion right now. Check your API key and try again.');
  } finally {
    state.aiLoading = null;
    render();
  }
}

// ── Boot ───────────────────────────────────────────────────────

async function init() {
  await loadState();
  initHandlers();
}

void init();
