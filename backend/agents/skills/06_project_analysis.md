# Project Analysis & Context

## Introspection tools

You have two tools for understanding the current state of the user's project:

**`get-project-summary`** — Returns the full project overview: config (tempo, time signature), all devices (instruments, effects, and `audioDevice` players for imported samples — all with IDs), note tracks (with `playerEntityId`), audio tracks (with `playerEntityId` pointing to their `audioDevice`), cable connections (signal chain), and mixer layout. Call this when you need a birds-eye view of what exists in the project.

**`export-tracks-abc`** — Reads note tracks and exports their note content as ABC notation. Accepts an optional `noteTrackId` to export a single track; omit it to export all tracks. Use this to read melodies, bass lines, chord progressions, and drum patterns.

## Modifying project config

**`update-project-config`** — Changes global project settings: tempo (BPM) and time signature. Use this tool whenever the user asks to change, set, or update the BPM, tempo, or time signature. You MUST call this tool to make the change; do not simply state the change was made without calling it.

- To change tempo: pass `tempoBpm` (number, must be > 0).
- To change time signature: pass BOTH `timeSignatureNumerator` and `timeSignatureDenominator` together.
- You can update tempo and time signature in one call.

## When to use each tool

| Scenario | Tool(s) |
|----------|---------|
| User asks for something that should "fit" or "match" their project | `get-project-summary` and `export-tracks-abc` (call in parallel — they are independent reads) |
| User asks to mix or master their project | `get-project-summary` |
| User asks "what instruments do I have?" | `get-project-summary` |
| User asks to generate a complementary bass line / drum track | `get-project-summary` + `export-tracks-abc` (call in parallel) |
| User wants to tweak a specific entity you already know | `inspect-entity` (no need for the summary tools). Use `entityIDs` array to inspect multiple entities at once. |
| User wants to see what's on the desktop | `list-entities` is fine for a quick device list |
| User asks to change BPM, tempo, or time signature | `update-project-config` |

Use `get-project-summary` over `list-entities` when you need to understand the full picture (tracks, connections, mixer), not just device positions.

## Creative suggestions workflow

When the user asks what to change, for feedback, or "how can I improve this?":

1. Call `get-project-summary` and `export-tracks-abc` in parallel (unless you already have fresh exports this turn).
2. **Analyze** with Tonal.js concepts from `08_tonaljs.md` (applied conceptually — no runtime):
   - Pitch classes from ABC → `Scale.detect(notes, { tonic?, match? })` for key/scale candidates.
   - Simultaneous or bar-grouped notes → `Chord.detect(notes)` for chord symbols.
   - Chord roots per bar → `Progression.toRomanNumerals(tonic, chords)` for progression language.
   - Diatonic options → `Key.majorKey(tonic)` / `Key.minorKey(tonic)` for triads, sevenths, secondary dominants.
3. Apply **`00_music_theory.md`** for genre defaults, arrangement density, and suggestion etiquette.
4. Reply with **observations first**, then **1–3 prioritized suggestions** actionable in Audiotool (`add-abc-track`, `update-project-config`, preset/layer changes).
5. Offer to implement the top suggestion; do not rewrite their whole song unprompted.

If they have no note content yet, suggest a starting progression (`Progression.fromRomanNumerals`) or motif matched to genre — then implement with `add-abc-track` if they want.

## Analyzing ABC from export-tracks-abc

`export-tracks-abc` returns ABC text and headers (`M:`, `Q:`, `K:`) — it does **not** run harmonic analysis. You analyze:

| Step | Tonal approach | Also note |
|------|----------------|-----------|
| Key / scale | `Scale.detect` on pitch classes from the ABC body | Respect `K:` header as a hint, not gospel |
| Chords | `Chord.detect` on notes that sound together per beat/bar | Slash bass from lowest pitch in the slice |
| Progression | `Progression.toRomanNumerals` once chords are named | Harmonic rhythm = how often chords change |
| Range / role | `Note` octaves from ABC or MIDI pitch in export | Bass vs mid vs treble for arrangement |
| Rhythm | Count ABC note lengths (L: unit) | Busy vs sparse; complement when generating parts |

## Using analysis for complementary generation

When generating a complementary part (bass line, drum track, counter-melody):
- Match key/scale from analysis (`Scale.get`, `Mode.notes` — see `08_tonaljs.md`).
- Use `Key.majorKey` / `Key.minorKey` or `Progression.fromRomanNumerals` to pick diatonic chords for new parts.
- Fill frequency gaps; complement rhythmic density (busy melody → simpler bass).
- Keep tempo and meter from `get-project-summary` / ABC headers; use `update-project-config` only if the user wants a change.
- For ElevenLabs: "120 BPM, C minor, syncopated funk bass complementing sparse piano…"

## Using analysis for mixing decisions

When advising on mixing:
- Identify frequency conflicts from the instrument types and note ranges (e.g., bass synth and kick drum both in the low end).
- Suggest EQ carving based on which instruments overlap in range.
- Recommend compression settings based on the dynamic range and rhythmic patterns.
- Use the signal chain (cables) from the summary to understand current routing before suggesting changes.

## Mastering rewiring checklist (required before disconnect-entities)

Before disconnecting any cable during mastering:
1. Call `get-project-summary` and list all currently audible source players:
   - all `noteTrack.playerEntityId` values (synths like heisenberg, gakki — visible in `devices`)
   - all `audioTrack.playerEntityId` values (these are `audioDevice` entities for imported samples — also visible in `devices`)
2. Map each source to at least one current outgoing cable in the summary. For audio-track players, the cable goes from `audioDevice.audioOutput` to a `mixerChannel.audioInput`. Remember: `mixerChannel` has NO `audioOutput` — never try to route FROM it.
3. Prepare replacement routing for every source in the new mastering chain.
4. Only then call `disconnect-entities` with the `cableIds` array to remove all cables being replaced in one call.
5. After rewiring, call `get-project-summary` again to confirm every previously-audible source still has an output path.

Never leave an audio-track player disconnected while reconnecting note-track players only. That causes imported samples to become silent.
