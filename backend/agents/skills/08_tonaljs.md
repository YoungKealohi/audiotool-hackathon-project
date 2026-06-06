# Tonal.js (Music Theory Library)

[Tonal.js](https://github.com/tonaljs/tonal) is a JavaScript music-theory toolkit. This skill is the **single in-prompt reference** for Tonal APIs (examples below). Upstream docs: [tonaljs/tonal/docs](https://github.com/tonaljs/tonal/tree/main/docs). A local mirror lives in `skills/references/` for maintainers only — it is **not** loaded into the agent prompt.

```js
import { Note, Interval, Chord, Scale, Key, Progression, AbcNotation, RomanNumeral, Mode, Voicing } from "tonal";
```

You do **not** execute JavaScript in the user's Audiotool session. Use these APIs **conceptually** to analyze exported ABC, name chords, plan progressions, and spell notation correctly.

---

## Module map (what to use when)

| Area | Modules | Typical task |
|------|---------|--------------|
| **basics** | `Note`, `Interval`, `Midi` | Parse note names, MIDI numbers, transpose, measure intervals |
| **dictionaries** | `ChordType`, `ScaleType` | Look up chord/scale *types* (interval formulas, aliases) |
| **groups** | `Chord`, `Scale`, `Pcset` | Build named chords/scales from a tonic; detect chords from note sets |
| **harmony** | `Key`, `Mode`, `Progression` | Diatonic chords, modes, roman-numeral progressions |
| **notation** | `RomanNumeral`, `AbcNotation` | Leadsheet symbols; convert between ABC and scientific notation |
| **time** | `DurationValue`, `TimeSignature`, `RhythmPattern` | Meter, note lengths, euclidean/binary rhythm grids |
| **utils** | `Collection`, `Range` | Note lists, chromatic/MIDI ranges between bounds |
| **voicings** | `Voicing`, `VoicingDictionary`, `VoiceLeading` | Jazz/pop voicing search and smooth voice leading |

**Layering:** `ChordType` / `ScaleType` describe *shapes*; `Chord.get("Cmaj7")` / `Scale.get("D dorian")` apply a tonic; `Key.majorKey("C")` bundles scales, triads, and functional harmony for a key center.

---

## Basics — Note, Interval, Midi (all functions with examples)

```js
import { Note, Interval, Midi } from "tonal";
```

### Note — properties

```js
Note.get("C4");           // => { name: "C4", midi: 60, chroma: 0, freq: 261.63, ... }
Note.name("fx4");           // => "F##4"
Note.pitchClass("Ab5");     // => "Ab"
Note.accidentals("Eb");     // => "b"
Note.octave("C4");          // => 4
Note.midi("A4");            // => 69
Note.freq("A4");            // => 440
Note.chroma("D");           // => 2
["C", "D", "E"].map(Note.chroma); // => [0, 2, 4]
```

### Note — from MIDI / frequency

```js
Note.fromMidi(61);          // => "Db4"
Note.fromMidi(61.7);        // => "D4"  (rounds to nearest)
Note.fromMidiSharps(61);    // => "C#4"
[60, 61, 62].map(Note.fromMidi); // => ["C4", "Db4", "D4"]

Note.fromFreq(440);         // => "A4"
[440, 550, 660].map(Note.fromFreq);       // => ["A4", "Db5", "E5"]
[440, 550, 660].map(Note.fromFreqSharps); // => ["A4", "C#5", "E5"]
```

### Note — transposition and distance

```js
Note.transpose("d3", "3M"); // => "F#3"
Note.transpose("D", "3M");  // => "F#"
["C", "D", "E"].map(Note.transposeBy("5P"));  // => ["G", "A", "B"]
["1P", "3M", "5P"].map(Note.transposeFrom("C")); // => ["C", "E", "G"]

Note.transposeFifths("G4", 3);  // => "E6"
Note.transposeFifths("G", 3);   // => "E"
[0, 1, 2, 3].map((n) => Note.transposeFifths("F#", n)); // => ["F#", "C#", "G#", "D#"]

Note.distance("C", "D");   // => "2M"
Note.distance("C3", "E3"); // => "3M"
Note.distance("C3", "E4"); // => "10M"
```

### Note — collections

```js
Note.names(["fx", "bb", 12, "nothing"]); // => ["F##", "Bb"]
Note.names(); // => ["C", "D", "E", "F", "G", "A", "B"]

Note.sortedNames(["c2", "c5", "c1", "c0", "c6", "c"]);
// => ["C", "C0", "C1", "C2", "C5", "C6"]
Note.sortedNames(["c", "F", "G", "a", "b"]); // => ["C", "F", "G", "A", "B"]
Note.sortedNames(["c2", "c5", "c1"], Note.descending); // => ["C5", "C2", "C1"]

Note.sortedUniqNames(["c2", "c2", "c5", "c1"]); // sorted ascending, duplicates removed
```

### Note — enharmonics

```js
Note.simplify("C#");   // => "C#"
Note.simplify("C##");  // => "D"
Note.simplify("C###"); // => "D#"

Note.enharmonic("C#");   // => "Db"
Note.enharmonic("C##");  // => "D"
Note.enharmonic("F2", "E#"); // => "E#2"  (enforce destination pitch class)
Note.enharmonic("B2", "Cb"); // => "Cb3"
Note.enharmonic("F2", "Eb"); // => ""  (invalid — different chroma)
```

### Interval — properties

```js
Interval.get("5P");       // => { name: "5P", num: 5, semitones: 7, ... }
Interval.name("d4");      // => "4d"
Interval.num("5P");       // => 5
Interval.quality("5P");   // => "P"
Interval.semitones("P4"); // => 5
```

### Interval — collections and conversion

```js
Interval.names(); // => ["1P", "2M", "3M", "4P", "5P", "6m", "7m"]

Interval.fromSemitones(7);  // => "5P"
Interval.fromSemitones(-7); // => "-5P"
[0, 1, 2, 3, 4].map(Interval.fromSemitones);
```

### Interval — operations

```js
Interval.simplify("9M");  // => "2M"
Interval.simplify("-2M"); // => "7m"
["8P", "9M", "10M", "11P"].map(Interval.simplify);
// => ["8P", "2M", "3M", "4P"]

Interval.invert("3m"); // => "6M"
Interval.invert("2M"); // => "7m"

Interval.distance("C4", "G4"); // => "5P"

Interval.add("3m", "5P");    // => "7m"
Interval.add("4P", "2M");    // => "5P"
Interval.subtract("5P", "3M"); // => "3m"
Interval.subtract("3M", "5P"); // => "-3m"
```

### Midi — conversion

```js
Midi.toMidi("C4");  // => 60
Midi.toMidi(60);    // => 60
Midi.toMidi("#");   // => null
Midi.toMidi(-1);    // => null

Midi.midiToFreq(60);       // => 261.63
Midi.midiToFreq(69);       // => 440
Midi.midiToFreq(69, 443);  // => 443  (custom A4 tuning)

Midi.midiToNoteName(61);                        // => "Db4"
Midi.midiToNoteName(61, { pitchClass: true });  // => "Db"
Midi.midiToNoteName(61, { sharps: true });    // => "C#4"
Midi.midiToNoteName(61.7);                      // => "D4"  (rounds)

Midi.freqToMidi(220);    // => 57
Midi.freqToMidi(261.62); // => 60
Midi.freqToMidi(261);    // => 59.96
```

### Midi — pitch-class sets

```js
import { Scale } from "tonal";

Midi.pcset([62, 63, 60, 65, 70, 72]); // => [0, 2, 3, 5, 10]
Midi.pcset("100100100101");            // => [0, 3, 6, 9, 11]

// Constrain MIDI notes to nearest scale tone (use with Scale.get(...).chroma)
const nearest = Midi.pcsetNearest(Scale.get("D dorian").chroma);
[60, 61, 62, 63, 64, 65, 66].map(nearest); // => [60, 62, 62, 63, 65, 65, 67]

const steps = Midi.pcsetSteps(Scale.get("D dorian").chroma, 60);
[-2, -1, 0, 1, 2, 3].map(steps); // => [57, 58, 60, 62, 63, 65]
```

---

## Dictionaries — ChordType, ScaleType

```js
import { ChordType, ScaleType } from "tonal";
```

### ChordType

```js
ChordType.get("major").intervals; // => ["1P", "3M", "5P"]
ChordType.get("major");
// => { name: "major", aliases: ["M", ""], quality: "Major", intervals: [...], chroma: "100010010000", length: 3 }

ChordType.names();   // all chord type long names
ChordType.symbols(); // all chord type symbols
ChordType.all();     // full list of chord type objects

ChordType.add(["1P", "3M", "5P"], ["M", "may"], "mayor");
ChordType.get("mayor"); // => { name: "mayor", quality: "Major", ... }
ChordType.get("may");   // alias lookup

ChordType.all()
  .filter((t) => t.length === 3)
  .map((t) => t.name); // triad type names
```

### ScaleType

```js
ScaleType.get("major").intervals; // => ["1P", "2M", "3M", "4P", "5P", "6M", "7M"]
ScaleType.get("major");
// => { name: "major", aliases: ["ionian"], intervals: [...], chroma: "101011010101", length: 7 }

ScaleType.names(); // all scale type names
ScaleType.all();   // full list

ScaleType.add(["1P", "5P"], "quinta", ["quinta justa", "diapente"]);
ScaleType.get("quinta");       // => { name: "quinta", intervals: ... }
ScaleType.get("quinta justa"); // alias lookup

ScaleType.all()
  .filter((t) => t.intervals.length === 5)
  .map((t) => t.name); // pentatonic type names
```

---

## Groups — Chord, Scale, Pcset

```js
import { Chord, Scale, Pcset, Range } from "tonal";
```

### Chord

```js
Chord.get("Cmaj7").notes; // => ["C", "E", "G", "B"]
Chord.get("Cmaj7/B");
// => { symbol: "Cmaj7/B", tonic: "C", bass: "B", notes: ["B", "C", "E", "G"], ... }

Chord.getChord("maj7", "C", "B"); // same as Chord.get("Cmaj7/B")

Chord.notes("maj7", "C4"); // => ["C4", "E4", "G4", "B4"]

const c4m7 = Chord.degrees("m7", "C4");
c4m7(1); // => "C4"
[1, 2, 3, 4].map(c4m7); // => ["C4", "Eb4", "G4", "Bb4"]
[2, 3, 4, 5].map(c4m7); // => ["Eb4", "G4", "Bb4", "C5"]  (inversions)

Range.numeric([-3, 3]).map(Chord.steps("aug", "C4"));
// => ["C3", "E3", "G#3", "C4", "E4", "G#4", "C5"]

Chord.detect(["D", "F#", "A", "C"]);  // => ["D7"]
Chord.detect(["F#", "A", "C", "D"]);  // => ["D7/F#"]

Chord.transpose("Eb7b9", "5P"); // => "Bb7b9"

Chord.chordScales("C7b9");
// => ["phrygian dominant", "flamenco", "spanish heptatonic", "half-whole diminished", "chromatic"]

Chord.extended("Cmaj7"); // supersets: ["Cmaj9", "Cmaj13", ...]
Chord.reduced("Cmaj7");  // subsets: ["C5", "CM"]
```

### Scale

```js
Scale.get("c5 pentatonic").notes; // => ["C5", "D5", "E5", "G5", "A5"]

const c4major = Scale.degrees("C4 major");
c4major(1);  // => "C4"
c4major(8);  // => "C5"
c4major(-1); // => "B3"
[1, 2, 3].map(Scale.degrees("C major")); // => ["C", "D", "E"]

Range.numeric([-3, 3]).map(Scale.steps("C4 major"));
// => ["G3", "A3", "B3", "C4", "D4", "E4", "F4"]

Scale.scaleNotes(["D4", "c#5", "A5", "F#6"]); // => ["D", "F#", "A", "C#"]
Scale.scaleNotes(["C4", "c3", "C5", "C4"]);    // => ["C"]  (deduped)

const range = Scale.rangeOf("C pentatonic");
range("C4", "C5"); // => ["C4", "D4", "E4", "G4", "A4", "C5"]

Scale.names(); // all known scale names

Scale.detect(["C", "D", "E", "F", "G", "A", "B"]);
// => ["C major", "C bebop", "C chromatic", ...]

Scale.detect(["C", "D", "E", "F", "G", "A", "B"], { tonic: "A" });
// => ["A aeolian", "A minor bebop", "A chromatic"]

Scale.detect(["D", "E", "F#", "A", "B"], { match: "exact" });
// => ["D major pentatonic"]

Scale.scaleChords("pentatonic"); // => ["5", "64", "M", "M6", "Madd9", "Msus2"]
Scale.extended("major");  // scales with same notes + more
Scale.reduced("major");   // subset scales: ["ionian pentatonic", "major pentatonic", ...]

Scale.modeNames("C pentatonic");
// => [["C","major pentatonic"], ["D","egyptian"], ["E","malkos raga"], ...]
```

### Pcset (pitch-class sets)

```js
Pcset.get(["c", "d", "e"]);
// => { num: 2688, chroma: "101010000000", intervals: ["1P", "2M", "3M"], length: 3 }
Pcset.get(2688);
Pcset.get("101010000000"); // same from number or chroma string

Pcset.chroma(["c", "d", "e"]); // => "101010000000"
Pcset.num(["c", "d", "e"]);    // => 2688
Pcset.intervals(["D", "F", "A"]); // => ["2M", "4P", "6M"]  (from C)

Pcset.notes(["D3", "A3", "Bb3", "C4", "D4", "E4", "F4", "G4", "A4"]);
// => ["C", "D", "E", "F", "G", "A", "Bb"]

const isInCTriad = Pcset.isIncludedIn(["C", "E", "G"]);
isInCTriad("C4");  // => true
isInCTriad("C#4"); // => false
isInCTriad("Fb");  // => true  (enharmonic)

// Pcset.isSubsetOf(parent)(subset) — curried subset test
// Pcset.isSupersetOf(subset)(parent) — curried superset test
```

---

## Harmony — Key, Mode, Progression

```js
import * as Key from "tonal";
import { Mode, Progression, Note } from "tonal";
```

### Key

```js
Key.majorKey("C").triads;
// => ["C", "Dm", "Em", "F", "G", "Am", "Bdim"]
Key.majorKey("C").chords;
// => ["Cmaj7", "Dm7", "Em7", "Fmaj7", "G7", "Am7", "Bm7b5"]
Key.majorKey("C").chordScales;
// => ["C major", "D dorian", "E phrygian", "F lydian", "G mixolydian", "A minor", "B locrian"]
Key.majorKey("C").secondaryDominants; // => ["", "A7", "B7", "C7", "D7", "E7", ""]

Key.minorKey("C").natural.scale;  // => ["C", "D", "Eb", "F", "G", "Ab", "Bb"]
Key.minorKey("C").harmonic.scale; // => ["C", "D", "Eb", "F", "G", "Ab", "B"]
Key.minorKey("C").melodic.scale;  // => ["C", "D", "Eb", "F", "G", "A", "B"]

Key.majorTonicFromKeySignature("bbb"); // => "Eb"

Key.majorKeyChords("C")
  .find((chord) => chord.name === "Em"); // => { name: "Em", roles: ["T", "ii/II"] }

Key.majorKeyChords("C").map((c) => c.name).join(", ");
// => "Cmaj7, Dm7, Em7, Fmaj7, G7, Am7, Bm7b5, A7, B7, ..."

Key.majorKey(Key.majorTonicFromKeySignature("###")).minorRelative; // => "F#"
```

### Mode

```js
Mode.names();
// => ["ionian", "dorian", "phrygian", "lydian", "mixolydian", "aeolian", "locrian"]

Mode.get("major");
// => { name: "ionian", intervals: ["1P","2M","3M","4P","5P","6M","7M"], seventh: "Maj7", ... }

Mode.all(); // all mode objects

Mode.notes("dorian", "D");  // => ["D", "E", "F", "G", "A", "B", "C"]
Mode.notes("major", "C");   // => ["C", "D", "E", "F", "G", "A", "B"]

Mode.triads("major", "C");
// => ["C", "Dm", "Em", "F", "G", "Am", "Bdim"]

Mode.seventhChords("major", "C");
// => ["CMaj7", "Dm7", "Em7", "FMaj7", "G7", "Am7", "B7b5"]

Mode.relativeTonic("minor", "major", "C"); // => "A"

Mode.get("major").intervals.map(Note.transposeFrom("A"));
// => ["A", "B", "C#", "D", "E", "F#", "G#"]
```

### Progression

```js
Progression.fromRomanNumerals("C", ["IMaj7", "IIm7", "V7"]);
// => ["CMaj7", "Dm7", "G7"]

Progression.fromRomanNumerals("C", ["I", "V", "vi", "IV"]);
// => ["C", "G", "Am", "F"]

Progression.toRomanNumerals("C", ["CMaj7", "Dm7", "G7"]);
// => ["IMaj7", "IIm7", "V7"]

Progression.toRomanNumerals("C", ["C", "G", "Am", "F"]);
// => ["I", "V", "vi", "IV"]
```

---

## Notation — RomanNumeral, AbcNotation

```js
import { RomanNumeral, AbcNotation, Interval } from "tonal";
```

### RomanNumeral

```js
RomanNumeral.get("bVIIMaj7");
// => { name: "bVIIMaj7", roman: "VII", acc: "b", chordType: "Maj7", step: 6, major: true }

RomanNumeral.get(Interval.get("3m")).name; // => "bIII"
```

### AbcNotation

```js
AbcNotation.abcToScientificNotation("c");  // => "C5"
AbcNotation.scientificToAbcNotation("C#4"); // => "^C"

AbcNotation.transpose("=C", "P19"); // => "g'"
AbcNotation.distance("=C", "g");    // => "12P"
```

ABC accidentals: `^` sharp, `_` flat, `=` natural; lowercase `c` = middle C (C5).

---

## Time — DurationValue, TimeSignature, RhythmPattern

```js
import { DurationValue, TimeSignature, RhythmPattern } from "tonal";
```

### DurationValue

```js
DurationValue.get("quarter").value; // => 0.25
DurationValue.get("quarter");
// => { name: "q", value: 0.25, fraction: [1, 4], shorthand: "q", dots: "" }

DurationValue.get("quarter..").value;    // => 0.4375  (double-dotted)
DurationValue.get("q") === DurationValue.get("quarter"); // true

DurationValue.value("q..");    // => 0.4375
DurationValue.fraction("q.."); // => [7, 16]

DurationValue.names();     // => ["large", "duplex longa", ...]
DurationValue.shorthands(); // => ["dl", "l", "d", "w", "h", "q", "e", "s", ...]
```

### TimeSignature

```js
TimeSignature.names(); // common signatures list

TimeSignature.get("3/4");
// => { name: "3/4", upper: 3, lower: 4, type: "simple", additive: [] }

TimeSignature.get("3+2+3/8");
// => { name: "3+2+3/8", type: "irregular", upper: 8, lower: 8, additive: [3, 2, 3] }

TimeSignature.get("12/10"); // => { type: "irrational", upper: 12, lower: 10 }
TimeSignature.get([3, 4]);
TimeSignature.get(["3+2+3", "8"]);
```

### RhythmPattern

```js
RhythmPattern.euclid(8, 3);  // => [1, 0, 0, 1, 0, 0, 1, 0]
RhythmPattern.binary(13);      // => [1, 1, 0, 1]
RhythmPattern.binary(12, 13);  // => [1, 1, 0, 0, 1, 1, 0, 1]
RhythmPattern.hex("8f");       // => [1, 0, 0, 0, 1, 1, 1, 1]
RhythmPattern.onsets(1, 2, 2, 1); // => [1, 0, 1, 0, 0, 1, 0, 0, 1, 0]
RhythmPattern.random(4);       // => [1, 0, 0, 1]  (non-deterministic)
RhythmPattern.probability([0.6, 0, 0.2, 0.5]); // => [0, 0, 0, 1]

RhythmPattern.rotate([1, 0, 0, 1], 2); // => [0, 1, 1, 0]
```

Audiotool ticks: 1 quarter = **3840**. Tonal time modules describe rhythmic structure, not DAW tick values.

---

## Utils — Collection, Range

```js
import { Collection, Range } from "tonal";
```

### Collection

```js
Collection.range(-2, 2);  // => [-2, -1, 0, 1, 2]
Collection.range(2, -2);  // => [2, 1, 0, -1, -2]

Collection.rotate(1, [1, 2, 3]); // => [2, 3, 1]
Collection.shuffle(["a", "b", "c"]); // randomized in-place

Collection.permutations(["a", "b", "c"]);
// => [["a","b","c"], ["b","a","c"], ["b","c","a"], ["a","c","b"], ["c","a","b"], ["c","b","a"]]
```

### Range

```js
Range.numeric([10, 5]);  // => [10, 9, 8, 7, 6, 5]
Range.numeric([-5, 5]);  // => [-5, -4, ..., 4, 5]
Range.numeric(["C5", "C4"]);
// => [72, 71, 70, 69, 68, 67, 66, 65, 64, 63, 62, 61, 60]
Range.numeric(["C4", "E4", "Bb3"]);
// => [60, 61, 62, 63, 64, 63, 62, 61, 60, 59, 58]

Range.chromatic(["C2", "E2", "D2"]);
// => ["C2", "Db2", "D2", "Eb2", "E2", "Eb2", "D2"]
Range.chromatic(["C2", "C3"], { sharps: true });
// => ["C2", "C#2", "D2", "D#2", "E2", "F2", "F#2", "G2", "G#2", "A2", "A#2", "B2", "C3"]
```

---

## Voicings — Voicing, VoicingDictionary, VoiceLeading

```js
import { Voicing, VoicingDictionary, VoiceLeading, Note } from "tonal";
```

### VoicingDictionary

```js
const lefthand = {
  m7: ["3m 5P 7m 9M", "7m 9M 10m 12P"],
  "7": ["3M 6M 7m 9M", "7m 9M 10M 13M"],
  "^7": ["3M 5P 7M 9M", "7M 9M 10M 12P"],
  m7b5: ["3m 5d 7m 8P", "7m 8P 10m 12d"],
  o7: ["1P 3m 5d 6M", "5d 6M 8P 10m"],
};
// Or: VoicingDictionary.lefthand from @tonaljs/voicing-dictionary
```

### Voicing

```js
Voicing.search("C^7", ["E3", "D5"], { "^7": ["3M 5P 7M 9M", "7M 9M 10M 12P"] });
// => [["E3","G3","B3","D4"], ["E4","G4","B4","D5"], ["B3","D4","E4","G4"]]

Voicing.search("C^7", ["E3", "D5"], VoicingDictionary.lefthand);
Voicing.search("C^7"); // uses defaults

Voicing.get("Dm7"); // => ["F3", "A3", "C4", "E4"]
const last = ["C4", "E4", "G4", "B4"];
Voicing.get("Dm7", ["F3", "A4"], lefthand, topNoteDiff, last);
// => ["C4", "E4", "F4", "A4"]  (top note closest to B4)

Voicing.analyze(["C4", "E4", "G4", "B4"]);
// => { topNote: "B4", bottomNote: "C4", midiAverage: 71 }

Voicing.analyzeTransition(["C4","E4","G4","B4"], ["D4","F4","A4","C5"]);
// => { topNoteDiff: 1, bottomNoteDiff: 2, movement: 5 }

Voicing.intervalSets("CM7", lefthand);
// => [["3M 5P 7M 9M", "7M 9M 10M 12P"]]

Voicing.searchSets([["1P","3M","5P"], ["3M","5P","8P"]], ["C3","G4"], "C");
// => [["C3","E3","G3"], ["E3","G3","C4"], ["C4","E4","G4"]]
```

### VoiceLeading

```js
const topNoteDiff = (voicings, lastVoicing) => {
  if (!lastVoicing?.length) return voicings[0];
  const topMidi = (v) => Note.midi(v[v.length - 1]) || 0;
  const diff = (v) => Math.abs(topMidi(lastVoicing) - topMidi(v));
  return voicings.sort((a, b) => diff(a) - diff(b))[0];
};

topNoteDiff(
  [["F3","A3","C4","E4"], ["C4","E4","F4","A4"]],
  ["C4","E4","G4","B4"]
);
// => ["C4", "E4", "F4", "A4"]  (A4 closer to B4 than E4)
```

---


## Audiotool workflow

1. **Inspect** — `get-project-summary` + `export-tracks-abc`.
2. **Analyze** — extract pitch classes from ABC → `Chord.detect`, `Scale.get`, `Progression.toRomanNumerals`, compare to `Key.majorKey` / `Key.minorKey`.
3. **Plan** — choose diatonic or borrowed chords (`Progression.fromRomanNumerals`, `Mode`, secondary dominants from `Key`).
4. **Generate** — write ABC with correct `K:` key and spellings (`AbcNotation` rules); `add-abc-track` with appropriate `instrument`.
5. **Explain** — tell the user in musical language (chord symbols, roman numerals, scale names). Do not cite `tonal` or package names unless asked.

When `00_music_theory.md` gives genre and arrangement advice, use this skill for spelling, detection, and progression math.
