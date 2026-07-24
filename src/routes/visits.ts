import { Hono } from 'hono';
import type { Bindings, Visit } from '../types';
import { VISIT_SELECT } from '../sql';

const app = new Hono<{ Bindings: Bindings }>();

// GET /api/visits?date=YYYY-MM-DD&status=&upcoming=true&limit=
app.get('/', async (c) => {
  const db = c.env.DB;
  const upcoming = c.req.query('upcoming');
  const status = c.req.query('status');

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

  return c.json({ id: result.meta.last_row_id }, 201);
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

  return c.json({ status: 'ok' });
});

export default app;
