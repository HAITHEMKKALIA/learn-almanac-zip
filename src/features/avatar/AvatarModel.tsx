import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import {
  type AvatarCalibration,
  type DetectedStandard,
  OCULUS_VISEMES,
  type OculusViseme,
} from "./avatar-utils";

type MorphMesh = THREE.Mesh & {
  morphTargetDictionary?: Record<string, number>;
  morphTargetInfluences?: number[];
};

type MorphEntry = { mesh: MorphMesh; index: number };
type MorphRegistry = Map<string, MorphEntry[]>;

export type AvatarSignal = {
  intensity: number;
  viseme: OculusViseme;
  speaking: boolean;
};

export type AvatarExpressions = {
  jawOverride: number | null;
  browOverride: number | null;
  smileOverride: number | null;
  blinkLeftOverride: number | null;
  blinkRightOverride: number | null;
  puckerOverride: number | null;
  cheekOverride: number | null;
};

export type AvatarMappingReport = {
  meshCount: number;
  morphCount: number;
  morphNames: string[];
  animations: string[];
  standard: DetectedStandard;
  oculusCount: number;
  arkitCount: number;
  hasBlink: boolean;
  hasBrows: boolean;
  hasSmile: boolean;
  hasJaw: boolean;
};

export type AvatarController = {
  blink: () => void;
  resetFace: () => void;
  setMorph: (name: string, value: number) => void;
  listMorphs: () => string[];
};

type Props = {
  url: string;
  calibration: AvatarCalibration;
  signalRef: React.MutableRefObject<AvatarSignal>;
  expressionsRef: React.MutableRefObject<AvatarExpressions>;
  onReport: (report: AvatarMappingReport) => void;
};

const ARKIT_NAMES = [
  "browDownLeft", "browDownRight", "browInnerUp", "browOuterUpLeft",
  "browOuterUpRight", "cheekPuff", "cheekSquintLeft", "cheekSquintRight",
  "eyeBlinkLeft", "eyeBlinkRight", "eyeLookDownLeft", "eyeLookDownRight",
  "eyeLookInLeft", "eyeLookInRight", "eyeLookOutLeft", "eyeLookOutRight",
  "eyeLookUpLeft", "eyeLookUpRight", "eyeSquintLeft", "eyeSquintRight",
  "eyeWideLeft", "eyeWideRight", "jawForward", "jawLeft", "jawOpen",
  "jawRight", "mouthClose", "mouthDimpleLeft", "mouthDimpleRight",
  "mouthFrownLeft", "mouthFrownRight", "mouthFunnel", "mouthLeft",
  "mouthLowerDownLeft", "mouthLowerDownRight", "mouthPressLeft",
  "mouthPressRight", "mouthPucker", "mouthRight", "mouthRollLower",
  "mouthRollUpper", "mouthShrugLower", "mouthShrugUpper", "mouthSmileLeft",
  "mouthSmileRight", "mouthStretchLeft", "mouthStretchRight",
  "mouthUpperUpLeft", "mouthUpperUpRight", "noseSneerLeft",
  "noseSneerRight", "tongueOut",
];

const CONTROL_ALIASES = {
  blinkLeft: ["eyeBlinkLeft", "eyeBlink_L"],
  blinkRight: ["eyeBlinkRight", "eyeBlink_R"],
  browUp: ["browInnerUp", "browOuterUpLeft", "browOuterUpRight", "browUpLeft", "browUpRight"],
  browDown: ["browDownLeft", "browDownRight"],
  smile: ["mouthSmile", "mouthSmileLeft", "mouthSmileRight"],
  jaw: ["jawOpen", "mouthOpen"],
  funnel: ["mouthFunnel"],
  pucker: ["mouthPucker"],
  cheek: ["cheekPuff"],
} as const;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function createRegistry(scene: THREE.Object3D): { registry: MorphRegistry; meshCount: number; morphCount: number } {
  const registry: MorphRegistry = new Map();
  let meshCount = 0;
  let morphCount = 0;

  scene.traverse((object) => {
    const mesh = object as MorphMesh;
    if (!mesh.isMesh || !mesh.morphTargetDictionary || !mesh.morphTargetInfluences) return;
    meshCount += 1;
    for (const [name, index] of Object.entries(mesh.morphTargetDictionary)) {
      const entries = registry.get(name) ?? [];
      entries.push({ mesh, index });
      registry.set(name, entries);
      morphCount += 1;
    }
  });
  return { registry, meshCount, morphCount };
}

