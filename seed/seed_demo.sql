-- Data simulasi dari mockup awal, dipindahkan jadi data nyata di database.
-- Semua tanggal digeser +5 hari dari referensi (yang "hari ini"-nya 20 Jul 2026)
-- supaya "hari ini" di data ini jatuh pada tanggal berjalan sungguhan (25 Jul 2026).

-- ================= DOKTER =================
INSERT INTO doctors (name, role, specialty, phone) VALUES
  ('dr. Andini Pratiwi, Sp.PD', 'dokter', 'DPJP Geriatri', '+62 812-1000-0001'),
  ('dr. Bimo Nugroho', 'dokter', 'Dokter Umum Plus Geriatri', '+62 812-1000-0002'),
  ('dr. Chandra Wijaya, Sp.JP', 'dokter', 'Kardiologi (mitra)', '+62 812-1000-0003'),
  ('Ft. Maya Anggraini', 'fisioterapis', '', '+62 812-1000-0004');

-- ================= PASIEN =================
INSERT INTO patients (name, address, phone, age, status, iot_fall_enabled) VALUES
  ('Hj. Siti Aminah', 'Puri Cinere Blok C-14', '+62 813-1111-0001', 72, 'active', 1),
  ('Bpk. Slamet Riyadi', 'Limo Residence A-7', '+62 813-1111-0002', 68, 'active', 0),
  ('Ibu Ratna Dewi', 'Pondok Labu, Jl. Wijaya IV', '+62 813-1111-0003', 58, 'active', 0),
  ('Bpk. Ahmad Fauzi', 'Gandul, Griya Asri B-2', '+62 813-1111-0004', 75, 'active', 1),
  ('Ibu Yuliana Sari', 'Cinere Indah D-21', '+62 813-1111-0005', 81, 'active', 1),
  ('Ibu Kartini Wulandari', 'Pangkalan Jati, Jl. Melati 8', '+62 813-1111-0006', 63, 'active', 0);

INSERT INTO patient_conditions (patient_id, condition)
  SELECT id, 'Hipertensi' FROM patients WHERE name = 'Hj. Siti Aminah';
INSERT INTO patient_conditions (patient_id, condition)
  SELECT id, 'DM tipe 2' FROM patients WHERE name = 'Hj. Siti Aminah';
INSERT INTO patient_conditions (patient_id, condition)
  SELECT id, 'PPOK GOLD III' FROM patients WHERE name = 'Bpk. Slamet Riyadi';
INSERT INTO patient_conditions (patient_id, condition)
  SELECT id, 'Gagal jantung NYHA II' FROM patients WHERE name = 'Ibu Ratna Dewi';
INSERT INTO patient_conditions (patient_id, condition)
  SELECT id, 'Pasca-stroke' FROM patients WHERE name = 'Bpk. Ahmad Fauzi';
INSERT INTO patient_conditions (patient_id, condition)
  SELECT id, 'Atrial fibrilasi' FROM patients WHERE name = 'Bpk. Ahmad Fauzi';
INSERT INTO patient_conditions (patient_id, condition)
  SELECT id, 'Frailty' FROM patients WHERE name = 'Ibu Yuliana Sari';
INSERT INTO patient_conditions (patient_id, condition)
  SELECT id, 'Riwayat jatuh' FROM patients WHERE name = 'Ibu Yuliana Sari';
INSERT INTO patient_conditions (patient_id, condition)
  SELECT id, 'PGK stadium 3b' FROM patients WHERE name = 'Ibu Kartini Wulandari';

-- ================= KONTAK KELUARGA (contoh, Hj. Siti Aminah) =================
INSERT INTO family_contacts (patient_id, name, phone, relation)
  SELECT id, 'Rizky Pratama', '+62 812-9931-4471', 'Anak' FROM patients WHERE name = 'Hj. Siti Aminah';
INSERT INTO family_contacts (patient_id, name, phone, relation)
  SELECT id, 'Dewi Anjani', '+62 811-2280-905', 'Menantu' FROM patients WHERE name = 'Hj. Siti Aminah';

-- ================= KUNJUNGAN: Hj. Siti Aminah =================
INSERT INTO visits (patient_id, doctor_id, visit_type, location, scheduled_at, started_at, finished_at, status, duration_minutes, on_time)
  SELECT p.id, d.id, 'Kontrol rutin', p.address, '2026-06-07 09:00:00', '2026-06-07 09:00:00', '2026-06-07 09:38:00', 'selesai', 38, 1
  FROM patients p, doctors d WHERE p.name='Hj. Siti Aminah' AND d.name='dr. Andini Pratiwi, Sp.PD';
