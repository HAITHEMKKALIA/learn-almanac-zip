// === Voix universelle compatible Huawei (sans Google Mobile Services) ===
// Stratégie :
//  1) Si une voix locale est dispo pour la langue → SpeechSynthesis natif (rapide, gratuit).
//  2) Sinon → on appelle l'edge function /tts qui renvoie un MP3 (Google Translate
//     ou ElevenLabs si clé). Marche partout, y compris Huawei.
import { supabase } from "@/integrations/supabase/client";

let cachedVoices: SpeechSynthesisVoice[] = [];

export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    if (!synth) { resolve([]); return; }
    const get = () => { cachedVoices = synth.getVoices(); return cachedVoices; };
    const v = get();
    if (v.length > 0) { resolve(v); return; }
    synth.onvoiceschanged = () => resolve(get());
    setTimeout(() => resolve(get()), 1500);
  });
}

function findVoice(lang: string): SpeechSynthesisVoice | null {
  if (!cachedVoices.length) cachedVoices = window.speechSynthesis?.getVoices() || [];
  const prefix = lang.slice(0, 2);
  return cachedVoices.find(v => v.lang === lang && v.name.includes("Google"))
    || cachedVoices.find(v => v.lang === lang && !v.localService)
    || cachedVoices.find(v => v.lang === lang)
    || cachedVoices.find(v => v.lang.startsWith(prefix))
    || null;
}

export type Gender = "female" | "male" | "auto";

const FEMALE_HINTS = ["female","femme","woman","frau","anna","marlene","vicki","petra","katja","helga","maria","sophie","amelia","sarah"];
const MALE_HINTS = ["male","homme","man","herr","stefan","yannick","markus","klaus","hans","thomas","michael","george","daniel"];

function isFemale(name: string): boolean { const n = name.toLowerCase(); return FEMALE_HINTS.some(h => n.includes(h)); }
function isMale(name: string): boolean { const n = name.toLowerCase(); return MALE_HINTS.some(h => n.includes(h)); }

function findVoiceByGender(lang: string, gender: Gender): SpeechSynthesisVoice | null {
  if (gender === "auto") return findVoice(lang);
  if (!cachedVoices.length) cachedVoices = window.speechSynthesis?.getVoices() || [];
  const prefix = lang.slice(0, 2);
  const candidates = cachedVoices.filter(v => v.lang === lang || v.lang.startsWith(prefix));
  const filterFn = gender === "female" ? isFemale : isMale;
  return candidates.find(v => filterFn(v.name)) || findVoice(lang);
}

export interface SpeakOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  gender?: Gender;
}

// Audio courant pour pouvoir l'arrêter
let currentAudio: HTMLAudioElement | null = null;
export function stopAll() {
  try { window.speechSynthesis?.cancel(); } catch {}
  if (currentAudio) { try { currentAudio.pause(); } catch {} currentAudio = null; }
}

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || "https://uqyjpvsdiuiuomkoocnk.supabase.co";
const SUPABASE_KEY = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY || "";

// Cache des MP3 déjà téléchargés (clé = lang|gender|text)
const ttsCache = new Map<string, string>(); // -> object URL

async function fetchTtsBlobUrl(text: string, lang: string, gender: Gender): Promise<string | null> {
  const key = `${lang}|${gender}|${text}`;
  const cached = ttsCache.get(key);
  if (cached) return cached;
  try {
    const params = new URLSearchParams({ text, lang: lang.slice(0, 2), gender: gender === "auto" ? "female" : gender });
    const res = await fetch(`${SUPABASE_URL}/functions/v1/tts?${params.toString()}`, {
      method: "GET",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
      },
    });
    if (!res.ok) return null;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    ttsCache.set(key, url);
    // Limite cache à 60 entrées
    if (ttsCache.size > 60) {
      const firstKey = ttsCache.keys().next().value;
      if (firstKey) {
        const oldUrl = ttsCache.get(firstKey);
        if (oldUrl) URL.revokeObjectURL(oldUrl);
        ttsCache.delete(firstKey);
      }
    }
    return url;
  } catch {
    return null;
  }
}

