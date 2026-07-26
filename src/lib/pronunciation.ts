// Évaluation locale tolérante de la prononciation.
// - Normalise les umlauts (ä/ae, ö/oe, ü/ue, ß/ss)
// - Supprime ponctuation
// - Calcule similarité Levenshtein normalisée
// - Combine avec un score "mots reconnus" pour rester indulgent

export function normalizeDe(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[?.!,;:'"„"«»()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  const prev = new Array(n + 1);
  const curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
}

export interface PronunciationScore {
  score: number;          // 0-100
  matched: string[];      // mots correctement reconnus
  missing: string[];      // mots attendus non trouvés
  similarity: number;     // similarité globale 0-1
}

/**
 * Évaluation indulgente : combine
 *  - similarité globale Levenshtein (poids 50%)
 *  - taux de mots reconnus (poids 50%)
 */
export function scorePronunciation(expected: string, got: string): PronunciationScore {
  const exp = normalizeDe(expected);
  const transcript = normalizeDe(got);
  if (!transcript) return { score: 0, matched: [], missing: exp.split(" "), similarity: 0 };

  const dist = levenshtein(exp, transcript);
  const similarity = 1 - dist / Math.max(exp.length, transcript.length, 1);

  const expWords = exp.split(" ").filter(Boolean);
  const gotWords = new Set(transcript.split(" ").filter(Boolean));
  const matched: string[] = [];
  const missing: string[] = [];
  for (const w of expWords) {
    // tolérance : mot reconnu si présent OU très proche d'un mot prononcé
    let ok = gotWords.has(w);
    if (!ok) {
      for (const g of gotWords) {
        if (g.length >= 3 && levenshtein(w, g) <= Math.max(1, Math.floor(w.length * 0.25))) {
          ok = true;
          break;
        }
      }
    }
    if (ok) matched.push(w);
    else missing.push(w);
  }

  const wordRate = expWords.length ? matched.length / expWords.length : 0;
  const score = Math.round((similarity * 0.5 + wordRate * 0.5) * 100);
  return { score: Math.max(0, Math.min(100, score)), matched, missing, similarity };
}