INSERT INTO vitals (visit_id, blood_pressure, heart_rate, temperature, spo2, gds, notes)
  VALUES (last_insert_rowid(), '160/98', 88, 36.5, 96, 198, 'Awal program; CGA lengkap dilakukan.');

INSERT INTO visits (patient_id, doctor_id, visit_type, location, scheduled_at, started_at, finished_at, status, duration_minutes, on_time)
  SELECT p.id, d.id, 'Kontrol rutin', p.address, '2026-06-21 09:00:00', '2026-06-21 09:00:00', '2026-06-21 09:34:00', 'selesai', 34, 1
  FROM patients p, doctors d WHERE p.name='Hj. Siti Aminah' AND d.name='dr. Bimo Nugroho';
INSERT INTO vitals (visit_id, blood_pressure, heart_rate, temperature, spo2, gds, notes)
  VALUES (last_insert_rowid(), '158/96', 86, 36.4, 96, 192, 'Edukasi diet garam; cek GDP ulang.');

INSERT INTO visits (patient_id, doctor_id, visit_type, location, scheduled_at, started_at, finished_at, status, duration_minutes, on_time)
  SELECT p.id, d.id, 'Kontrol rutin', p.address, '2026-07-05 09:00:00', '2026-07-05 09:00:00', '2026-07-05 09:38:00', 'selesai', 38, 1
  FROM patients p, doctors d WHERE p.name='Hj. Siti Aminah' AND d.name='dr. Andini Pratiwi, Sp.PD';
INSERT INTO vitals (visit_id, blood_pressure, heart_rate, temperature, spo2, gds, notes)
  VALUES (last_insert_rowid(), '152/94', 84, 36.6, 97, 186, 'Dosis amlodipine dinaikkan 5–10 mg.');

INSERT INTO visits (patient_id, doctor_id, visit_type, location, scheduled_at, started_at, finished_at, status, duration_minutes, on_time)
  SELECT p.id, d.id, 'Kontrol rutin', p.address, '2026-07-19 09:00:00', '2026-07-19 09:00:00', '2026-07-19 09:38:00', 'selesai', 38, 1
  FROM patients p, doctors d WHERE p.name='Hj. Siti Aminah' AND d.name='dr. Andini Pratiwi, Sp.PD';
INSERT INTO vitals (visit_id, blood_pressure, heart_rate, temperature, spo2, gds, notes)
  VALUES (last_insert_rowid(), '148/92', 82, 36.5, 97, 156, 'Titrasi amlodipine berhasil; lutut kanan kaku → rujuk fisioterapi.');

INSERT INTO visits (patient_id, doctor_id, visit_type, location, scheduled_at, started_at, finished_at, status, duration_minutes, on_time)
  SELECT p.id, d.id, 'Fisioterapi lutut', p.address, '2026-07-25 08:30:00', '2026-07-25 08:30:00', '2026-07-25 09:15:00', 'selesai', 45, 1
  FROM patients p, doctors d WHERE p.name='Hj. Siti Aminah' AND d.name='Ft. Maya Anggraini';

INSERT INTO visits (patient_id, doctor_id, visit_type, location, scheduled_at, started_at, status, on_time)
  SELECT p.id, d.id, 'Kunjungan rutin', p.address, '2026-07-25 11:30:00', '2026-07-25 11:30:00', 'berlangsung', 1
  FROM patients p, doctors d WHERE p.name='Hj. Siti Aminah' AND d.name='dr. Andini Pratiwi, Sp.PD';

INSERT INTO visits (patient_id, doctor_id, visit_type, location, scheduled_at, status)
  SELECT p.id, d.id, 'Fisioterapi lutut', p.address, '2026-07-26 13:30:00', 'terjadwal'
  FROM patients p, doctors d WHERE p.name='Hj. Siti Aminah' AND d.name='Ft. Maya Anggraini';

INSERT INTO visits (patient_id, doctor_id, visit_type, location, scheduled_at, status)
  SELECT p.id, d.id, 'Kontrol rutin', p.address, '2026-08-02 10:30:00', 'terjadwal'
  FROM patients p, doctors d WHERE p.name='Hj. Siti Aminah' AND d.name='dr. Andini Pratiwi, Sp.PD';

