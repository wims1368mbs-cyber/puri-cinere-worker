import { Hono } from 'hono';
import type { Bindings, WaReminderSetting, WhatsAppSettings } from '../types';

const app = new Hono<{ Bindings: Bindings }>();

// GET /api/settings/whatsapp/reminders — pengaturan pengingat per audiens (pasien/dokter/keluarga)
app.get('/reminders', async (c) => {
  const rows = await c.env.DB.prepare(`SELECT audience, enabled, timing FROM wa_reminder_settings ORDER BY audience`).all<WaReminderSetting>();
  return c.json(rows.results);
});

app.put('/reminders/:audience', async (c) => {
  const audience = c.req.param('audience');
  const body = await c.req.json<{ enabled: boolean; timing: string }>();

  await c.env.DB.prepare(`UPDATE wa_reminder_settings SET enabled = ?, timing = ? WHERE audience = ?`)
    .bind(body.enabled ? 1 : 0, body.timing, audience)
    .run();

  return c.json({ status: 'ok' });
});

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
