const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, '..', 'bignetiktel.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS equipment_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS brands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    brand_id INTEGER NOT NULL,
    equipment_type_id INTEGER NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
    FOREIGN KEY (equipment_type_id) REFERENCES equipment_types(id) ON DELETE CASCADE,
    UNIQUE(name, brand_id)
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_id INTEGER NOT NULL,
    total_quantity INTEGER NOT NULL DEFAULT 0,
    available_quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER NOT NULL DEFAULT 0,
    unit_price REAL NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD' CHECK(currency IN ('USD', 'CUP')),
    warehouse_location TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    identity_card TEXT UNIQUE,
    address TEXT,
    phone TEXT,
    email TEXT,
    notes TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    sale_date TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    total_amount REAL NOT NULL DEFAULT 0,
    paid_amount REAL NOT NULL DEFAULT 0,
    payment_plan TEXT NOT NULL DEFAULT 'full' CHECK(payment_plan IN ('full', 'installments')),
    interest_rate REAL NOT NULL DEFAULT 0,
    term_months INTEGER NOT NULL DEFAULT 0,
    total_with_interest REAL NOT NULL DEFAULT 0,
    installment_amount REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending'
      CHECK(status IN ('pending', 'active', 'completed', 'cancelled')),
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    model_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD' CHECK(currency IN ('USD', 'CUP')),
    subtotal REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    payment_date TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    amount REAL NOT NULL,
    payment_method TEXT DEFAULT 'cash',
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
  );
`);

// Migraciones
try { db.prepare("ALTER TABLE sale_items ADD COLUMN mac_address TEXT").run() } catch (_) {}
try { db.prepare("ALTER TABLE clients ADD COLUMN first_name TEXT").run() } catch (_) {}
try { db.prepare("ALTER TABLE clients ADD COLUMN last_name TEXT").run() } catch (_) {}
// Poblar first_name desde name para registros existentes
db.prepare("UPDATE clients SET first_name = name WHERE first_name IS NULL").run();
try { db.prepare("ALTER TABLE clients ADD COLUMN id_document_type TEXT NOT NULL DEFAULT 'CI'").run() } catch (_) {}
try { db.prepare("ALTER TABLE clients ADD COLUMN province TEXT").run() } catch (_) {}
try { db.prepare("ALTER TABLE clients ADD COLUMN city TEXT").run() } catch (_) {}
try { db.prepare("ALTER TABLE sales ADD COLUMN next_payment_date TEXT").run() } catch (_) {}
try { db.prepare("ALTER TABLE inventory ADD COLUMN min_stock INTEGER NOT NULL DEFAULT 0").run() } catch (_) {}
try { db.prepare("ALTER TABLE users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0").run() } catch (_) {}
try { db.prepare("ALTER TABLE users ADD COLUMN email TEXT").run() } catch (_) {}
try { db.prepare("ALTER TABLE users ADD COLUMN phone TEXT").run() } catch (_) {}
try { db.prepare("ALTER TABLE users ADD COLUMN avatar TEXT").run() } catch (_) {}
db.exec(`
  CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    username TEXT,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id INTEGER,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Una sola vez: convertir timestamps UTC existentes a hora local
try {
  const done = db.prepare("SELECT value FROM settings WHERE key = 'utc_converted'").get();
  if (!done) {
    db.prepare("UPDATE activity_logs SET created_at = datetime(created_at, 'localtime') WHERE created_at IS NOT NULL").run();
    db.prepare("UPDATE users SET created_at = datetime(created_at, 'localtime') WHERE created_at IS NOT NULL;").run();
    db.prepare("UPDATE equipment_types SET created_at = datetime(created_at, 'localtime') WHERE created_at IS NOT NULL;").run();
    db.prepare("UPDATE brands SET created_at = datetime(created_at, 'localtime') WHERE created_at IS NOT NULL;").run();
    db.prepare("UPDATE models SET created_at = datetime(created_at, 'localtime') WHERE created_at IS NOT NULL;").run();
    db.prepare("UPDATE inventory SET created_at = datetime(created_at, 'localtime'), updated_at = datetime(updated_at, 'localtime');").run();
    db.prepare("UPDATE clients SET created_at = datetime(created_at, 'localtime') WHERE created_at IS NOT NULL;").run();
    db.prepare("UPDATE sales SET sale_date = datetime(sale_date, 'localtime'), created_at = datetime(created_at, 'localtime'), updated_at = datetime(updated_at, 'localtime');").run();
    db.prepare("UPDATE sale_items SET created_at = datetime(created_at, 'localtime') WHERE created_at IS NOT NULL;").run();
    db.prepare("UPDATE payments SET payment_date = datetime(payment_date, 'localtime'), created_at = datetime(created_at, 'localtime');").run();
    db.prepare("INSERT INTO settings (key, value) VALUES ('utc_converted', '1')").run();
  }
} catch (_) {}

module.exports = db;
