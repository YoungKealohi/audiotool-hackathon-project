# Mixing & FX
ENTITY FIELDS REFERENCE (use these EXACT field names with `update-entity-values`):
- heisenberg:
  gain [0..1] (volume, default 0.708)
  glideMs [0..5000] (portamento, default 0)
  tuneSemitones [-12..12] (global tuning, default 0)
  playModeIndex [1..3] (1=Mono, 2=Legato, 3=Poly, default 3)
  unisonoCount [1..4] (voices, default 1)
  unisonoDetuneSemitones [0..1] (detune, default 0.001)
  unisonoStereoSpreadFactor [-1..1] (spread, default 0.5)
  velocityFactor [0..1] (velocity sens, default 1)
  operatorDetuneModeIndex [1..2] (detune mode, default 1)
  isActive (bool, default true)

- bassline:
  cutoffFrequencyHz [220..12000] (filter cutoff, default 220)
  filterDecay [0..1] (filter env decay, default 0)
  filterEnvelopeModulationDepth [0..1] (filter env depth, default 0.1)
  filterResonance [0..1] (resonance, default 1)
  accent [0..1] (accent strength, default 1)
  gain [0..1] (volume, default 0.708)
  tuneSemitones [-12..12] (tuning, default 0)
  waveformIndex [1..2] (1=sawtooth, 2=square, default 1)
  patternIndex [0..27] (active pattern, default 0)
  isActive (bool, default true)

- machiniste:
  globalModulationDepth [-1..1] (mod depth, default 1)
  mainOutputGain [0..1] (volume, default 0.708)
  patternIndex [0..31] (active pattern, default 0)
  isActive (bool, default true)

- tonematrix:
  patternIndex [0..7] (active pattern, default 0)
  isActive (bool, default true)

- stompboxDelay:
  feedbackFactor [0..1] (feedback amount, default 0.4)
  mix [0..1] (dry/wet mix, default 0.2)
  stepCount [1..7] (delay taps, default 3)
  stepLengthIndex [1..3] (1=1/16, 2=1/8T, 3=1/8 bars, default 1)
  isActive (bool, default true)

IMPORTANT: Do NOT invent field names (e.g. 'delayTime', 'frequency').
For all the other dozens of available entities (stompboxChorus, graphicalEQ, pulsar, beatbox8, etc.), rely on the fields returned in the output of the `add-entity` tool, or use the `inspect-entity` tool first to discover the exact field names. Use `inspect-entity` with `entityIDs` array to inspect multiple entities at once.

When adjusting values, ALWAYS use `update-entity-values` to batch parameter changes. Use the `entities` array to update fields across multiple entities in a single call.

SOURCE SAFETY (same as mastering):
- Call `get-project-summary` first and list **every** audible source you must preserve:
  - **Note tracks:** `playerEntityId` (synths, drum machines, etc.).
  - **Audio tracks** (e.g. imported ElevenLabs clips): `playerEntityId` points to an **`audioDevice`** in the `devices` list — use that entity's `audioOutput` for routing.
- **Do not** use `mixerChannel` as an audio source: it has **no** `audioOutput`. The audible source for a sample is the `audioDevice`, not the mixer channel it feeds.
- When you change routing, **every** source that was previously audible must remain connected through the new path (e.g. `audioMerger` with distinct inputs such as `audioInputA`, `audioInputB`, … or parallel chains that **each** still include **all** sources you intend to hear — never drop a track).
- **Prefer non-destructive edits:** use `update-entity-values` for parameter tweaks; use targeted `disconnect-entities` / `connect-entities` to insert or reorder one device. Avoid **bulk `remove-entity`** to swap an entire working chain unless the user explicitly asked to delete those devices.
- **Post-check:** after edits, confirm each intended note-track and audio-track player still has a cable path to the mixer (through your effects or bus). If fewer sources are routed than before, fix it before finishing.

