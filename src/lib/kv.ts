import fs from 'fs';
import path from 'path';

export interface LinkData {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  createdAt: string;
  kakaoPayUrl?: string;
}

// For local development: use a JSON file as mock KV store
const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'links.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '{}', 'utf-8');
  }
}

function readStore(): Record<string, LinkData> {
  ensureDataDir();
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      console.error('Invalid data format in links.json, resetting to empty store');
      return {};
    }
    return parsed;
  } catch (e) {
    console.error('Failed to parse links.json, resetting to empty store:', e);
    return {};
  }
}

// Atomic write: write to temp file first, then rename to avoid partial writes
function writeStore(data: Record<string, LinkData>) {
  ensureDataDir();
  const tempFile = path.join(DATA_DIR, `links.tmp.${Date.now()}.json`);
  try {
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DATA_FILE);
  } catch (e) {
    // Clean up temp file on failure
    try { fs.unlinkSync(tempFile); } catch { /* ignore */ }
    throw e;
  }
}

// Simple write queue to prevent concurrent read-modify-write race conditions
let writeQueue: Promise<void> = Promise.resolve();

function withWriteLock<T>(fn: () => T): Promise<T> {
  const result = writeQueue.then(fn);
  // Update queue to wait for this operation (ignore errors for queue chaining)
  writeQueue = result.then(() => {}, () => {});
  return result;
}

export async function saveLink(data: LinkData): Promise<void> {
  // TODO: In production (Cloudflare), use KV binding:
  // const kv = (process.env as any).LINKS_KV;
  // await kv.put(data.id, JSON.stringify(data));

  return withWriteLock(() => {
    const store = readStore();
    store[data.id] = data;
    writeStore(store);
  });
}

export async function getLink(id: string): Promise<LinkData | null> {
  // TODO: In production (Cloudflare), use KV binding:
  // const kv = (process.env as any).LINKS_KV;
  // const val = await kv.get(id);
  // return val ? JSON.parse(val) : null;

  const store = readStore();
  return store[id] || null;
}

export async function getAllLinks(): Promise<LinkData[]> {
  const store = readStore();
  return Object.values(store).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function deleteLink(id: string): Promise<boolean> {
  return withWriteLock(() => {
    const store = readStore();
    if (store[id]) {
      delete store[id];
      writeStore(store);
      return true;
    }
    return false;
  });
}

export async function updateLink(id: string, updates: Partial<LinkData>): Promise<LinkData | null> {
  return withWriteLock(() => {
    const store = readStore();
    if (store[id]) {
      store[id] = { ...store[id], ...updates };
      writeStore(store);
      return store[id];
    }
    return null;
  });
}
