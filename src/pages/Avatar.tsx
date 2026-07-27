import {
  Component,
  type ReactNode,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, Html, OrbitControls, useGLTF } from "@react-three/drei";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronDown,
  FileBox,
  Loader2,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Square,
  Upload,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AvatarModel,
  type AvatarController,
  type AvatarExpressions,
  type AvatarMappingReport,
  type AvatarSignal,
} from "@/features/avatar/AvatarModel";
import {
  buildVisemeSequence,
  DEFAULT_AVATAR_CALIBRATION,
  formatFileSize,
  getTimelineViseme,
  MAX_GLB_SIZE,
  OCULUS_VISEMES,
  type AvatarCalibration,
  type VisemeStandard,
  validateGlbHeader,
} from "@/features/avatar/avatar-utils";

const DEFAULT_MODEL_URL = "/models/avatar-aurelia.glb";
const DEFAULT_MODEL_NAME = "Aurélia — professeure virtuelle originale";
const CALIBRATION_STORAGE_KEY = "deutsch-meister-avatar-calibration-v2";

type FaceLabControls = {
  jaw: number;
  smile: number;
  brows: number;
  blinkLeft: number;
  blinkRight: number;
  pucker: number;
  cheeks: number;
};

const DEFAULT_FACE_LAB: FaceLabControls = {
  jaw: 0,
  smile: 0,
  brows: 0,
  blinkLeft: 0,
  blinkRight: 0,
  pucker: 0,
  cheeks: 0,
};

const VOICES = [
  { id: "sage", label: "Sage — pédagogue" },
  { id: "coral", label: "Coral — vive" },
  { id: "alloy", label: "Alloy — neutre" },
  { id: "nova", label: "Nova — jeune" },
  { id: "shimmer", label: "Shimmer — claire" },
];

const SUGGESTIONS = [
  "Hallo! Ich bin deine virtuelle Deutschlehrerin. Was möchtest du heute lernen?",
  "Wie geht es dir heute? Erzähl mir von deinem Tag auf Deutsch.",
  "Perfekt mit haben oder sein? Ich habe gegessen. Ich bin gegangen.",
];

type CalibrationProfiles = Record<string, AvatarCalibration>;

function loadProfiles(): CalibrationProfiles {
  try {
    const raw = localStorage.getItem(CALIBRATION_STORAGE_KEY);
    return raw ? JSON.parse(raw) as CalibrationProfiles : {};
  } catch {
    return {};
  }
}

function saveProfile(modelKey: string, calibration: AvatarCalibration): void {
  try {
    const profiles = loadProfiles();
    profiles[modelKey] = calibration;
    localStorage.setItem(CALIBRATION_STORAGE_KEY, JSON.stringify(profiles));
  } catch {
    // A private browser session can reject localStorage. The avatar still works for the current session.
  }
}

function getProfile(modelKey: string): AvatarCalibration {
  return { ...DEFAULT_AVATAR_CALIBRATION, ...loadProfiles()[modelKey] };
}

class ModelErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode; resetKey: string },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(previous: Readonly<{ resetKey: string }>) {
    if (previous.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  componentDidCatch(error: unknown) {
    console.warn("[Avatar] Échec du chargement GLB", error);
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function SceneFallback() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.68, 32, 24]} />
        <meshStandardMaterial color="#f0b49c" roughness={0.75} />
      </mesh>
      <mesh position={[0, -0.82, 0]}>
        <sphereGeometry args={[0.95, 32, 24]} />
        <meshStandardMaterial color="#f9d5e3" roughness={0.8} />
      </mesh>
    </group>
  );
}

function SceneLoading() {
  return (
    <Html center>
      <div className="flex items-center gap-2 whitespace-nowrap rounded-full bg-black/65 px-4 py-2 text-xs text-white backdrop-blur">
        <Loader2 className="h-4 w-4 animate-spin" />
        Chargement du modèle 3D…
      </div>
    </Html>
  );
}

