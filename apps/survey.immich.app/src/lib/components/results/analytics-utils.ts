export interface AnswerData {
  value: string;
  count: number;
}

export interface NpsStats {
  total: number;
  promoters: number;
  passives: number;
  detractors: number;
  npsScore: number | null;
  pPct: number;
  paPct: number;
  dPct: number;
}

export function computeNps(answers: AnswerData[]): NpsStats {
  let total = 0,
    promoters = 0,
    passives = 0,
    detractors = 0;
  for (const a of answers) {
    const score = Number(a.value);
    if (Number.isNaN(score)) continue;
    total += a.count;
    if (score >= 9) promoters += a.count;
    else if (score >= 7) passives += a.count;
    else detractors += a.count;
  }
  const npsScore = total > 0 ? Math.round(((promoters - detractors) / total) * 100) : null;
  const pPct = total > 0 ? (promoters / total) * 100 : 0;
  const paPct = total > 0 ? (passives / total) * 100 : 0;
  const dPct = total > 0 ? (detractors / total) * 100 : 0;
  return { total, promoters, passives, detractors, npsScore, pPct, paPct, dPct };
}

export function npsLabel(npsScore: number | null): string {
  if (npsScore === null) return '';
  if (npsScore >= 50) return 'Excellent';
  if (npsScore >= 0) return 'Good';
  if (npsScore >= -50) return 'Needs improvement';
  return 'Critical';
}

export function computeDropoffRate(reached: number, answered: number): number {
  if (reached === 0) return 0;
  return Math.round(((reached - answered) / reached) * 100);
}
