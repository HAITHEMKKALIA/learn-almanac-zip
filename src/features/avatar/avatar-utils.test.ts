import { describe, expect, it } from "vitest";
import { buildVisemeSequence, getTimelineViseme, validateGlbHeader } from "./avatar-utils";

describe("avatar utilities", () => {
  it("rejects files without a glTF binary header", () => {
    expect(validateGlbHeader(new TextEncoder().encode("this-is-not-a-glb-file").buffer)).toContain("Signature GLB");
  });

  it("accepts a glTF 2 binary header", () => {
    const bytes = new Uint8Array(12);
    bytes.set([0x67, 0x6c, 0x54, 0x46]);
    new DataView(bytes.buffer).setUint32(4, 2, true);
    expect(validateGlbHeader(bytes.buffer)).toBeNull();
  });

  it("creates a German-friendly Oculus viseme sequence", () => {
    const sequence = buildVisemeSequence("Schön, wie geht es dir?");
    expect(sequence[0]).toBe("viseme_sil");
    expect(sequence).toContain("viseme_CH");
    expect(sequence).toContain("viseme_FF");
    expect(sequence.at(-1)).toBe("viseme_sil");
  });

  it("selects a viseme from audio time", () => {
    expect(getTimelineViseme(["viseme_sil", "viseme_aa", "viseme_O"], 5, 10)).toBe("viseme_aa");
  });
});
