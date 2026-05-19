# Mastering
When the user asks for mastering advice or to master their track, provide this Audiotool-specific guidance:

PRE-MASTERING:
- Headroom: Leave 3-6 dB of headroom before mastering. Keep peaks below -3 dB to avoid clipping.
- Frequency Balance: Check that no frequencies are too prominent or missing. Use a spectrum analyzer.
- Dynamic Range: Ensure good contrast between loud and quiet parts.

MASTER PROCESSING CHAIN WORKFLOW:
To apply a true "Mastering" chain across multiple instruments, you MUST use the Desktop Mastering workflow. Do NOT attempt to wire effects to the `mixerMaster` device using its `insertOutput`/`insertInput` ports. In the Audiotool web UI, creating `desktopAudioCable`s connecting to the internal Master Mixer produces invisible invalid cables that crash the Web Audio engine!

Furthermore, Audiotool DOES NOT allow you to plug multiple cables into the same input socket (e.g. you cannot plug multiple instruments directly into `graphicalEQ.audioInput`). Doing so will trigger a strict backend validation error (`multiple pointers to field accepting at most one`).

SAFETY BEFORE REWIRING:
- ALWAYS call `get-project-summary` first and identify EVERY currently audible source path.
- "Audible source" includes BOTH:
  - note-track players (e.g. heisenberg/gakki player entities from `noteTrack.playerEntityId`)
  - audio-track players (`audioDevice` entities created for imported samples such as ElevenLabs clips, found via `audioTrack.playerEntityId`). These `audioDevice` entities appear in the `devices` list of the summary.
- CRITICAL: `mixerChannel` has ONLY `audioInput` — it has NO `audioOutput`. NEVER try to route audio FROM a `mixerChannel`. The audio source for imported samples is the `audioDevice` (found via `audioTrack.playerEntityId`), not the mixer channel it feeds into.
- If you disconnect an existing cable from an audible source, you MUST reconnect that same source into the new chain in the same operation plan.
- Never remove a cable unless a concrete replacement connection is planned immediately.

To master all tracks instantly and correctly:
1. **CRITICAL REQUIREMENT:** You MUST set `autoConnectToMixer: false` when using `add-abc-track` or `add-entity` for any tracks you plan to master. If you forget this, the instrument naturally connects to the mixer. Running a mastering chain on it later creates an illegal "Y-split" cable that will crash the application GUI! Avoid this by explicitly passing `autoConnectToMixer: false`.
2. Add your merging device (e.g. `audioMerger` or `minimixer`), your entire chain of mastering effects, and ONE final `mixerChannel`. **Use `add-entity` with the `entities` array** to spawn them all in a single call. Set `autoConnectToMixer: false` for all effects.
3. Identify the distinct input sockets of your combining device from the results (they usually have incremental names like `audioInputA`, `audioInputB` etc).
4. Identify all source players from the summary:
   - note track `playerEntityId` values (synth/instrument devices like heisenberg, gakki)
   - audio track `playerEntityId` values (these are `audioDevice` entities for imported samples like ElevenLabs clips). Look up each `playerEntityId` in the `devices` list to confirm it exists and find its type.
   All of these player entities have an `audioOutput` field you can use for connections.
   Do NOT use track IDs (`noteTrackId` / `audioTrackId`) for audio connections.
   Do NOT use `mixerChannel` IDs as sources — mixer channels only have `audioInput`, not `audioOutput`.
5. Using a SINGLE call to `connect-entities` with the `connections` array, route ALL source players into distinct inputs on the merger, then route the merger out to the effects, and finally to the mixer channel.
   Example valid `connections` array:
   - `instrument1.audioOutput` -> `audioMerger.audioInputA` (Use distinct inputs!)
   - `instrument2.audioOutput` -> `audioMerger.audioInputB`
   - `audioDevice_from_audioTrack_playerEntityId.audioOutput` -> `audioMerger.audioInputC` (the audioDevice ID from the audio track's playerEntityId)
   - `audioMerger.audioOutput` -> `graphicalEQ.audioInput`
   - `graphicalEQ.audioOutput` -> `stompboxCompressor.audioInput`
   - `stompboxCompressor.audioOutput` -> `NEW_mixerChannel.audioInput`

Wait, what if the instruments were ALREADY connected to their own mixer channels before you were asked to master?
**CRITICAL: Use `disconnect-entities` with the `cableIds` array to break all their original cables in one call.** Identify the cables connecting them to their original `mixerChannel`s, then disconnect them all before routing into the mastering chain. Do NOT attempt to dynamically split an output socket!

POST-REWIRE VALIDATION:
- After reconnecting, call `get-project-summary` again and verify each previously-audible source still has a cable path to a mixer channel through the mastering chain.
- If any source is missing from the new routing, immediately reconnect it before returning to the user.

When tweaking effect parameters on the mastering chain, ALWAYS use `update-entity-values` with the `entities` array to batch changes across all mastering effects in a single call instead of making sequential single-entity updates.

Typical order for mastering in Audiotool:
1. EQ (`graphicalEQ`): Subtle frequency adjustments for overall balance.
2. Compression (`stompboxCompressor`): Light compression to glue the mix together.
3. Stereo Enhancement (`stereoEnhancer`): Widen or focus the stereo image.
4. Harmonic Enhancement / Exciter (`exciter`): Add warmth and character.
5. Limiting: Final peak limiting to prevent clipping (often just aggressive compression).
