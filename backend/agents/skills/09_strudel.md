# Strudel — default for agent-composed MIDI

[Strudel](https://strudel.cc/) is the **default** way Nexus writes drums, bass, melody, and chord parts. The user does **not** need to say "Strudel" — use **`add-strudel-track`** whenever you compose notes from scratch.

Workshop reference: https://strudel.cc/workshop/getting-started/

## When to use which tool

| Request | Tool |
|---------|------|
| Compose drums / bass / melody / chords / grooves (default) | **`add-strudel-track`** |
| User pasted ABC, leadsheet/staff notation, or instrument swap on exported ABC | **`add-abc-track`** |
| Audio sample / loop / vocals | **`generate-music`** (ElevenLabs) |

## Workflow

1. **`get-project-summary`** — tempo, meter, existing devices.
2. **`export-tracks-abc`** (optional) — match key/groove of existing parts.
3. Write **valid Strudel JS** and call **`add-strudel-track`** once per layer (or batch `tracks` array).
4. Prefer **separate calls** for drums vs bass vs melody (each gets its own instrument).

## Tempo and time signature

Audiotool plays notes in **tick space**; **BPM and meter are project settings**, not Strudel code.

1. **`get-project-summary`** — read current `tempoBpm` and `timeSignature`.
2. If the user asked for a specific BPM or meter (e.g. “120 BPM”, “in 6/8”), call **`update-project-config`** **before** `add-strudel-track`.
3. Do **not** use `setcpm()` / `setcps()` — the MCP export ignores them.
4. **One Strudel cycle = one bar** at the project meter. Default `cycles: 4` → four bars (works in 3/4, 6/8, 4/4, etc.).
5. Match rhythmic patterns to the meter (e.g. waltz feel in 3/4, sixteenth subdivisions in 6/8).

## Code style (REPL-compatible)

- **Mini-notation** in double quotes: `note("c3 [e3 g3]*2")`
- **No ABC bar lines** — do **not** use `|` or `|:` inside strings (invalid in Strudel). Separate bars with spaces or use `< ... >` per cycle.
- **Sharps** in note names: `f#2`, `c#3` (not `F#` alone without octave when possible)
- **Sound / instrument**: `.sound("gm_acoustic_bass")` or `.sound("piano")` — server infers GM instrument from `gm_*` names.
- **Scales**: `n("0 2 4 7").scale("C:minor").sound("piano")`
- **Parallel layers** in one string: prefix lines with `$:` or use `stack(...)`  
  Example:
  ```
  $: note("c2 e2 g2").sound("gm_acoustic_bass")
  $: s("bd*4, ~ sd").bank("RolandTR909")
  ```
- **Cycles**: default export length is **4 cycles** (≈ four bars at project meter). Pass `cycles: 8` for longer patterns.

## Examples

**Bass (GM):**
```javascript
note("<c2 g1 f1 eb1>*2").sound("gm_acoustic_bass")
```

**Melody with scale degrees:**
```javascript
n("0 2 4 [6 7]").scale("C:minor").sound("gm_xylophone")
```

**Drums (maps bd/sd/hh to GM drum MIDI — creates gakki + drum kit, not machiniste):**
```javascript
s("bd*4, [~ sd]*2, hh*8")
```
Optional: `drumKit: "electronic-kit"` for house/techno; server auto-picks kit when omitted.

**Funk stack (single call — auto-stacked from `$:` lines):**
```javascript
$: note("c3@2 eb3 g3").sound("gm_electric_guitar_muted")
$: s("bd*2, sd*2")
```

## Instrument parameter

Override device when `.sound()` is ambiguous:

- `instrument: "electric bass guitar"` → gakki GM bass
- `instrument: "heisenberg"` → synth
- **Drums:** use `s("bd sd hh")` — server creates **gakki + GM drum kit** (`standard-kit`, `electronic-kit`, …). Do **not** pass `instrument: "machiniste"` for Strudel drums — bare Machiniste has no samples and MIDI note tracks stay silent.
- Optional `drumKit: "jazz-kit"` when the user names a kit.

Do **not** pass `playerEntityId` when swapping instruments — use `replaceNoteTrackId` like ABC swaps.

## Limits

- Server **evaluates** Strudel and exports **MIDI notes** only — no Strudel audio/samples play inside Audiotool.
- Sample names (`s("bd")`) become GM drum **pitches**, not sample playback.
- Heavy `.lpf()`, `.delay()`, etc. are ignored for note export (FX belong in Audiotool after insert).
- Keep patterns **≤ 16 cycles** unless the user asks for longer; large patterns cost tokens and time.

## Combining with theory skills

Use **`08_tonaljs.md`** for chord/scale names when analyzing exports; use this skill for **writing** rhythmic/microtonal/Tidal-style patterns in JS.
