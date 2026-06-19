import { describe, it, expect } from "vitest";
import {
  normalizeStrudelCode,
  inferInstrumentFromStrudelCode,
  parseStrudelToNotes,
} from "../strudel-utils.js";
import { TICKS_WHOLE } from "../server-utils.js";

describe("normalizeStrudelCode", () => {
  it("strips $: prefixes and stacks multiple lines", () => {
    const code = `$: note("c3 e3")
$: s("bd sd")`;
    expect(normalizeStrudelCode(code)).toBe('stack(note("c3 e3"), s("bd sd"))');
  });

  it("passes through single expression", () => {
    expect(normalizeStrudelCode('note("c4")')).toBe('note("c4")');
  });

  it("joins multiline chained expression into one line", () => {
    const code = `note("<d2 ~ f2>")
.sound("gm_electric_bass_finger")
.lpf(900)`;
    expect(normalizeStrudelCode(code)).toBe(
      'note("<d2 ~ f2>").sound("gm_electric_bass_finger").lpf(900)',
    );
  });

  it("collapses newlines inside mini-notation strings", () => {
    const code = `note("<
  [d2 ~ f2] [g2 ~ a2]
>").sound("gm_electric_bass_finger")`;
    expect(normalizeStrudelCode(code)).toBe(
      'note("< [d2 ~ f2] [g2 ~ a2] >").sound("gm_electric_bass_finger")',
    );
  });

  it("strips line comments", () => {
    const code = `// funk bass
note("c2").sound("gm_acoustic_bass")`;
    expect(normalizeStrudelCode(code)).toBe('note("c2").sound("gm_acoustic_bass")');
  });

  it("strips ABC bar lines inside mini-notation strings", () => {
    const code = `note("<
  [e2 ~ g2] [a2 ~ e2] |
  [d2 ~ f#2] [g2 ~ a2]
>")`;
    const normalized = normalizeStrudelCode(code);
    expect(normalized).not.toContain("|");
    expect(normalized).toContain("f#2");
  });
});

describe("inferInstrumentFromStrudelCode", () => {
  it("maps gm_ sound names to instrument hints", () => {
    expect(
      inferInstrumentFromStrudelCode('note("c2").sound("gm_acoustic_bass")'),
    ).toBe("acoustic bass");
  });
});

describe("parseStrudelToNotes", () => {
  it("parses multiline funk bass with comments (agent-style payload)", async () => {
    const code = `
// Funk bassline – D Dorian
note("<
  [d2 ~ d2 f2] [g2 ~ a2 ~] [d2 ~ d2 f2] [g2 a2 ~ d2]
  [d2 ~ f2 g2] [a2 ~ g2 ~] [f2 ~ d2 ~] [e2 ~ d2 c2]
>")
.sound("gm_electric_bass_finger")
.lpf(900)
.gain(1.1)
`;
    const notes = await parseStrudelToNotes(code, { cycles: 2 });
    expect(notes.length).toBeGreaterThan(5);
  });

  it("parses E Dorian bass with ABC bar lines in string", async () => {
    const code = `
note("<
  [e2 ~ e2 g2] [a2 ~ g2 e2] [e2 ~ e2 g2] [a2 b2 ~ a2] |
  [e2 ~ e2 g2] [a2 ~ g2 e2] [d2 ~ d2 f#2] [g2 ~ a2 b2] |
  [e2 ~ e2 g2] [a2 ~ g2 e2] [e2 ~ e2 g2] [a2 b2 ~ a2] |
  [e2 ~ d2 e2] [g2 ~ f#2 e2] [a2 ~ e2 d2] [e2 ~ ~ ~]
>")
.sound("gm_electric_bass_finger")
.gain(1.1)
.lpf(900)
`;
    const notes = await parseStrudelToNotes(code, { cycles: 4 });
    expect(notes.length).toBeGreaterThan(10);
  });

  it("converts note() patterns to MIDI events", async () => {
    const notes = await parseStrudelToNotes('note("c3 e3 g3")', { cycles: 1 });
    expect(notes.length).toBeGreaterThan(0);
    expect(notes[0].pitch).toBeGreaterThanOrEqual(0);
    expect(notes[0].positionTicks).toBeGreaterThanOrEqual(0);
    expect(notes[0].durationTicks).toBeGreaterThan(0);
  });

  it("maps drum samples to GM pitches", async () => {
    const notes = await parseStrudelToNotes('s("bd sd")', { cycles: 1 });
    const pitches = notes.map((n) => n.pitch);
    expect(pitches).toContain(36);
    expect(pitches).toContain(38);
  });

  it("scales cycle timing to TICKS_WHOLE per cycle", async () => {
    const notes = await parseStrudelToNotes('note("c4")', { cycles: 2 });
    const maxEnd = Math.max(...notes.map((n) => n.positionTicks + n.durationTicks));
    expect(maxEnd).toBeLessThanOrEqual(TICKS_WHOLE * 2 + 100);
  });
});
