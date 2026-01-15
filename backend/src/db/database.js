import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database placering
const DB_PATH = join(__dirname, 'database.sqlite');

// Opret database forbindelse
const db = Database(DB_PATH);

// Aktiver foreign keys
db.pragma('foreign_keys = ON');

// Initialiser database med schema
export function initializeDatabase() {
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    db.exec(schema);
    console.log('Database initialiseret');
}

export default db;
