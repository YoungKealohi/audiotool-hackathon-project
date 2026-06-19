/**
 * Evaluate Strudel (JavaScript/Tidal) patterns and convert note haps to Audiotool ticks.
 * Uses @strudel/* 1.1.x (Node-compatible; avoids @kabelsalat/web breakage in 1.2.x).
 */

import { TICKS_QUARTER, TICKS_WHOLE } from "./server-utils.js";

/** Strudel logs to stdout on import, which breaks MCP stdio JSON-RPC. Filter known noise. */
const _origConsoleLog = console.log;
const _origConsoleWarn = console.warn;
console.log = (...args: unknown[]) => {
  const head = args.map((a) => String(a)).join(" ");
  if (
    head.includes("@strudel/core loaded")
    || head.includes("cannot use window")
  ) {
    return;
  }
  _origConsoleLog.apply(console, args);
};
console.warn = (...args: unknown[]) => {
  const head = args.map((a) => String(a)).join(" ");
  if (head.includes("cannot use window")) {
    return;
  }
  _origConsoleWarn.apply(console, args);
};

export type StrudelNoteEvent = {
  pitch: number;
  positionTicks: number;
  durationTicks: number;
  velocity: number;
};

export type StrudelParseOptions = {
  /** How many Strudel cycles to render (default 4). One cycle ≈ one 4/4 bar at default cps. */
  cycles?: number;
  /** Audiotool ticks per Strudel cycle (default: one bar at 4/4). */
  ticksPerCycle?: number;
  /** Map sample-only haps (s("bd")) to GM drum MIDI pitches. Default true. */
  mapDrumSamples?: boolean;
};

type StrudelHap = {
  whole?: { begin: unknown; end: unknown };
  value?: Record<string, unknown>;
};

const DRUM_SAMPLE_TO_MIDI: Record<string, number> = {
  bd: 36,
  kick: 36,
  sd: 38,
  sn: 38,
  snare: 38,
  cp: 39,
  clap: 39,
  rim: 37,
  hh: 42,
  oh: 46,
  openhat: 46,
  tom: 45,
  crash: 49,
  ride: 51,
};

let scopeReady: Promise<void> | null = null;

async function ensureStrudelScope(): Promise<void> {
  if (!scopeReady) {
    scopeReady = (async () => {
      const [{ evalScope }, strudel, { mini }, { evaluate: transpilerEvaluate }] =
        await Promise.all([
          import("@strudel/core"),
          import("@strudel/core"),
          import("@strudel/mini"),
          import("@strudel/transpiler"),
        ]);
      await evalScope(strudel, { mini, m: mini });
      // Warm transpiler import (evaluate uses globals from evalScope).
      void transpilerEvaluate;
    })();
  }
  await scopeReady;
}

