export type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
};

export type Visit = {
  id: number;
  patient_id: number;
  patient_name: string;
  doctor_id: number;
  doctor_name: string;
  visit_type: string;
  location: string;
  scheduled_at: string;
  started_at: string | null;
  finished_at: string | null;
  status: 'terjadwal' | 'berlangsung' | 'selesai' | 'batal';
  duration_minutes: number | null;
  on_time: number | null;
};

export type Patient = {
  id: number;
  name: string;
  address: string;
  phone: string;
  age: number | null;
  status: 'active' | 'inactive';
  iot_fall_enabled: number;
  created_at: string;
};

export type Doctor = {
  id: number;
  name: string;
  role: 'dokter' | 'fisioterapis';
  specialty: string;
  phone: string;
};

export type Vital = {
  id: number;
  visit_id: number;
  blood_pressure: string;
  heart_rate: number;
  temperature: number;
  spo2: number | null;
  gds: number | null;
  notes: string;
};

export type WhatsAppSettings = {
  id: number;
  api_key: string;
  sender_number: string;
  reminder_enabled: number;
};

export type WaReminderSetting = {
  audience: 'pasien' | 'dokter' | 'keluarga';
  enabled: number;
  timing: string;
};

export type FamilyContact = {
  id: number;
  patient_id: number;
  name: string;
  phone: string;
  relation: string;
};

export type CallCenterSettings = {
  id: number;
  phone_number: string;
  hours: string;
  connected: number;
};

export type EmergencyCall = {
  id: number;
  patient_id: number | null;
  patient_name?: string;
  caller_name: string;
  complaint: string;
  escalation: string;
  status: string;
  occurred_at: string;
  auto_triggered: number;
};

export type ScheduleChange = {
  id: number;
  visit_id: number;
  changed_at: string;
  change_type: 'created' | 'rescheduled' | 'doctor_changed' | 'status_changed' | 'cancelled';
  description: string;
  changed_by: string;
  patient_name?: string;
};

export type RiskCategory =
  | 'infeksi'
  | 'dehidrasi'
  | 'gagal_jantung'
  | 'hipoglikemia'
  | 'hiperglikemia'
  | 'stroke'
  | 'risiko_jatuh'
  | 'malnutrisi'
  | 'delirium'
  | 'frailty';

export type RiskScore = {
  category: RiskCategory;
  label: string;
  score: number;
  explanation: string;
};
