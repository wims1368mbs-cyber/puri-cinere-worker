import { Hono } from 'hono';
import type { Bindings, CallCenterSettings, EmergencyCall } from '../types';

const app = new Hono<{ Bindings: Bindings }>();

app.get('/settings', async (c) => {
  const settings = await c.env.DB.prepare(`SELECT id, phone_number, hours, connected FROM call_center_settings WHERE id = 1`).first<CallCenterSettings>();
  return c.json(settings ?? { id: 1, phone_number: '', hours: '24/7', connected: 0 });
});

app.put('/settings', async (c) => {
  const body = await c.req.json<{ phone_number: string; hours: string; connected: boolean }>();

  await c.env.DB.prepare(
    `INSERT INTO call_center_settings (id, phone_number, hours, connected) VALUES (1, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET phone_number = excluded.phone_number, hours = excluded.hours, connected = excluded.connected`
  )
    .bind(body.phone_number, body.hours, body.connected ? 1 : 0)
    .run();

  return c.json({ status: 'ok' });
});

app.get('/calls', async (c) => {
  const limit = Number(c.req.query('limit') ?? '30') || 30;
  const rows = await c.env.DB.prepare(
    `SELECT ec.id, ec.patient_id, p.name AS patient_name, ec.caller_name, ec.complaint, ec.escalation, ec.status, ec.occurred_at, ec.auto_triggered
     FROM emergency_calls ec
     LEFT JOIN patients p ON p.id = ec.patient_id
     ORDER BY ec.occurred_at DESC
     LIMIT ?`
  )
    .bind(limit)
    .all<EmergencyCall>();
  return c.json(rows.results);
});

app.post('/calls', async (c) => {
  const body = await c.req.json<{
    patient_id?: number;
    caller_name: string;
    complaint: string;
    escalation: string;
    status: string;
    auto_triggered?: boolean;
  }>();

  const result = await c.env.DB.prepare(
    `INSERT INTO emergency_calls (patient_id, caller_name, complaint, escalation, status, auto_triggered) VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(body.patient_id ?? null, body.caller_name, body.complaint, body.escalation, body.status, body.auto_triggered ? 1 : 0)
    .run();

  return c.json({ id: result.meta.last_row_id }, 201);
});

export default app;
