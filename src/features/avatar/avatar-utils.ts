export const OCULUS_VISEMES = [
  "viseme_sil",
  "viseme_PP",
  "viseme_FF",
  "viseme_TH",
  "viseme_DD",
  "viseme_kk",
  "viseme_CH",
  "viseme_SS",
  "viseme_nn",
  "viseme_RR",
  "viseme_aa",
  "viseme_E",
  "viseme_I",
  "viseme_O",
  "viseme_U",
] as const;

export type OculusViseme = (typeof OCULUS_VISEMES)[number];
export type VisemeStandard = "auto" | "arkit" | "oculus";
export type DetectedStandard = "none" | "custom" | "arkit" | "oculus" | "hybrid";

export type AvatarCalibration = {
  modelScale: number;
  modelOffsetY: number;
  mouthGain: number;
  mouthSmoothing: number;
  blinkIntervalSec: number;
  browIntensity: number;
  smile: number;
  visemeSet: VisemeStandard;
};

export const DEFAULT_AVATAR_CALIBRATION: AvatarCalibration = {
  modelScale: 1,
  modelOffsetY: 0,
  mouthGain: 1.15,
  mouthSmoothing: 0.58,
  blinkIntervalSec: 4,
  browIntensity: 0.25,
  smile: 0.12,
  visemeSet: "auto",
};

export const MAX_GLB_SIZE = 25 * 1024 * 1024;

export function validateGlbHeader(buffer: ArrayBuffer): string | null {
  if (buffer.byteLength < 12) return "Le fichier est trop petit pour être un GLB valide.";
  const bytes = new Uint8Array(buffer, 0, 4);
  const isGlb = bytes[0] === 0x67 && bytes[1] === 0x6c && bytes[2] === 0x54 && bytes[3] === 0x46;
  if (!isGlb) return "Signature GLB absente. Exportez le modèle au format glTF Binary (.glb).";
  const version = new DataView(buffer).getUint32(4, true);
  if (version !== 2) return `Version glTF ${version} non prise en charge. La version 2 est requise.`;
  return null;
}

const TOKEN_TO_VISEME: Array<[RegExp, OculusViseme]> = [
  [/^(sch|ch|tsch)/, "viseme_CH"],
  [/^(th)/, "viseme_TH"],
  [/^(ph|pf|f|v|w)/, "viseme_FF"],
  [/^(p|b|m)/, "viseme_PP"],
  [/^(s|z|ß|x)/, "viseme_SS"],
  [/^(d|t)/, "viseme_DD"],
  [/^(k|g|q|c)/, "viseme_kk"],
  [/^(n|l)/, "viseme_nn"],
  [/^(r)/, "viseme_RR"],
  [/^(au|eu|äu|o)/, "viseme_O"],
  [/^(u|ü)/, "viseme_U"],
  [/^(i|ie|y)/, "viseme_I"],
  [/^(e|ä|ö)/, "viseme_E"],
  [/^(a)/, "viseme_aa"],
];

export function buildVisemeSequence(text: string): OculusViseme[] {
  const normalized = text
    .toLocaleLowerCase("de-DE")
    .normalize("NFC")
    .replace(/[^\p{L}\p{N}\s]/gu, " ");

  const sequence: OculusViseme[] = ["viseme_sil"];
  let cursor = 0;
  while (cursor < normalized.length) {
    const rest = normalized.slice(cursor);
    if (/^\s/.test(rest)) {
      if (sequence.at(-1) !== "viseme_sil") sequence.push("viseme_sil");
      cursor += 1;
      continue;
    }

    let matched = false;
    for (const [pattern, viseme] of TOKEN_TO_VISEME) {
      const token = rest.match(pattern)?.[0];
      if (!token) continue;
      if (sequence.at(-1) !== viseme) sequence.push(viseme);
      cursor += token.length;
      matched = true;
      break;
    }
    if (!matched) cursor += 1;
  }
  sequence.push("viseme_sil");
  return sequence;
}

export function getTimelineViseme(
  sequence: readonly OculusViseme[],
  currentTime: number,
  duration: number,
): OculusViseme {
  if (!Number.isFinite(duration) || duration <= 0 || sequence.length === 0) return "viseme_sil";
  const ratio = Math.min(0.999, Math.max(0, currentTime / duration));
  return sequence[Math.floor(ratio * sequence.length)] ?? "viseme_sil";
}

export function formatFileSize(size: number): string {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} Ko`;
  return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
}
