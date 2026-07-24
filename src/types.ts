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
  status: 'active' | 'inactive';
  created_at: string;
};

export type Doctor = {
  id: number;
  name: string;
  role: 'dokter' | 'fisioterapis';
  phone: string;
};

export type WhatsAppSettings = {
  id: number;
  api_key: string;
  sender_number: string;
  reminder_enabled: number;
};
