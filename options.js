const API_KEY_STORAGE_KEY = 'kainos-todo:apiKey';
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

function setStatus(message) {
  const saveStatus = document.getElementById('save-status');
  saveStatus.textContent = message;
}

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
    return Promise.resolve(true);
  }

  if (storageMode !== STORAGE_MODE_EXTENSION) {
    return Promise.resolve(false);
  }

  return new Promise((resolve, reject) => {
    try {
      const maybePromise = chromeStorageArea.set(items, () => {
        const error = globalThis.chrome?.runtime?.lastError;
        if (error) {
          reject(new Error(error.message));
          return;
        }

        resolve(true);
      });

      if (maybePromise && typeof maybePromise.then === 'function') {
        maybePromise.then(() => resolve(true), reject);
      }
    } catch (error) {
      reject(error);
    }
  });
}

async function loadApiKey() {
  if (storageMode === STORAGE_MODE_NONE) {
    setStatus('Storage unavailable');
    return;
  }

  const stored = await storageGet(API_KEY_STORAGE_KEY);
  const apiKey = typeof stored[API_KEY_STORAGE_KEY] === 'string' ? stored[API_KEY_STORAGE_KEY] : '';
  document.getElementById('api-key-input').value = apiKey;

  if (storageMode === STORAGE_MODE_LOCAL) {
    setStatus('Using local browser storage (tab mode)');
  }
}

async function saveApiKey(key) {
  if (storageMode === STORAGE_MODE_NONE) {
    return false;
  }

  return storageSet({ [API_KEY_STORAGE_KEY]: key });
}

document.getElementById('settings-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const key = document.getElementById('api-key-input').value.trim();

  const saved = await saveApiKey(key);
  setStatus(saved ? 'Saved' : 'Storage unavailable');
});

void loadApiKey();