-- ================= KUNJUNGAN: Bpk. Slamet Riyadi =================
INSERT INTO visits (patient_id, doctor_id, visit_type, location, scheduled_at, started_at, finished_at, status, duration_minutes, on_time)
  SELECT p.id, d.id, 'Evaluasi bulanan', p.address, '2026-06-20 09:00:00', '2026-06-20 09:00:00', '2026-06-20 09:38:00', 'selesai', 38, 1
  FROM patients p, doctors d WHERE p.name='Bpk. Slamet Riyadi' AND d.name='dr. Andini Pratiwi, Sp.PD';
INSERT INTO vitals (visit_id, blood_pressure, heart_rate, temperature, spo2, notes)
  VALUES (last_insert_rowid(), '140/88', 92, 36.7, 94, 'Evaluasi bulanan; spirometri klinik dijadwalkan.');

INSERT INTO visits (patient_id, doctor_id, visit_type, location, scheduled_at, started_at, finished_at, status, duration_minutes, on_time)
  SELECT p.id, d.id, 'Kunjungan rutin', p.address, '2026-07-04 09:00:00', '2026-07-04 09:00:00', '2026-07-04 09:34:00', 'selesai', 34, 1
  FROM patients p, doctors d WHERE p.name='Bpk. Slamet Riyadi' AND d.name='dr. Bimo Nugroho';
INSERT INTO vitals (visit_id, blood_pressure, heart_rate, temperature, spo2, notes)
  VALUES (last_insert_rowid(), '136/84', 90, 36.6, 94, 'Stabil; latihan napas dilanjutkan.');

INSERT INTO visits (patient_id, doctor_id, visit_type, location, scheduled_at, started_at, finished_at, status, duration_minutes, on_time)
  SELECT p.id, d.id, 'Kunjungan ulang (SpO2)', p.address, '2026-07-18 09:00:00', '2026-07-18 09:00:00', '2026-07-18 09:34:00', 'selesai', 34, 1
  FROM patients p, doctors d WHERE p.name='Bpk. Slamet Riyadi' AND d.name='dr. Bimo Nugroho';
INSERT INTO vitals (visit_id, blood_pressure, heart_rate, temperature, spo2, notes)
  VALUES (last_insert_rowid(), '138/86', 96, 36.8, 93, 'Sesak ringan; SABA diajarkan ulang; kontrol ketat 7 hari.');

INSERT INTO visits (patient_id, doctor_id, visit_type, location, scheduled_at, status)
  SELECT p.id, d.id, 'Kunjungan ulang (SpO2)', p.address, '2026-07-25 13:00:00', 'terjadwal'
  FROM patients p, doctors d WHERE p.name='Bpk. Slamet Riyadi' AND d.name='dr. Bimo Nugroho';

-- ================= KUNJUNGAN: Ibu Ratna Dewi =================
INSERT INTO visits (patient_id, doctor_id, visit_type, location, scheduled_at, started_at, finished_at, status, duration_minutes, on_time)
  SELECT p.id, d.id, 'Kontrol kardiologi', p.address, '2026-07-11 09:00:00', '2026-07-11 09:00:00', '2026-07-11 09:42:00', 'selesai', 42, 1
  FROM patients p, doctors d WHERE p.name='Ibu Ratna Dewi' AND d.name='dr. Chandra Wijaya, Sp.JP';
INSERT INTO vitals (visit_id, blood_pressure, heart_rate, temperature, spo2, notes)
  VALUES (last_insert_rowid(), '132/84', 80, 36.5, 96, 'Edema pergelangan minimal; furosemide tetap.');

INSERT INTO visits (patient_id, doctor_id, visit_type, location, scheduled_at, started_at, finished_at, status, duration_minutes, on_time)
  SELECT p.id, d.id, 'Kontrol kardiologi', p.address, '2026-07-25 08:00:00', '2026-07-25 08:00:00', '2026-07-25 08:42:00', 'selesai', 42, 1
  FROM patients p, doctors d WHERE p.name='Ibu Ratna Dewi' AND d.name='dr. Chandra Wijaya, Sp.JP';
INSERT INTO vitals (visit_id, blood_pressure, heart_rate, temperature, spo2, notes)
  VALUES (last_insert_rowid(), '128/82', 78, 36.4, 97, 'Selesai pagi ini: euvolemik, BB stabil, lanjut dosis.');

