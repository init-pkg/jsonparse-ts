// Tokens
export const TOKENS = {
    LEFT_BRACE: 0x1,
    RIGHT_BRACE: 0x2,
    LEFT_BRACKET: 0x3,
    RIGHT_BRACKET: 0x4,
    COLON: 0x5,
    COMMA: 0x6,
    TRUE: 0x7,
    FALSE: 0x8,
    NULL: 0x9,
    STRING: 0xa,
    NUMBER: 0xb,
} as const


// Tokenizer States
export const TOKENIZER_STATES = {
    START: 0x11,
    STOP: 0x12,
    TRUE1: 0x21,
    TRUE2: 0x22,
    TRUE3: 0x23,
    FALSE1: 0x31,
    FALSE2: 0x32,
    FALSE3: 0x33,
    FALSE4: 0x34,
    NULL1: 0x41,
    NULL2: 0x42,
    NULL3: 0x43,
    NUMBER1: 0x51,
    NUMBER3: 0x53,
    STRING1: 0x61, // After open quote
    STRING2: 0x62, // After backslash
    // unicode hex codes
    STRING3: 0x63,
    STRING4: 0x64,
    STRING5: 0x65,
    STRING6: 0x66,
} as const;

// Parser States
export const PARSER_STATES = {
    VALUE: 0x71,
    KEY: 0x72,
    COLON: 0x3a, // :
    COMMA: 0x2c, // ,
} as const

// Parser Modes
export const PARSER_MODES = {
    OBJECT: 0x81,
    ARRAY: 0x82,
} as const

// Character constants
export const CHARS = {
    BACKSLASH: 0x5c, // '\'
    FORWARD_SLASH: 0x2f, // '/'
    BACKSPACE: 0x8, // \b
    FORM_FEED: 0xc, // \f
    NEWLINE: 0xa, // \n
    CARRIAGE_RETURN: 0xd, // \r
    TAB: 0x9, // \t
    SPACE: 0x20, // ' '


    LEFT_BRACE: 0x7b, // {
    RIGHT_BRACE: 0x7d, // }
    LEFT_BRACKET: 0x5b, // [
    RIGHT_BRACKET: 0x5d, // ]
    COLON: 0x3a, // :
    COMMA: 0x2c, // ,

    QUOTE: 0x22, // "
    MINUS: 0x2d, // -
    PLUS: 0x2b, // +

    DOT: 0x2e, // .
    E: 0x65, // e
    BIG_E: 0x45, // E

    T: 0x74, // t
    F: 0x66, // f
    N: 0x6e, // n
    L: 0x6c, // l
    S: 0x73, // s

    B: 0x62, // b (Backspace)
    R: 0x72, // r (Carriage Return)
    U: 0x75, // u (Unicode sequence start)

    A: 0x61, // a

    BIG_A: 0x41, // A
    BIG_F: 0x46, // F

    ZERO: 0x30, // 0
    NINE: 0x39, // 9

    WHITESPACES: [
        0x20, // ' '
        0x9, // \t
        0xa, // \n
        0xd, // \r
    ] as number[]
} as const;

export const UTF8_BOUNDS = {
    MIN_MULTI_BYTE: 128,
    INVALID_LOWER: 193,
    BYTE_2_MIN: 194,
    BYTE_2_MAX: 223,
    BYTE_3_MIN: 224,
    BYTE_3_MAX: 239,
    BYTE_4_MIN: 240,
    BYTE_4_MAX: 244,

    HIGH_SURROGATE_START: 0xD800,
    HIGH_SURROGATE_END: 0xDBFF,
    LOW_SURROGATE_START: 0xDC00,
    LOW_SURROGATE_END: 0xDFFF,
} as const;

export const STRING_BUFFER_SIZE = 64 * 1024;
