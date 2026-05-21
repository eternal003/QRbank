import { getRequestContext } from '@cloudflare/next-on-pages';

// Minimal D1 types for TypeScript
interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: any;
}

interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

export interface LinkData {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  createdAt: string;
  kakaoPayUrl?: string;
}

// In-memory fallback for local development without Wrangler
const inMemoryStore = new Map<string, LinkData>();

function getDb() {
  try {
    const ctx = getRequestContext();
    const env = ctx?.env as any;
    if (env?.DB) return env.DB as D1Database;
  } catch (e) {
    // Not running in Cloudflare context
  }
  return null;
}

export async function saveLink(data: LinkData): Promise<void> {
  const db = getDb();
  if (db) {
    await db.prepare(
      'INSERT INTO links (id, bankName, accountNumber, accountHolder, kakaoPayUrl, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(
      data.id, data.bankName, data.accountNumber, data.accountHolder, data.kakaoPayUrl || null, data.createdAt
    ).run();
  } else {
    inMemoryStore.set(data.id, data);
  }
}

export async function getLink(id: string): Promise<LinkData | null> {
  const db = getDb();
  if (db) {
    const stmt = await db.prepare('SELECT * FROM links WHERE id = ?').bind(id).first<LinkData>();
    return stmt || null;
  }
  return inMemoryStore.get(id) || null;
}

export async function getAllLinks(): Promise<LinkData[]> {
  const db = getDb();
  if (db) {
    const { results } = await db.prepare('SELECT * FROM links ORDER BY createdAt DESC').all<LinkData>();
    return results || [];
  }
  return Array.from(inMemoryStore.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function deleteLink(id: string): Promise<boolean> {
  const db = getDb();
  if (db) {
    const info = await db.prepare('DELETE FROM links WHERE id = ?').bind(id).run();
    return info.meta.changes > 0;
  }
  return inMemoryStore.delete(id);
}

export async function updateLink(id: string, updates: Partial<LinkData>): Promise<LinkData | null> {
  const db = getDb();
  if (db) {
    const existing = await getLink(id);
    if (!existing) return null;
    const merged = { ...existing, ...updates };
    await db.prepare(
      'UPDATE links SET bankName = ?, accountNumber = ?, accountHolder = ?, kakaoPayUrl = ? WHERE id = ?'
    ).bind(
      merged.bankName, merged.accountNumber, merged.accountHolder, merged.kakaoPayUrl || null, id
    ).run();
    return merged;
  }
  
  const existing = inMemoryStore.get(id);
  if (existing) {
    const merged = { ...existing, ...updates };
    inMemoryStore.set(id, merged);
    return merged;
  }
  return null;
}
