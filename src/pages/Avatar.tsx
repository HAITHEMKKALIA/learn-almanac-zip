import { Component, ReactNode, Suspense, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, forwardRef } from "react";
import { Link } from "react-router-dom";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, ContactShadows, Float, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { ArrowLeft, Sparkles as SparklesIcon, Volume2, Loader2, Play, Upload, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import faceModel from "@/assets/avatar-doctor.glb.asset.json";

import teacherPortrait from "@/assets/ai-teacher-portrait.jpg.asset.json";

const DEFAULT_FACE_URL = faceModel.url;
const PORTRAIT_URL = teacherPortrait.url;


type LipRef = { value: number };
type VisemeSet = "auto" | "arkit" | "oculus";

type Calibration = {
  scale: number;
  posX: number;
  posY: number;
  posZ: number;
  mouthGain: number;
  mouthSmoothing: number; // 0..1 lerp factor
  blinkIntervalSec: number;
  browIntensity: number;
  visemeSet: VisemeSet;
};

const DEFAULT_CALIB: Calibration = {
  scale: 12,
  posX: 0,
  posY: -1.4,
  posZ: 0,
  mouthGain: 1,
  mouthSmoothing: 0.5,
  blinkIntervalSec: 3.5,
  browIntensity: 0.3,
  visemeSet: "auto",
};

const ARKIT_MOUTH = ["jawOpen", "mouthOpen", "mouthFunnel", "mouthPucker"];
// Full Oculus LipSync viseme set (15 visemes)
const OCULUS_MOUTH = [
  "viseme_sil", "viseme_PP", "viseme_FF", "viseme_TH", "viseme_DD",
  "viseme_kk", "viseme_CH", "viseme_SS", "viseme_nn", "viseme_RR",
  "viseme_aa", "viseme_E", "viseme_I", "viseme_O", "viseme_U",
];
const ARKIT_BLINK_L = ["eyeBlinkLeft", "eyeBlink_L"];
const ARKIT_BLINK_R = ["eyeBlinkRight", "eyeBlink_R"];
const BROW_KEYS = ["browInnerUp", "browOuterUpLeft", "browOuterUpRight", "browUpLeft", "browUpRight", "browDownLeft", "browDownRight"];
const SMILE_KEYS = ["mouthSmile", "mouthSmileLeft", "mouthSmileRight"];
const JAW_KEYS = ["jawOpen"];

export type FacialController = {
  setMorph: (key: string, value: number) => void;
  blink: () => void;
  resetFace: () => void;
  listMorphs: () => string[];
};

export type MappingReport = {
  meshes: number;
  totalMorphs: number;
  mouth: string[];
  blink: string[];
  brow: string[];
  smile: string[];
};

class AvatarErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err: unknown) { console.warn("Avatar load failed:", err); }
  render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}

/* ----------------------- Modern stylized fallback ----------------------- */
function StylizedAvatar({ lipRef, speaking }: { lipRef: LipRef; speaking: boolean }) {
  const head = useRef<THREE.Group>(null);
  const jaw = useRef<THREE.Group>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (head.current) head.current.rotation.y = Math.sin(t * 0.4) * 0.08;
    if (jaw.current) jaw.current.rotation.x = THREE.MathUtils.lerp(jaw.current.rotation.x, lipRef.value * 0.35, 0.4);
  });
  return (
    <group ref={head} position={[0, 0, 0]}>
      <mesh><sphereGeometry args={[0.4, 32, 32]} /><meshStandardMaterial color="#f2c9a8" /></mesh>
      <group ref={jaw} position={[0, -0.15, 0.3]}>
        <mesh><boxGeometry args={[0.15, 0.05, 0.05]} /><meshStandardMaterial color="#b84a5a" /></mesh>
      </group>
      {speaking && <pointLight color="#22d3ee" intensity={2} distance={2} />}
    </group>
  );
}

