import { Hono } from 'hono';
import type { Bindings, FamilyContact, Patient, Vital } from '../types';
import { computeRiskScores } from '../risk';

const app = new Hono<{ Bindings: Bindings }>();

async function getConditions(db: D1Database, patientId: number): Promise<string[]> {
  const rows = await db
    .prepare(`SELECT condition FROM patient_conditions WHERE patient_id = ? ORDER BY id`)
    .bind(patientId)
    .all<{ condition: string }>();
  return rows.results.map((r) => r.condition);
}

async function replaceConditions(db: D1Database, patientId: number, conditions: string[]) {
  await db.prepare(`DELETE FROM patient_conditions WHERE patient_id = ?`).bind(patientId).run();
  for (const condition of conditions) {
    if (!condition.trim()) continue;
    await db
      .prepare(`INSERT INTO patient_conditions (patient_id, condition) VALUES (?, ?)`)
      .bind(patientId, condition.trim())
      .run();
  }
}

app.get('/', async (c) => {
  const db = c.env.DB;
  const patients = await db
    .prepare(`SELECT id, name, address, phone, age, status, iot_fall_enabled, created_at FROM patients ORDER BY name`)
    .all<Patient>();

  const withConditions = await Promise.all(
    patients.results.map(async (p) => ({ ...p, conditions: await getConditions(db, p.id) }))
  );

  return c.json(withConditions);
});

app.get('/:id', async (c) => {
  const db = c.env.DB;
  const id = Number(c.req.param('id'));
  const patient = await db
    .prepare(`SELECT id, name, address, phone, age, status, iot_fall_enabled, created_at FROM patients WHERE id = ?`)
    .bind(id)
    .first<Patient>();

  if (!patient) return c.json({ error: 'patient not found' }, 404);

  const conditions = await getConditions(db, id);

  const latestVitalRow = await db
    .prepare(
      `SELECT v.blood_pressure, v.heart_rate, v.temperature, v.spo2, v.gds
       FROM vitals v JOIN visits vi ON vi.id = v.visit_id
       WHERE vi.patient_id = ? ORDER BY vi.scheduled_at DESC LIMIT 1`
    )
    .bind(id)
    .first<{ blood_pressure: string; heart_rate: number; temperature: number; spo2: number | null; gds: number | null }>();

  const riskScores = computeRiskScores({
    age: patient.age,
    conditions,
    iotFallEnabled: patient.iot_fall_enabled === 1,
    latestVital: latestVitalRow
      ? {
          bloodPressure: latestVitalRow.blood_pressure,
          heartRate: latestVitalRow.heart_rate,
          temperature: latestVitalRow.temperature,
          spo2: latestVitalRow.spo2,
          gds: latestVitalRow.gds,
        }
      : null,
  });

  const familyContacts = await db
    .prepare(`SELECT id, patient_id, name, phone, relation FROM family_contacts WHERE patient_id = ? ORDER BY id`)
    .bind(id)
    .all<FamilyContact>();

  return c.json({ ...patient, conditions, risk_scores: riskScores, family_contacts: familyContacts.results });
});

// GET /api/patients/:id/history — riwayat kunjungan + vital (untuk modal & tren risk score)
app.get('/:id/history', async (c) => {
  const db = c.env.DB;
  const id = Number(c.req.param('id'));

  const rows = await db
    .prepare(
      `SELECT vi.id AS visit_id, vi.scheduled_at, vi.status, d.name AS doctor_name,
              v.blood_pressure, v.heart_rate, v.temperature, v.spo2, v.gds, v.notes
       FROM visits vi
       JOIN doctors d ON d.id = vi.doctor_id
       LEFT JOIN vitals v ON v.visit_id = vi.id
       WHERE vi.patient_id = ? AND vi.status = 'selesai'
       ORDER BY vi.scheduled_at DESC`
    )
    .bind(id)
    .all();

  return c.json(rows.results);
});

app.post('/', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json<{
    name: string;
    address: string;
    phone: string;
    age?: number;
    status?: string;
    iot_fall_enabled?: boolean;
    conditions?: string[];
  }>();
  const status = body.status ?? 'active';

  const result = await db
    .prepare(`INSERT INTO patients (name, address, phone, age, status, iot_fall_enabled) VALUES (?, ?, ?, ?, ?, ?)`)
    .bind(body.name, body.address, body.phone, body.age ?? null, status, body.iot_fall_enabled ? 1 : 0)
    .run();

  const id = result.meta.last_row_id as number;
  if (body.conditions?.length) await replaceConditions(db, id, body.conditions);

  return c.json({ id }, 201);
});

app.put('/:id', async (c) => {
  const db = c.env.DB;
  const id = Number(c.req.param('id'));
  const body = await c.req.json<{
    name: string;
    address: string;
    phone: string;
    age?: number;
    status: string;
    iot_fall_enabled?: boolean;
    conditions?: string[];
  }>();

  await db
    .prepare(`UPDATE patients SET name = ?, address = ?, phone = ?, age = ?, status = ?, iot_fall_enabled = ? WHERE id = ?`)
    .bind(body.name, body.address, body.phone, body.age ?? null, body.status, body.iot_fall_enabled ? 1 : 0, id)
    .run();

  if (body.conditions) await replaceConditions(db, id, body.conditions);

  return c.json({ status: 'ok' });
});

// ---- Kontak keluarga (maks 3 per pasien) ----

app.get('/:id/family', async (c) => {
  const id = Number(c.req.param('id'));
  const rows = await c.env.DB
    .prepare(`SELECT id, patient_id, name, phone, relation FROM family_contacts WHERE patient_id = ? ORDER BY id`)
    .bind(id)
    .all<FamilyContact>();
  return c.json(rows.results);
});

app.post('/:id/family', async (c) => {
  const db = c.env.DB;
  const patientId = Number(c.req.param('id'));

  const countRow = await db
    .prepare(`SELECT COUNT(*) AS count FROM family_contacts WHERE patient_id = ?`)
    .bind(patientId)
    .first<{ count: number }>();
  if ((countRow?.count ?? 0) >= 3) {
    return c.json({ error: 'Maksimal 3 kontak keluarga per pasien' }, 400);
  }

  const body = await c.req.json<{ name: string; phone: string; relation: string }>();
  const result = await db
    .prepare(`INSERT INTO family_contacts (patient_id, name, phone, relation) VALUES (?, ?, ?, ?)`)
    .bind(patientId, body.name, body.phone, body.relation)
    .run();

  return c.json({ id: result.meta.last_row_id }, 201);
});

app.delete('/:id/family/:contactId', async (c) => {
  const contactId = Number(c.req.param('contactId'));
  await c.env.DB.prepare(`DELETE FROM family_contacts WHERE id = ?`).bind(contactId).run();
  return c.json({ status: 'ok' });
});

export default app;
