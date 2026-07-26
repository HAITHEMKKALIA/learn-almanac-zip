// Lightweight AI generation history persisted in localStorage.
// Used by Assignments / TeacherHomework to show recent generations.

export type AiHistoryEntry = {
  id: string;
  at: string;            // ISO date
  mode: "exam" | "homework";
  level: string;
  category?: string;
  title?: string;
  status: "success" | "error";
  count?: number;        // questions added
  message?: string;      // error message or summary
  ids?: string[];        // question_bank ids inserted
};

const KEY = "ai_pedagogy_history_v1";
const MAX = 30;

export function pushAiHistory(entry: Omit<AiHistoryEntry, "id" | "at">) {
  try {
    const list = readAiHistory();
    const e: AiHistoryEntry = { id: crypto.randomUUID(), at: new Date().toISOString(), ...entry };
    list.unshift(e);
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
    window.dispatchEvent(new CustomEvent("ai-history:update"));
    return e;
  } catch {
    return null;
  }
}

export function readAiHistory(): AiHistoryEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AiHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function clearAiHistory() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new CustomEvent("ai-history:update"));
}
