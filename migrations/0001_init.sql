CREATE TABLE patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE doctors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('dokter', 'fisioterapis')),
    phone TEXT NOT NULL
);

CREATE TABLE visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL REFERENCES patients(id),
    doctor_id INTEGER NOT NULL REFERENCES doctors(id),
    visit_type TEXT NOT NULL,
    location TEXT NOT NULL,
    scheduled_at TEXT NOT NULL,
    started_at TEXT,
    finished_at TEXT,
    status TEXT NOT NULL DEFAULT 'terjadwal' CHECK (status IN ('terjadwal', 'berlangsung', 'selesai', 'batal')),
    duration_minutes INTEGER,
    on_time INTEGER
);

CREATE INDEX idx_visits_scheduled_at ON visits(scheduled_at);
CREATE INDEX idx_visits_status ON visits(status);

CREATE TABLE vitals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visit_id INTEGER NOT NULL REFERENCES visits(id),
    blood_pressure TEXT NOT NULL,
    heart_rate INTEGER NOT NULL,
    temperature REAL NOT NULL,
    notes TEXT
);

CREATE TABLE whatsapp_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    api_key TEXT NOT NULL DEFAULT '',
    sender_number TEXT NOT NULL DEFAULT '',
    reminder_enabled INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
);