/* ---------------------- Realistic human face (GLB) ---------------------- */
const AvatarModel = forwardRef<FacialController, {
  url: string; lipRef: LipRef; speaking: boolean; calib: Calibration;
  onReport?: (r: MappingReport) => void;
  manualOverrides?: React.MutableRefObject<Record<string, number>>;
}>(function AvatarModel({ url, lipRef, speaking, calib, onReport, manualOverrides }, ref) {
  const { scene } = useGLTF(url);
  const group = useRef<THREE.Group>(null);
  const mouthTargets = useRef<{ mesh: THREE.Mesh; i: number }[]>([]);
  const blinkTargets = useRef<{ mesh: THREE.Mesh; i: number }[]>([]);
  const browTargets = useRef<{ mesh: THREE.Mesh; i: number }[]>([]);
  // Registry: morph name -> list of (mesh, index) — supports multi-mesh (upper/lower lip)
  const registry = useRef<Map<string, { mesh: THREE.Mesh; i: number }[]>>(new Map());

  useEffect(() => {
    mouthTargets.current = [];
    blinkTargets.current = [];
    browTargets.current = [];
    registry.current = new Map();
    const found = { mouth: new Set<string>(), blink: new Set<string>(), brow: new Set<string>(), smile: new Set<string>() };
    let meshes = 0, totalMorphs = 0;

    let mouthKeys: string[] = [];
    if (calib.visemeSet === "arkit") mouthKeys = ARKIT_MOUTH;
    else if (calib.visemeSet === "oculus") mouthKeys = OCULUS_MOUTH;
    else mouthKeys = [...ARKIT_MOUTH, ...OCULUS_MOUTH];

    scene.traverse((obj) => {
      const m = obj as THREE.Mesh;
      if (!m.isMesh || !m.morphTargetDictionary || !m.morphTargetInfluences) return;
      meshes++;
      totalMorphs += Object.keys(m.morphTargetDictionary).length;
      const dict = m.morphTargetDictionary;

      // Register every morph target for live control
      for (const name of Object.keys(dict)) {
        const i = dict[name];
        if (typeof i !== "number") continue;
        const arr = registry.current.get(name) || [];
        arr.push({ mesh: m, i });
        registry.current.set(name, arr);
      }

      for (const k of mouthKeys) {
        const i = dict[k];
        if (typeof i === "number") { mouthTargets.current.push({ mesh: m, i }); found.mouth.add(k); }
      }
      for (const k of ARKIT_BLINK_L) { const i = dict[k]; if (typeof i === "number") { blinkTargets.current.push({ mesh: m, i }); found.blink.add(k); } }
      for (const k of ARKIT_BLINK_R) { const i = dict[k]; if (typeof i === "number") { blinkTargets.current.push({ mesh: m, i }); found.blink.add(k); } }
      for (const k of BROW_KEYS) { const i = dict[k]; if (typeof i === "number") { browTargets.current.push({ mesh: m, i }); found.brow.add(k); } }
      for (const k of SMILE_KEYS) {
        const i = dict[k];
        if (typeof i === "number") { m.morphTargetInfluences[i] = 0.12; found.smile.add(k); }
      }
    });

    onReport?.({
      meshes, totalMorphs,
      mouth: [...found.mouth], blink: [...found.blink],
      brow: [...found.brow], smile: [...found.smile],
    });
  }, [scene, calib.visemeSet]);

  useImperativeHandle(ref, () => ({
    setMorph: (key, value) => {
      const arr = registry.current.get(key);
      if (!arr) return;
      const v = Math.max(0, Math.min(1, value));
      for (const t of arr) if (t.mesh.morphTargetInfluences) t.mesh.morphTargetInfluences[t.i] = v;
    },
    blink: () => { manualBlinkTrigger.current = 1; },
    resetFace: () => {
      registry.current.forEach((arr) => {
        for (const t of arr) if (t.mesh.morphTargetInfluences) t.mesh.morphTargetInfluences[t.i] = 0;
      });
    },
    listMorphs: () => Array.from(registry.current.keys()),
  }), []);

  const smoothed = useRef(0);
  const blinkPhase = useRef(0);
  const manualBlinkTrigger = useRef(0);

  useFrame((_, dt) => {
    const target = Math.min(1, Math.max(0, lipRef.value * calib.mouthGain));
    const alpha = THREE.MathUtils.clamp(calib.mouthSmoothing, 0.05, 1);
    smoothed.current += (target - smoothed.current) * alpha;
    const v = smoothed.current;

    for (const t of mouthTargets.current) {
      if (t.mesh.morphTargetInfluences) t.mesh.morphTargetInfluences[t.i] = v;
    }

    blinkPhase.current += dt / Math.max(0.6, calib.blinkIntervalSec);
    const cycle = blinkPhase.current % 1;
    let blink = cycle > 0.96 ? 1 - Math.abs((cycle - 0.98) * 50) : 0;
    if (manualBlinkTrigger.current > 0) {
      blink = Math.max(blink, manualBlinkTrigger.current);
      manualBlinkTrigger.current = Math.max(0, manualBlinkTrigger.current - dt * 4);
    }
    for (const b of blinkTargets.current) {
      if (b.mesh.morphTargetInfluences) b.mesh.morphTargetInfluences[b.i] = Math.max(0, blink);
    }

    for (const br of browTargets.current) {
      if (br.mesh.morphTargetInfluences) {
        br.mesh.morphTargetInfluences[br.i] = (speaking ? (0.15 + v * 0.6) : 0.05) * calib.browIntensity * 2;
      }
    }

    // Apply manual overrides last (test sliders win over automated animation)
    if (manualOverrides?.current) {
      for (const [name, val] of Object.entries(manualOverrides.current)) {
        const arr = registry.current.get(name);
        if (!arr) continue;
        for (const t of arr) if (t.mesh.morphTargetInfluences) t.mesh.morphTargetInfluences[t.i] = val;
      }
    }

    if (group.current) {
      const t = performance.now() * 0.001;
      group.current.rotation.y = Math.sin(t * 0.5) * 0.08;
      group.current.rotation.x = Math.sin(t * 0.7) * 0.03;
    }
  });

  return (
    <group ref={group} position={[calib.posX, -0.4, calib.posZ]}>
      <primitive object={scene} scale={calib.scale} position={[0, calib.posY, 0]} />
    </group>
  );
});