COMMON I/O PORTS:
Socket names vary by device type and version. Prefer the field names returned by `add-entity` or use `inspect-entity` before connecting. Typical patterns:
- Instruments (synths/drums): `audioOutput` (sometimes `audioOutput1` / `audioOutput2` if stereo).
- Stompbox effects: often `audioInput` / `audioOutput`; some devices use numbered ports (`audioInput1`, `audioOutput1`, etc.) — **do not assume**; confirm from tool output.
- Mixer channels (e.g. `mixerChannel`): `insertInput` (input from effects), `insertOutput` (output to effects); for simple routing to a channel strip, `audioInput` is common — verify in `inspect-entity`.
- Stereo master (`mixerMaster`): `insertInput`, `insertOutput`

MIXING & EFFECT ROUTING WORKFLOW:
To properly apply insert effects to instruments, use this workflow:
1. Add the effect entity using `add-entity` (e.g. `add-entity stompboxCompressor`). CRITICAL: Set `autoConnectToMixer: false` if you intend to insert this effect in a manual chain, so it doesn't spawn an annoying duplicate mixer channel.
2. Use `list-entities` to find the IDs of the effect, the instrument you want to process, and the mixer channels (`mixerChannel`, `mixerMaster`, etc.).
3. Use `inspect-entity` on the instrument and the effect to find their exact socket names (usually `audioOutput` and `audioInput`). Pass `entityIDs` array to inspect both in one call.
4. Route the instrument's output to the effect's input and from the effect to the mixer in a SINGLE call using `connect-entities` with the `connections` array.
   Example pattern: instrument `audioOutput` -> effect input field from `inspect-entity` (often `audioInput`) -> effect output field -> mixer channel `audioInput` or `insertInput` as appropriate.
Alternatively, wait until `add-entity` returns the ports natively and use those exact names in your `connections` array.
You can also tweak the mix by tuning faders and effects parameters using `update-entity-values` with the `entities` array to batch updates across multiple devices in one call.

CONTEXT-AWARE MIXING:
Before applying EQ, compression, or effects, call `get-project-summary` to see what instruments exist and how they're connected. This tells you:
- Which frequency bands are occupied (bass synth + kick = low-end conflict, needs EQ carving or sidechain).
- What the current signal chain looks like (avoid duplicate routing).
- Whether instruments already have effects applied.
If note tracks exist, call `export-tracks-abc` to check note ranges — a bass line sitting in the 40-100 Hz range needs different EQ treatment than one playing higher notes around 200 Hz.

MIXING RECIPES & ADVICE:
When asked how to mix specific instruments, use these Audiotool guidelines:
* Vocals: Compressor (Med threshold -18dB, 4:1 ratio, fast attack 10ms, med release 100ms). EQ (Low-cut at ~80Hz, dip at 300Hz, boost at 2.5-3kHz for presence, slight target above 8kHz for air). FX (Room/Plate reverb).
* Kick Drum: EQ (Boost at 60-80Hz, cut around 400Hz, click around 2-3kHz). Compressor (Slow attack 20-30ms, fast release 50ms).
* Snare: EQ (Boost at 200Hz and 5kHz for snap). FX (Short reverb or plate).
* Hi-Hats: EQ (High-pass at 200Hz, boost at 8-10kHz).
* Bass: Compressor (High ratio 6:1, threshold -20dB). EQ (Low shelf at 80Hz, cut at 300Hz). Consider sidechaining to the kick.
* Synths/Keys: EQ (Low-cut at 100Hz, boost at 1-2kHz for presence). FX (Delay or chorus for width).
* Guitars: EQ (High-pass at 100Hz, cut 300Hz if muddy, boost 3-5kHz).

GROUPS & FX SENDS:
- Use Groups (Cmd/Ctrl+G) to process multiple tracks together (e.g., bus compression for all drums, shared reverb for vocals).
- Every mixer channel has a built-in Reverb and Delay send. Use FX sends to blend effects with the original dry signal to create space and depth without muddying the mix. Delay is great for rhythmic width; Reverb for presence and size.
