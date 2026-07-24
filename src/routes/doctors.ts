import { Hono } from 'hono';
import type { Bindings, Doctor, Visit } from '../types';
import { VISIT_SELECT } from '../sql';

const app = new Hono<{ Bindings: Bindings }>();

app.get('/', async (c) => {
  const rows = await c.env.DB.prepare(`SELECT id, name, role, phone FROM doctors ORDER BY name`).all<Doctor>();
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
  const body = await c.req.json<{ name: string; role: string; phone: string }>();

  const result = await c.env.DB.prepare(`INSERT INTO doctors (name, role, phone) VALUES (?, ?, ?)`)
    .bind(body.name, body.role, body.phone)
    .run();

  return c.json({ id: result.meta.last_row_id }, 201);
});

app.put('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json<{ name: string; role: string; phone: string }>();

  await c.env.DB.prepare(`UPDATE doctors SET name = ?, role = ?, phone = ? WHERE id = ?`)
    .bind(body.name, body.role, body.phone, id)
    .run();

  return c.json({ status: 'ok' });
});

export default app;