INSERT INTO visits (patient_id, doctor_id, visit_type, location, scheduled_at, started_at, status, on_time)
  SELECT p.id, d.id, 'Latihan jantung', p.address, '2026-07-25 12:00:00', '2026-07-25 12:00:00', 'berlangsung', 1
  FROM patients p, doctors d WHERE p.name='Ibu Ratna Dewi' AND d.name='Ft. Maya Anggraini';

INSERT INTO visits (patient_id, doctor_id, visit_type, location, scheduled_at, status)
  SELECT p.id, d.id, 'Kontrol kardiologi', p.address, '2026-08-01 09:00:00', 'terjadwal'
  FROM patients p, doctors d WHERE p.name='Ibu Ratna Dewi' AND d.name='dr. Chandra Wijaya, Sp.JP';

-- ================= KUNJUNGAN: Bpk. Ahmad Fauzi =================
INSERT INTO visits (patient_id, doctor_id, visit_type, location, scheduled_at, started_at, finished_at, status, duration_minutes, on_time)
  SELECT p.id, d.id, 'Cek INR + evaluasi', p.address, '2026-07-02 09:00:00', '2026-07-02 09:00:00', '2026-07-02 09:34:00', 'selesai', 34, 1
  FROM patients p, doctors d WHERE p.name='Bpk. Ahmad Fauzi' AND d.name='dr. Bimo Nugroho';
INSERT INTO vitals (visit_id, blood_pressure, heart_rate, temperature, spo2, notes)
  VALUES (last_insert_rowid(), '146/90', 92, 36.6, 95, 'Penyesuaian warfarin; fisioterapi 2x/mgg.');

INSERT INTO visits (patient_id, doctor_id, visit_type, location, scheduled_at, started_at, finished_at, status, duration_minutes, on_time)
  SELECT p.id, d.id, 'Cek INR + evaluasi', p.address, '2026-07-16 09:00:00', '2026-07-16 09:00:00', '2026-07-16 09:34:00', 'selesai', 34, 1
  FROM patients p, doctors d WHERE p.name='Bpk. Ahmad Fauzi' AND d.name='dr. Bimo Nugroho';
INSERT INTO vitals (visit_id, blood_pressure, heart_rate, temperature, spo2, notes)
  VALUES (last_insert_rowid(), '142/88', 88, 36.5, 96, 'INR 2.4 (target); latihan mobilisasi meningkat.');

INSERT INTO visits (patient_id, doctor_id, visit_type, location, scheduled_at, started_at, finished_at, status, duration_minutes, on_time)
  SELECT p.id, d.id, 'Fisioterapi mobilisasi', p.address, '2026-07-25 10:30:00', '2026-07-25 10:30:00', '2026-07-25 11:15:00', 'selesai', 45, 1
  FROM patients p, doctors d WHERE p.name='Bpk. Ahmad Fauzi' AND d.name='Ft. Maya Anggraini';

INSERT INTO visits (patient_id, doctor_id, visit_type, location, scheduled_at, status)
  SELECT p.id, d.id, 'Edukasi keluarga', p.address, '2026-07-25 16:30:00', 'terjadwal'
  FROM patients p, doctors d WHERE p.name='Bpk. Ahmad Fauzi' AND d.name='dr. Bimo Nugroho';

INSERT INTO visits (patient_id, doctor_id, visit_type, location, scheduled_at, status)
  SELECT p.id, d.id, 'Cek INR + evaluasi', p.address, '2026-07-26 10:00:00', 'terjadwal'
  FROM patients p, doctors d WHERE p.name='Bpk. Ahmad Fauzi' AND d.name='dr. Bimo Nugroho';

-- ================= KUNJUNGAN: Ibu Yuliana Sari =================
INSERT INTO visits (patient_id, doctor_id, visit_type, location, scheduled_at, started_at, finished_at, status, duration_minutes, on_time)
  SELECT p.id, d.id, 'Kunjungan rutin', p.address, '2026-07-09 09:00:00', '2026-07-09 09:00:00', '2026-07-09 09:38:00', 'selesai', 38, 1
  FROM patients p, doctors d WHERE p.name='Ibu Yuliana Sari' AND d.name='dr. Andini Pratiwi, Sp.PD';
INSERT INTO vitals (visit_id, blood_pressure, heart_rate, temperature, spo2, notes)
  VALUES (last_insert_rowid(), '120/76', 82, 36.5, 97, 'Stabil; penilaian risiko jatuh → handrail dipasang keluarga.');

