# Music Theory (Creative Suggestions)

Use this when the user asks for feedback, ideas, "what should I change?", or arrangement help. **Inspect with tools first; analyze with Tonal.js concepts** (see `08_tonaljs.md` for `Chord.detect`, `Scale.detect`, `Progression`, `Key`, etc.). Ground every suggestion in their actual notes, tempo, and instrumentation.

## Tools vs theory

- **Tools** read and change the Audiotool project (`get-project-summary`, `export-tracks-abc`, `add-abc-track`, …).
- **Tonal.js** (skill `08_tonaljs.md`) is how you reason about pitch, harmony, and ABC — you do not execute it; apply it conceptually to exported ABC and note lists.

## How to suggest changes

1. Call `get-project-summary` and `export-tracks-abc` in parallel before musical feedback.
2. **Diagnose** using Tonal-style analysis: likely key/scale (`Scale.detect`), chord names (`Chord.detect`), progression (`Progression.toRomanNumerals`), diatonic options (`Key.majorKey` / `Key.minorKey`).
3. **Prescribe** 1–3 prioritized suggestions, each tied to Audiotool actions (new notes, chord swap, layer add/remove, `update-project-config`).
4. If they name an **artist or theme** and want it to match, use **`10_reference_styles.md`** — decompose feel/structure and implement with Strudel (`add-strudel-track`), **in the spirit of** only.
5. Respect intentional minimalism; explain *effect*, not jargon dumps.
6. Max 3 concrete suggestions per reply unless they ask for a full critique.

## Scales and modes (genre palette)

| Mode / scale | Character | Common genres |
|--------------|-----------|---------------|
| Ionian (major) | Bright, resolved | Pop, country |
| Aeolian (natural minor) | Dark, emotional | Rock ballads, cinematic |
| Dorian | Minor + raised 6, hopeful | Funk, soul, house |
| Mixolydian | Major + ♭7, open | Rock, jam bands |
| Phrygian | Minor + ♭2, tense | Flamenco, metal, trap |
| Harmonic / melodic minor | Classical/jazz color | Metal, film, jazz |
| Pentatonic / blues | Hook-friendly | Rock, pop, EDM, hip-hop |

**Suggestion triggers**:
- All diatonic stepwise motion with no color → suggest a borrowed chord or mode shift (see `08_tonaljs` / `Mode`).
- Minor with weak cadences → harmonic minor or V7 on v.
- Pentatonic loop only → add a short motif with one chromatic passing tone or syncopation.

## Arrangement & texture (non-harmonic)

- **Frequency roles**: sub/bass, body, presence, air — overlap causes mud; suggest octave moves or EQ, not only volume.
- **Layer arc**: sparse intro → fuller chorus → breakdown before final chorus.
- **Density**: if melody and drums are both busy, thin one layer.
- **Bass + kick**: in EDM, suggest sidechain or octave separation when low end fights.

Do not claim timbre from ABC alone — use `get-project-summary` device types for sound-design advice.

## Genre-aware defaults (sparse user context)

| Genre | Typical tempo | Harmony | Rhythm | Melody |
|-------|---------------|---------|--------|--------|
| House/techno | 120–128 | minor vamps, 7ths | four-on-floor, off-beat hats | short hooks |
| Hip-hop/trap | 70–150 (half-time) | minor, sparse | syncopated hats, 808 | sparse, rhythmic |
| Pop | 90–130 | I–V–vi–IV family | straight eighths | singable, narrow range |
| Rock | 100–140 | I–IV–V, Mixolydian | backbeat | pentatonic |
| Jazz | 80–200 | ii–V–I, extensions | swing, syncopation | chromatic approaches |
| Lo-fi | 70–90 | jazzy 7ths, borrowed chords | dusty/swing drums | simple, nostalgic |
| Cinematic | variable | modal, orchestral | long notes | wide motifs |

For chord spelling, transposition, voicings, and ABC conversion, use **`08_tonaljs.md`** — not duplicated here.

## What NOT to do

- Do not insist on classical voice leading in aggressive EDM/trap unless they want that style.
- Do not suggest key/tempo changes without a reason tied to their material.
- Do not overwhelm with theory lectures; offer to implement the top suggestion via tools.
