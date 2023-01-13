// MUST USE ES5 SYNTAX FOR MSCORE COMPAT.

// Export function to be retrieved by Qt.include()
// MuseScore plugin api is a mess...
function ImportLookup() {

    var Generated = ImportGenerated();

    /**
    Lookup table for mapping SymbolCode number to 
    musescore's internal accidental names and accidental symbol names.
    
    Note: this is a one-to-many lookup table, as there are multiple symbols/accidentals
    that look alike but have different internal representations. This plugin
    should treat identical looking accidentals all the same.
    
    All caps are accidental names (the string value of Note.accidentalType)
    Non caps are symbol names (string value of Element.symbol)
    
    E.g. CODE_TO_LABELS[2] contains all the possible accidental names/symbol names
    that represent the sesquisharp (#+) accidental.
    
    Whenever 'accidentalID' is used in code, it refers to the index of the
    accidental in this array.
    
    To be kept updated with: https://docs.google.com/spreadsheets/d/1kRBJNl-jdvD9BBgOMJQPcVOHjdXurx5UFWqsPf46Ffw/edit?usp=sharing
    */
    var CODE_TO_LABELS = Generated.CODE_TO_LABELS;

    /**
     * The inverse many-to-one mapping of the above CODE_TO_LABELS array.
     * 
     * Maps internal labels/IDs to SymbolCode number.
     */
    var LABELS_TO_CODE = (function () {
        var mapping = {};
        // start from 1. 0 is null.
        for (var i = 1; i < CODE_TO_LABELS.length; i++) {
            for (var j = 0; j < CODE_TO_LABELS[i].length; j++)
                mapping[CODE_TO_LABELS[i][j]] = i;
        }
        Object.freeze(mapping);
        return mapping;
    })();

    /**
     * Mapping of Text Codes to SymbolCode.
     * 
     * To be kept updated with https://docs.google.com/spreadsheets/d/1kRBJNl-jdvD9BBgOMJQPcVOHjdXurx5UFWqsPf46Ffw/edit?usp=sharing
     * 
     * (For inputting symbols via text representation)
     */

    var TEXT_TO_CODE = Generated.TEXT_TO_CODE;

    /**
     * Mapping of 12EDO note letters to nominals from A.
     */
    var LETTERS_TO_NOMINAL = {
        'a': 0,
        'b': 1,
        'c': 2,
        'd': 3,
        'e': 4,
        'f': 5,
        'g': 6
    };

    /**
     * Mapping of SymId/AccidentalType string to [PosX, PosY, SizeX, SizeY] layout settings
     * 
     * If Symbol is not in this lookup, default layout settings are used.
     */
    var SYMBOL_LAYOUT = Generated.SYMBOL_LAYOUT;

    /**
     * Mapping of 12EDO note letters to semitones from A.
     * (A is the reference note which the octave is based on).
     */
    var LETTERS_TO_SEMITONES = {
        'a': 0,
        'b': 2,
        'c': -9,
        'd': -7,
        'e': -5,
        'f': -4,
        'g': -2
    };

    /**
     * Mapping from 12edo TPCs to a [nominals, midiOctaveOffset] tuple.
     * 
     * Used in conjuction with Note.pitch to calculate `nominalsFromA4` 
     * property of MSNote.
     * 
     * nominals: 
     *      0-6, representing A, B, C, ...
     * 
     * midiOctaveOffset: 
     *      represents the number of octaves to add/sub when calculating octaves
     *      using its MIDI note because the MIDI pitch of this TPC will appear
     *      to be in a different octave if it has accidentals.
     *      
     *      In these calculations, the 12edo octave is considered to reset
     *      on the note A. (A4 = 0th octave, G4 = -1st octave)
     */
    var TPC_TO_NOMINAL = (function () {
        var x = {};
        x[-8] = [5, 0]; // Fbbb
        x[-7] = [2, 0]; // Cbbb
        x[-6] = [6, 0]; // Gbbb
        x[-5] = [3, 0]; // Dbbb
        x[-4] = [0, 1]; // Abbb
        x[-3] = [4, 0]; // Ebbb
        x[-2] = [1, 1]; // Bbbb

        x[-1] = [5, 0]; // Fbb
        x[0] = [2, 0]; // Cbb
        x[1] = [6, 0]; // Gbb
        x[2] = [3, 0]; // Dbb
        x[3] = [0, 1]; // Abb
        x[4] = [4, 0]; // Ebb
        x[5] = [1, 0]; // Bbb

        x[6] = [5, 0]; // Fb
        x[7] = [2, 0]; // Cb
        x[8] = [6, 0]; // Gb
        x[9] = [3, 0]; // Db
        x[10] = [0, 1]; // Ab
        x[11] = [4, 0]; // Eb
        x[12] = [1, 0]; // Bb

        x[13] = [5, 0]; // F
        x[14] = [2, 0]; // C
        x[15] = [6, 0]; // G
        x[16] = [3, 0]; // D
        x[17] = [0, 0]; // A
        x[18] = [4, 0]; // E
        x[19] = [1, 0]; // B

        x[20] = [5, 0]; // F#
        x[21] = [2, 0]; // C#
        x[22] = [6, 0]; // G#
        x[23] = [3, 0]; // D#
        x[24] = [0, 0]; // A#
        x[25] = [4, 0]; // E#
        x[26] = [1, 0]; // B#

        x[27] = [5, 0]; // Fx
        x[28] = [2, 0]; // Cx
        x[29] = [6, -1]; // Gx
        x[30] = [3, 0]; // Dx
        x[31] = [0, 0]; // Ax
        x[32] = [4, 0]; // Ex
        x[33] = [1, 0]; // Bx

        x[34] = [5, 0]; // Fx#
        x[35] = [2, 0]; // Cx#
        x[36] = [6, -1]; // Gx#
        x[37] = [3, 0]; // Dx#
        x[38] = [0, 0]; // Ax#
        x[39] = [4, 0]; // Ex#
        x[40] = [1, 0]; // Bx#
        return x;
    })();


    return {
        CODE_TO_LABELS: CODE_TO_LABELS,
        LABELS_TO_CODE: LABELS_TO_CODE,
        TEXT_TO_CODE: TEXT_TO_CODE,
        LETTERS_TO_NOMINAL: LETTERS_TO_NOMINAL,
        LETTERS_TO_SEMITONES: LETTERS_TO_SEMITONES,
        TPC_TO_NOMINAL: TPC_TO_NOMINAL,
    };
}