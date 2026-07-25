import type { RiskCategory, RiskScore } from './types';

// Skor risiko sederhana & transparan berbasis data yang benar-benar tercatat
// (vital terbaru, kondisi, usia, status sensor jatuh). Ini BUKAN model AI/ML —
// murni heuristik ambang batas klinis umum, alat bantu keputusan. Keputusan
// akhir tetap di tangan dokter.

export type RiskInput = {
  age: number | null;
  conditions: string[];
  iotFallEnabled: boolean;
  latestVital: {
    bloodPressure: string | null;
    heartRate: number | null;
    temperature: number | null;
    spo2: number | null;
    gds: number | null;
  } | null;
};

const LABELS: Record<RiskCategory, string> = {
  infeksi: 'Infeksi',
  dehidrasi: 'Dehidrasi',
  gagal_jantung: 'Gagal jantung',
  hipoglikemia: 'Hipoglikemia',
  hiperglikemia: 'Hiperglikemia',
  stroke: 'Stroke',
  risiko_jatuh: 'Risiko jatuh',
  malnutrisi: 'Malnutrisi',
  delirium: 'Delirium',
  frailty: 'Frailty',
};

function clamp(v: number): number {
  return Math.max(3, Math.min(97, Math.round(v)));
}

function hasCondition(conditions: string[], ...keywords: string[]): boolean {
  const lower = conditions.map((c) => c.toLowerCase());
  return keywords.some((kw) => lower.some((c) => c.includes(kw)));
}

function systolic(bp: string | null): number | null {
  if (!bp) return null;
  const match = bp.match(/(\d+)\s*\/\s*\d+/);
  return match ? Number(match[1]) : null;
}

