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
// RBAC: permisos por módulo (JSON array de claves). super_admin ignora esto (acceso total).
try { db.prepare("ALTER TABLE users ADD COLUMN permissions TEXT").run() } catch (_) {}
// Grandfathering: los 'admin' existentes conservan acceso a la operación diaria.
db.prepare("UPDATE users SET permissions = ? WHERE role = 'admin' AND permissions IS NULL")
  .run(JSON.stringify(['inventory', 'sales', 'clients', 'payments', 'hr']));
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

  -- ===== Módulo Reloj / RRHH =====
  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_code TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT,
    position TEXT,
    department TEXT,
    phone TEXT,
    email TEXT,
    hire_date TEXT,
    pay_type TEXT NOT NULL DEFAULT 'hourly' CHECK(pay_type IN ('hourly', 'monthly')),
    pay_rate REAL NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'CUP' CHECK(currency IN ('USD', 'CUP')),
    photo TEXT,
    face_descriptor TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS time_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    check_in TEXT NOT NULL,
    check_out TEXT,
    hours REAL,
    method TEXT NOT NULL DEFAULT 'manual' CHECK(method IN ('manual', 'kiosk', 'face')),
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_time_employee ON time_entries(employee_id);
  CREATE INDEX IF NOT EXISTS idx_time_checkin ON time_entries(check_in);

  CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    location TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );
`);

// Ficha de empleado ampliada (documento, datos personales, departamento).
try { db.prepare("ALTER TABLE employees ADD COLUMN second_name TEXT").run() } catch (_) {}
try { db.prepare("ALTER TABLE employees ADD COLUMN document_type TEXT NOT NULL DEFAULT 'CI'").run() } catch (_) {}
try { db.prepare("ALTER TABLE employees ADD COLUMN document_number TEXT").run() } catch (_) {}
try { db.prepare("ALTER TABLE employees ADD COLUMN address TEXT").run() } catch (_) {}
try { db.prepare("ALTER TABLE employees ADD COLUMN birth_date TEXT").run() } catch (_) {}
try { db.prepare("ALTER TABLE employees ADD COLUMN department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL").run() } catch (_) {}
// Portal del empleado: credenciales propias (separadas de users).
try { db.prepare("ALTER TABLE employees ADD COLUMN password TEXT").run() } catch (_) {}
try { db.prepare("ALTER TABLE employees ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 1").run() } catch (_) {}
try { db.prepare("ALTER TABLE employees ADD COLUMN portal_last_login TEXT").run() } catch (_) {}
try { db.prepare("ALTER TABLE employees ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0").run() } catch (_) {}
// Días de vacaciones anuales por empleado (Cuba: ~30 días).
try { db.prepare("ALTER TABLE employees ADD COLUMN vacation_days_per_year INTEGER NOT NULL DEFAULT 30").run() } catch (_) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS leave_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    type TEXT NOT NULL DEFAULT 'vacaciones' CHECK(type IN ('vacaciones', 'enfermedad', 'personal')),
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    days INTEGER NOT NULL DEFAULT 1,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pendiente' CHECK(status IN ('pendiente', 'aprobada', 'rechazada')),
    admin_note TEXT,
    decided_by TEXT,
    decided_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_leave_employee ON leave_requests(employee_id);

  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'abierto' CHECK(status IN ('abierto', 'cerrado')),
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS ticket_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    author_type TEXT NOT NULL CHECK(author_type IN ('empleado', 'admin')),
    author_name TEXT,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_ticketmsg_ticket ON ticket_messages(ticket_id);

  -- Notificaciones (para RRHH y para empleados).
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    audience TEXT NOT NULL CHECK(audience IN ('hr', 'employee')),
    employee_id INTEGER,
    type TEXT NOT NULL,
    title TEXT,
    body TEXT,
    link TEXT,
    read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_notif_audience ON notifications(audience, read);
  CREATE INDEX IF NOT EXISTS idx_notif_employee ON notifications(employee_id, read);

  -- Solicitudes de corrección de horario (el empleado pide arreglar una marca).
  CREATE TABLE IF NOT EXISTS time_change_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    entry_id INTEGER,
    date TEXT NOT NULL,
    requested_check_in TEXT,
    requested_check_out TEXT,
    reason_type TEXT,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pendiente' CHECK(status IN ('pendiente', 'aprobada', 'rechazada')),
    admin_note TEXT,
    decided_by TEXT,
    decided_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_tcr_employee ON time_change_requests(employee_id);
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
