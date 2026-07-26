// Gestion des bruits d'ambiance pour le mode "Hören réel".
// Sources combinées : fichier local /public/sounds/ + plusieurs CDN libres
// (Pixabay / Mixkit / Wikimedia). Bascule automatique si l'une casse.

export type AmbianceId =
  | "street"
  | "cars"
  | "train"
  | "supermarket"
  | "cafe"
  | "rain"
  | "wind"
  | "thunder"
  | "office"
  | "school"
  | "none";

interface AmbianceMeta {
  id: AmbianceId;
  label: string;
  emoji: string;
  localPath: string;
  /** Plusieurs URLs fallback : on essaie dans l'ordre. */
  fallbackUrls: string[];
}

export const AMBIANCES: AmbianceMeta[] = [
  {
    id: "street",
    label: "Rue / passants",
    emoji: "🚶",
    localPath: "/sounds/street.mp3",
    fallbackUrls: [
      "https://cdn.pixabay.com/download/audio/2022/03/15/audio_d9b9f0d3e6.mp3?filename=city-ambience-9272.mp3",
      "https://cdn.pixabay.com/download/audio/2022/10/30/audio_347111dca5.mp3?filename=city-ambient-noise-loop-127275.mp3",
      "https://assets.mixkit.co/active_storage/sfx/2434/2434-preview.mp3",
    ],
  },
  {
    id: "cars",
    label: "Voitures / trafic",
    emoji: "🚗",
    localPath: "/sounds/cars.mp3",
    fallbackUrls: [
      "https://cdn.pixabay.com/download/audio/2021/08/04/audio_d70e0e9bb1.mp3?filename=traffic-in-city-6868.mp3",
      "https://assets.mixkit.co/active_storage/sfx/2526/2526-preview.mp3",
    ],
  },
  {
    id: "train",
    label: "Train / gare",
    emoji: "🚆",
    localPath: "/sounds/train.mp3",
    fallbackUrls: [
      "https://cdn.pixabay.com/download/audio/2022/10/14/audio_5b4d2bee45.mp3?filename=train-station-ambience-128330.mp3",
      "https://cdn.pixabay.com/download/audio/2022/03/24/audio_d4b4e0fba3.mp3?filename=train-passing-by-21661.mp3",
      "https://assets.mixkit.co/active_storage/sfx/1318/1318-preview.mp3",
    ],
  },
  {
    id: "supermarket",
    label: "Supermarché",
    emoji: "🛒",
    localPath: "/sounds/supermarket.mp3",
    fallbackUrls: [
      "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=supermarket-ambience-15-seconds-99844.mp3",
      "https://cdn.pixabay.com/download/audio/2022/03/15/audio_d9b9f0d3e6.mp3?filename=city-ambience-9272.mp3",
    ],
  },
  {
    id: "cafe",
    label: "Café / restaurant",
    emoji: "☕",
    localPath: "/sounds/cafe.mp3",
    fallbackUrls: [
      "https://cdn.pixabay.com/download/audio/2022/03/10/audio_d10454b48a.mp3?filename=coffee-shop-background-audio-6388.mp3",
      "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0c6ff1bda.mp3?filename=restaurant-ambience-people-talking-21013.mp3",
      "https://assets.mixkit.co/active_storage/sfx/2435/2435-preview.mp3",
    ],
  },
  {
    id: "rain",
    label: "Pluie",
    emoji: "🌧️",
    localPath: "/sounds/rain.mp3",
    fallbackUrls: [
      "https://cdn.pixabay.com/download/audio/2022/03/10/audio_d4a8e5f1f0.mp3?filename=rain-and-thunder-sfx-12820.mp3",
      "https://cdn.pixabay.com/download/audio/2022/06/07/audio_a0a1f9b7f4.mp3?filename=light-rain-109591.mp3",
      "https://assets.mixkit.co/active_storage/sfx/2515/2515-preview.mp3",
    ],
  },
  {
    id: "wind",
    label: "Vent",
    emoji: "💨",
    localPath: "/sounds/wind.mp3",
    fallbackUrls: [
      "https://cdn.pixabay.com/download/audio/2022/10/25/audio_3478e0f04f.mp3?filename=wind-blowing-trees-129111.mp3",
      "https://assets.mixkit.co/active_storage/sfx/2517/2517-preview.mp3",
    ],
  },
  {
    id: "thunder",
    label: "Orage",
    emoji: "⛈️",
    localPath: "/sounds/thunder.mp3",
    fallbackUrls: [
      "https://cdn.pixabay.com/download/audio/2022/03/15/audio_b6e7d9bec5.mp3?filename=thunder-25689.mp3",
      "https://assets.mixkit.co/active_storage/sfx/2518/2518-preview.mp3",
    ],
  },
  {
    id: "office",
    label: "Bureau",
    emoji: "💼",
    localPath: "/sounds/office.mp3",
    fallbackUrls: [
      "https://cdn.pixabay.com/download/audio/2022/03/10/audio_d10454b48a.mp3?filename=coffee-shop-background-audio-6388.mp3",
    ],
  },
  {
    id: "school",
    label: "École / cour",
    emoji: "🏫",
    localPath: "/sounds/school.mp3",
    fallbackUrls: [
      "https://cdn.pixabay.com/download/audio/2022/03/15/audio_d9b9f0d3e6.mp3?filename=city-ambience-9272.mp3",
    ],
  },
  {
    id: "none",
    label: "Aucun (silencieux)",
    emoji: "🔇",
    localPath: "",
    fallbackUrls: [],
  },
];

export function getAmbiance(id: AmbianceId): AmbianceMeta | undefined {
  return AMBIANCES.find(a => a.id === id);
}

/**
 * Crée un élément <audio> qui essaie le local puis chaque CDN du tableau.
 * Bascule automatique sur erreur de chargement.
 */
export function createAmbiancePlayer(id: AmbianceId, volume = 0.25): HTMLAudioElement | null {
  const meta = getAmbiance(id);
  if (!meta || id === "none") return null;
  const audio = new Audio();
  audio.loop = true;
  audio.volume = Math.max(0, Math.min(1, volume));
  audio.crossOrigin = "anonymous";
  audio.preload = "auto";

  const sources = [meta.localPath, ...meta.fallbackUrls].filter(Boolean);
  let attemptIdx = 0;

  const tryNext = () => {
    if (attemptIdx >= sources.length) return;
    audio.src = sources[attemptIdx];
    attemptIdx += 1;
  };

  audio.onerror = () => tryNext();
  // Démarre la chaîne
  tryNext();
  return audio;
}
