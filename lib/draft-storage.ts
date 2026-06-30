// Client-side persistence for in-progress forms ("drafts").
//
// Text fields are stored in localStorage (small, synchronous, JSON-serializable).
// Image files are stored in IndexedDB, which can hold Blob/File objects natively
// and is not bound by the ~5MB string limit of localStorage.
//
// Every function is SSR-safe: it no-ops (or returns an empty value) when run
// outside the browser, so it is safe to import from a client component.

const DB_NAME = "vendsmoi-drafts";
const DB_VERSION = 1;
const IMAGE_STORE = "images";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

// ---------- Text fields (localStorage) ----------

export function saveDraftText(key: string, data: unknown): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Quota exceeded or storage disabled — drafts are best-effort, fail silently.
  }
}

export function loadDraftText<T>(key: string): T | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function clearDraftText(key: string): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore — nothing we can do if storage is unavailable.
  }
}

// ---------- Images (IndexedDB) ----------

function openDB(): Promise<IDBDatabase | null> {
  if (!isBrowser() || typeof indexedDB === "undefined") {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IMAGE_STORE)) {
        db.createObjectStore(IMAGE_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

interface StoredImage {
  name: string;
  type: string;
  blob: Blob;
}

export async function saveDraftImages(key: string, files: File[]): Promise<void> {
  const db = await openDB();
  if (!db) return;
  const payload: StoredImage[] = files.map((f) => ({
    name: f.name,
    type: f.type,
    blob: f,
  }));
  await new Promise<void>((resolve) => {
    const tx = db.transaction(IMAGE_STORE, "readwrite");
    tx.objectStore(IMAGE_STORE).put(payload, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
  db.close();
}

export async function loadDraftImages(key: string): Promise<File[]> {
  const db = await openDB();
  if (!db) return [];
  const stored = await new Promise<StoredImage[]>((resolve) => {
    const tx = db.transaction(IMAGE_STORE, "readonly");
    const request = tx.objectStore(IMAGE_STORE).get(key);
    request.onsuccess = () => resolve((request.result as StoredImage[]) ?? []);
    request.onerror = () => resolve([]);
  });
  db.close();
  return stored.map((img) => new File([img.blob], img.name, { type: img.type }));
}

export async function clearDraftImages(key: string): Promise<void> {
  const db = await openDB();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const tx = db.transaction(IMAGE_STORE, "readwrite");
    tx.objectStore(IMAGE_STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
  db.close();
}

// ---------- Combined ----------

export async function clearDraft(key: string): Promise<void> {
  clearDraftText(key);
  await clearDraftImages(key);
}
