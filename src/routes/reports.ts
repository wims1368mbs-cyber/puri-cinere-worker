import { Hono } from 'hono';
import type { Bindings } from '../types';

const app = new Hono<{ Bindings: Bindings }>();

// GET /api/reports/summary — KPI bulan berjalan
app.get('/summary', async (c) => {
  const db = c.env.DB;

  const monthCount = await db
    .prepare(`SELECT COUNT(*) AS count FROM visits WHERE strftime('%Y-%m', scheduled_at) = strftime('%Y-%m', 'now')`)
    .first<{ count: number }>();

  const onTimeRate = await db
    .prepare(
      `SELECT ROUND(AVG(on_time) * 100) AS rate FROM visits
       WHERE on_time IS NOT NULL AND strftime('%Y-%m', scheduled_at) = strftime('%Y-%m', 'now')`
    )
    .first<{ rate: number | null }>();

  // Kunjungan ulang <7 hari: pasien yang punya 2+ kunjungan selesai dalam rentang 7 hari
  const repeatVisits = await db
    .prepare(
      `SELECT COUNT(*) AS count FROM (
         SELECT v1.id FROM visits v1
         JOIN visits v2 ON v2.patient_id = v1.patient_id AND v2.id != v1.id
           AND v2.status = 'selesai' AND v1.status = 'selesai'
           AND julianday(v1.scheduled_at) - julianday(v2.scheduled_at) BETWEEN 0 AND 7
         GROUP BY v1.id
       )`
    )
    .first<{ count: number }>();

  return c.json({
    visits_this_month: monthCount?.count ?? 0,
    on_time_rate: onTimeRate?.rate ?? 0,
    repeat_visits_within_7_days: repeatVisits?.count ?? 0,
    // Belum ada fitur survei kepuasan pasien — jangan tampilkan angka fiktif.
    family_satisfaction_nps: null,
  });
});

// GET /api/reports/weekly — jumlah kunjungan per minggu, 8 minggu terakhir
app.get('/weekly', async (c) => {
  const rows = await c.env.DB.prepare(
    `SELECT strftime('%Y-%W', scheduled_at) AS week_key, COUNT(*) AS count
     FROM visits
     WHERE scheduled_at >= datetime('now', '-56 days')
     GROUP BY week_key
     ORDER BY week_key`
  ).all<{ week_key: string; count: number }>();

  return c.json(rows.results);
});

export default app;
