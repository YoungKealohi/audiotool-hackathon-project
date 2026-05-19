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

## Analyzing ABC notation from export-tracks-abc

When you receive ABC notation from `export-tracks-abc`, analyze the musical content:

1. **Key and scale**: Look at the pitches used. Identify the most common note, the lowest note, and whether the intervals suggest major, minor, or another mode.
2. **Chord progression**: If notes overlap (chords), identify the root notes and chord qualities (major, minor, 7th, etc.).
3. **Rhythmic feel**: Note durations reveal the rhythmic density — lots of eighth notes = busy, mostly half/whole notes = sparse.
4. **Range**: The pitch range tells you which frequency band the track occupies (bass, mid, treble).
5. **Tempo & time signature**: Provided in the ABC header (Q: and M: fields) from the project config.

## Using analysis for complementary generation

When generating a complementary part (bass line, drum track, counter-melody):
- Match the key and scale of existing tracks.
- Fill frequency gaps — if existing tracks are all mid-range, suggest bass or high-frequency elements.
- Complement the rhythmic density — if the melody is busy, a simpler bass line often works better.
- Maintain the same tempo and time signature.
- For ElevenLabs prompts, translate your analysis into descriptive text: "120 BPM, C minor, syncopated funk bass line complementing a sparse piano melody."

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