async function speakViaEdge(text: string, lang: string, gender: Gender, rate: number): Promise<void> {
  stopAll();
  const url = await fetchTtsBlobUrl(text, lang, gender);
  if (!url) return;
  return new Promise((resolve) => {
    try {
      const audio = new Audio(url);
      audio.playbackRate = Math.max(0.5, Math.min(1.5, rate / 0.85));
      audio.preload = "auto";
      currentAudio = audio;
      const done = () => { if (currentAudio === audio) currentAudio = null; resolve(); };
      audio.onended = done;
      audio.onerror = done;
      audio.play().catch(done);
    } catch {
      resolve();
    }
  });
}

function nativeAvailable(lang: string): boolean {
  if (!cachedVoices.length) cachedVoices = window.speechSynthesis?.getVoices() || [];
  const prefix = lang.slice(0, 2);
  return cachedVoices.some(v => v.lang.startsWith(prefix));
}

export function speak(text: string, lang = "de-DE", rate = 0.85): Promise<void> {
  return speakAdvanced(text, { lang, rate });
}

export function speakAdvanced(text: string, opts: SpeakOptions = {}): Promise<void> {
  const { lang = "de-DE", rate = 0.85, gender = "auto" } = opts;
  let { pitch = 1.0 } = opts;
  if (gender === "male") pitch = Math.min(pitch, 0.78);
  else if (gender === "female") pitch = Math.max(pitch, 1.18);

  if (!text) return Promise.resolve();

  const synth = window.speechSynthesis;
  // Si pas de SpeechSynthesis OU pas de voix pour cette langue → edge function
  if (!synth || !nativeAvailable(lang)) {
    return speakViaEdge(text, lang, gender, rate);
  }

  return new Promise((resolve) => {
    try {
      synth.cancel();
      setTimeout(() => {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = lang;
        u.rate = rate;
        u.pitch = pitch;
        u.volume = 1.0;
        const v = findVoiceByGender(lang, gender);
        if (v) u.voice = v;
        let fellBack = false;
        const fallback = () => {
          if (fellBack) return; fellBack = true;
          speakViaEdge(text, lang, gender, rate).then(resolve);
        };
        const timer = setInterval(() => {
          if (synth.speaking) synth.resume(); else clearInterval(timer);
        }, 8000);
        u.onend = () => { clearInterval(timer); resolve(); };
        u.onerror = () => { clearInterval(timer); fallback(); };
        synth.speak(u);
        // Sécurité : si rien ne démarre en 1.2s, on bascule edge
        setTimeout(() => { if (!synth.speaking && !fellBack) fallback(); }, 1200);
      }, 60);
    } catch {
      speakViaEdge(text, lang, gender, rate).then(resolve);
    }
  });
}

export function guessGenderFromSpeaker(speaker: string): Gender {
  const s = (speaker || "").toLowerCase();
  if (/^(frau|kellnerin|kassiererin|sekretärin|verkäuferin|bäckerin|sprecherin|touristin|reisende|patientin|mutter|tochter|kundin|kind|dame|mitarbeiterin|fahrerin|durchsage|lautsprecher)/.test(s)) return "female";
  if (/(in|frau|tochter|mama|mutter|oma|anna|lisa|maria|sophie|katja|petra)$/.test(s)) return "female";
  if (/^(herr|kellner|verkäufer|sprecher|kunde|fahrer|fahrgast|patient|vater|sohn|mann|junge|bäcker|beamter|mitarbeiter|passant|reisender|thomas|markus|klaus|stefan|hans|michael)/.test(s)) return "male";
  return "auto";
}

export function speakGerman(text: string): Promise<void> {
  const clean = text.replace(/\([^)]*\)/g, "").replace(/[✓✗💡❌✅🌟👍📊🎤🔊]/g, "");
  const sentences = clean.match(/[A-ZÄÖÜ][a-zäöüßA-ZÄÖÜ\s,!?.]+/g);
  if (sentences) return speak(sentences.slice(0, 4).join(". "), "de-DE", 0.8);
  return Promise.resolve();
}

// Utilitaires utilisés par l'UI pour parler en arabe / français explicitement
export function speakFr(text: string, gender: Gender = "auto") {
  return speakAdvanced(text, { lang: "fr-FR", gender, rate: 0.95 });
}
export function speakAr(text: string, gender: Gender = "auto") {
  return speakAdvanced(text, { lang: "ar-SA", gender, rate: 0.9 });
}