export function computeRiskScores(input: RiskInput): RiskScore[] {
  const { age, conditions, iotFallEnabled, latestVital } = input;
  const temp = latestVital?.temperature ?? null;
  const hr = latestVital?.heartRate ?? null;
  const gds = latestVital?.gds ?? null;
  const sys = systolic(latestVital?.bloodPressure ?? null);

  const results: { category: RiskCategory; score: number; explanation: string }[] = [];

  // Infeksi — dari suhu tubuh & nadi
  if (temp != null) {
    let score = temp >= 38.5 ? 82 : temp >= 37.8 ? 62 : temp >= 37.3 ? 38 : 15;
    let note = `Suhu ${temp}°C`;
    if (hr != null && hr > 100) {
      score += 8;
      note += `, nadi ${hr}x/mnt (takikardia)`;
    }
    results.push({ category: 'infeksi', score: clamp(score), explanation: note + ' pada kunjungan terakhir.' });
  } else {
    results.push({ category: 'infeksi', score: 12, explanation: 'Belum ada data suhu terbaru.' });
  }

  // Dehidrasi — proxy dari nadi + suhu (tidak ada data hidrasi langsung)
  {
    let score = 20;
    const notes: string[] = [];
    if (hr != null && hr > 95) {
      score += 20;
      notes.push(`nadi ${hr}x/mnt`);
    }
    if (temp != null && temp >= 37.8) {
      score += 15;
      notes.push(`suhu ${temp}°C`);
    }
    if (age != null && age >= 75) score += 10;
    results.push({
      category: 'dehidrasi',
      score: clamp(score),
      explanation: notes.length ? `Indikasi tidak langsung dari ${notes.join(' & ')}.` : 'Tidak ada indikasi dari vital terakhir.',
    });
  }

  // Gagal jantung — kondisi + tekanan darah
  {
    const hasHF = hasCondition(conditions, 'jantung', 'nyha');
    let score = hasHF ? 45 : 15;
    const notes: string[] = [hasHF ? 'riwayat gagal jantung' : 'tanpa riwayat gagal jantung'];
    if (sys != null && sys > 150) {
      score += 20;
      notes.push(`sistolik ${sys} mmHg`);
    } else if (sys != null && sys > 130) {
      score += 10;
      notes.push(`sistolik ${sys} mmHg`);
    }
    results.push({ category: 'gagal_jantung', score: clamp(score), explanation: `Berdasarkan ${notes.join(', ')}.` });
  }

  // Hipoglikemia / Hiperglikemia — dari GDS
  if (gds != null) {
    const hypoScore = gds < 70 ? 85 : gds < 90 ? 48 : 12;
    results.push({ category: 'hipoglikemia', score: clamp(hypoScore), explanation: `GDS terakhir ${gds} mg/dL.` });

    const hyperScore = gds > 200 ? 78 : gds > 180 ? 55 : gds > 140 ? 32 : 10;
    results.push({ category: 'hiperglikemia', score: clamp(hyperScore), explanation: `GDS terakhir ${gds} mg/dL.` });
  } else {
    results.push({ category: 'hipoglikemia', score: 15, explanation: 'Belum ada data GDS terbaru.' });
    results.push({ category: 'hiperglikemia', score: 15, explanation: 'Belum ada data GDS terbaru.' });
  }

  // Stroke — kondisi + tekanan darah
  {
    const hasRisk = hasCondition(conditions, 'stroke', 'fibrilasi', 'afib');
    let score = hasRisk ? 55 : 10;
    const notes = [hasRisk ? 'riwayat stroke/fibrilasi atrium' : 'tanpa riwayat stroke/fibrilasi atrium'];
    if (sys != null && sys > 150) {
      score += 15;
      notes.push(`sistolik ${sys} mmHg`);
    }
    results.push({ category: 'stroke', score: clamp(score), explanation: `Berdasarkan ${notes.join(', ')}.` });
  }

  // Risiko jatuh — sensor IoT + kondisi + usia
  {
    let score = 10;
    const notes: string[] = [];
    if (iotFallEnabled) {
      score += 20;
      notes.push('sensor jatuh aktif');
    }
    if (hasCondition(conditions, 'jatuh', 'frailty')) {
      score += 25;
      notes.push('riwayat jatuh/frailty tercatat');
    }
    if (age != null && age >= 85) {
      score += 20;
      notes.push(`usia ${age} tahun`);
    } else if (age != null && age >= 75) {
      score += 10;
      notes.push(`usia ${age} tahun`);
    }
    results.push({
      category: 'risiko_jatuh',
      score: clamp(score),
      explanation: notes.length ? notes.join(', ') + '.' : 'Tidak ada faktor risiko tercatat.',
    });
  }

  // Malnutrisi — belum ada data berat badan/asupan, proxy dari kondisi + usia
  {
    const hasRisk = hasCondition(conditions, 'malnutrisi', 'gizi');
    let score = hasRisk ? 60 : 18;
    if (age != null && age >= 80) score += 8;
    results.push({
      category: 'malnutrisi',
      score: clamp(score),
      explanation: hasRisk ? 'Kondisi malnutrisi tercatat.' : 'Belum ada data berat badan/asupan — perkiraan awal saja.',
    });
  }

  // Delirium — proxy dari suhu tinggi (infeksi akut sering memicu delirium pada lansia) + kondisi
  {
    const hasRisk = hasCondition(conditions, 'demensia', 'delirium');
    let score = hasRisk ? 55 : 12;
    if (temp != null && temp >= 38 && age != null && age >= 75) {
      score += 20;
    }
    results.push({
      category: 'delirium',
      score: clamp(score),
      explanation: hasRisk ? 'Riwayat gangguan kognitif tercatat.' : 'Proxy dari suhu & usia — belum ada asesmen kognitif formal.',
    });
  }

  // Frailty — usia + jumlah kondisi kronis
  {
    const ageFactor = age != null ? Math.max(0, (age - 60) * 1.4) : 20;
    const conditionFactor = conditions.length * 9;
    results.push({
      category: 'frailty',
      score: clamp(ageFactor + conditionFactor),
      explanation: `Usia ${age ?? '?'} tahun dengan ${conditions.length} kondisi kronis tercatat.`,
    });
  }

  return results.map((r) => ({ ...r, label: LABELS[r.category] }));
}
