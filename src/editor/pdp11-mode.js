//  So... we hve to defer defining the mode until runtime
//  which is an ugly hack in CodeMirror.
// Here we just export that things the runtime needs

const opcode_names =
  `\\b(?:` +
  `adc|adcb|add|ash|ashc|asl|aslb|asr|asrb|bcc|bcs|beq|bge|bgt|bhi|` +
  `bhis|bic|bicb|bis|bisb|bit|bitb|ble|blo|blos|blt|bmi|bne|bpl|bpt|br|` +
  `bvc|bvs|ccc|clc|cln|clr|clrb|clv|clz|cmp|cmpb|com|comb|dec|decb|div|` +
  `emt|halt|inc|incb|iot|jmp|jsr|mfpd|mfpi|mfps|mov|movb|mtpd|mtpi|mtps|mul|` +
  `neg|negb|nop|reset|rol|rolb|ror|rorb|rti|rts|sbc|sbcb|scc|sec|sen|sev|` +
  `sez|sob|Asub|swab|sxt|trap|tst|tstb|wait|xor` +
  `)\\b`


const opcodes = new RegExp(opcode_names, `i`)

const register           = `(r[0-7]|sp|pc)\\b`
const register_autoinc   = `\\(${register}\\)\\+`
const register_autodec   = `-\\(${register}\\)`

const base_register      = `(${register_autodec})|(${register_autoinc})|(${register})`
const register_deferred1 = `\\(${register}\\)`
const register_all       =
        `\\b(@?${base_register})|(${register_deferred1})\\b`

export const mode_name = 'pdp11'
export const mode_def = {
  start: [

    {
      regex: /(\.asci[iz])(\s*)(.)(.*?\3)/,
      token: [ "keyword", null, "string", "string" ]
    },

    {
      regex: new RegExp(register_all),
      token: `builtin`,
    },

    { 
      regex: opcodes,
      token: `keyword`,
    },
    
    { 
      regex: /(:?\^O)?[0-7]+/i,
      token: `number`,
    },

    { 
      regex: /(:?\^B)[01]+/i,
      token: `number`,
    },

    { 
      regex: /(:?\^D)[0-9]+/i,
      token: `number`,
    },

    { 
      regex: /(:?\^X)[0-9A-F]+/i,
      token: `number`,
    },

    {
      regex: /[-+*/!&]|-?\(|\)\+?/,
      token: `operator`,
    },

    {
      regex: /\.\w+/,
      token: `keyword`,
    },

    {
      regex: /;.*/, 
      token: `comment`,
    },

    {
      regex: /[a-z0-9$.]+:/,
      token: `label`,
    },

    {
      regex: /#[a-z][a-z0-9$.]*/,
      token: `name`,
    },

    {
      regex: /[a-z0-9$.]+/,
      token: `variable`,
    },

    { 
      regex: /"..|'./, 
      token: `string`, 
    },
  ], 

  meta: {
    dontIndentStates: [`comment`],
    lineComment: `;`,
  },
}

