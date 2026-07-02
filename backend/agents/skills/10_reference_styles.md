# Reference styles (“in the spirit of”)

When the user names an **artist, song, film theme, or genre icon** (e.g. “Iron Man theme”, “Daft Punk”, “Hans Zimmer”), do **not** stop at critique or device picking. Translate the reference into a **musical brief**, then **implement** with tools.

## Copyright / safety (required)

- **Never** transcribe a famous melody **note-for-note** or claim you reproduced a copyrighted work.
- **Do** capture **feel**: tempo band, key/mode, rhythmic feel, interval *shapes*, instrumentation, density.
- Tell the user naturally: “I wrote a riff **in the spirit of** …” — not “here is the exact theme”.
- If unsure about a reference, use **genre + era** (e.g. “early 70s heavy metal”) instead of quoting the title in generated note content.

## Workflow

1. **`get-project-summary`** + **`export-tracks-abc`** — see what exists and what’s wrong vs the target feel.
2. **Match reference** — scan **`references/style_cards.md`** for the closest card (fuzzy match on keywords). If no card, infer from general knowledge using the decomposition template below.
3. **Decompose** (internal brief before composing):

   | Field | Examples |
   |-------|----------|
   | Tempo | 76 BPM (slow metal), 124 (house) |
   | Meter | 4/4, 6/8, 3/4 |
   | Key / mode | B minor, D Dorian, C major |
   | Rhythmic feel | heavy quarters, swung hi-hats, four-on-floor |
   | Motif shape | repeating minor cell, b5 color, ascending fourth |
   | Layers | riff guitar, bass double, rock kit |
   | Instruments | GM slugs / device types from card |

4. **`update-project-config`** if project tempo/meter don’t match the brief.
5. **Compose** — **`add-strudel-track`** per layer (default). Use `.sound('gm_...')` from the card. Separate calls for drums / bass / riff / pads.
6. **Sound design** (optional) — presets, EQ, distortion on existing devices if only timbre needs to change.
7. **One-sentence reply** — genre, key, tempo, “in the spirit of …”; no tool names.

## Decomposition template (no card match)

Ask yourself:

- **Era & genre** (70s doom metal, 90s French house, modern cinematic)
- **Tempo & meter** (slow/fast, straight/swing)
- **Harmony** (minor vs major, modal color, simple vs chromatic)
- **Rhythm** (backbeat, syncopation, sparse vs busy)
- **Texture** (mono riff vs stacked chords vs orchestral)
- **Signature interval motion** (minor 3rd, tritone *color*, not a copied melody)

Then implement — do not only list what’s missing.

## When user wants to fix an existing project

- Compare exported ABC to the brief (wrong key? too fast? too major?).
- Prefer **replace** layers: `add-strudel-track` with `replaceNoteTrackId` on the weak track, or add a new layer that carries the reference feel.
- If multiple tracks fight the reference (e.g. bright pop chords under a doom brief), suggest removing or simplifying conflicting layers via tools.

## ElevenLabs

For **audio samples**, describe mood/instruments generically in the prompt — avoid naming copyrighted titles (see `03_elevenlabs_music.md`). MIDI/Strudel path above is preferred for “in the spirit of” riffs.