/* ---------------------- Photo-based 3D Avatar ---------------------- */
function Photo3DAvatar({ url, lipRef, speaking }: { url: string; lipRef: LipRef; speaking: boolean }) {
  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const t = loader.load(url);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [url]);

  const group = useRef<THREE.Group>(null);
  const mouth = useRef<THREE.Mesh>(null);
  const eyeL = useRef<THREE.Mesh>(null);
  const eyeR = useRef<THREE.Mesh>(null);
  const smoothed = useRef(0);
  const blinkPhase = useRef(0);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    if (group.current) {
      group.current.rotation.y = Math.sin(t * 0.5) * 0.08;
      group.current.rotation.x = Math.sin(t * 0.7) * 0.03;
      const breath = 1 + Math.sin(t * 1.2) * 0.008;
      group.current.scale.set(breath, breath, 1);
    }
    // Lip sync
    smoothed.current += (lipRef.value - smoothed.current) * 0.5;
    if (mouth.current) {
      const s = 0.15 + smoothed.current * 0.55;
      mouth.current.scale.set(1, s, 1);
      (mouth.current.material as THREE.MeshBasicMaterial).opacity = 0.55 + smoothed.current * 0.35;
    }
    // Blink
    blinkPhase.current += dt / 3.5;
    const c = blinkPhase.current % 1;
    const blink = c > 0.96 ? 1 - Math.abs((c - 0.98) * 50) : 0;
    const bScale = Math.max(0.05, 1 - blink);
    if (eyeL.current) eyeL.current.scale.y = bScale;
    if (eyeR.current) eyeR.current.scale.y = bScale;
  });

  return (
    <group ref={group}>
      {/* Portrait plane */}
      <mesh>
        <planeGeometry args={[1.35, 1.6, 32, 32]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      {/* Mouth overlay (animated) — positioned over the mouth region of the portrait */}
      <mesh ref={mouth} position={[0.02, -0.18, 0.01]}>
        <planeGeometry args={[0.13, 0.05]} />
        <meshBasicMaterial color="#3a0a12" transparent opacity={0.6} />
      </mesh>
      {/* Eye blink covers — thin skin-tone rectangles that flatten to simulate blink */}
      <mesh ref={eyeL} position={[-0.11, 0.13, 0.01]}>
        <planeGeometry args={[0.08, 0.03]} />
        <meshBasicMaterial color="#000000" transparent opacity={0} />
      </mesh>
      <mesh ref={eyeR} position={[0.13, 0.13, 0.01]}>
        <planeGeometry args={[0.08, 0.03]} />
        <meshBasicMaterial color="#000000" transparent opacity={0} />
      </mesh>
      {speaking && <pointLight color="#ff6bb5" intensity={1.5} distance={2} position={[0, -0.2, 0.5]} />}
    </group>
  );
}



const VOICES = [
  { id: "alloy", label: "Alloy — neutre" },
  { id: "ash", label: "Ash — chaud" },
  { id: "ballad", label: "Ballad — doux" },
  { id: "coral", label: "Coral — vive" },
  { id: "echo", label: "Echo — clair" },
  { id: "fable", label: "Fable — narratif" },
  { id: "onyx", label: "Onyx — grave" },
  { id: "nova", label: "Nova — jeune" },
  { id: "sage", label: "Sage — pédagogue" },
  { id: "shimmer", label: "Shimmer — cristallin" },
];

const SUGGESTIONS = [
  "Hallo! Ich bin dein virtueller Deutschlehrer. Wollen wir heute zusammen lernen?",
  "Der schnelle braune Fuchs springt über den faulen Hund.",
  "Wie geht es dir heute? Erzähl mir von deinem Tag auf Deutsch.",
  "Perfekt mit haben oder sein? Ich habe gegessen. Ich bin gegangen.",
];

const CALIB_STORAGE = "avatar_calibration_v1";

