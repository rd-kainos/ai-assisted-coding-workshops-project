const test = require('node:test');
const assert = require('node:assert/strict');

const {
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
  loadTodos,
  normalizePriority,
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
} = require('../todo-core.js');

function makeStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
    },
    setItem(key, value) {
      data[key] = String(value);
    },
    dump() {
      return { ...data };
    },
  };
}

test('createTodo returns null for empty and whitespace text', () => {
  assert.equal(createTodo(''), null);
  assert.equal(createTodo('   '), null);
  assert.equal(createTodo(null), null);
});

test('createTodo returns normalized todo object with defaults', () => {
  const todo = createTodo('  Ship workshop task  ', {
    generateId: () => 'todo-1',
    now: () => '2026-07-07T09:00:00.000Z',
    dueDate: '2026-07-10',
  });

  assert.deepEqual(todo, {
    id: 'todo-1',
    text: 'Ship workshop task',
    done: false,
    createdAt: '2026-07-07T09:00:00.000Z',
    dueDate: '2026-07-10',
    priority: null,
  });
});

test('createTodo truncates long text to 200 chars', () => {
  const longText = 'a'.repeat(250);
  const todo = createTodo(longText, {
    generateId: () => 'todo-2',
    now: () => '2026-07-07T09:00:00.000Z',
  });

  assert.equal(todo.text.length, 200);
});

test('normalizeDueDate accepts ISO date-only strings and rejects other values', () => {
  assert.equal(normalizeDueDate('2026-07-10'), '2026-07-10');
  assert.equal(normalizeDueDate(' 2026-07-10 '), '2026-07-10');
  assert.equal(normalizeDueDate('2026/07/10'), null);
  assert.equal(normalizeDueDate(''), null);
});

test('getTodayDateString formats a local date as YYYY-MM-DD', () => {
  const localDate = new Date(2026, 6, 7, 9, 30, 0);
  assert.equal(getTodayDateString(localDate), '2026-07-07');
});

test('classifyDueDate returns the correct urgency badge metadata', () => {
  assert.deepEqual(classifyDueDate(null, { todayDate: '2026-07-07' }), {
    label: '',
    sortOrder: 3,
    status: URGENCY_NONE,
  });

  assert.deepEqual(classifyDueDate('2026-07-06', { todayDate: '2026-07-07' }), {
    label: 'Overdue',
    sortOrder: 0,
    status: URGENCY_OVERDUE,
  });

  assert.deepEqual(classifyDueDate('2026-07-07', { todayDate: '2026-07-07' }), {
    label: 'Today',
    sortOrder: 1,
    status: URGENCY_TODAY,
  });

  assert.deepEqual(classifyDueDate('2026-07-08', { todayDate: '2026-07-07' }), {
    label: '2026-07-08',
    sortOrder: 2,
    status: URGENCY_UPCOMING,
  });
});

test('normalizeTodos accepts arrays and rejects unsupported values', () => {
  const todos = [{ id: 'todo-1', text: 'Write tests', done: false, createdAt: '2026-07-07T09:00:00.000Z', priority: null }];

  assert.deepEqual(normalizeTodos(todos), todos);
  assert.deepEqual(normalizeTodos({ id: 1 }), []);
  assert.deepEqual(normalizeTodos(null), []);
});

test('normalizeTodos parses legacy JSON strings', () => {
  const todos = [{ id: 'todo-1', text: 'Write tests', done: false, createdAt: '2026-07-07T09:00:00.000Z', priority: null }];

  assert.deepEqual(normalizeTodos(JSON.stringify(todos)), todos);
  assert.deepEqual(normalizeTodos('{broken'), []);
});

