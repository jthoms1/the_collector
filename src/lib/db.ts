import Database from 'better-sqlite3';
import path from 'path';
import type {
  Item,
  ItemWithType,
  CollectionType,
  PriceHistory,
  Tag,
  User,
  CreateItemInput,
  UpdateItemInput,
  CollectionStats,
  SearchParams
} from './schema';

const DB_PATH = path.join(process.cwd(), 'collection.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initializeSchema();
  }
  return db;
}

function initializeSchema() {
  const database = db!;

  database.exec(`
    CREATE TABLE IF NOT EXISTS collection_types (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY,
      collection_type_id INTEGER NOT NULL,
      user_id INTEGER,
      name TEXT NOT NULL,
      year INTEGER,
      publisher TEXT,
      series TEXT,
      issue_number TEXT,
      variant TEXT,
      condition_grade TEXT,
      professional_grade REAL,
      grading_company TEXT,
      cert_number TEXT,
      purchase_price REAL,
      purchase_date TEXT,
      estimated_value REAL,
      value_updated_at TEXT,
      image_path TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (collection_type_id) REFERENCES collection_types(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS price_history (
      id INTEGER PRIMARY KEY,
      item_id INTEGER NOT NULL,
      price REAL NOT NULL,
      source TEXT,
      recorded_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS item_tags (
      item_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (item_id, tag_id),
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_items_collection_type ON items(collection_type_id);
    CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);
    CREATE INDEX IF NOT EXISTS idx_items_year ON items(year);
    CREATE INDEX IF NOT EXISTS idx_price_history_item ON price_history(item_id);
  `);

  // Seed default collection types if they don't exist
  const typesCount = database.prepare('SELECT COUNT(*) as count FROM collection_types').get() as { count: number };
  if (typesCount.count === 0) {
    const insertType = database.prepare('INSERT INTO collection_types (name, description) VALUES (?, ?)');
    insertType.run('Cards', 'Trading cards, sports cards, and collectible card games');
    insertType.run('Comics', 'Comic books, graphic novels, and manga');
  }

  // Seed default users if they don't exist
  const usersCount = database.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (usersCount.count === 0) {
    const insertUser = database.prepare('INSERT INTO users (name) VALUES (?)');
    insertUser.run('Josh');
    insertUser.run('Ellie');
  }
}

// Collection Types
export function getCollectionTypes(): CollectionType[] {
  return getDb().prepare('SELECT * FROM collection_types ORDER BY name').all() as CollectionType[];
}

export function getCollectionType(id: number): CollectionType | undefined {
  return getDb().prepare('SELECT * FROM collection_types WHERE id = ?').get(id) as CollectionType | undefined;
}

export function getCollectionTypeByName(name: string): CollectionType | undefined {
  return getDb().prepare('SELECT * FROM collection_types WHERE LOWER(name) = LOWER(?)').get(name) as CollectionType | undefined;
}

// Items
export function getItems(typeId?: number, limit = 100, offset = 0): ItemWithType[] {
  let query = `
    SELECT items.*, collection_types.name as collection_type_name
    FROM items
    JOIN collection_types ON items.collection_type_id = collection_types.id
  `;
  const params: (number | string)[] = [];

  if (typeId) {
    query += ' WHERE items.collection_type_id = ?';
    params.push(typeId);
  }

  query += ' ORDER BY items.updated_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return getDb().prepare(query).all(...params) as ItemWithType[];
}

export function getItem(id: number): ItemWithType | undefined {
  return getDb().prepare(`
    SELECT items.*, collection_types.name as collection_type_name
    FROM items
    JOIN collection_types ON items.collection_type_id = collection_types.id
    WHERE items.id = ?
  `).get(id) as ItemWithType | undefined;
}

