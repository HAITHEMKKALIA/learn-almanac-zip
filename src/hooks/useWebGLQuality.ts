import { useEffect, useMemo, useState } from "react";

export interface WebGLQuality {
  /** Clamped devicePixelRatio [min, max] to pass to R3F <Canvas dpr={…}> */
  dpr: [number, number];
  /** Whether to enable antialiasing */
  antialias: boolean;
  /** Suggested shadow map size (0 = disabled) */
  shadowMapSize: number;
  /** Whether device is considered "low-end" */
  lowPower: boolean;
  /** Suggested max FPS (used with requestAnimationFrame throttling) */
  targetFPS: number;
}

interface NavigatorConn {
  deviceMemory?: number;
  hardwareConcurrency?: number;
  connection?: { effectiveType?: string; saveData?: boolean };
}

/**
 * Adaptive WebGL settings based on device capabilities.
 * Used by R3F Canvas mounts to prevent context-loss on cheap Androids
 * and to keep FPS acceptable on old phones.
 */
export function useWebGLQuality(): WebGLQuality {
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(() =>
    typeof window !== "undefined" && window.innerHeight >= window.innerWidth ? "portrait" : "landscape",
  );

  useEffect(() => {
    const onResize = () =>
      setOrientation(window.innerHeight >= window.innerWidth ? "portrait" : "landscape");
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  return useMemo<WebGLQuality>(() => {
    const nav = navigator as unknown as NavigatorConn;
    const mem = nav.deviceMemory ?? 4;
    const cores = nav.hardwareConcurrency ?? 4;
    const saveData = !!nav.connection?.saveData;
    const eff = nav.connection?.effectiveType ?? "4g";
    const width = window.innerWidth;

    const lowPower =
      mem <= 2 ||
      cores <= 2 ||
      saveData ||
      eff === "slow-2g" || eff === "2g" || eff === "3g" ||
      width < 480;

    const rawDpr = window.devicePixelRatio || 1;
    const maxDpr = lowPower ? 1 : Math.min(rawDpr, orientation === "portrait" ? 1.75 : 2);

    return {
      dpr: [1, Math.max(1, maxDpr)],
      antialias: !lowPower,
      shadowMapSize: lowPower ? 0 : 1024,
      lowPower,
      targetFPS: lowPower ? 30 : 60,
    };
  }, [orientation]);
}
