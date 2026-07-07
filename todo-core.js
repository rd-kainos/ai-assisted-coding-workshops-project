(function initTodoCore(root, factory) {
  const api = factory();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.TodoCore = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  const DEFAULT_TEXT_LIMIT = 200;
  const FILTER_ALL = 'all';
  const FILTER_ACTIVE = 'active';
  const FILTER_DONE = 'done';
  const PRIORITY_HIGH = 'high';
  const PRIORITY_MEDIUM = 'medium';
  const PRIORITY_LOW = 'low';
  const URGENCY_NONE = 'none';
  const URGENCY_OVERDUE = 'overdue';
  const URGENCY_TODAY = 'today';
  const URGENCY_UPCOMING = 'upcoming';

  function sanitizeText(text) {
    if (typeof text !== 'string') {
      return '';
    }

    return text.trim().slice(0, DEFAULT_TEXT_LIMIT);
  }

  function createUniqueId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function normalizeDueDate(dueDate) {
    if (typeof dueDate !== 'string') {
      return null;
    }

    const normalizedDueDate = dueDate.trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(normalizedDueDate) ? normalizedDueDate : null;
  }

  function getTodayDateString(now = new Date()) {
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function classifyDueDate(dueDate, options = {}) {
    const normalizedDueDate = normalizeDueDate(dueDate);
    if (!normalizedDueDate) {
      return {
        label: '',
        sortOrder: 3,
        status: URGENCY_NONE,
      };
    }

    const todayDate = typeof options.todayDate === 'string' ? options.todayDate : getTodayDateString();

    if (normalizedDueDate < todayDate) {
      return {
        label: 'Overdue',
        sortOrder: 0,
        status: URGENCY_OVERDUE,
      };
    }

    if (normalizedDueDate === todayDate) {
      return {
        label: 'Today',
        sortOrder: 1,
        status: URGENCY_TODAY,
      };
    }

    return {
      label: normalizedDueDate,
      sortOrder: 2,
      status: URGENCY_UPCOMING,
    };
  }

  function createTodo(text, options = {}) {
    const normalizedText = sanitizeText(text);

    if (!normalizedText) {
      return null;
    }

    const generateId = typeof options.generateId === 'function' ? options.generateId : createUniqueId;
    const now = typeof options.now === 'function' ? options.now : () => new Date().toISOString();
    const dueDate = normalizeDueDate(options.dueDate);

    return {
      id: generateId(),
      text: normalizedText,
      done: false,
      createdAt: now(),
      dueDate,
      priority: null,
    };
  }

  function normalizeTodos(value) {
    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value !== 'string') {
      return [];
    }

    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
      return [];
    }
  }

  function loadTodos(storage, key) {
    const raw = storage.getItem(key);
    return normalizeTodos(raw);
  }

  function saveTodos(storage, key, todos) {
    const safeTodos = Array.isArray(todos) ? todos : [];
    storage.setItem(key, JSON.stringify(safeTodos));
  }

  function toggleTodoById(todos, id) {
    if (!Array.isArray(todos)) {
      return [];
    }

    return todos.map((todo) => {
      if (todo.id !== id) {
        return todo;
      }

      return {
        ...todo,
        done: !todo.done,
      };
    });
  }

  function deleteTodoById(todos, id) {
    if (!Array.isArray(todos)) {
      return [];
    }

    return todos.filter((todo) => todo.id !== id);
  }

  function normalizePriority(priority) {
    if (typeof priority !== 'string') {
      return null;
    }

    const normalizedPriority = priority.trim().toLowerCase();
    if (
      normalizedPriority === PRIORITY_HIGH
      || normalizedPriority === PRIORITY_MEDIUM
      || normalizedPriority === PRIORITY_LOW
    ) {
      return normalizedPriority;
    }

    return null;
  }

  function extractPrioritySuggestion(content) {
    if (typeof content !== 'string') {
      return null;
    }

    const match = content.trim().toLowerCase().match(/\b(high|medium|low)\b/);
    return match ? normalizePriority(match[1]) : null;
  }

  function setPriorityById(todos, id, priority) {
    if (!Array.isArray(todos)) {
      return [];
    }

    const normalizedPriority = normalizePriority(priority);
    if (!normalizedPriority) {
      return todos;
    }

    return todos.map((todo) => {
      if (todo.id !== id) {
        return todo;
      }

      return {
        ...todo,
        priority: normalizedPriority,
      };
    });
  }

  function sortTodosByUrgency(todos, options = {}) {
    if (!Array.isArray(todos)) {
      return [];
    }

    return todos
      .map((todo, index) => ({
        index,
        urgency: classifyDueDate(todo.dueDate, options),
        todo,
      }))
      .sort((left, right) => {
        if (left.urgency.sortOrder !== right.urgency.sortOrder) {
          return left.urgency.sortOrder - right.urgency.sortOrder;
        }

        const leftDueDate = normalizeDueDate(left.todo.dueDate);
        const rightDueDate = normalizeDueDate(right.todo.dueDate);

        if (leftDueDate && rightDueDate && leftDueDate !== rightDueDate) {
          return leftDueDate.localeCompare(rightDueDate);
        }

        return left.index - right.index;
      })
      .map((entry) => entry.todo);
  }

  function getVisibleTodos(todos, filter = FILTER_ALL) {
    if (!Array.isArray(todos)) {
      return [];
    }

    let filteredTodos;

    if (filter === FILTER_ACTIVE) {
      filteredTodos = todos.filter((todo) => !todo.done);
      return sortTodosByUrgency(filteredTodos);
    }

    if (filter === FILTER_DONE) {
      filteredTodos = todos.filter((todo) => todo.done);
      return sortTodosByUrgency(filteredTodos);
    }

    return sortTodosByUrgency(todos);
  }

  function countActiveTodos(todos) {
    if (!Array.isArray(todos)) {
      return 0;
    }

    return todos.filter((todo) => !todo.done).length;
  }

  return {
    classifyDueDate,
    countActiveTodos,
    createTodo,
    deleteTodoById,
    extractPrioritySuggestion,
    FILTER_ACTIVE,
    FILTER_ALL,
    FILTER_DONE,
    getTodayDateString,
    getVisibleTodos,
    normalizeTodos,
    normalizeDueDate,
    normalizePriority,
    loadTodos,
    PRIORITY_HIGH,
    PRIORITY_LOW,
    PRIORITY_MEDIUM,
    saveTodos,
    setPriorityById,
    sortTodosByUrgency,
    toggleTodoById,
    URGENCY_NONE,
    URGENCY_OVERDUE,
    URGENCY_TODAY,
    URGENCY_UPCOMING,
  };
});