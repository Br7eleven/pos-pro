-- Initial schema for Nurture POS Pro

CREATE TABLE IF NOT EXISTS staff (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  pin_hash   TEXT    NOT NULL,
  role       TEXT    NOT NULL CHECK(role IN ('cashier','manager')),
  active     INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS categories (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  name  TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#85967c'
);

CREATE TABLE IF NOT EXISTS products (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  barcode         TEXT UNIQUE,
  name            TEXT    NOT NULL,
  description     TEXT,
  category_id     INTEGER REFERENCES categories(id),
  price           INTEGER NOT NULL,
  cost_price      INTEGER NOT NULL DEFAULT 0,
  stock_quantity  INTEGER NOT NULL DEFAULT 0,
  low_stock_alert INTEGER NOT NULL DEFAULT 5,
  image_path      TEXT,
  active          INTEGER NOT NULL DEFAULT 1,
  created_at      INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at      INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_products_barcode  ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_name     ON products(name);

CREATE TABLE IF NOT EXISTS customers (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT NOT NULL,
  phone          TEXT UNIQUE,
  email          TEXT UNIQUE,
  loyalty_points INTEGER NOT NULL DEFAULT 0,
  notes          TEXT,
  created_at     INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at     INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

CREATE TABLE IF NOT EXISTS transactions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  type            TEXT    NOT NULL CHECK(type IN ('sale','return','refund')),
  status          TEXT    NOT NULL DEFAULT 'completed' CHECK(status IN ('completed','voided')),
  customer_id     INTEGER REFERENCES customers(id),
  staff_id        INTEGER NOT NULL REFERENCES staff(id),
  subtotal        INTEGER NOT NULL,
  discount        INTEGER NOT NULL DEFAULT 0,
  tax             INTEGER NOT NULL DEFAULT 0,
  total           INTEGER NOT NULL,
  payment_method  TEXT    NOT NULL CHECK(payment_method IN ('cash','card','mixed')),
  amount_tendered INTEGER,
  change_given    INTEGER,
  notes           TEXT,
  original_tx_id  INTEGER REFERENCES transactions(id),
  created_at      INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_transactions_created  ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_staff    ON transactions(staff_id);
CREATE INDEX IF NOT EXISTS idx_transactions_customer ON transactions(customer_id);

CREATE TABLE IF NOT EXISTS transaction_items (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  product_id     INTEGER NOT NULL REFERENCES products(id),
  product_name   TEXT    NOT NULL,
  unit_price     INTEGER NOT NULL,
  quantity       INTEGER NOT NULL,
  discount       INTEGER NOT NULL DEFAULT 0,
  line_total     INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tx_items_transaction ON transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_tx_items_product     ON transaction_items(product_id);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT OR IGNORE INTO settings VALUES
  ('store_name',        'My Shop'),
  ('store_address',     ''),
  ('store_phone',       ''),
  ('currency_symbol',   'Rs.'),
  ('tax_rate',          '0'),
  ('receipt_footer',    'Thank you for shopping with us!'),
  ('idle_timeout_mins', '5'),
  ('printer_name',      '');

-- Seed a default manager so first launch works
INSERT OR IGNORE INTO staff (id, name, pin_hash, role)
VALUES (1, 'Manager', '$2a$10$rOzWq6K1V3pZ8N2mX4L5euKvQw7tJ9nHdCyF0bMgAiEsPl3uYR6Wy', 'manager');
-- default PIN: 1234 (bcrypt hash above — user should change in Settings)
