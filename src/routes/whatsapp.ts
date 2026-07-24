import { Hono } from 'hono';
import type { Bindings, WhatsAppSettings } from '../types';

const app = new Hono<{ Bindings: Bindings }>();

app.get('/', async (c) => {
  const settings = await c.env.DB.prepare(`SELECT id, api_key, sender_number, reminder_enabled FROM whatsapp_settings WHERE id = 1`).first<WhatsAppSettings>();
  return c.json(
    settings ?? { id: 1, api_key: '', sender_number: '', reminder_enabled: 0 }
  );
});

app.put('/', async (c) => {
  const body = await c.req.json<{ api_key: string; sender_number: string; reminder_enabled: boolean }>();

  await c.env.DB.prepare(
    `INSERT INTO whatsapp_settings (id, api_key, sender_number, reminder_enabled) VALUES (1, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET api_key = excluded.api_key, sender_number = excluded.sender_number, reminder_enabled = excluded.reminder_enabled`
  )
    .bind(body.api_key, body.sender_number, body.reminder_enabled ? 1 : 0)
    .run();

  return c.json({ status: 'ok' });
});

export default app;