function applyEntries(entries: MorphEntry[] | undefined, value: number): void {
  if (!entries) return;
  const safeValue = clamp01(value);
  for (const { mesh, index } of entries) {
    if (mesh.morphTargetInfluences) mesh.morphTargetInfluences[index] = safeValue;
  }
}

export const AvatarModel = forwardRef<AvatarController, Props>(function AvatarModel(
  { url, calibration, signalRef, expressionsRef, onReport },
  forwardedRef,
) {
  const gltf = useGLTF(url) as GLTF;
  // Keep every skinned mesh connected to its cloned bone hierarchy.
  const model = useMemo(() => cloneSkeleton(gltf.scene), [gltf.scene]);
  const groupRef = useRef<THREE.Group>(null);
  const registryRef = useRef<MorphRegistry>(new Map());
  const oculusValues = useRef<Record<string, number>>({});
  const manualBlinkAt = useRef<number | null>(null);
  const nextBlinkAt = useRef(2.5 + Math.random() * 2);
  const blinkStartedAt = useRef<number | null>(null);
  const smoothedMouth = useRef(0);

  const framing = useMemo(() => {
    model.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const height = Math.max(size.y, 0.1);
    const presentation = gltf.scene.userData.avatarPresentation;
    const isPortraitAvatar =
      presentation === "portrait" ||
      gltf.scene.name.includes("Doctor_Modern_Realistic");
    const isUpperBodyAvatar = presentation === "upper-body";
    const visibleHeight = isUpperBodyAvatar
      ? height * 0.72
      : isPortraitAvatar
        ? height * 0.5
        : height;
    const focusY = isUpperBodyAvatar
      ? bounds.max.y - visibleHeight * 0.48
      : isPortraitAvatar
        ? bounds.max.y - visibleHeight * 0.48
        : center.y;

    return {
      center: new THREE.Vector3(center.x, focusY, center.z),
      normalizationScale: 2.65 / visibleHeight,
    };
  }, [gltf.scene, model]);

  useEffect(() => {
    const { registry, meshCount, morphCount } = createRegistry(model);
    registryRef.current = registry;
    const names = [...registry.keys()].sort();
    const oculusCount = OCULUS_VISEMES.filter((name) => registry.has(name)).length;
    const arkitCount = ARKIT_NAMES.filter((name) => registry.has(name)).length;
    const standard: DetectedStandard =
      oculusCount >= 5 && arkitCount >= 3
        ? "hybrid"
        : oculusCount >= 5
          ? "oculus"
          : arkitCount >= 3
            ? "arkit"
            : names.length > 0
              ? "custom"
              : "none";

    onReport({
      meshCount,
      morphCount,
      morphNames: names,
      animations: gltf.animations.map((animation) => animation.name || "Sans nom"),
      standard,
      oculusCount,
      arkitCount,
      hasBlink: CONTROL_ALIASES.blinkLeft.some((name) => registry.has(name))
        && CONTROL_ALIASES.blinkRight.some((name) => registry.has(name)),
      hasBrows: [...CONTROL_ALIASES.browUp, ...CONTROL_ALIASES.browDown].some((name) => registry.has(name)),
      hasSmile: CONTROL_ALIASES.smile.some((name) => registry.has(name)),
      hasJaw: CONTROL_ALIASES.jaw.some((name) => registry.has(name)),
    });

    return () => {
      registry.forEach((entries) => applyEntries(entries, 0));
      registryRef.current = new Map();
    };
  }, [gltf.animations, model, onReport]);

  const applyAliases = (aliases: readonly string[], value: number) => {
    const registry = registryRef.current;
    for (const alias of aliases) applyEntries(registry.get(alias), value);
  };

  useImperativeHandle(forwardedRef, () => ({
    blink: () => {
      manualBlinkAt.current = performance.now() / 1000;
    },
    resetFace: () => {
      registryRef.current.forEach((entries) => applyEntries(entries, 0));
      expressionsRef.current = {
        jawOverride: null,
        browOverride: null,
        smileOverride: null,
        blinkLeftOverride: null,
        blinkRightOverride: null,
        puckerOverride: null,
        cheekOverride: null,
      };
      signalRef.current = { intensity: 0, viseme: "viseme_sil", speaking: false };
    },
    setMorph: (name, value) => applyEntries(registryRef.current.get(name), value),
    listMorphs: () => [...registryRef.current.keys()],
  }), [expressionsRef, signalRef]);

  useFrame(({ clock }, delta) => {
    const now = clock.elapsedTime;
    const registry = registryRef.current;
    const signal = signalRef.current;
    const expressions = expressionsRef.current;
    const response = 1 - Math.exp(-delta * (5 + calibration.mouthSmoothing * 24));
    const targetMouth = clamp01(signal.intensity * calibration.mouthGain);
    smoothedMouth.current = THREE.MathUtils.lerp(smoothedMouth.current, targetMouth, response);

    const selectedStandard = calibration.visemeSet === "auto"
      ? (OCULUS_VISEMES.some((name) => registry.has(name)) ? "oculus" : "arkit")
      : calibration.visemeSet;

    if (selectedStandard === "oculus") {
      for (const name of OCULUS_VISEMES) {
        const desired = signal.speaking && name === signal.viseme ? smoothedMouth.current : 0;
        const current = oculusValues.current[name] ?? 0;
        const next = THREE.MathUtils.lerp(current, desired, response);
        oculusValues.current[name] = next;
        applyEntries(registry.get(name), next);
      }
      applyAliases(CONTROL_ALIASES.jaw, expressions.jawOverride ?? 0);
    } else {
      const jaw = expressions.jawOverride ?? (signal.speaking ? smoothedMouth.current : 0);
      applyAliases(CONTROL_ALIASES.jaw, jaw);
      const roundMouth = signal.viseme === "viseme_O" || signal.viseme === "viseme_U";
      applyAliases(CONTROL_ALIASES.funnel, roundMouth ? smoothedMouth.current * 0.8 : 0);
      applyAliases(CONTROL_ALIASES.pucker, signal.viseme === "viseme_U" ? smoothedMouth.current * 0.7 : 0);
    }

    const blinkDuration = 0.18;
    if (manualBlinkAt.current !== null) {
      blinkStartedAt.current = now;
      manualBlinkAt.current = null;
    } else if (blinkStartedAt.current === null && now >= nextBlinkAt.current) {
      blinkStartedAt.current = now;
    }

    let blinkValue = 0;
    if (blinkStartedAt.current !== null) {
      const progress = (now - blinkStartedAt.current) / blinkDuration;
      if (progress >= 1) {
        blinkStartedAt.current = null;
        nextBlinkAt.current = now + Math.max(1.5, calibration.blinkIntervalSec) * (0.72 + Math.random() * 0.56);
      } else {
        blinkValue = Math.sin(progress * Math.PI);
      }
    }
    applyAliases(
      CONTROL_ALIASES.blinkLeft,
      expressions.blinkLeftOverride ?? blinkValue,
    );
    applyAliases(
      CONTROL_ALIASES.blinkRight,
      expressions.blinkRightOverride ?? blinkValue,
    );

    const autoBrow = signal.speaking ? smoothedMouth.current * calibration.browIntensity : 0;
    const brow = expressions.browOverride ?? autoBrow;
    applyAliases(CONTROL_ALIASES.browUp, brow);
    applyAliases(CONTROL_ALIASES.smile, expressions.smileOverride ?? calibration.smile);
    if (expressions.puckerOverride !== null) {
      applyAliases(CONTROL_ALIASES.pucker, expressions.puckerOverride);
    }
    applyAliases(CONTROL_ALIASES.cheek, expressions.cheekOverride ?? 0);

    if (expressions.jawOverride !== null && selectedStandard === "oculus") {
      applyAliases(CONTROL_ALIASES.jaw, expressions.jawOverride);
    }

    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(now * 0.38) * 0.025;
      groupRef.current.rotation.x = Math.sin(now * 0.52) * 0.012;
    }
  });

  const scale = framing.normalizationScale * calibration.modelScale;
  return (
    <group ref={groupRef} position={[0, calibration.modelOffsetY, 0]} scale={scale}>
      <primitive
        object={model}
        position={[-framing.center.x, -framing.center.y, -framing.center.z]}
      />
    </group>
  );
});
