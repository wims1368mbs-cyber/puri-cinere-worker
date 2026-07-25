-- Perluasan skema: registry pasien lengkap, statistik dokter, risk score,
-- log perubahan jadwal, pengaturan WhatsApp per audiens + kontak keluarga,
-- dan log panggilan darurat Call Center.

ALTER TABLE patients ADD COLUMN age INTEGER;
ALTER TABLE patients ADD COLUMN iot_fall_enabled INTEGER NOT NULL DEFAULT 0;

ALTER TABLE doctors ADD COLUMN specialty TEXT NOT NULL DEFAULT '';

ALTER TABLE vitals ADD COLUMN spo2 INTEGER;
ALTER TABLE vitals ADD COLUMN gds INTEGER;

CREATE TABLE patient_conditions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL REFERENCES patients(id),
    condition TEXT NOT NULL
);
CREATE INDEX idx_patient_conditions_patient ON patient_conditions(patient_id);

CREATE TABLE schedule_changes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visit_id INTEGER NOT NULL REFERENCES visits(id),
    changed_at TEXT NOT NULL DEFAULT (datetime('now')),
    change_type TEXT NOT NULL CHECK (change_type IN ('created', 'rescheduled', 'doctor_changed', 'status_changed', 'cancelled')),
    description TEXT NOT NULL,
    changed_by TEXT NOT NULL DEFAULT 'Admin'
);
CREATE INDEX idx_schedule_changes_visit ON schedule_changes(visit_id);

CREATE TABLE family_contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL REFERENCES patients(id),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    relation TEXT NOT NULL
);
CREATE INDEX idx_family_contacts_patient ON family_contacts(patient_id);

CREATE TABLE wa_reminder_settings (
    audience TEXT PRIMARY KEY CHECK (audience IN ('pasien', 'dokter', 'keluarga')),
    enabled INTEGER NOT NULL DEFAULT 1,
    timing TEXT NOT NULL
);
INSERT INTO wa_reminder_settings (audience, enabled, timing) VALUES
    ('pasien', 1, 'H-1 hari + H-2 jam'),
    ('dokter', 1, 'H-1 jam sebelum kunjungan'),
    ('keluarga', 1, 'Setelah kunjungan + H-1 hari');

CREATE TABLE call_center_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    phone_number TEXT NOT NULL DEFAULT '',
    hours TEXT NOT NULL DEFAULT '24/7',
    connected INTEGER NOT NULL DEFAULT 0
);
INSERT INTO call_center_settings (id, phone_number, hours, connected) VALUES (1, '', '24/7', 0);

CREATE TABLE emergency_calls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER REFERENCES patients(id),
    caller_name TEXT NOT NULL,
    complaint TEXT NOT NULL,
    escalation TEXT NOT NULL,
    status TEXT NOT NULL,
    occurred_at TEXT NOT NULL DEFAULT (datetime('now')),
    auto_triggered INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_emergency_calls_occurred ON emergency_calls(occurred_at);