INSERT INTO visits (patient_id, doctor_id, visit_type, location, scheduled_at, started_at, finished_at, status, duration_minutes, on_time)
  SELECT p.id, d.id, 'Evaluasi demam', p.address, '2026-07-23 09:00:00', '2026-07-23 09:00:00', '2026-07-23 09:38:00', 'selesai', 38, 1
  FROM patients p, doctors d WHERE p.name='Ibu Yuliana Sari' AND d.name='dr. Andini Pratiwi, Sp.PD';
INSERT INTO vitals (visit_id, blood_pressure, heart_rate, temperature, spo2, notes)
  VALUES (last_insert_rowid(), '118/74', 90, 37.9, 96, 'Demam H-1, urin keruh → kultur urin diambil, antibiotik empiris.');

INSERT INTO visits (patient_id, doctor_id, visit_type, location, scheduled_at, started_at, finished_at, status, duration_minutes, on_time)
  SELECT p.id, d.id, 'Pengambilan sampel', p.address, '2026-07-25 11:00:00', '2026-07-25 11:00:00', '2026-07-25 11:34:00', 'selesai', 34, 1
  FROM patients p, doctors d WHERE p.name='Ibu Yuliana Sari' AND d.name='dr. Bimo Nugroho';

INSERT INTO visits (patient_id, doctor_id, visit_type, location, scheduled_at, status)
  SELECT p.id, d.id, 'Evaluasi demam', p.address, '2026-07-25 15:30:00', 'terjadwal'
  FROM patients p, doctors d WHERE p.name='Ibu Yuliana Sari' AND d.name='dr. Andini Pratiwi, Sp.PD';

INSERT INTO visits (patient_id, doctor_id, visit_type, location, scheduled_at, status)
  SELECT p.id, d.id, 'Review hasil kultur', p.address, '2026-07-27 09:00:00', 'terjadwal'
  FROM patients p, doctors d WHERE p.name='Ibu Yuliana Sari' AND d.name='dr. Andini Pratiwi, Sp.PD';

-- ================= KUNJUNGAN: Ibu Kartini Wulandari =================
INSERT INTO visits (patient_id, doctor_id, visit_type, location, scheduled_at, started_at, finished_at, status, duration_minutes, on_time)
  SELECT p.id, d.id, 'Review hasil lab', p.address, '2026-07-15 09:00:00', '2026-07-15 09:00:00', '2026-07-15 09:38:00', 'selesai', 38, 1
  FROM patients p, doctors d WHERE p.name='Ibu Kartini Wulandari' AND d.name='dr. Andini Pratiwi, Sp.PD';
INSERT INTO vitals (visit_id, blood_pressure, heart_rate, temperature, spo2, gds, notes)
  VALUES (last_insert_rowid(), '144/90', 80, 36.4, 97, 118, 'eGFR stabil 38; diet protein dievaluasi ahli gizi.');

INSERT INTO visits (patient_id, doctor_id, visit_type, location, scheduled_at, started_at, finished_at, status, duration_minutes, on_time)
  SELECT p.id, d.id, 'Kunjungan rutin', p.address, '2026-07-25 09:30:00', '2026-07-25 09:30:00', '2026-07-25 10:04:00', 'selesai', 34, 1
  FROM patients p, doctors d WHERE p.name='Ibu Kartini Wulandari' AND d.name='dr. Bimo Nugroho';

INSERT INTO visits (patient_id, doctor_id, visit_type, location, scheduled_at, status)
  SELECT p.id, d.id, 'Fisioterapi', p.address, '2026-07-25 14:00:00', 'terjadwal'
  FROM patients p, doctors d WHERE p.name='Ibu Kartini Wulandari' AND d.name='Ft. Maya Anggraini';

INSERT INTO visits (patient_id, doctor_id, visit_type, location, scheduled_at, status)
  SELECT p.id, d.id, 'Review hasil lab', p.address, '2026-07-29 11:00:00', 'terjadwal'
  FROM patients p, doctors d WHERE p.name='Ibu Kartini Wulandari' AND d.name='dr. Andini Pratiwi, Sp.PD';

