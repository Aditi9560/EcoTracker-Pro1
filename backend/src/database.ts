import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = process.env.DATABASE_PATH || "./data/ecotracker.db";

// Ensure directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// @ts-ignore
const db = new Database(DB_PATH) as any;

// Enable WAL mode for better performance
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export function initializeDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      avatar_color TEXT DEFAULT '#22c55e',
      units TEXT DEFAULT 'metric',
      grid_region TEXT DEFAULT 'global_avg',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('transport', 'energy', 'food', 'shopping', 'waste')),
      type TEXT NOT NULL,
      description TEXT,
      value REAL NOT NULL,
      unit TEXT NOT NULL,
      date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS emissions (
      id TEXT PRIMARY KEY,
      activity_id TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL,
      co2_kg REAL NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      target_co2_kg REAL NOT NULL,
      period TEXT NOT NULL CHECK(period IN ('weekly', 'monthly', 'yearly')),
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'failed', 'cancelled')),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_activities_user_date ON activities(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_emissions_user_date ON emissions(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_emissions_category ON emissions(category);
    CREATE INDEX IF NOT EXISTS idx_goals_user_status ON goals(user_id, status);
  `);

  // Migrate: add new user columns if upgrading from older schema
  const columns = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
  const columnNames = columns.map((c) => c.name);
  if (!columnNames.includes("avatar_color")) {
    db.exec("ALTER TABLE users ADD COLUMN avatar_color TEXT DEFAULT '#22c55e'");
  }
  if (!columnNames.includes("units")) {
    db.exec("ALTER TABLE users ADD COLUMN units TEXT DEFAULT 'metric'");
  }
  if (!columnNames.includes("grid_region")) {
    db.exec("ALTER TABLE users ADD COLUMN grid_region TEXT DEFAULT 'global_avg'");
  }
}

export default db;
