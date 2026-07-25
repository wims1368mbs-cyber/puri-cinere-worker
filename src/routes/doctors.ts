import { Hono } from 'hono';
import type { Bindings, Doctor, Visit } from '../types';
import { VISIT_SELECT } from '../sql';

const app = new Hono<{ Bindings: Bindings }>();

app.get('/', async (c) => {
  const rows = await c.env.DB.prepare(`SELECT id, name, role, specialty, phone FROM doctors ORDER BY name`).all<Doctor>();
  return c.json(rows.results);
});

// GET /api/doctors/stats — kunjungan hari ini, durasi rata-rata, ketepatan waktu per dokter
app.get('/stats', async (c) => {
  const rows = await c.env.DB.prepare(
    `SELECT d.id, d.name, d.role, d.specialty, d.phone,
            COUNT(CASE WHEN date(v.scheduled_at) = date('now') THEN 1 END) AS visits_today,
            ROUND(AVG(CASE WHEN v.duration_minutes IS NOT NULL THEN v.duration_minutes END)) AS avg_duration,
            ROUND(AVG(CASE WHEN v.on_time IS NOT NULL THEN v.on_time END) * 100) AS on_time_rate
     FROM doctors d
     LEFT JOIN visits v ON v.doctor_id = d.id
     GROUP BY d.id
     ORDER BY d.name`
  ).all();

  return c.json(rows.results);
});

app.get('/:id/activity', async (c) => {
  const id = Number(c.req.param('id'));
  const rows = await c.env.DB.prepare(`${VISIT_SELECT} WHERE v.doctor_id = ? ORDER BY v.scheduled_at DESC`)
    .bind(id)
    .all<Visit>();
  return c.json(rows.results);
});

app.post('/', async (c) => {
  const body = await c.req.json<{ name: string; role: string; specialty?: string; phone: string }>();

  const result = await c.env.DB.prepare(`INSERT INTO doctors (name, role, specialty, phone) VALUES (?, ?, ?, ?)`)
    .bind(body.name, body.role, body.specialty ?? '', body.phone)
    .run();

  return c.json({ id: result.meta.last_row_id }, 201);
});

app.put('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json<{ name: string; role: string; specialty?: string; phone: string }>();

  await c.env.DB.prepare(`UPDATE doctors SET name = ?, role = ?, specialty = ?, phone = ? WHERE id = ?`)
    .bind(body.name, body.role, body.specialty ?? '', body.phone, id)
    .run();

  return c.json({ status: 'ok' });
});

export default app;
