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

export default app;
