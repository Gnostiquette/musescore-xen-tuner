# Microtonal/Xenharmonic MuseScore plugin suite

**Work in progress.**

A rewrite of the n-edo plugin.

## HELP NEEDED

See [this post](https://www.facebook.com/groups/497105067092502/permalink/2700729770063343/)

## Goals:

- [ ] The user should not need to manually retune cents offset of notes. Support for many tuning systems as possible while allowing maximum flexibility of choice of accidentals.

- [ ] The user should not need to open up the symbols palette and manually search for the accidental the user needs. Every unique accidental and note in the equave should be accessible with just up/down arrows and 'J' to cycle through enharmonics.

- [ ] In large tuning systems, the user should not need to press the up arrow one [gongulus](https://googology.fandom.com/wiki/Gongulus) times to get to the desired note. An auxiliary up/down operation should be provided that transposes to the next note that considers a smaller subset of accidentals and leaves the other accidentals unchanged.

- [ ] Accidental ligatures (for HEJI & Sagittal) where multiple accidentals can combine and be represented as a single symbol.

- [ ] Proper transposition by any interval of choice for all regular mappings.

- [ ] MIDI/MPE export with channel pitch bend support.


## Target features

- Multiple accidentals (using symbols attached to a note)
- any number of nominals + custom nominal tuning
- equave stretching (1 equave = 1 cycle of nominals)
- custom accidental tuning
- declare a finite number of accidental permutations
- rank-N tunings/JI subgroups of dim-N with N different chains of accidentals
- transpose up/down to the nearest pitch
- enharmonic respell
- a list of copyable tuning configs of commonly used tunings for beginner users.

## List of Supported Accidentals

https://docs.google.com/spreadsheets/d/1kRBJNl-jdvD9BBgOMJQPcVOHjdXurx5UFWqsPf46Ffw/edit?usp=sharing

This is still a work in progress. Free for all to edit, and in need of community contribution! (Read [this post](https://www.facebook.com/groups/497105067092502/permalink/2700729770063343/))

## Caveats

- Does not intend to support having the same symbols in two different accidental chains (I am unaware of any notation system that requires this)
- Does not regard the order of appearance of accidentals.
- If writing music in non-ET tunings, only concert pitch is supported. If you wish to write for transposing instruments in transposed key, put the score in Concert Pitch mode and set the instruments' Tuning Config's tuning frequency to match the transposition of the instrument. When you do this, you cannot toggle between concert and transposed.
- Could be very laggy...

-----

# Dev Notes

## Case Study/Example

This tuning system/staff text specifies a 315-note subset of 2.3.5 JI:

```
A4: 440
0 203.91 294.13 498.04 701.96 792.18 996.09 1200
bb.bb 7 bb b (113.685) # x 2 x.x
\.\ \ (21.506) / /./
```

- `A4: 440`
  - Sets tuning note to MIDI note A4, sets A4 to 440hz.
  - Because of how this plugin works, the tuning note must be without accidental.
- `0 203.91 294.13 498.04 701.96 792.18 996.09 1200`
  - Sets a cycle of 7 nominals extending upwards/downwards from A4.
  - Tunes 7 nominals to 203.91cents, 294.13c, 498.04c, 701.96c, etc... respectively, representing the note names A, B, C, etc... (3-limit JI)
  - The last number sets equave to 1200c.
- `bb.bb 7 bb b (113.685) # x 2 x.x`
  - Declares a chain of accidentals that goes: two double-flats, triple-flat (accidental code `7` according to the [spreadsheet](https://docs.google.com/spreadsheets/d/1kRBJNl-jdvD9BBgOMJQPcVOHjdXurx5UFWqsPf46Ffw/edit?usp=sharing)), double-flat, flat, natural/none, sharp, double-sharp, triple-sharp (accidental code `2`), two double-sharps.
  - Each step in the flat/sharp direction lowers/raises the pitch by 113.685 cents respectively.
  - Accidentals in a one chain are mutually exclusive. That is, you cannot have two different accidentals within the same chain applied to the same note.
  - Declaring the chain of accidentals limits the search space of the 'transpose up/down to nearest pitch' function such that only the declared accidentals are regarded. (too many accidentals / nominals will cause lag.)
- `\.\ \ (21.506) / /./`
  - Declares a second chain of accidentals that go double-syntonic down, syntonic down, natural/none, syntonic up, double-syntonic up --- where each adjacent step in the accidental chain is 21.506 cents apart.
  - You can combine accidentals from different chains.


## Implementation Details

### Overview

`tune.qml`:

1. Parse tuning text annotation to construct the 'TuningConfig`.
2. Using key signature annotations, implicit & explicit accidentals, calculate the effective accidental applied on to a note. Explicit > implicit > key signature.
3. Calculate cents interval (from tuning note) of the original 12edo note.
4. Look up the `TuningConfig` for cents interval (from tuning note) for microtonal tuning.
5. Subtract the xen tuning cents from the original cents to get the cents offset.
6. Apply cents offset.

`up/down.qml`:

1. Parse tuning text annotation to construct the `TuningConfig`.
2. The up/down operation should move the current selected note(s) stepwise to the nearest `XenNote` in the `TuningConfig` that is **not** enharmonically equivalent. It should also choose the enharmonic spelling with the minimal number of required explicit accidentals.
3. Run through a series of checks:
   - If the newly adjusted note has a side-effect of adjusting the effective accidental of a succeeding note/grace note, apply the effective accidental of the succeeding note as explicit accidental(s), **before** the current note is adjusted.
   - If the newly adjusted note has a side-effect of making explicit accidentals of a succeeding note/grace redundant, remove the explicit accidental(s) of the succeeding note.
   - If the newly adjusted note agrees with the prior effective accidental context, then simply remove explicit accidentals of the current note.
4. Finally, apply/remove explicit accidentals as needed on the adjusted note.
5.  Apply the same method as `tune.qml` to tune the newly adjusted note.

In some edge cases, the newly adjusted note may cause succeeding notes to sound off-pitch (because of how symbolic accidentals allow standard accidental pitch offsets to pass through). **Recommend the user to always manually run `tune.qml` on the whole score after moving notes around.**

`enharmonic.qml`:

1. Parse tuning text annotation to construct the `TuningConfig`.
2. All enharmonically equivalent spellings are indexed/logically grouped together in the `TuningConfig`.
3. Cycle enharmonic spellings by index using the lookup table.

No checks on subsequent notes are needed because enharmonically equivalent notes/accidentals should always result in the same pitch.

For the same reason as `up/down.qml`, recommend the user to **always manually run `tune.qml` after this operation.**

`aux up/down.qml`:

1. Parse tuning text annotation to construct the `TuningConfig`.
2. Take note of the special auxiliary step config annotation which specifies which accidental cycles/sets to regard/disregard for the auxiliary up/down operation.
3. For this aux up/down operation, instead of using the nearest adjacent non-equivalent pitch. Skip to the nearest non-equivalent `XenNote` spelling such that accidentals present in disregarded accidental cycles remain unchanged. This is effectively forms a 'quotient group' (ish).
4. Continue with steps 8-10 of `up/down.qml`.

Let's use the current 2.3.5 JI subset example:

Assume we configure aux up/down to disregard the syntonic comma accidental chain and only regard the sharps/flats chain.

Then, upon executing 'aux up' on the note `A/`, it should skip all the way to `Gx/`, followed by `Dbbbb/`, `Fxx/`, `Cbb/`, etc... because those are the next nearest `XenNote`s in the `TuningTable` which have an identical syntonic comma accidental. This way, the user can move a note up/down in bigger increments to save time.

We can also make clones `aux2 up/down.qml` etc... which work the same way with individually configurable accidental chains.

### Construction of `TuningTable` & `TuningConfig`

Upon parsing the above example of the 2.3.5 JI subset tuning config, the plugin should generate the `TuningTable`. This contains all permutations of nominals and accidentals within an equave and sort it in ascending pitch order like so:

```csv
NoteName,  cents,  equavesAdjusted
A      ,   0.00c,  0
Dbbbb\\,   0.29c,  0
Gx\    ,   1.95c,  -1
Fxx\\  ,   3.91c,  -1
Bbb//  ,  19.55c,  0
A/     ,  21.51c,  0
Dbbbb\ ,  21.79c,  0
Gx     ,  23.46c,  -1
Cbb\\  ,  23.75c,  0
Fxx\   ,  25.41c,  -1
A//    ,  43.01c,  0
Dbbbb  ,  43.30c,  0
Gx/    ,  44.97c,  -1
Cbb\   ,  45.25c,  0
Fxx    ,  46.92c,  -1
Bb\\   ,  47.21c,  0
Dbbbb/ ,  64.81c,  0
Gx//   ,  66.47c,  -1
Cbb    ,  66.76c,  0
Fxx/   ,  68.43c,  -1
Bb\    ,  68.72c,  0
A#\\   ,  70.67c,  0
Dbbbb//,  86.31c,  0
Cbb/   ,  88.27c,  0
Fxx//  ,  89.93c,  -1
Bb     ,  90.22c,  0
A#\    ,  92.18c,  0
Gx#\\  ,  94.13c,  -1
... etc (see 2.3.5 JI tuning example.csv for all 315 notes)
```

This `TuningTable` is the common resource that exhausts all possible unique spellings of the nominals, and belongs to the `TuningConfig`. It is implemented as a mapping from `XenNote`s to cent offsets.

During the parsing of tuning, the `TuningConfig` needs to index the `TuningTable` several ways so that we can quickly obtain required information in O(1) time.

- `notesTable`: maps `XenNote` string hashes to `XenNote` objects
- `tuningTable`: maps `XenNote` string hashes to cent offsets
- `avTable`: maps `XenNote` string hashes to `AccidentalVector`s
- `stepsList`: a list of collated sets of enharmonic-equivalent `XenNote` string hashes, sorted by increasing pitch
- `stepsLookup`: maps `XenNote` string hashes to the index it appears in the `stepsList`
- `enharmonics`: maps `XenNote` string hashes to enharmonic equivalent `XenNote` string hashes.
- ~~a mapping of cents to note name~~ (no use case yet)

### Behavior of accidentals

Before we can do anything, we need to address how MuseScore handles accidentals.

There are 3 categories of accidentals, and for the sake of this plugin, let's call them:

1. **Fully supported** aka 'full accidentals'
2. **Half supported** aka 'half accidentals'
3. **Symbolic** accidentals

Full accidentals are the result an internal property of the Note element called `tpc` (tonal pitch class), which is a number that ranges from -8 to 40. This represents a cycle of 49 fifths ranging from Fbbb (3ple flat) to Bx# (3ple sharp). Any of these standard accidentals will affect playback in steps of 100 cents as it registers a different MIDI note.

Half accidentals are accidentals that exist in the `accidental` property of the Note element, but they do not affect the `tpc` nor playback, and they are treated like the 'natural' accidental (cancelling all prior accidentals). Only a fraction of SMuFL accidental symbols are available as half-supported accidentals. These accidentals are identifiable with UPPER_CAMEL_CASE IDs.

Symbolic accidentals are accidentals that are from of the `elements` array property of the Note element. This property includes **all** elements attached to the Note head (including articulations & fingering), but accidental symbols will have the `symbol` property set to the SMuFL ID of the symbol. These accidentals are identifiable with lowerCamelCase IDs. E.g. if a note only has one symbol element attached to it, then you can access it with `note.elements[0].symbol`.


Because of this mess, we need to take caution of notes which have non-natural `tpc`s, because we need to account for the fact that fully supported accidentals affect playback.

A half accidental naturalizes any prior accidentals, but a symbolic accidental does not. This means that any prior full accidental will cause a succeeding note with only a symbolic accidental to appear with the same offset applied to the prior full accidental, and we need to account for that.

Thankfully all we need to do is check the `tpc` of each note, and take into account the semitone offsets of the `tpc`. There is no need for handling all edge cases.

### Tokenizing of explicit accidentals

Let's continue the example using the same tuning system as above with two accidental chains, 7 nominals, and tuning note set to A4.

Here's an example of the parsing of `Ebbbb\\4`. Let's assume that the first double flat is a Full Accidental, and the second double flat is a Symbolic Accidental. (You cannot have more than one Full/Half Accidentals on the same note) The double flat is accidental code 6.

Let's also assume that the comma down is the `accidentalArrowDown` SMuFL (Gould arrow) symbol, which looks like an arrow pointing straight down. Let's say it is represented by accidental code 34 (not finalized yet).

Hence, this note's `tpc` is 3 (E double flat), and it has three Symbolic Accidental attached under the `elements` property. In no particular order: double flat, comma down, comma down.

Note that this plugin does not factor the order of appearance of accidentals. That is, `Ebbbb\\` is the same as `E\bb\bb`.

The `readNote()` function 'tokenizes' the MuseScore Note element to output the following `MSNote` object:

```js
// MSNote
{
  tpc: 4, // Ebb is 4
  octaves: 4, // Ebb4 is 4th octave.
  accidentals: {
    6: 2, // two double flats
    34: 2, // two comma downs
  }
}
```

### Tokenizing of implicit accidentals

Let's say immediately after the above `Ebbbb\\` note, we have a `E` with no accidentals.

This note's `tpc` is still 4 (Ebb), because the Full Accidental is still in effect from before. However, it has no explicit accidentals attached to it.

In this situation, we need to check for prior notes in this staff line with explicit accidentals using the `getAccidental` function. This function returns the `accidentals` object of a preceding note with explicit accidentals that affect the current one, or `null` if there are no prior notes with explicit accidentals.

As of now, this plugin does not intend to support the ability to have independently explicit/implicit accidentals per accidental chain. This means that ups and downs notation where prior sharps/flats carry through an up/down accidental will not be supported. If there's enough demand for that, then this feature will be a goal.

### Parsing a note

Once the implicit/explicit accidentals on a `MSNote` has been tokenized. We apply the TuningConfig to calculate the `XenNote` string hash from properties of the `MSNote`.

### Matching of an accidental

Because the `TuningConfig` has a mapping for all `XenNote`s to `AccidentalVector`s, we can simply look that up.

We should obtain the `AccidentalVector` of `[-4,-2]`. Which states that we need to apply -4 apotomes and -2 syntonic commas to the nominal.

## Advanced example: composite accidentals

For proper HEJI and Sagittal notation, we need to take into account that there are combinations of accidentals that can combine into one single symbol.

For example, the sharp and syntonic comma up (ARROW_UP) accidentals can combine into `SHARP_ARROW_UP`.

The solution here is to allow the user to specify a list of ligatures/replacement symbols that apply to specific accidental chains only.

For example, we can have 7-limit JI with 3 accidental chains: apotomes, 5-commas and 7-commas.

In HEJI, there are composite accidental ligatures for compositions of apotomes and 5-commas. The user can append the following text to the Tuning Config text annotation:

```
lig(1,2)
<acc chain 1 amount> <acc chain 2 amount> <acc code>
1 3 23
1 2 24
1 1 25
1 -1 26
1 -2 27
1 -3 28
```

`lig(0,1)` signifies that the plugin should perform search-and-replace for exact matches pertaining to the 1st and 2nd accidental chains (which are apotomes and 5-commas respectively).

This means that if some note has an accidental vector of `[1,3,2]` (sharp + 3 syntonic commas + 2 7-commas), then the plugin will note that, between the 1st and 2nd chains, `1,3` should be notated as accidental code 23 (SHARP_THREE_ARROWS_UP).

Hence, the resulting accidental on the note should be sharp-3-arrows + 7-comma up.

If some obscure tuning system requires more than one ligature declaration between any number of accidental chains, the user can do so by appending more `lig(x,y,z,...)` declarations below.

E.g.:

```
lig(1,2)
...
lig(2,3)
...
lig(1,2,3)
...
```

The ligatures will be searched and replaced in the order of which they are declared.

The above example will first try to find matches between chains 1 and 2. If a match is found, then it will flag that accidental chains 1 and 2 has been replaced with and will no longer search for matches involving chains 1 and 2.

Then, ligatures for chains 2 and 3 will be searched, and any matches will be flagged.

Finally, if nothing has been matched so far, then ligatures involving all 3 chains will be searched.

Though, this is a very extreme example and I can't think of any notation system that requires that much complexity.

## Data Structures

#### `MSNote`

```js
{
  tpc: number, // tpc of note
  octave: number, // octave of note A4 = 4.
  accidentals?: {
    // map of all explicit accidentals attached to this note
    <acc code>: number,
    ...
  }
}
```

Represents a tokenized MuseScore note element.

If no explicit accidentals are present, `accidentals` is null.

#### `AccidentalVector`

```
[<acc chain 1>, <acc chain 2>, ...]
```

A list of the effective accidentals applied in terms of the accidental chains declared in the tuning config.


For example, declare a tuning system with two accidental chains in this order: sharps/flats, up/down.

Then, the `AccidentalVector` of `[2, -3]` represents the degree 2 of the sharps/flat chain (e.g. double sharp) and degree -3 of the arrows chain (e.g. three down arrows).

The n-th number represents the degree of the n-th accidental chain. The order of which the accidental chains are declared/stored determines which number corresponds to which accidental chain.

#### `XenNote`

```js
{
  nominal: number, // no. of nominals away from tuning note (mod equave)
  accidentals?: {
    // map of the effective accidentals required to spell this note.
    <acc code>: number
    <acc code>: number,
    // if a tuning-declared accidental is not present in this note,
    // do not add it
    <unused acc>: 0 // DON'T DO THIS.
    ...
  }
  hash: string, // for lookup purposes
}
```

Think of this as the xen version of 'tonal pitch class'.

This is how the plugin represents a 'microtonal' note, containing data pertaining to how the note should be spelt/represented microtonally.

If `accidentals` is null, represents a nominal of the tuning system (note without accidental).

The `hash` string is to save performance cost of JSON.stringify and acts as a unique identifier for this `XenNote`.

`"<nominal> <acc code> <num> <acc code> <num> ..."`

The accidental codes must appear in increasing order.

For example, the note `A bb d` (1 double flat, 1 mirrored flat) should have the hash string: `"0 6 1 10 1"`.

#### `NotesTable`

```js
{
  'XenNote.hash': XenNote,
  'XenNote.hash', XenNote,
  ...
}
```

Contains a lookup for all unique `XenNote`s in a tuning system.

Maps `XenNote.hash` to `XenNote` object.

#### `AccidentalVectorTable`

```js
{
  'XenNote.hash': AccidentalVector,
  'XenNote.hash': AccidentalVector,
  ...
}
```

Contains a map of `XenNote`s to their respective `AccidentalVector`s.

Note that this mapping is not bijective - two `XenNote`s can have different nominals but the same `AccidentalVector`.

NOTE: There doesn't seem to be a use case for an inverse mapping of this yet. However, if it is required later down the line, that would mean a lot of the implementation has to change. Hmm.

#### `TuningTable`

```js
{
  'XenNote.hash': [number, number], // [cents, equavesAdjusted]
  'XenNote.hash': [number, number],
  ...
}
```

Lookup table for the tuning of `XenNote`s. Entries do not need to be sorted in any particular order as the indexing for pitch sorting is done in `StepwiseList`.

See [2.3.5 JI tuning table.csv](https://github.com/euwbah/musescore-ji-rtt-plugin/blob/master/2.3.5%20JI%20tuning%20table%20example.csv) for an example.

`cents`: the number of cents this note is from tuning note modulo the equave.

`equavesAdjusted`: the number of times this note has to be taken up/down an equave so that its cents mapping will fit modulo the equave.

The equave adjustment has to be kept track of so that notes are tuned with in the correct equave, and stepwise up/down operations use the correct equave for certain notenames.

Look at the above 2.3.5 JI subset tuning for an example. (A4 is the tuning note & equave: 1200 cents.)

Going up stepwise from the note `Dbbbb\\` to `Gx\`, we actually need to lower Gx\ by one equave to actually get the correct next note up.

Similarly, going up stepwise from `Fxx\\` to `Bbb//`, we'll need to increase the equave by 1 so that it sounds in the correct equave.

#### `StepwiseList`

```js
[
  // Groups enharmonically equivalent oredered by ascending pitch
  ['XenNote.hash', 'XenNote.hash', ...],
  ['XenNote.hash', 'XenNote.hash', ...],
  ...
]
```

This list of lists indexes the `XenNote` hashes in order of ascending pitch.

Each list represents 'enharmonically equivalent' `XenNote`s. The stepwise up/down plugins uses this to determine what are the possible spellings of the next stepwise note, and it chooses the best option of enharmonic spelling based on the context (use of implicit accidentals/key signature/minimizing accidentals)

#### `StepwiseLookup`

```js
{
  // Mapping of XenNote to index of StepwiseList
  `XenNote.hash`: number,
  `XenNote.hash`: number,
  ...
}
```

A lookup table for the index of a `XenNote` in the `StepwiseList`. This lookup is used to determine the index of a current note, and the next note up/down is simply the enharmonically equivalent `XenNote`s at index + 1 or index - 1 of `StepwiseList`.

#### `EnharmonicGraph`

```js
{
  'XenNote.hash': 'XenNote.hash',
  'XenNote.hash': 'XenNote.hash',
  ...
}
```

A simple lookup table where `EnharmonicGraph[XenNote]` gives the next enharmonic equivalent spelling of the note, or `null` if there are no other enharmonic equivalents.

This lookup table describes a graph composed of several distinct cyclic directional paths. Each cyclic loop represents enharmonically equivalent notes.

This structure is computed at the same time as the `StepwiseList`.

#### `TuningConfig`

```js
{
  notesTable: NotesTable,
  tuningTable: TuningTable,
  avTable: AccidentalVectorTable,
  stepsList: StepwiseList,
  stepsLookup: StepwiseLookup,
  enharmonics: EnharmonicGraph,
  nominals: [number], // List of cents from tuning note
  numNominals: number, // = nominals.length
  equaveSize: number, // = the last cents value in nominals list
  tuningNote: number, // MIDI note number of tuning note
  tuningFreq: number // Hz of tuning note.
}
```

This is the resulting data structure to be generated after parsing a tuning config staff/system text annotation.


#### `TuningConfigLookup`

```js
{
  'staff/system text string': TuningConfig,
  'staff/system text string': TuningConfig,
  ...
}
```

A lookup for memoized parsed `TuningConfig`s. Because of how the plugin cursor API requires each voice to be tuned separately one at a time, it will cause many unnecessary re-parsings of the same System/Staff Text element.

To prevent unneeded parsings, this lookup maps verbatim system/staff texts to the `TuningConfig` it results in when parsed. Hopefully this would reduce plugin lag.

## Functions

#### `readNote`

Takes in a MuseScore Note element and returns a `MSNote` object.

#### `getAccidental`

Checks the current (or preceding if `before=true`) note for explicit accidentals.
