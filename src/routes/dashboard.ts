import { Hono } from 'hono';
import type { Bindings } from '../types';

const app = new Hono<{ Bindings: Bindings }>();

app.get('/', async (c) => {
  const db = c.env.DB;

  const statusCounts = await db
    .prepare(`SELECT status, COUNT(*) as count FROM visits WHERE date(scheduled_at) = date('now') GROUP BY status`)
    .all<{ status: string; count: number }>();

  let done = 0;
  let ongoing = 0;
  let scheduled = 0;
  for (const row of statusCounts.results) {
    if (row.status === 'selesai') done = row.count;
    if (row.status === 'berlangsung') ongoing = row.count;
    if (row.status === 'terjadwal') scheduled = row.count;
  }

  const onTimeRow = await db
    .prepare(
      `SELECT AVG(on_time) as rate FROM visits WHERE on_time IS NOT NULL AND scheduled_at >= datetime('now', '-7 days')`
    )
    .first<{ rate: number | null }>();

  const activePatientsRow = await db
    .prepare(`SELECT COUNT(*) as count FROM patients WHERE status = 'active'`)
    .first<{ count: number }>();

  const thisWeekRow = await db
    .prepare(`SELECT COUNT(*) as count FROM visits WHERE strftime('%Y-%W', scheduled_at) = strftime('%Y-%W', 'now')`)
    .first<{ count: number }>();

  const avgDurationRow = await db
    .prepare(`SELECT AVG(duration_minutes) as avg FROM visits WHERE duration_minutes IS NOT NULL`)
    .first<{ avg: number | null }>();

  return c.json({
    visits_today: done + ongoing + scheduled,
    visits_done: done,
    visits_ongoing: ongoing,
    visits_scheduled: scheduled,
    on_time_rate: (onTimeRow?.rate ?? 0) * 100,
    active_patients: activePatientsRow?.count ?? 0,
    visits_this_week: thisWeekRow?.count ?? 0,
    visits_week_target: 68,
    avg_duration_minutes: avgDurationRow?.avg ?? 0,
  });
});

export default app;