function reportLabel(report: AvatarMappingReport | null): string {
  if (!report) return "Analyse du rig…";
  if (report.standard === "hybrid") return "ARKit + Oculus";
  if (report.standard === "oculus") return "Oculus LipSync";
  if (report.standard === "arkit") return "ARKit";
  if (report.standard === "custom") return "Rig personnalisé";
  return "Aucun rig facial";
}

export default function Avatar() {
  const [modelUrl, setModelUrl] = useState(DEFAULT_MODEL_URL);
  const [modelName, setModelName] = useState(DEFAULT_MODEL_NAME);
  const [modelSize, setModelSize] = useState<number | null>(null);
  const [modelKey, setModelKey] = useState("default");
  const [calibration, setCalibration] = useState<AvatarCalibration>(() => getProfile("default"));
  const [report, setReport] = useState<AvatarMappingReport | null>(null);
  const [dragging, setDragging] = useState(false);
  const [text, setText] = useState(SUGGESTIONS[0]);
  const [voice, setVoice] = useState("sage");
  const [loadingSpeech, setLoadingSpeech] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [faceLab, setFaceLab] = useState<FaceLabControls>(DEFAULT_FACE_LAB);

  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const controllerRef = useRef<AvatarController | null>(null);
  const signalRef = useRef<AvatarSignal>({ intensity: 0, viseme: "viseme_sil", speaking: false });
  const expressionsRef = useRef<AvatarExpressions>({
    jawOverride: null,
    browOverride: null,
    smileOverride: null,
    blinkLeftOverride: null,
    blinkRightOverride: null,
    puckerOverride: null,
    cheekOverride: null,
  });

  const stopAudio = useCallback(() => {
    if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = null;
    const audio = audioRef.current;
    audioRef.current = null;
    if (audio) {
      audio.onended = null;
      audio.onpause = null;
      audio.pause();
    }
    sourceRef.current?.disconnect();
    analyserRef.current?.disconnect();
    sourceRef.current = null;
    analyserRef.current = null;
    signalRef.current = { intensity: 0, viseme: "viseme_sil", speaking: false };
    setSpeaking(false);
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = null;
  }, []);

  useEffect(() => {
    saveProfile(modelKey, calibration);
  }, [calibration, modelKey]);

  useEffect(() => () => {
    stopAudio();
    if (objectUrlRef.current) {
      useGLTF.clear(objectUrlRef.current);
      URL.revokeObjectURL(objectUrlRef.current);
    }
    void audioContextRef.current?.close();
  }, [stopAudio]);

  const handleReport = useCallback((nextReport: AvatarMappingReport) => {
    setReport(nextReport);
  }, []);

  const updateCalibration = <K extends keyof AvatarCalibration>(
    key: K,
    value: AvatarCalibration[K],
  ) => {
    setCalibration((current) => ({ ...current, [key]: value }));
  };

  const resetCalibration = () => {
    expressionsRef.current = {
      jawOverride: null,
      browOverride: null,
      smileOverride: null,
      blinkLeftOverride: null,
      blinkRightOverride: null,
      puckerOverride: null,
      cheekOverride: null,
    };
    setFaceLab(DEFAULT_FACE_LAB);
    setCalibration({ ...DEFAULT_AVATAR_CALIBRATION });
    controllerRef.current?.resetFace();
    toast.success("Réglages recommandés restaurés");
  };

  const updateFaceLab = (key: keyof FaceLabControls, value: number) => {
    setFaceLab((current) => ({ ...current, [key]: value }));
    const expressions = expressionsRef.current;
    if (key === "jaw") expressions.jawOverride = value;
    if (key === "smile") expressions.smileOverride = value;
    if (key === "brows") expressions.browOverride = value;
    if (key === "blinkLeft") expressions.blinkLeftOverride = value;
    if (key === "blinkRight") expressions.blinkRightOverride = value;
    if (key === "pucker") expressions.puckerOverride = value;
    if (key === "cheeks") expressions.cheekOverride = value;
  };

  const resetFaceLab = () => {
    setFaceLab(DEFAULT_FACE_LAB);
    expressionsRef.current = {
      jawOverride: null,
      browOverride: null,
      smileOverride: null,
      blinkLeftOverride: null,
      blinkRightOverride: null,
      puckerOverride: null,
      cheekOverride: null,
    };
    controllerRef.current?.resetFace();
  };

  const loadFile = async (file: File) => {
    if (!file.name.toLocaleLowerCase().endsWith(".glb")) {
      toast.error("Choisissez un fichier au format .glb");
      return;
    }
    if (file.size > MAX_GLB_SIZE) {
      toast.error(`Le fichier dépasse la limite de ${formatFileSize(MAX_GLB_SIZE)}.`);
      return;
    }

    const header = await file.slice(0, 12).arrayBuffer();
    const headerError = validateGlbHeader(header);
    if (headerError) {
      toast.error(headerError);
      return;
    }

    stopAudio();
    if (objectUrlRef.current) {
      useGLTF.clear(objectUrlRef.current);
      URL.revokeObjectURL(objectUrlRef.current);
    }

    const url = URL.createObjectURL(file);
    const fingerprint = `${file.name}:${file.size}:${file.lastModified}`;
    objectUrlRef.current = url;
    setReport(null);
    setModelUrl(url);
    setModelName(file.name);
    setModelSize(file.size);
    setModelKey(fingerprint);
    setCalibration(getProfile(fingerprint));
    toast.success(`${file.name} est prêt pour l’analyse.`);
  };

  const restoreDefaultModel = () => {
    stopAudio();
    if (objectUrlRef.current) {
      useGLTF.clear(objectUrlRef.current);
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setReport(null);
    setModelUrl(DEFAULT_MODEL_URL);
    setModelName(DEFAULT_MODEL_NAME);
    setModelSize(null);
    setModelKey("default");
    setCalibration(getProfile("default"));
  };

  const speak = async (override?: string) => {
    const message = (override ?? text).trim();
    if (!message) {
      toast.error("Ajoutez une phrase à faire prononcer.");
      return;
    }

    stopAudio();
    setLoadingSpeech(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Votre session a expiré. Reconnectez-vous.");

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const response = await fetch(`${supabaseUrl}/functions/v1/avatar-tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          apikey: publishableKey,
        },
        body: JSON.stringify({ text: message, voice }),
      });

      if (!response.ok) {
        const details = await response.text().catch(() => "");
        throw new Error(details || `Le service vocal a répondu ${response.status}.`);
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      audioUrlRef.current = audioUrl;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      const context = audioContextRef.current ?? new AudioContext();
      audioContextRef.current = context;
      if (context.state === "suspended") await context.resume();

      const source = context.createMediaElementSource(audio);
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.55;
      source.connect(analyser);
      analyser.connect(context.destination);
      sourceRef.current = source;
      analyserRef.current = analyser;

      const frequencies = new Uint8Array(analyser.frequencyBinCount);
      const sequence = buildVisemeSequence(message);
      const tick = () => {
        if (!audioRef.current || audioRef.current.paused) return;
        analyser.getByteFrequencyData(frequencies);
        let energy = 0;
        const end = Math.min(48, frequencies.length);
        for (let index = 2; index < end; index += 1) energy += frequencies[index];
        const average = energy / Math.max(1, end - 2) / 255;
        signalRef.current = {
          intensity: Math.min(1, average * 2.65),
          viseme: getTimelineViseme(sequence, audio.currentTime, audio.duration),
          speaking: true,
        };
        animationFrameRef.current = requestAnimationFrame(tick);
      };

      audio.onplay = () => {
        setSpeaking(true);
        tick();
      };
      audio.onended = stopAudio;
      await audio.play();
    } catch (error) {
      stopAudio();
      toast.error(error instanceof Error ? error.message : "Impossible de générer la voix.");
    } finally {
      setLoadingSpeech(false);
    }
  };

  const detectedItems = useMemo(() => {
    if (!report) return [];
    return [
      { label: "Bouche", ok: report.oculusCount > 0 || report.hasJaw },
      { label: "Yeux", ok: report.hasBlink },
      { label: "Sourcils", ok: report.hasBrows },
      { label: "Sourire", ok: report.hasSmile },
    ];
  }, [report]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
        <Link
          to="/app"
          className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à mon espace
        </Link>

        <header className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              Professeur virtuel
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Faites parler votre avatar</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Écrivez une phrase en allemand. Le modèle cligne des yeux et synchronise sa bouche automatiquement.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1.5">
              <FileBox className="h-3.5 w-3.5" />
              GLB 2.0
            </Badge>
            <Badge variant={report?.standard === "none" ? "destructive" : "secondary"}>
              {reportLabel(report)}
            </Badge>
          </div>
        </header>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
          <Card
            className={`relative min-h-[430px] overflow-hidden border-primary/20 sm:min-h-[560px] ${
              dragging ? "ring-2 ring-primary ring-offset-2" : ""
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              const file = event.dataTransfer.files?.[0];
              if (file) void loadFile(file);
            }}
          >
            <Canvas
              camera={{ position: [0, 0.2, 4.4], fov: 32 }}
              dpr={[1, 1.5]}
              shadows
              gl={{ antialias: true, powerPreference: "high-performance" }}
            >
              <color attach="background" args={["#07101d"]} />
              <ambientLight intensity={0.85} />
              <directionalLight position={[3, 4, 4]} intensity={1.8} castShadow />
              <directionalLight position={[-3, 2, 2]} intensity={0.8} color="#67e8f9" />
              <directionalLight position={[0, 2, -3]} intensity={0.75} color="#c084fc" />
              <Suspense fallback={<SceneLoading />}>
                <ModelErrorBoundary resetKey={modelUrl} fallback={<SceneFallback />}>
                  <AvatarModel
                    ref={controllerRef}
                    url={modelUrl}
                    calibration={calibration}
                    signalRef={signalRef}
                    expressionsRef={expressionsRef}
                    onReport={handleReport}
                  />
                </ModelErrorBoundary>
                <ContactShadows position={[0, -1.4, 0]} opacity={0.45} blur={2.5} scale={5} far={4} />
                <Environment preset="city" />
              </Suspense>
              <OrbitControls
                makeDefault
                enablePan={false}
                target={[0, 0, 0]}
                minDistance={2.6}
                maxDistance={6}
                minPolarAngle={Math.PI / 3.2}
                maxPolarAngle={Math.PI / 1.65}
              />
            </Canvas>

            <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 bg-gradient-to-b from-black/70 to-transparent p-4 text-white">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{modelName}</div>
                <div className="mt-0.5 text-xs text-white/65">
                  {modelSize ? formatFileSize(modelSize) : "Modèle intégré"}
                  {report ? ` · ${report.morphCount} contrôles faciaux` : ""}
                </div>
              </div>
              {speaking && (
                <Badge className="shrink-0 gap-1.5 bg-red-500 text-white">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                  Parle
                </Badge>
              )}
            </div>

            <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2">
              <input
                ref={inputRef}
                type="file"
                accept=".glb,model/gltf-binary"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void loadFile(file);
                  event.target.value = "";
                }}
              />
              <Button
                variant="secondary"
                className="shadow-lg"
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Changer le modèle
              </Button>
              {modelUrl !== DEFAULT_MODEL_URL && (
                <Button variant="outline" className="bg-background/85 shadow-lg" onClick={restoreDefaultModel}>
                  Modèle par défaut
                </Button>
              )}
            </div>

            {dragging && (
              <div className="pointer-events-none absolute inset-3 grid place-items-center rounded-xl border-2 border-dashed border-primary bg-primary/20 backdrop-blur-sm">
                <div className="rounded-xl bg-background/95 px-6 py-4 text-center shadow-xl">
                  <Upload className="mx-auto mb-2 h-7 w-7 text-primary" />
                  <div className="font-semibold">Déposez votre fichier GLB</div>
                  <div className="mt-1 text-xs text-muted-foreground">glTF 2.0 · maximum 25 Mo</div>
                </div>
              </div>
            )}
          </Card>

          <div className="space-y-4">
            <Card className="p-4 sm:p-5">
              <div className="mb-4">
                <h2 className="font-semibold">1. Écrivez une phrase</h2>
                <p className="text-xs text-muted-foreground">La bouche utilisera automatiquement les visèmes détectés.</p>
              </div>
              <Textarea
                value={text}
                onChange={(event) => setText(event.target.value.slice(0, 2000))}
                rows={5}
                placeholder="Hallo! Wie geht es dir?"
              />
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>{text.length}/2000</span>
                <button
                  type="button"
                  className="font-medium text-primary hover:underline"
                  onClick={() => {
                    const currentIndex = SUGGESTIONS.indexOf(text);
                    setText(SUGGESTIONS[(currentIndex + 1) % SUGGESTIONS.length]);
                  }}
                >
                  Autre exemple
                </button>
              </div>

              <div className="mt-4">
                <Label htmlFor="avatar-voice" className="text-xs">Voix allemande</Label>
                <Select value={voice} onValueChange={setVoice}>
                  <SelectTrigger id="avatar-voice" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VOICES.map((item) => (
                      <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
                <Button onClick={() => void speak()} disabled={loadingSpeech || speaking}>
                  {loadingSpeech ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Préparation…</>
                  ) : (
                    <><Play className="mr-2 h-4 w-4" />Faire parler</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={!speaking}
                  onClick={stopAudio}
                  aria-label="Arrêter la voix"
                >
                  <Square className="h-4 w-4" />
                </Button>
              </div>
            </Card>

            <Card className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">2. Vérification automatique</h2>
                  <p className="text-xs text-muted-foreground">Le modèle est analysé après chaque import.</p>
                </div>
                {report && (
                  <Badge variant={report.standard === "none" ? "destructive" : "outline"}>
                    {reportLabel(report)}
                  </Badge>
                )}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {detectedItems.length > 0 ? detectedItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-2 rounded-lg border bg-muted/25 px-3 py-2 text-xs">
                    {item.ok
                      ? <Check className="h-4 w-4 text-emerald-500" />
                      : <AlertCircle className="h-4 w-4 text-amber-500" />}
                    {item.label}
                  </div>
                )) : (
                  <div className="col-span-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyse en cours…
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-4 sm:p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">3. Visage 3D en temps réel</h2>
                  <p className="text-xs text-muted-foreground">
                    Chaque curseur déforme directement la géométrie du visage.
                  </p>
                </div>
                <Button size="sm" variant="ghost" onClick={resetFaceLab}>
                  <RotateCcw className="mr-1 h-3.5 w-3.5" />
                  Auto
                </Button>
              </div>

              <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
                <SliderRow
                  label="Ouverture de la bouche"
                  value={faceLab.jaw}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(value) => updateFaceLab("jaw", value)}
                />
                <SliderRow
                  label="Sourire"
                  value={faceLab.smile}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(value) => updateFaceLab("smile", value)}
                />
                <SliderRow
                  label="Sourcils"
                  value={faceLab.brows}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(value) => updateFaceLab("brows", value)}
                />
                <SliderRow
                  label="Lèvres arrondies"
                  value={faceLab.pucker}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(value) => updateFaceLab("pucker", value)}
                />
                <SliderRow
                  label="Paupière gauche"
                  value={faceLab.blinkLeft}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(value) => updateFaceLab("blinkLeft", value)}
                />
                <SliderRow
                  label="Paupière droite"
                  value={faceLab.blinkRight}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(value) => updateFaceLab("blinkRight", value)}
                />
                <SliderRow
                  label="Volume des joues"
                  value={faceLab.cheeks}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(value) => updateFaceLab("cheeks", value)}
                />
              </div>
            </Card>

            <Accordion type="single" collapsible className="rounded-xl border bg-card px-4">
              <AccordionItem value="advanced" className="border-0">
                <AccordionTrigger className="hover:no-underline">
                  <span className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-primary" />
                    Réglages avancés
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-5 pb-5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      Utilisez ces réglages seulement si un modèle importé bouge mal.
                    </p>
                    <Button size="sm" variant="ghost" onClick={resetCalibration}>
                      <RotateCcw className="mr-1 h-3.5 w-3.5" />
                      Réinitialiser
                    </Button>
                  </div>

                  <div>
                    <Label className="text-xs">Standard facial</Label>
                    <Select
                      value={calibration.visemeSet}
                      onValueChange={(value: VisemeStandard) => updateCalibration("visemeSet", value)}
                    >
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Automatique — recommandé</SelectItem>
                        <SelectItem value="oculus">Oculus LipSync</SelectItem>
                        <SelectItem value="arkit">ARKit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <SliderRow
                    label="Taille du modèle"
                    value={calibration.modelScale}
                    min={0.7}
                    max={1.5}
                    step={0.01}
                    onChange={(value) => updateCalibration("modelScale", value)}
                  />
                  <SliderRow
                    label="Hauteur"
                    value={calibration.modelOffsetY}
                    min={-1}
                    max={1}
                    step={0.01}
                    onChange={(value) => updateCalibration("modelOffsetY", value)}
                  />
                  <SliderRow
                    label="Amplitude de la bouche"
                    value={calibration.mouthGain}
                    min={0.4}
                    max={2}
                    step={0.01}
                    onChange={(value) => updateCalibration("mouthGain", value)}
                  />
                  <SliderRow
                    label="Fluidité de la bouche"
                    value={calibration.mouthSmoothing}
                    min={0.05}
                    max={1}
                    step={0.01}
                    onChange={(value) => updateCalibration("mouthSmoothing", value)}
                  />
                  <SliderRow
                    label="Sourire naturel"
                    value={calibration.smile}
                    min={0}
                    max={0.55}
                    step={0.01}
                    onChange={(value) => updateCalibration("smile", value)}
                  />
                  <SliderRow
                    label="Mouvement des sourcils"
                    value={calibration.browIntensity}
                    min={0}
                    max={0.8}
                    step={0.01}
                    onChange={(value) => updateCalibration("browIntensity", value)}
                  />
                  <SliderRow
                    label="Intervalle de clignement"
                    value={calibration.blinkIntervalSec}
                    min={2}
                    max={7}
                    step={0.1}
                    suffix=" s"
                    onChange={(value) => updateCalibration("blinkIntervalSec", value)}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" onClick={() => controllerRef.current?.blink()}>
                      Cligner des yeux
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        expressionsRef.current.smileOverride =
                          expressionsRef.current.smileOverride === null ? 0.7 : null;
                      }}
                    >
                      Tester le sourire
                    </Button>
                  </div>

                  {report?.oculusCount ? (
                    <div>
                      <Label className="mb-2 block text-xs">Visèmes Oculus</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {OCULUS_VISEMES.filter((viseme) => report.morphNames.includes(viseme)).map((viseme) => (
                          <button
                            key={viseme}
                            type="button"
                            className="rounded-md border bg-muted/40 px-2 py-1 text-[10px] font-mono transition hover:border-primary hover:bg-primary hover:text-primary-foreground"
                            onPointerDown={() => {
                              signalRef.current = { intensity: 1, viseme, speaking: true };
                            }}
                            onPointerUp={() => {
                              signalRef.current = { intensity: 0, viseme: "viseme_sil", speaking: false };
                            }}
                            onPointerLeave={() => {
                              signalRef.current = { intensity: 0, viseme: "viseme_sil", speaking: false };
                            }}
                          >
                            {viseme.replace("viseme_", "")}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {report && (
                    <details className="rounded-lg border bg-muted/20 p-3 text-xs">
                      <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                        Diagnostic du modèle
                        <ChevronDown className="h-4 w-4" />
                      </summary>
                      <div className="mt-3 space-y-1 text-muted-foreground">
                        <p>{report.meshCount} meshes avec morph targets</p>
                        <p>{report.morphCount} contrôles faciaux</p>
                        <p>{report.oculusCount}/15 visèmes Oculus</p>
                        <p>{report.arkitCount} contrôles ARKit reconnus</p>
                        <p>Animations : {report.animations.join(", ") || "aucune"}</p>
                      </div>
                    </details>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
              <Volume2 className="h-3.5 w-3.5" />
              Synchronisation phonétique approximative lorsque le TTS ne fournit pas de timeline native.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  suffix = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <Label className="text-xs">{label}</Label>
        <span className="font-mono text-[10px] text-muted-foreground">
          {value.toFixed(2)}{suffix}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(next) => onChange(next[0])}
      />
    </div>
  );
}

useGLTF.preload(DEFAULT_MODEL_URL);