export function createItem(input: CreateItemInput): Item {
  const db = getDb();
  const now = new Date().toISOString();

  const result = db.prepare(`
    INSERT INTO items (
      collection_type_id, user_id, name, year, publisher, series, issue_number,
      variant, condition_grade, professional_grade, grading_company,
      cert_number, purchase_price, purchase_date, estimated_value,
      value_updated_at, image_path, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.collection_type_id,
    input.user_id ?? null,
    input.name,
    input.year ?? null,
    input.publisher ?? null,
    input.series ?? null,
    input.issue_number ?? null,
    input.variant ?? null,
    input.condition_grade ?? null,
    input.professional_grade ?? null,
    input.grading_company ?? null,
    input.cert_number ?? null,
    input.purchase_price ?? null,
    input.purchase_date ?? null,
    input.estimated_value ?? null,
    input.estimated_value ? now : null,
    input.image_path ?? null,
    input.notes ?? null,
    now,
    now
  );

  return getItem(result.lastInsertRowid as number) as Item;
}

export function updateItem(input: UpdateItemInput): Item | undefined {
  const db = getDb();
  const existing = getItem(input.id);
  if (!existing) return undefined;

  const now = new Date().toISOString();
  const fields: string[] = ['updated_at = ?'];
  const values: (string | number | null)[] = [now];

  const updateFields = [
    'collection_type_id', 'user_id', 'name', 'year', 'publisher', 'series', 'issue_number',
    'variant', 'condition_grade', 'professional_grade', 'grading_company',
    'cert_number', 'purchase_price', 'purchase_date', 'estimated_value',
    'image_path', 'notes'
  ];

  for (const field of updateFields) {
    if (field in input) {
      fields.push(`${field} = ?`);
      values.push((input as Record<string, unknown>)[field] as string | number | null);
    }
  }

  // Update value_updated_at if estimated_value changed
  if ('estimated_value' in input) {
    fields.push('value_updated_at = ?');
    values.push(now);
  }

  values.push(input.id);

  db.prepare(`UPDATE items SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  return getItem(input.id);
}

export function deleteItem(id: number): boolean {
  const result = getDb().prepare('DELETE FROM items WHERE id = ?').run(id);
  return result.changes > 0;
}

// Search
export function searchItems(params: SearchParams): ItemWithType[] {
  const db = getDb();
  let query = `
    SELECT items.*, collection_types.name as collection_type_name
    FROM items
    JOIN collection_types ON items.collection_type_id = collection_types.id
    WHERE 1=1
  `;
  const queryParams: (string | number)[] = [];

  if (params.q) {
    query += ` AND (
      items.name LIKE ? OR
      items.publisher LIKE ? OR
      items.series LIKE ? OR
      items.notes LIKE ?
    )`;
    const searchTerm = `%${params.q}%`;
    queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  if (params.type) {
    query += ' AND items.collection_type_id = ?';
    queryParams.push(params.type);
  }

  if (params.minValue !== undefined) {
    query += ' AND items.estimated_value >= ?';
    queryParams.push(params.minValue);
  }

  if (params.maxValue !== undefined) {
    query += ' AND items.estimated_value <= ?';
    queryParams.push(params.maxValue);
  }

  if (params.condition) {
    query += ' AND items.condition_grade = ?';
    queryParams.push(params.condition);
  }

  if (params.year) {
    query += ' AND items.year = ?';
    queryParams.push(params.year);
  }

  query += ' ORDER BY items.updated_at DESC';
  query += ` LIMIT ? OFFSET ?`;
  queryParams.push(params.limit ?? 50, params.offset ?? 0);

  return db.prepare(query).all(...queryParams) as ItemWithType[];
}

// Statistics
export function getStats(): CollectionStats {
  const db = getDb();

  const totals = db.prepare(`
    SELECT
      COUNT(*) as totalItems,
      COALESCE(SUM(estimated_value), 0) as totalValue,
      COALESCE(SUM(purchase_price), 0) as totalInvested
    FROM items
  `).get() as { totalItems: number; totalValue: number; totalInvested: number };

  const itemsByType = db.prepare(`
    SELECT collection_types.name, COUNT(*) as count
    FROM items
    JOIN collection_types ON items.collection_type_id = collection_types.id
    GROUP BY collection_types.id
    ORDER BY count DESC
  `).all() as { name: string; count: number }[];

  const recentItems = db.prepare(`
    SELECT items.*, collection_types.name as collection_type_name
    FROM items
    JOIN collection_types ON items.collection_type_id = collection_types.id
    ORDER BY items.created_at DESC
    LIMIT 5
  `).all() as ItemWithType[];

  const valueByCondition = db.prepare(`
    SELECT
      COALESCE(condition_grade, 'Ungraded') as condition,
      COALESCE(SUM(estimated_value), 0) as value
    FROM items
    GROUP BY condition_grade
    ORDER BY value DESC
  `).all() as { condition: string; value: number }[];

  return {
    ...totals,
    itemsByType,
    recentItems,
    valueByCondition
  };
}

// Price History
export function addPriceHistory(itemId: number, price: number, source = 'manual'): PriceHistory {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO price_history (item_id, price, source)
    VALUES (?, ?, ?)
  `).run(itemId, price, source);

  return db.prepare('SELECT * FROM price_history WHERE id = ?')
    .get(result.lastInsertRowid) as PriceHistory;
}

export function getPriceHistory(itemId: number): PriceHistory[] {
  return getDb().prepare(`
    SELECT * FROM price_history
    WHERE item_id = ?
    ORDER BY recorded_at DESC
  `).all(itemId) as PriceHistory[];
}

// Tags
export function getTags(): Tag[] {
  return getDb().prepare('SELECT * FROM tags ORDER BY name').all() as Tag[];
}

export function getItemTags(itemId: number): Tag[] {
  return getDb().prepare(`
    SELECT tags.* FROM tags
    JOIN item_tags ON tags.id = item_tags.tag_id
    WHERE item_tags.item_id = ?
    ORDER BY tags.name
  `).all(itemId) as Tag[];
}

export function addTagToItem(itemId: number, tagName: string): void {
  const db = getDb();

  // Get or create tag
  let tag = db.prepare('SELECT * FROM tags WHERE LOWER(name) = LOWER(?)').get(tagName) as Tag | undefined;
  if (!tag) {
    const result = db.prepare('INSERT INTO tags (name) VALUES (?)').run(tagName);
    tag = { id: result.lastInsertRowid as number, name: tagName };
  }

  // Add to item (ignore if already exists)
  db.prepare('INSERT OR IGNORE INTO item_tags (item_id, tag_id) VALUES (?, ?)').run(itemId, tag.id);
}

export function removeTagFromItem(itemId: number, tagId: number): void {
  getDb().prepare('DELETE FROM item_tags WHERE item_id = ? AND tag_id = ?').run(itemId, tagId);
}

// Utility to count items
export function countItems(typeId?: number): number {
  let query = 'SELECT COUNT(*) as count FROM items';
  if (typeId) {
    query += ' WHERE collection_type_id = ?';
    return (getDb().prepare(query).get(typeId) as { count: number }).count;
  }
  return (getDb().prepare(query).get() as { count: number }).count;
}

// Users
export function getUsers(): User[] {
  return getDb().prepare('SELECT * FROM users ORDER BY name').all() as User[];
}

export function getUser(id: number): User | undefined {
  return getDb().prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
}
