const languages =
  `\\b(?:` +
  `adc|adcb|add|ash|ashc|asl|aslb|asr|asrb|bcc|bcs|beq|bge|bgt|bhi|` +
  `bhis|bic|bicb|bis|bisb|bit|bitb|ble|blo|blos|blt|bmi|bne|bpl|bpt|br|` +
  `bvc|bvs|ccc|clc|cln|clr|clrb|clv|clz|cmp|cmpb|com|comb|dec|decb|div|` +
  `emt|halt|inc|incb|iot|jmp|jsr|mfpd|mfpi|mfps|mov|movb|mtpd|mtpi|mtps|mul|` +
  `neg|negb|nop|reset|rol|rolb|ror|rorb|rti|rts|sbc|sbcb|scc|sec|sen|sev` +
  `sez|sob|Asub|swab|sxt|trap|tst|tstb|wait|xor` +
  `)\\b`


const opcodes = new RegExp(languages, `i`)

Prism.languages.pdp11 = {
  comment: /;.*/,

  register: {
    pattern: /\b(:?r[0-7])|sp|pc\b/i,
  },

  'directive': {
    pattern: /\.\w+(?= )/,
    alias: `keyword`,
  },

  'opcode': {
    pattern: opcodes,
    alias: `keyword`,
  },

  operator: {
    pattern: /[-+*/!&]|-?\(|\)\+?/,
  },

  label: {
    pattern: /[a-z0-9$.]+:/,
  },

  symbol: {
    pattern: /[a-z0-9$.]+/,
  },

  'octalnumber': {
    pattern: /(:?\^O)?[0-7]+/i,
    alias: `number`,
  },

  'binarynumber': {
    pattern: /(:?\^B)?[01]+/i,
    alias: `number`,
  },

  'decimalnumber': {
    pattern: /(:?\^D)?[0-9]+/i,
    alias: `number`,
  },

  'characterconstant': {
    pattern: /'./,
    alias: `number`,
  },

  'twocharconstant': {
    pattern: /"../,
    alias: `number`,
  },

}