-- ================= LOG PERUBAHAN JADWAL =================
INSERT INTO schedule_changes (visit_id, changed_at, change_type, description, changed_by)
  SELECT v.id, '2026-07-25 12:18:00', 'created', 'Kunjungan baru dijadwalkan: 2 Agustus 10.30 · dr. Andini', 'dr. Andini (aplikasi dokter)'
  FROM visits v JOIN patients p ON p.id = v.patient_id
  WHERE p.name='Hj. Siti Aminah' AND v.scheduled_at='2026-08-02 10:30:00';

INSERT INTO schedule_changes (visit_id, changed_at, change_type, description, changed_by)
  SELECT v.id, '2026-07-25 09:12:00', 'doctor_changed', 'Sempat dialihkan ke dr. Bimo karena bentrok jadwal poli, dikembalikan ke dr. Andini setelah konfirmasi ulang', 'dr. Andini'
  FROM visits v JOIN patients p ON p.id = v.patient_id
  WHERE p.name='Ibu Kartini Wulandari' AND v.scheduled_at='2026-07-29 11:00:00';

INSERT INTO schedule_changes (visit_id, changed_at, change_type, description, changed_by)
  SELECT v.id, '2026-07-24 16:40:00', 'rescheduled', 'Jadwal diubah: 26 Jul 13.00 → 26 Jul 10.00', 'Admin Sari (permintaan keluarga)'
  FROM visits v JOIN patients p ON p.id = v.patient_id
  WHERE p.name='Bpk. Ahmad Fauzi' AND v.scheduled_at='2026-07-26 10:00:00';

INSERT INTO schedule_changes (visit_id, changed_at, change_type, description, changed_by)
  SELECT v.id, '2026-07-23 08:05:00', 'doctor_changed', '25 Jul 09.00 → dialihkan dr. Bimo → dr. Chandra untuk evaluasi kardiologi langsung', 'Manajer operasional'
  FROM visits v JOIN patients p ON p.id = v.patient_id
  WHERE p.name='Ibu Ratna Dewi' AND v.scheduled_at='2026-07-25 08:00:00';

-- ================= PENGATURAN WHATSAPP =================
UPDATE whatsapp_settings SET sender_number = '+62 811-1500-975', reminder_enabled = 1 WHERE id = 1;

-- ================= CALL CENTER =================
UPDATE call_center_settings SET phone_number = '(021) 754-5488', hours = '24/7', connected = 1 WHERE id = 1;

INSERT INTO emergency_calls (patient_id, caller_name, complaint, escalation, status, occurred_at, auto_triggered)
  SELECT id, 'Anak (Dodi)', 'Nyeri dada ringan, hilang saat istirahat', 'Dokter jaga → DPJP dr. Bimo telepon balik 14.31', 'Selesai - edukasi', '2026-07-25 14:22:00', 0
  FROM patients WHERE name='Bpk. Ahmad Fauzi';

INSERT INTO emergency_calls (patient_id, caller_name, complaint, escalation, status, occurred_at, auto_triggered)
  SELECT id, 'Otomatis (sensor jatuh IoT)', 'Deteksi jatuh di kamar tidur', 'Call Center telepon keluarga & pasien → konfirmasi terpeleset ringan → evaluasi kunjungan pagi', 'Selesai - tanpa cedera', '2026-07-20 03:12:00', 1
  FROM patients WHERE name='Ibu Yuliana Sari';

INSERT INTO emergency_calls (patient_id, caller_name, complaint, escalation, status, occurred_at, auto_triggered)
  SELECT id, 'Cucu (Nadia)', 'Demam 38,4°C, lemas', 'Dokter jaga → kunjungan cito 21.40', 'Selesai - antibiotik', '2026-07-23 21:05:00', 0
  FROM patients WHERE name='Ibu Yuliana Sari';

INSERT INTO emergency_calls (patient_id, caller_name, complaint, escalation, status, occurred_at, auto_triggered)
  SELECT id, 'Suami', 'Sesak mendadak', 'Ambulans RS + IGD Puri Cinere', 'Rawat inap 2 hari', '2026-07-20 06:48:00', 0
  FROM patients WHERE name='Ibu Ratna Dewi';

INSERT INTO emergency_calls (patient_id, caller_name, complaint, escalation, status, occurred_at, auto_triggered)
  SELECT id, 'Istri', 'Sesak setelah aktivitas', 'Triase → SABA dipandu telepon', 'Selesai - stabil', '2026-07-16 19:12:00', 0
  FROM patients WHERE name='Bpk. Slamet Riyadi';
