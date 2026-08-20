const DB_NAME = "verdensbordet-production";
const DB_VERSION = 1;
const ENTRY_STORE = "entries";
const SETTINGS_STORE = "settings";

let dbPromise;

function openDatabase() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(ENTRY_STORE)) {
        const entries = db.createObjectStore(ENTRY_STORE, { keyPath: "id" });
        entries.createIndex("cookedAt", "cookedAt");
        entries.createIndex("countryCode", "countryCode");
      }
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

async function withStore(storeName, mode, work) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    let result;
    try {
      result = work(store);
    } catch (error) {
      reject(error);
      return;
    }
    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export async function getEntries() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(ENTRY_STORE, "readonly");
    const request = transaction.objectStore(ENTRY_STORE).getAll();
    request.onsuccess = () => {
      const entries = request.result ?? [];
      entries.sort((a, b) => new Date(b.cookedAt) - new Date(a.cookedAt));
      resolve(entries);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getEntry(id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(ENTRY_STORE, "readonly").objectStore(ENTRY_STORE).get(id);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

export async function saveEntry(entry) {
  await withStore(ENTRY_STORE, "readwrite", (store) => store.put(entry));
  return entry;
}

export async function deleteEntry(id) {
  await withStore(ENTRY_STORE, "readwrite", (store) => store.delete(id));
}

export async function clearEntries() {
  await withStore(ENTRY_STORE, "readwrite", (store) => store.clear());
}

export async function getSetting(key, fallback = null) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(SETTINGS_STORE, "readonly").objectStore(SETTINGS_STORE).get(key);
    request.onsuccess = () => resolve(request.result?.value ?? fallback);
    request.onerror = () => reject(request.error);
  });
}

export async function setSetting(key, value) {
  await withStore(SETTINGS_STORE, "readwrite", (store) => store.put({ key, value }));
  return value;
}

export async function exportBackup() {
  const [entries, currentCountry, recipeDrafts, settings] = await Promise.all([
    getEntries(),
    getSetting("currentCountry"),
    getSetting("recipeDrafts", {}),
    getSetting("preferences", {}),
  ]);
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    app: "Verdensbordet",
    currentCountry,
    recipeDrafts,
    settings,
    entries,
  };
}

export async function importBackup(payload) {
  if (!payload || !Array.isArray(payload.entries)) throw new Error("Ugyldig backupfil");
  const db = await openDatabase();
  await new Promise((resolve, reject) => {
    const tx = db.transaction([ENTRY_STORE, SETTINGS_STORE], "readwrite");
    const entriesStore = tx.objectStore(ENTRY_STORE);
    const settingsStore = tx.objectStore(SETTINGS_STORE);
    payload.entries.forEach((entry) => entriesStore.put(entry));
    if (payload.currentCountry) settingsStore.put({ key: "currentCountry", value: payload.currentCountry });
    if (payload.recipeDrafts) settingsStore.put({ key: "recipeDrafts", value: payload.recipeDrafts });
    if (payload.settings) settingsStore.put({ key: "preferences", value: payload.settings });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

export async function compressImage(file, { maxWidth = 3600, maxHeight = 3600, quality = 0.9 } = {}) {
  if (!file?.type?.startsWith("image/")) throw new Error("Filen er ikke et bilde");
  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Bildet kunne ikke leses"));
      img.src = sourceUrl;
    });
    const scale = Math.min(1, maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: false });
    context.fillStyle = "#0a0b0c";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

export function downloadJSON(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