test('toggleTodoById flips done state for matching todo only', () => {
  const todos = [
    { id: 'todo-1', text: 'Write tests', done: false, createdAt: '2026-07-07T09:00:00.000Z', priority: null },
    { id: 'todo-2', text: 'Ship code', done: true, createdAt: '2026-07-07T09:05:00.000Z', priority: null },
  ];

  assert.deepEqual(toggleTodoById(todos, 'todo-1'), [
    { id: 'todo-1', text: 'Write tests', done: true, createdAt: '2026-07-07T09:00:00.000Z', priority: null },
    { id: 'todo-2', text: 'Ship code', done: true, createdAt: '2026-07-07T09:05:00.000Z', priority: null },
  ]);
});

test('deleteTodoById removes the matching todo and keeps others', () => {
  const todos = [
    { id: 'todo-1', text: 'Write tests', done: false, createdAt: '2026-07-07T09:00:00.000Z', priority: null },
    { id: 'todo-2', text: 'Ship code', done: true, createdAt: '2026-07-07T09:05:00.000Z', priority: null },
  ];

  assert.deepEqual(deleteTodoById(todos, 'todo-1'), [
    { id: 'todo-2', text: 'Ship code', done: true, createdAt: '2026-07-07T09:05:00.000Z', priority: null },
  ]);
});

test('normalizePriority accepts only supported priority labels', () => {
  assert.equal(normalizePriority('high'), PRIORITY_HIGH);
  assert.equal(normalizePriority(' Medium '), PRIORITY_MEDIUM);
  assert.equal(normalizePriority('LOW'), PRIORITY_LOW);
  assert.equal(normalizePriority('urgent'), null);
});

test('extractPrioritySuggestion parses a supported priority from model content', () => {
  assert.equal(extractPrioritySuggestion('high'), PRIORITY_HIGH);
  assert.equal(extractPrioritySuggestion('Priority: medium'), PRIORITY_MEDIUM);
  assert.equal(extractPrioritySuggestion('I would choose low priority.'), PRIORITY_LOW);
  assert.equal(extractPrioritySuggestion('no clear answer'), null);
});

test('setPriorityById updates only the matching todo when priority is valid', () => {
  const todos = [
    { id: 'todo-1', text: 'Write tests', done: false, createdAt: '2026-07-07T09:00:00.000Z', dueDate: null, priority: null },
    { id: 'todo-2', text: 'Ship code', done: true, createdAt: '2026-07-07T09:05:00.000Z', dueDate: null, priority: PRIORITY_LOW },
  ];

  assert.deepEqual(setPriorityById(todos, 'todo-1', 'high'), [
    { id: 'todo-1', text: 'Write tests', done: false, createdAt: '2026-07-07T09:00:00.000Z', dueDate: null, priority: PRIORITY_HIGH },
    { id: 'todo-2', text: 'Ship code', done: true, createdAt: '2026-07-07T09:05:00.000Z', dueDate: null, priority: PRIORITY_LOW },
  ]);

  assert.equal(setPriorityById(todos, 'todo-1', 'urgent'), todos);
});

test('getVisibleTodos returns the expected subset for each filter', () => {
  const todos = [
    { id: 'todo-1', text: 'Write tests', done: false, createdAt: '2026-07-07T09:00:00.000Z', dueDate: '2026-07-08', priority: null },
    { id: 'todo-2', text: 'Ship code', done: true, createdAt: '2026-07-07T09:05:00.000Z', dueDate: '2026-07-06', priority: null },
    { id: 'todo-3', text: 'Review code', done: false, createdAt: '2026-07-07T09:10:00.000Z', dueDate: null, priority: null },
  ];

  assert.deepEqual(getVisibleTodos(todos, FILTER_ALL), [
    { id: 'todo-2', text: 'Ship code', done: true, createdAt: '2026-07-07T09:05:00.000Z', dueDate: '2026-07-06', priority: null },
    { id: 'todo-1', text: 'Write tests', done: false, createdAt: '2026-07-07T09:00:00.000Z', dueDate: '2026-07-08', priority: null },
    { id: 'todo-3', text: 'Review code', done: false, createdAt: '2026-07-07T09:10:00.000Z', dueDate: null, priority: null },
  ]);
  assert.deepEqual(getVisibleTodos(todos, FILTER_ACTIVE), [
    { id: 'todo-1', text: 'Write tests', done: false, createdAt: '2026-07-07T09:00:00.000Z', dueDate: '2026-07-08', priority: null },
    { id: 'todo-3', text: 'Review code', done: false, createdAt: '2026-07-07T09:10:00.000Z', dueDate: null, priority: null },
  ]);
  assert.deepEqual(getVisibleTodos(todos, FILTER_DONE), [
    { id: 'todo-2', text: 'Ship code', done: true, createdAt: '2026-07-07T09:05:00.000Z', dueDate: '2026-07-06', priority: null },
  ]);
});

