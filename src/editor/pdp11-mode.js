/* Example definition of a simple mode that understands a subset of
 * JavaScript:
 */

import CodeMirror from "codemirror/lib/codemirror"
import "codemirror/addon/mode/simple"

// Prism.languages.pdp11 = {


//   'opcode': {
//     pattern: opcodes,
//     alias: `keyword`,
//   },

// cm-s-abcdef span.cm-keyword { color: darkgoldenrod; font-weight: bold; }
// .cm-s-abcdef span.cm-atom { color: #77F; }
// .cm-s-abcdef span.cm-number { color: violet; }
// .cm-s-abcdef span.cm-def { color: #fffabc; }
// .cm-s-abcdef span.cm-variable { color: #abcdef; }
// .cm-s-abcdef span.cm-variable-2 { color: #cacbcc; }
// .cm-s-abcdef span.cm-variable-3, .cm-s-abcdef span.cm-type { color: #def; }
// .cm-s-abcdef span.cm-property { color: #fedcba; }
// .cm-s-abcdef span.cm-operator { color: #ff0; }
// .cm-s-abcdef span.cm-comment { color: #7a7b7c; font-style: italic;}
// .cm-s-abcdef span.cm-string { color: #2b4; }
// .cm-s-abcdef span.cm-meta { color: #C9F; }
// .cm-s-abcdef span.cm-qualifier { color: #FFF700; }
// .cm-s-abcdef span.cm-builtin { color: #30aabc; }
// .cm-s-abcdef span.cm-bracket { color: #8a8a8a; }
// .cm-s-abcdef span.cm-tag { color: #FFDD44; }
// .cm-s-abcdef span.cm-attribute { color: #DDFF00; }
// .cm-s-abcdef span.cm-error { color: #FF0000; }
// .cm-s-abcdef span.cm-header { color: aquamarine; font-weight: bold; }
// .cm-s-abcdef span.cm-link { color: blueviolet; }


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


CodeMirror.defineSimpleMode(`pdp11`, {
  start: [
    { 
      regex: /"..|'./, 
      token: `string`, 
    },

    {
      regex: /\b(:?r[0-7])|sp|pc\b/i,
      token: `atom`,
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
      regex: /[-+*/!&]|-?\(|\)\+?/,
      token: `operator`,
    },

    {
      regex: /\.\w+/,
      token: `def`,
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
      regex: /[a-z0-9$.]+/,
      token: `variable`,
    },

  ], 

  meta: {
    dontIndentStates: [`comment`],
    lineComment: `;`,
  },
})

