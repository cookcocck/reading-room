import { getDb } from '../connection';

export interface Card {
  id: number;
  title: string;
  image_path: string;
  category: string;
  created_at: number;
}

export function getAllCards(): Card[] {
  const db = getDb();
  if (!db) return [];
  return db.prepare(`
    SELECT * FROM cards ORDER BY created_at DESC
  `).all() as unknown as Card[];
}

export function getCardById(id: number): Card | null {
  const db = getDb();
  if (!db) return null;
  const row = db.prepare(`SELECT * FROM cards WHERE id = ?`).get(id);
  return (row as unknown as Card) || null;
}

export function createCard(title: string, imagePath: string, category: string): number {
  const db = getDb();
  if (!db) return 0;
  const now = Math.floor(Date.now() / 1000);
  const result = db.prepare(`
    INSERT INTO cards (title, image_path, category, created_at)
    VALUES (?, ?, ?, ?)
  `).run(title, imagePath, category, now);
  return result.lastInsertRowid;
}

export function deleteCard(id: number): boolean {
  const db = getDb();
  if (!db) return false;
  db.prepare(`DELETE FROM cards WHERE id = ?`).run(id);
  return true;
}

export function getCardCategories(): string[] {
  const db = getDb();
  if (!db) return [];
  const rows = db.prepare(`
    SELECT DISTINCT category FROM cards WHERE category != '' ORDER BY category
  `).all() as unknown as Array<{ category: string }>;
  return rows.map(r => r.category);
}