test('sortTodosByUrgency returns a new urgency-sorted array without mutating input', () => {
  const todos = [
    { id: 'todo-1', text: 'No date', done: false, createdAt: '2026-07-07T09:00:00.000Z', dueDate: null, priority: null },
    { id: 'todo-2', text: 'Later', done: false, createdAt: '2026-07-07T09:05:00.000Z', dueDate: '2026-07-09', priority: null },
    { id: 'todo-3', text: 'Sooner', done: false, createdAt: '2026-07-07T09:10:00.000Z', dueDate: '2026-07-08', priority: null },
    { id: 'todo-4', text: 'Today', done: false, createdAt: '2026-07-07T09:15:00.000Z', dueDate: '2026-07-07', priority: null },
    { id: 'todo-5', text: 'Overdue', done: false, createdAt: '2026-07-07T09:20:00.000Z', dueDate: '2026-07-06', priority: null },
  ];

  const sorted = sortTodosByUrgency(todos, { todayDate: '2026-07-07' });

  assert.deepEqual(sorted.map((todo) => todo.id), ['todo-5', 'todo-4', 'todo-3', 'todo-2', 'todo-1']);
  assert.deepEqual(todos.map((todo) => todo.id), ['todo-1', 'todo-2', 'todo-3', 'todo-4', 'todo-5']);
});

test('countActiveTodos counts only todos that are not done', () => {
  const todos = [
    { id: 'todo-1', text: 'Write tests', done: false, createdAt: '2026-07-07T09:00:00.000Z', dueDate: null, priority: null },
    { id: 'todo-2', text: 'Ship code', done: true, createdAt: '2026-07-07T09:05:00.000Z', dueDate: '2026-07-06', priority: null },
    { id: 'todo-3', text: 'Review code', done: false, createdAt: '2026-07-07T09:10:00.000Z', dueDate: '2026-07-10', priority: null },
  ];

  assert.equal(countActiveTodos(todos), 2);
});

test('loadTodos returns empty array when key is missing', () => {
  const storage = makeStorage();
  assert.deepEqual(loadTodos(storage, 'kainos-todo:todos'), []);
});

test('loadTodos returns empty array for malformed json', () => {
  const storage = makeStorage({ 'kainos-todo:todos': '{broken' });
  assert.deepEqual(loadTodos(storage, 'kainos-todo:todos'), []);
});

test('loadTodos returns empty array when payload is not an array', () => {
  const storage = makeStorage({ 'kainos-todo:todos': '{"id":1}' });
  assert.deepEqual(loadTodos(storage, 'kainos-todo:todos'), []);
});

test('saveTodos writes JSON payload and loadTodos rehydrates it', () => {
  const storage = makeStorage();
  const todos = [{ id: 'todo-1', text: 'Write tests', done: false, createdAt: '2026-07-07T09:00:00.000Z', priority: null }];

  saveTodos(storage, 'kainos-todo:todos', todos);
  const snapshot = storage.dump();
  assert.equal(typeof snapshot['kainos-todo:todos'], 'string');

  const loaded = loadTodos(storage, 'kainos-todo:todos');
  assert.deepEqual(loaded, todos);
});

test('saveTodos stores empty array if input is not array', () => {
  const storage = makeStorage();
  saveTodos(storage, 'kainos-todo:todos', null);
  assert.equal(storage.dump()['kainos-todo:todos'], '[]');
});
