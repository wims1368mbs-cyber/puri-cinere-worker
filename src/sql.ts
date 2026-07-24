export const VISIT_SELECT = `
  SELECT v.id, v.patient_id, p.name AS patient_name, v.doctor_id, d.name AS doctor_name,
         v.visit_type, v.location, v.scheduled_at, v.started_at, v.finished_at,
         v.status, v.duration_minutes, v.on_time
  FROM visits v
  JOIN patients p ON p.id = v.patient_id
  JOIN doctors d ON d.id = v.doctor_id`;
