import { Hono } from 'hono';
import type { Bindings, Patient } from '../types';

const app = new Hono<{ Bindings: Bindings }>();

app.get('/', async (c) => {
  const rows = await c.env.DB.prepare(`SELECT id, name, address, phone, status, created_at FROM patients ORDER BY name`).all<Patient>();
  return c.json(rows.results);
});

app.get('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const patient = await c.env.DB.prepare(`SELECT id, name, address, phone, status, created_at FROM patients WHERE id = ?`)
    .bind(id)
    .first<Patient>();

  if (!patient) return c.json({ error: 'patient not found' }, 404);
  return c.json(patient);
});

app.post('/', async (c) => {
  const body = await c.req.json<{ name: string; address: string; phone: string; status?: string }>();
  const status = body.status ?? 'active';

  const result = await c.env.DB.prepare(`INSERT INTO patients (name, address, phone, status) VALUES (?, ?, ?, ?)`)
    .bind(body.name, body.address, body.phone, status)
    .run();

  return c.json({ id: result.meta.last_row_id }, 201);
});

export default app;
