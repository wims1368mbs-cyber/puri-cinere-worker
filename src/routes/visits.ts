import { Hono } from 'hono';
import type { Bindings, Visit } from '../types';
import { VISIT_SELECT } from '../sql';

const app = new Hono<{ Bindings: Bindings }>();

// GET /api/visits?date=YYYY-MM-DD&status=&upcoming=true&limit=
// GET /api/visits?start=YYYY-MM-DD&end=YYYY-MM-DD  (inclusive range, for calendar views)
app.get('/', async (c) => {
  const db = c.env.DB;
  const upcoming = c.req.query('upcoming');
  const status = c.req.query('status');
  const start = c.req.query('start');
  const end = c.req.query('end');

  if (upcoming === 'true') {
    const limit = Number(c.req.query('limit') ?? '5') || 5;
    const rows = await db
      .prepare(
        `${VISIT_SELECT} WHERE v.status = 'terjadwal' AND v.scheduled_at >= datetime('now') ORDER BY v.scheduled_at LIMIT ?`
      )
      .bind(limit)
      .all<Visit>();
    return c.json(rows.results);
  }

  if (start && end) {
    let query = `${VISIT_SELECT} WHERE date(v.scheduled_at) BETWEEN ? AND ?`;
    const params: (string | number)[] = [start, end];
    if (status) {
      query += ' AND v.status = ?';
      params.push(status);
    }
    query += ' ORDER BY v.scheduled_at';

    const rows = await db.prepare(query).bind(...params).all<Visit>();
    return c.json(rows.results);
  }

  const date = c.req.query('date') ?? new Date().toISOString().split('T')[0];
  let query = `${VISIT_SELECT} WHERE date(v.scheduled_at) = ?`;
  const params: (string | number)[] = [date];
  if (status) {
    query += ' AND v.status = ?';
    params.push(status);
  }
  query += ' ORDER BY v.scheduled_at';

  const rows = await db.prepare(query).bind(...params).all<Visit>();
  return c.json(rows.results);
});

async function logChange(
  db: D1Database,
  visitId: number,
  changeType: 'created' | 'rescheduled' | 'doctor_changed' | 'status_changed' | 'cancelled',
  description: string
) {
  await db
    .prepare(`INSERT INTO schedule_changes (visit_id, change_type, description) VALUES (?, ?, ?)`)
    .bind(visitId, changeType, description)
    .run();
}

// POST /api/visits
app.post('/', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json<{
    patient_id: number;
    doctor_id: number;
    visit_type: string;
    location: string;
    scheduled_at: string;
  }>();

  const result = await db
    .prepare(
      `INSERT INTO visits (patient_id, doctor_id, visit_type, location, scheduled_at, status) VALUES (?, ?, ?, ?, ?, 'terjadwal')`
    )
    .bind(body.patient_id, body.doctor_id, body.visit_type, body.location, body.scheduled_at)
    .run();

  const id = result.meta.last_row_id as number;
  await logChange(db, id, 'created', `Kunjungan baru dijadwalkan: ${body.scheduled_at} — ${body.visit_type}`);

  return c.json({ id }, 201);
});

// PUT /api/visits/:id — edit/reschedule a visit
app.put('/:id', async (c) => {
  const db = c.env.DB;
  const id = Number(c.req.param('id'));
  const body = await c.req.json<{
    patient_id: number;
    doctor_id: number;
    visit_type: string;
    location: string;
    scheduled_at: string;
  }>();

  const before = await db
    .prepare(`SELECT doctor_id, scheduled_at FROM visits WHERE id = ?`)
    .bind(id)
    .first<{ doctor_id: number; scheduled_at: string }>();

  await db
    .prepare(
      `UPDATE visits SET patient_id = ?, doctor_id = ?, visit_type = ?, location = ?, scheduled_at = ? WHERE id = ?`
    )
    .bind(body.patient_id, body.doctor_id, body.visit_type, body.location, body.scheduled_at, id)
    .run();

  if (before) {
    if (before.doctor_id !== body.doctor_id) {
      await logChange(db, id, 'doctor_changed', `Dokter dialihkan (id ${before.doctor_id} → ${body.doctor_id})`);
    }
    if (before.scheduled_at !== body.scheduled_at) {
      await logChange(db, id, 'rescheduled', `Jadwal diubah: ${before.scheduled_at} → ${body.scheduled_at}`);
    }
  }

  return c.json({ status: 'ok' });
});

