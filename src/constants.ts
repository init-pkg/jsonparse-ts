// Named constants with unique integer values
export const CONSTANTS = {
  // Tokens
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

  // Tokenizer States
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
  STRING1: 0x61,
  STRING2: 0x62,
  STRING3: 0x63,
  STRING4: 0x64,
  STRING5: 0x65,
  STRING6: 0x66,

  // Parser States
  VALUE: 0x71,
  KEY: 0x72,

  // Parser Modes
  OBJECT: 0x81,
  ARRAY: 0x82,
} as const;

// Character constants
export const CHAR = {
  BACK_SLASH: "\\".charCodeAt(0),
  FORWARD_SLASH: "/".charCodeAt(0),
  BACKSPACE: "\b".charCodeAt(0),
  FORM_FEED: "\f".charCodeAt(0),
  NEWLINE: "\n".charCodeAt(0),
  CARRIAGE_RETURN: "\r".charCodeAt(0),
  TAB: "\t".charCodeAt(0),
} as const;

export const STRING_BUFFER_SIZE = 64 * 1024;