/** Remove ABC-style bar lines and repeat marks from mini-notation string bodies. */
function sanitizeMiniNotationString(inner: string): string {
  return inner
    .replace(/\|:/g, " ")
    .replace(/:\|/g, " ")
    .replace(/\s*\|\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Collapse whitespace/newlines inside double-quoted mini-notation strings. */
function collapseQuotedStringWhitespace(code: string): string {
  return code.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (_match, inner: string) => {
    const collapsed = sanitizeMiniNotationString(inner);
    return `"${collapsed}"`;
  });
}

/** Strip REPL `$:` prefixes; stack only explicit `$:` layers, else join chained lines. */
export function normalizeStrudelCode(input: string): string {
  let code = input.replace(/\/\*[\s\S]*?\*\//g, "");
  code = code
    .split("\n")
    .map((line) => line.replace(/\/\/.*$/, "").trim())
    .filter(Boolean)
    .join("\n");

  if (!code.trim()) {
    throw new Error("Strudel code is empty");
  }

  code = collapseQuotedStringWhitespace(code);

  const rawLines = code.split("\n").map((line) => line.trim()).filter(Boolean);
  const stripped = rawLines.map((line) =>
    line.replace(/^\$:\s*/, "").replace(/;+\s*$/, ""),
  );

  const replLayerCount = rawLines.filter((line) => /^\$:/.test(line)).length;
  if (replLayerCount >= 2) {
    return `stack(${stripped.join(", ")})`;
  }

  if (stripped.length === 1) {
    return stripped[0];
  }

  // One chained expression split across lines (note(...)\n.sound(...)\n.lpf(...))
  return stripped
    .join(" ")
    .replace(/\s+\./g, ".")
    .replace(/\s+/g, " ")
    .trim();
}

/** Infer Audiotool instrument hint from `.sound("gm_acoustic_bass")` etc. */
export function inferInstrumentFromStrudelCode(code: string): string | undefined {
  const match = code.match(/\.sound\s*\(\s*["']([^"']+)["']/);
  if (!match) return undefined;
  const sound = match[1].split(",")[0]?.trim();
  if (!sound) return undefined;
  if (sound.startsWith("gm_")) {
    return sound.slice(3).replace(/_/g, " ");
  }
  if (/^(sawtooth|square|triangle|sine|bd|sd|hh|cp)$/i.test(sound)) {
    return undefined;
  }
  return sound;
}

function cycleToNumber(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "object" && value !== null && "valueOf" in value) {
    const n = Number((value as { valueOf: () => unknown }).valueOf());
    return Number.isFinite(n) ? n : 0;
  }
  return Number(value) || 0;
}

function hapVelocity(value: Record<string, unknown>): number {
  const gain = typeof value.gain === "number" ? value.gain : undefined;
  const velocity = typeof value.velocity === "number" ? value.velocity : undefined;
  if (velocity != null) {
    return velocity > 1 ? Math.min(1, velocity / 127) : Math.max(0, velocity);
  }
  if (gain != null) {
    return Math.min(1, Math.max(0, gain));
  }
  return 0.7;
}

function drumPitchFromSample(value: Record<string, unknown>): number | null {
  const sample = value.s;
  if (typeof sample === "string") {
    const key = sample.toLowerCase();
    if (DRUM_SAMPLE_TO_MIDI[key] != null) {
      return DRUM_SAMPLE_TO_MIDI[key];
    }
  }
  if (typeof sample === "number" && sample >= 0 && sample <= 127) {
    return sample;
  }
  return null;
}

export async function parseStrudelToNotes(
  strudelCode: string,
  options: StrudelParseOptions = {},
): Promise<StrudelNoteEvent[]> {
  const cycles = options.cycles ?? 4;
  const ticksPerCycle = options.ticksPerCycle ?? TICKS_WHOLE;
  const mapDrumSamples = options.mapDrumSamples !== false;

  if (cycles <= 0) {
    throw new Error("cycles must be > 0");
  }

  await ensureStrudelScope();
  const { evaluate } = await import("@strudel/transpiler");
  const { valueToMidi } = await import("@strudel/core");

  const normalized = normalizeStrudelCode(strudelCode);
  const { pattern } = await evaluate(normalized);
  if (!pattern || typeof pattern.queryArc !== "function") {
    throw new Error("Strudel code did not evaluate to a Pattern");
  }

  const haps: StrudelHap[] = pattern.queryArc(0, cycles);
  const notes: StrudelNoteEvent[] = [];

  for (const hap of haps) {
    const value = hap.value;
    if (!value || typeof value !== "object") continue;

    let pitch: number | null = null;
    try {
      pitch = Math.round(valueToMidi(value));
    } catch {
      if (mapDrumSamples) {
        pitch = drumPitchFromSample(value);
      }
    }

    if (pitch == null || pitch < 0 || pitch > 127) continue;

    const begin = cycleToNumber(hap.whole?.begin);
    const end = cycleToNumber(hap.whole?.end);
    const durationCycles = Math.max(end - begin, 1 / 64);
    const positionTicks = Math.round(begin * ticksPerCycle);
    const durationTicks = Math.max(
      TICKS_QUARTER / 4,
      Math.round(durationCycles * ticksPerCycle),
    );

    notes.push({
      pitch,
      positionTicks,
      durationTicks,
      velocity: hapVelocity(value),
    });
  }

  if (notes.length === 0) {
    throw new Error(
      "No pitched notes found in Strudel pattern. Use note()/n().scale() for melody, or s('bd sd') for drums.",
    );
  }

  return notes.sort((a, b) => a.positionTicks - b.positionTicks);
}