// POST /api/visits/:id/vitals — pencatatan vital manual oleh dokter saat kunjungan
app.post('/:id/vitals', async (c) => {
  const db = c.env.DB;
  const visitId = Number(c.req.param('id'));
  const body = await c.req.json<{
    blood_pressure: string;
    heart_rate: number;
    temperature: number;
    spo2?: number;
    gds?: number;
    notes?: string;
  }>();

  const existing = await db.prepare(`SELECT id FROM vitals WHERE visit_id = ?`).bind(visitId).first<{ id: number }>();

  if (existing) {
    await db
      .prepare(
        `UPDATE vitals SET blood_pressure = ?, heart_rate = ?, temperature = ?, spo2 = ?, gds = ?, notes = ? WHERE visit_id = ?`
      )
      .bind(body.blood_pressure, body.heart_rate, body.temperature, body.spo2 ?? null, body.gds ?? null, body.notes ?? '', visitId)
      .run();
  } else {
    await db
      .prepare(
        `INSERT INTO vitals (visit_id, blood_pressure, heart_rate, temperature, spo2, gds, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(visitId, body.blood_pressure, body.heart_rate, body.temperature, body.spo2 ?? null, body.gds ?? null, body.notes ?? '')
      .run();
  }

  return c.json({ status: 'ok' });
});

const VALID_STATUSES = new Set(['terjadwal', 'berlangsung', 'selesai', 'batal']);

// PATCH /api/visits/:id/status
app.patch('/:id/status', async (c) => {
  const db = c.env.DB;
  const id = Number(c.req.param('id'));
  const { status } = await c.req.json<{ status: string }>();

  if (!VALID_STATUSES.has(status)) {
    return c.json({ error: 'invalid status value' }, 400);
  }

  if (status === 'berlangsung') {
    await db
      .prepare(
        `UPDATE visits SET status = ?, started_at = datetime('now'),
         on_time = (datetime('now') <= datetime(scheduled_at, '+15 minutes')) WHERE id = ?`
      )
      .bind(status, id)
      .run();
  } else if (status === 'selesai') {
    await db
      .prepare(
        `UPDATE visits SET status = ?, finished_at = datetime('now'),
         duration_minutes = CAST((julianday('now') - julianday(started_at)) * 1440 AS INTEGER) WHERE id = ?`
      )
      .bind(status, id)
      .run();
  } else {
    await db.prepare(`UPDATE visits SET status = ? WHERE id = ?`).bind(status, id).run();
  }

  if (status === 'batal') {
    await logChange(db, id, 'cancelled', 'Kunjungan dibatalkan');
  }

  return c.json({ status: 'ok' });
});

// GET /api/visits/schedule-changes?limit= — log perubahan jadwal & pengalihan dokter
app.get('/schedule-changes', async (c) => {
  const limit = Number(c.req.query('limit') ?? '20') || 20;
  const rows = await c.env.DB.prepare(
    `SELECT sc.id, sc.visit_id, sc.changed_at, sc.change_type, sc.description, sc.changed_by, p.name AS patient_name
     FROM schedule_changes sc
     JOIN visits v ON v.id = sc.visit_id
     JOIN patients p ON p.id = v.patient_id
     ORDER BY sc.changed_at DESC
     LIMIT ?`
  )
    .bind(limit)
    .all();
  return c.json(rows.results);
});

export default app;