export default function Avatar() {
  const [mode, setMode] = useState<"portrait" | "3d">("3d");

  const [avatarUrl, setAvatarUrl] = useState<string>(DEFAULT_FACE_URL);
  const [usePhoto, setUsePhoto] = useState<boolean>(false);
  const [pendingUrl, setPendingUrl] = useState("");
  const [text, setText] = useState(SUGGESTIONS[0]);
  const [voice, setVoice] = useState("sage");
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [lipLevel, setLipLevel] = useState(0);

  const [calib, setCalib] = useState<Calibration>(() => {
    try {
      const raw = localStorage.getItem(CALIB_STORAGE);
      return raw ? { ...DEFAULT_CALIB, ...JSON.parse(raw) } : DEFAULT_CALIB;
    } catch { return DEFAULT_CALIB; }
  });
  const [report, setReport] = useState<MappingReport | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const lipRef = useMemo<LipRef>(() => ({ value: 0 }), []);
  const controllerRef = useRef<FacialController | null>(null);
  const manualOverrides = useRef<Record<string, number>>({});
  const [, forceTick] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(CALIB_STORAGE, JSON.stringify(calib)); } catch { /* ignore */ }
  }, [calib]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      currentAudioRef.current?.pause();
      audioCtxRef.current?.close().catch(() => {});
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const setC = <K extends keyof Calibration>(k: K, v: Calibration[K]) => setCalib((c) => ({ ...c, [k]: v }));

  const handleReport = useCallback((r: MappingReport) => {
    setReport(r);
    if (r.mouth.length === 0) {
      toast.warning("Aucun blendshape bouche détecté — sync labiale désactivée");
    } else {
      toast.success(`Mapping OK · ${r.mouth.length} visèmes bouche, ${r.blink.length} clignement`);
    }
  }, []);

  const speak = async () => {
    const t = text.trim();
    if (!t) { toast.error("Écris quelque chose à faire dire"); return; }
    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      const base = (import.meta as any).env?.VITE_SUPABASE_URL || (supabase as any).supabaseUrl || "";
      const endpoint = `${base}/functions/v1/avatar-tts`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text: t, voice }),
      });
      if (!res.ok) {
        const err = await res.text().catch(() => "");
        throw new Error(err || `TTS failed (${res.status})`);
      }
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);

      currentAudioRef.current?.pause();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      const audio = new Audio(objUrl);
      audio.crossOrigin = "anonymous";
      currentAudioRef.current = audio;

      const ctx = audioCtxRef.current ?? new AudioContext();
      audioCtxRef.current = ctx;
      if (ctx.state === "suspended") await ctx.resume().catch(() => {});
      const source = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.4;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        let sum = 0;
        const bandEnd = Math.min(60, data.length);
        for (let i = 2; i < bandEnd; i++) sum += data[i];
        const avg = sum / (bandEnd - 2) / 255;
        const v = Math.min(1, avg * 2.2);
        lipRef.value = v;
        setLipLevel(v);

        rafRef.current = requestAnimationFrame(tick);
      };

      audio.onplay = () => { setSpeaking(true); tick(); };
      audio.onended = audio.onpause = () => {
        setSpeaking(false);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        lipRef.value = 0;
        setLipLevel(0);

        URL.revokeObjectURL(objUrl);
      };
      await audio.play();
    } catch (e: any) {
      toast.error(e.message || "Erreur TTS");
    } finally {
      setLoading(false);
    }
  };

  const applyUrl = () => {
    const u = pendingUrl.trim();
    setAvatarUrl(u);
    toast.success(u ? "Avatar chargé" : "Avatar par défaut restauré");
  };

  const onFilePicked = (f: File) => {
    if (!f.name.toLowerCase().endsWith(".glb")) {
      toast.error("Fichier .glb requis");
      return;
    }
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(f);
    objectUrlRef.current = url;
    setAvatarUrl(url);
    toast.success(`Chargé : ${f.name}`);
  };

  const resetCalib = () => { setCalib(DEFAULT_CALIB); toast.success("Calibration réinitialisée"); };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <Link to="/app" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <SparklesIcon className="w-8 h-8 text-primary" /> Avatar IA — Professeur virtuel
          </h1>
          <p className="text-muted-foreground">Calibration temps réel · Upload .glb · Sync labiale ARKit/Oculus</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr,400px]">
          <Card
            className={`overflow-hidden border-primary/20 relative ${dragOver ? "ring-2 ring-primary" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault(); setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) onFilePicked(f);
            }}
          >
            <div className="absolute inset-0 pointer-events-none"
                 style={{
                   background: "radial-gradient(ellipse at 50% 30%, hsl(var(--primary)/0.25), transparent 60%), linear-gradient(180deg, #0b1220 0%, #050810 100%)",
                 }} />
            <div className="h-[560px] relative">
              <div className="absolute top-3 right-3 z-20 flex gap-1 rounded-full bg-black/50 backdrop-blur border border-white/10 p-1">
                <button
                  onClick={() => setMode("portrait")}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold transition ${mode === "portrait" ? "bg-primary text-primary-foreground" : "text-white/70 hover:text-white"}`}
                >Portrait</button>
                <button
                  onClick={() => setMode("3d")}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold transition ${mode === "3d" ? "bg-primary text-primary-foreground" : "text-white/70 hover:text-white"}`}
                >3D</button>
              </div>

              {mode === "portrait" ? (
                <PortraitAvatar url={PORTRAIT_URL} speaking={speaking} lipLevel={lipLevel} />
              ) : (
                <Canvas
                  camera={{ position: [0, 0, 1.6], fov: 28 }}
                  shadows
                  dpr={[1, 2]}
                  gl={{ powerPreference: "high-performance", antialias: true, preserveDrawingBuffer: false, failIfMajorPerformanceCaveat: false }}
                  onCreated={({ gl }) => {
                    const canvas = gl.domElement;
                    canvas.addEventListener("webglcontextlost", (e) => {
                      e.preventDefault();
                      console.warn("[Avatar] WebGL context lost — preventing default to allow restore");
                    }, false);
                    canvas.addEventListener("webglcontextrestored", () => {
                      console.info("[Avatar] WebGL context restored");
                    }, false);
                  }}
                >
                  <color attach="background" args={["#050810"]} />
                  <fog attach="fog" args={["#050810", 3, 8]} />
                  <ambientLight intensity={0.35} />
                  <directionalLight position={[2.5, 3, 2]} intensity={1.4} castShadow color="#ffffff" shadow-mapSize={[1024, 1024]} />
                  <directionalLight position={[-2, 1.5, 1]} intensity={0.6} color="#22d3ee" />
                  <directionalLight position={[0, 2, -2]} intensity={1.1} color="#8b5cf6" />
                  <pointLight position={[0, 0.5, 2]} intensity={0.5} color="#22d3ee" />

                  <Suspense fallback={null}>
                    <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.15}>
                      {usePhoto ? (
                        <Photo3DAvatar url={PORTRAIT_URL} lipRef={lipRef} speaking={speaking} />
                      ) : (
                        <AvatarErrorBoundary fallback={<Photo3DAvatar url={PORTRAIT_URL} lipRef={lipRef} speaking={speaking} />}>
                          <AvatarModel
                            ref={controllerRef}
                            url={avatarUrl || DEFAULT_FACE_URL}
                            lipRef={lipRef}
                            speaking={speaking}
                            calib={calib}
                            onReport={handleReport}
                            manualOverrides={manualOverrides}
                          />
                        </AvatarErrorBoundary>
                      )}
                    </Float>
                    <Sparkles count={60} scale={[3, 2.5, 2]} size={2} speed={0.4} color="#22d3ee" opacity={0.7} />
                    <ContactShadows position={[0, -0.92, 0]} opacity={0.55} blur={2.4} scale={4} far={2} color="#000" />
                    <Environment preset="city" />
                  </Suspense>

                  <OrbitControls target={[0, 0, 0]} enablePan={false} minDistance={1.0} maxDistance={2.6}
                    minPolarAngle={Math.PI / 2.5} maxPolarAngle={Math.PI / 1.9} />
                </Canvas>
              )}


              {speaking && (
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-red-500/90 text-white text-xs font-medium flex items-center gap-2 z-10 backdrop-blur">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> Parle…
                </div>
              )}
              {dragOver && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-primary/20 border-2 border-dashed border-primary rounded-lg pointer-events-none">
                  <div className="text-white font-semibold text-lg">Déposer le fichier .glb ici</div>
                </div>
              )}
              <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/40 text-white text-[10px] font-mono tracking-widest z-10 backdrop-blur border border-white/10">
                DEUTSCH MEISTER · AI TUTOR v3
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            <Tabs defaultValue="speak" className="w-full">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="speak">Parler</TabsTrigger>
                <TabsTrigger value="calib">Calibrage</TabsTrigger>
                <TabsTrigger value="model">Modèle</TabsTrigger>
              </TabsList>

              <TabsContent value="speak" className="space-y-3 mt-3">
                <Card className="p-4 space-y-3">
                  <div>
                    <Label className="text-xs">Voix</Label>
                    <Select value={voice} onValueChange={setVoice}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {VOICES.map((v) => <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Texte à faire dire</Label>
                    <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} className="mt-1" placeholder="Hallo…" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{text.length} / 2000</span>
                      <button
                        onClick={() => setText(SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)])}
                        className="hover:text-foreground underline"
                      >Suggestion aléatoire</button>
                    </div>
                  </div>
                  <Button onClick={speak} disabled={loading || speaking} className="w-full">
                    {loading ? (<><Loader2 className="w-4 h-4 me-2 animate-spin" /> Génération…</>)
                      : speaking ? (<><Volume2 className="w-4 h-4 me-2" /> En cours…</>)
                      : (<><Play className="w-4 h-4 me-2" /> Faire parler</>)}
                  </Button>
                </Card>
              </TabsContent>

              <TabsContent value="calib" className="space-y-3 mt-3">
                <Card className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Position & taille</Label>
                    <Button size="sm" variant="ghost" onClick={resetCalib}>
                      <RotateCcw className="w-3 h-3 me-1" /> Reset
                    </Button>
                  </div>

                  <SliderRow label="Échelle" value={calib.scale} min={1} max={30} step={0.5}
                    onChange={(v) => setC("scale", v)} suffix="×" />
                  <SliderRow label="Position X" value={calib.posX} min={-1} max={1} step={0.02}
                    onChange={(v) => setC("posX", v)} />
                  <SliderRow label="Position Y" value={calib.posY} min={-3} max={1} step={0.05}
                    onChange={(v) => setC("posY", v)} />
                  <SliderRow label="Position Z" value={calib.posZ} min={-1} max={1} step={0.02}
                    onChange={(v) => setC("posZ", v)} />
                </Card>

                <Card className="p-4 space-y-4">
                  <Label className="text-sm font-semibold">Sync labiale</Label>
                  <div>
                    <Label className="text-xs">Jeu de visèmes</Label>
                    <Select value={calib.visemeSet} onValueChange={(v: VisemeSet) => setC("visemeSet", v)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto (ARKit + Oculus)</SelectItem>
                        <SelectItem value="arkit">ARKit (52 blendshapes)</SelectItem>
                        <SelectItem value="oculus">Oculus / RPM (viseme_*)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <SliderRow label="Intensité bouche" value={calib.mouthGain} min={0} max={3} step={0.05}
                    onChange={(v) => setC("mouthGain", v)} suffix="×" />
                  <SliderRow label="Smoothing (réactivité)" value={calib.mouthSmoothing} min={0.05} max={1} step={0.01}
                    onChange={(v) => setC("mouthSmoothing", v)} />
                  <p className="text-[11px] text-muted-foreground">
                    Smoothing bas = bouche douce/lissée · haut = réaction instantanée à l'audio.
                  </p>
                </Card>

                <Card className="p-4 space-y-4">
                  <Label className="text-sm font-semibold">Expressions</Label>
                  <SliderRow label="Fréquence clignements" value={calib.blinkIntervalSec} min={1} max={8} step={0.1}
                    onChange={(v) => setC("blinkIntervalSec", v)} suffix="s" />
                  <SliderRow label="Intensité sourcils" value={calib.browIntensity} min={0} max={1} step={0.02}
                    onChange={(v) => setC("browIntensity", v)} />
                </Card>

                <LiveTestPanel
                  report={report}
                  controllerRef={controllerRef}
                  manualOverrides={manualOverrides}
                />
              </TabsContent>

              <TabsContent value="model" className="space-y-3 mt-3">
                <Card className="p-4 space-y-3">
                  <Label className="text-sm font-semibold">Type d'avatar 3D</Label>
                  <div className="flex gap-2">
                    <Button size="sm" variant={!usePhoto ? "default" : "secondary"} className="flex-1"
                      onClick={() => setUsePhoto(false)}>Visage 3D (blendshapes)</Button>
                    <Button size="sm" variant={usePhoto ? "default" : "secondary"} className="flex-1"
                      onClick={() => { setUsePhoto(true); setReport(null); }}>Photo 3D</Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Le mode <b>Visage 3D</b> active la sync labiale par blendshapes. La <b>Photo 3D</b> anime la bouche via un overlay texturé (pas de mapping).
                  </p>
                </Card>

                <Card className="p-4 space-y-3">
                  <Label className="text-sm font-semibold">Charger un avatar .glb</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".glb,model/gltf-binary"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && onFilePicked(e.target.files[0])}
                  />
                  <Button variant="secondary" className="w-full" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4 me-2" /> Uploader un fichier .glb
                  </Button>
                  <div className="text-xs text-muted-foreground">— ou —</div>
                  <div>
                    <Label className="text-xs">URL Ready Player Me (.glb)</Label>
                    <div className="flex gap-2 mt-1">
                      <Input value={pendingUrl} onChange={(e) => setPendingUrl(e.target.value)}
                        placeholder="https://models.readyplayer.me/…glb" className="text-xs" />
                      <Button size="sm" variant="secondary" onClick={applyUrl}>Charger</Button>
                    </div>
                  </div>
                  {avatarUrl && avatarUrl !== DEFAULT_FACE_URL && (
                    <Button size="sm" variant="ghost" className="w-full"
                      onClick={() => { setAvatarUrl(DEFAULT_FACE_URL); setPendingUrl(""); toast.success("Avatar par défaut restauré"); }}>
                      Restaurer avatar par défaut
                    </Button>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    Astuce RPM : ajoute <code>?morphTargets=ARKit,Oculus+Visemes</code> à l'URL pour activer la sync.
                  </p>
                </Card>

                <Card className="p-4 space-y-2">
                  <Label className="text-sm font-semibold">Vérification du mapping</Label>
                  {usePhoto ? (
                    <p className="text-xs text-muted-foreground">
                      Mode <b>Photo 3D</b> actif — pas de blendshapes à mapper. Bascule sur <b>Visage 3D</b> pour vérifier les visèmes.
                    </p>
                  ) : report ? (
                    <div className="space-y-2 text-xs">
                      <div className="text-muted-foreground">
                        {report.meshes} mesh · {report.totalMorphs} blendshapes total
                      </div>
                      <MappingRow ok={report.mouth.length > 0} label="Bouche / visèmes" tags={report.mouth} />
                      <MappingRow ok={report.blink.length > 0} label="Clignements" tags={report.blink} />
                      <MappingRow ok={report.brow.length > 0} label="Sourcils" tags={report.brow} />
                      <MappingRow ok={report.smile.length > 0} label="Sourire" tags={report.smile} />
                      {report.mouth.length === 0 && (
                        <p className="text-[11px] text-destructive">
                          Aucun visème détecté — bascule sur "Oculus" ou "ARKit" dans Calibrage, ou réexporte ton modèle avec les blendshapes.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Chargement du modèle…</p>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

function LiveTestPanel({
  report, controllerRef, manualOverrides,
}: {
  report: MappingReport | null;
  controllerRef: React.MutableRefObject<FacialController | null>;
  manualOverrides: React.MutableRefObject<Record<string, number>>;
}) {
  const [values, setValues] = useState<Record<string, number>>({});

  const rowsBase = useMemo(() => {
    if (!report) return [] as { label: string; keys: string[] }[];
    const pick = (cands: string[]) => cands.filter((k) => report.mouth.includes(k) || report.blink.includes(k) || report.brow.includes(k) || report.smile.includes(k));
    return [
      { label: "Jaw Open", keys: pick(["jawOpen"]) },
      { label: "Sourire", keys: pick(["mouthSmile", "mouthSmileLeft", "mouthSmileRight"]) },
      { label: "Clignement G", keys: pick(["eyeBlinkLeft", "eyeBlink_L"]) },
      { label: "Clignement D", keys: pick(["eyeBlinkRight", "eyeBlink_R"]) },
      { label: "Sourcils haut", keys: pick(["browInnerUp", "browOuterUpLeft", "browOuterUpRight", "browUpLeft", "browUpRight"]) },
      { label: "Sourcils bas", keys: pick(["browDownLeft", "browDownRight"]) },
    ].filter((r) => r.keys.length > 0);
  }, [report]);

  const visemeRows = useMemo(() => report?.mouth.filter((k) => k.startsWith("viseme_")) ?? [], [report]);

  const setKey = (key: string, v: number) => {
    setValues((s) => ({ ...s, [key]: v }));
    manualOverrides.current[key] = v;
  };
  const clearKey = (key: string) => {
    setValues((s) => { const { [key]: _, ...rest } = s; return rest; });
    delete manualOverrides.current[key];
    controllerRef.current?.setMorph(key, 0);
  };
  const resetAll = () => {
    setValues({});
    manualOverrides.current = {};
    controllerRef.current?.resetFace();
  };

  if (!report) return null;
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Test des expressions (live)</Label>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => controllerRef.current?.blink()}>Cligner</Button>
          <Button size="sm" variant="ghost" onClick={resetAll}><RotateCcw className="w-3 h-3" /></Button>
        </div>
      </div>
      {rowsBase.length === 0 && visemeRows.length === 0 ? (
        <p className="text-xs text-muted-foreground">Aucun morph target contrôlable détecté sur ce modèle.</p>
      ) : (
        <>
          {rowsBase.map((row) => {
            const key = row.keys[0];
            const v = values[key] ?? 0;
            return (
              <div key={row.label}>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs">{row.label}</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground">{v.toFixed(2)}</span>
                    {v > 0 && <button className="text-[10px] text-muted-foreground hover:text-foreground" onClick={() => clearKey(key)}>auto</button>}
                  </div>
                </div>
                <Slider
                  value={[v]} min={0} max={1} step={0.01}
                  onValueChange={(val) => { row.keys.forEach((k) => setKey(k, val[0])); }}
                />
                <div className="text-[9px] font-mono text-muted-foreground mt-0.5">{row.keys.join(" · ")}</div>
              </div>
            );
          })}
          {visemeRows.length > 0 && (
            <div className="pt-2 border-t">
              <Label className="text-xs mb-2 block">Visèmes Oculus détectés</Label>
              <div className="flex flex-wrap gap-1">
                {visemeRows.map((v) => (
                  <button key={v} type="button"
                    onMouseDown={() => setKey(v, 1)}
                    onMouseUp={() => clearKey(v)}
                    onMouseLeave={() => clearKey(v)}
                    onTouchStart={() => setKey(v, 1)}
                    onTouchEnd={() => clearKey(v)}
                    className="px-2 py-1 rounded bg-muted hover:bg-primary hover:text-primary-foreground text-[10px] font-mono transition"
                  >{v.replace("viseme_", "")}</button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Maintiens un visème pour tester en direct.</p>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

function SliderRow({
  label, value, min, max, step, onChange, suffix,
}: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; suffix?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Label className="text-xs">{label}</Label>
        <span className="text-[11px] font-mono text-muted-foreground">{value.toFixed(2)}{suffix || ""}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} />
    </div>
  );
}

function MappingRow({ ok, label, tags }: { ok: boolean; label: string; tags: string[] }) {
  return (
    <div className="flex items-start gap-2">
      {ok ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
          : <XCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />}
      <div className="flex-1 min-w-0">
        <div className="font-medium">{label}</div>
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1 mt-1">
            {tags.slice(0, 6).map((t) => <Badge key={t} variant="secondary" className="text-[10px] font-mono">{t}</Badge>)}
            {tags.length > 6 && <span className="text-[10px] text-muted-foreground">+{tags.length - 6}</span>}
          </div>
        ) : (
          <div className="text-[11px] text-muted-foreground">Aucun</div>
        )}
      </div>
    </div>
  );
}

try { useGLTF.preload(DEFAULT_FACE_URL); } catch { /* ignore */ }

function PortraitAvatar({ url, speaking, lipLevel }: { url: string; speaking: boolean; lipLevel: number }) {
  // Subtle scale + glow synced to voice amplitude.
  const scale = 1 + lipLevel * 0.015;
  const glow = 0.35 + lipLevel * 0.55;
  const mouthOpen = Math.min(1, lipLevel * 1.4);
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 35%, rgba(236,72,153,0.35), transparent 55%), linear-gradient(180deg, #1a0b1f 0%, #05060f 100%)",
        }}
      />
      {/* Pulsing halo */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none transition-opacity duration-100"
        style={{
          width: 480,
          height: 480,
          background: `radial-gradient(circle, rgba(236,72,153,${glow * 0.5}) 0%, rgba(139,92,246,${glow * 0.3}) 40%, transparent 70%)`,
          filter: `blur(${20 + lipLevel * 30}px)`,
          opacity: speaking ? 1 : 0.6,
        }}
      />
      {/* Portrait */}
      <img
        src={url}
        alt="Professeur IA"
        draggable={false}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[95%] w-auto object-contain drop-shadow-[0_20px_60px_rgba(236,72,153,0.35)] select-none"
        style={{
          transform: `translate(-50%, -50%) scale(${scale})`,
          transition: "transform 60ms linear",
          animation: speaking ? "none" : "avatarBreath 4s ease-in-out infinite",
        }}
      />
      {/* Mouth speaking overlay (soft glow near mouth area) */}
      {speaking && (
        <div
          className="absolute left-1/2 pointer-events-none rounded-full"
          style={{
            top: "58%",
            width: 60 + mouthOpen * 40,
            height: 14 + mouthOpen * 22,
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(ellipse, rgba(255,120,180,${0.35 + mouthOpen * 0.4}) 0%, transparent 70%)`,
            filter: "blur(6px)",
            transition: "width 60ms linear, height 60ms linear",
          }}
        />
      )}
      {/* Voice bars */}
      {speaking && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-end gap-1 h-8">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="w-1.5 rounded-full bg-gradient-to-t from-pink-400 to-fuchsia-300"
              style={{
                height: `${20 + Math.abs(Math.sin(Date.now() / 120 + i)) * (30 + lipLevel * 60)}%`,
                opacity: 0.6 + lipLevel * 0.4,
              }}
            />
          ))}
        </div>
      )}
      <style>{`
        @keyframes avatarBreath {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.01); }
        }
      `}</style>
    </div>
  );
}

