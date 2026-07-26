// Historique persistant du Tageschallenge (révision quotidienne) dans localStorage
const KEY = "dm_challenge_history";

export interface ChallengeRecord {
  date: string;     // YYYY-MM-DD
  score: number;    // bonnes réponses
  total: number;    // questions totales
  completedAt: string; // ISO
}

export function getChallengeHistory(): ChallengeRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveChallengeRecord(rec: ChallengeRecord) {
  const all = getChallengeHistory();
  // remplace si même date existe
  const idx = all.findIndex(r => r.date === rec.date);
  if (idx >= 0) all[idx] = rec;
  else all.push(rec);
  // garde 60 derniers
  const trimmed = all.slice(-60);
  localStorage.setItem(KEY, JSON.stringify(trimmed));
  return trimmed;
}

export function getTodayChallenge(): ChallengeRecord | null {
  const today = new Date().toISOString().slice(0, 10);
  return getChallengeHistory().find(r => r.date === today) ?? null;
}

export function getChallengeStreak(): number {
  const history = getChallengeHistory().filter(r => r.score >= Math.ceil(r.total * 0.6));
  if (history.length === 0) return 0;
  const dates = new Set(history.map(r => r.date));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    if (dates.has(ds)) streak++;
    else if (i === 0) continue; // si aujourd'hui pas fait, on regarde quand même hier
    else break;
  }
  return streak;
}
