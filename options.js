const API_KEY_STORAGE_KEY = 'kainos-todo:apiKey';
const storageArea = globalThis.chrome?.storage?.local ?? null;

function storageGet(key) {
  if (!storageArea) {
    return Promise.resolve({});
  }

  return new Promise((resolve, reject) => {
    try {
      const maybePromise = storageArea.get(key, (result) => {
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
  if (!storageArea) {
    return Promise.resolve(false);
  }

  return new Promise((resolve, reject) => {
    try {
      const maybePromise = storageArea.set(items, () => {
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
  if (!storageArea) {
    return;
  }

  const stored = await storageGet(API_KEY_STORAGE_KEY);
  const apiKey = typeof stored[API_KEY_STORAGE_KEY] === 'string' ? stored[API_KEY_STORAGE_KEY] : '';
  document.getElementById('api-key-input').value = apiKey;
}

async function saveApiKey(key) {
  if (!storageArea) {
    return false;
  }

  return storageSet({ [API_KEY_STORAGE_KEY]: key });
}

document.getElementById('settings-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const key = document.getElementById('api-key-input').value.trim();
  const saveStatus = document.getElementById('save-status');

  const saved = await saveApiKey(key);
  saveStatus.textContent = saved ? 'Saved' : 'Storage unavailable';
});

void loadApiKey();
