
// import "codemirror/addon/mode/simple"
// I'm sure there's a better way, but I need to hndle all this inline in the browser,
// so I can't do the import about, because CodeMiddor is not
// defined on the server.
  
function addLanguageInBrowser(CodeMirror) {
  // CodeMirror, copyright (c) by Marijn Haverbeke and others
  // Distributed under an MIT license: https://codemirror.net/LICENSE

  function defineSimpleMode(name, states) {
    CodeMirror.defineMode(name, function(config) {
      return simpleMode(config, states);
    });
  };

  function simpleMode(config, states) {
    ensureState(states, "start");
    var states_ = {}, meta = states.meta || {}, hasIndentation = false;
    for (var state in states) if (state != meta && states.hasOwnProperty(state)) {
      var list = states_[state] = [], orig = states[state];
      for (var i = 0; i < orig.length; i++) {
        var data = orig[i];
        list.push(new Rule(data, states));
        if (data.indent || data.dedent) hasIndentation = true;
      }
    }
    var mode = {
      startState: function() {
        return {state: "start", pending: null,
          local: null, localState: null,
          indent: hasIndentation ? [] : null};
      },
      copyState: function(state) {
        var s = {state: state.state, pending: state.pending,
          local: state.local, localState: null,
          indent: state.indent && state.indent.slice(0)};
        if (state.localState)
          s.localState = CodeMirror.copyState(state.local.mode, state.localState);
        if (state.stack)
          s.stack = state.stack.slice(0);
        for (var pers = state.persistentStates; pers; pers = pers.next)
          s.persistentStates = {mode: pers.mode,
            spec: pers.spec,
            state: pers.state == state.localState ? s.localState : CodeMirror.copyState(pers.mode, pers.state),
            next: s.persistentStates};
        return s;
      },
      token: tokenFunction(states_, config),
      innerMode: function(state) { return state.local && {mode: state.local.mode, state: state.localState}; },
      indent: indentFunction(states_, meta)
    };
    if (meta) for (var prop in meta) if (meta.hasOwnProperty(prop))
      mode[prop] = meta[prop];
    return mode;
  };

  function ensureState(states, name) {
    if (!states.hasOwnProperty(name))
      throw new Error("Undefined state " + name + " in simple mode");
  }

  function toRegex(val, caret) {
    if (!val) return /(?:)/;
    var flags = "";
    if (val instanceof RegExp) {
      if (val.ignoreCase) flags = "i";
      if (val.unicode) flags += "u"
      val = val.source;
    } else {
      val = String(val);
    }
    return new RegExp((caret === false ? "" : "^") + "(?:" + val + ")", flags);
  }

  function asToken(val) {
    if (!val) return null;
    if (val.apply) return val
    if (typeof val == "string") return val.replace(/\./g, " ");
    var result = [];
    for (var i = 0; i < val.length; i++)
      result.push(val[i] && val[i].replace(/\./g, " "));
    return result;
  }

  function Rule(data, states) {
    if (data.next || data.push) ensureState(states, data.next || data.push);
    this.regex = toRegex(data.regex);
    this.token = asToken(data.token);
    this.data = data;
  }

  function tokenFunction(states, config) {
    return function(stream, state) {
      if (state.pending) {
        var pend = state.pending.shift();
        if (state.pending.length == 0) state.pending = null;
        stream.pos += pend.text.length;
        return pend.token;
      }

      if (state.local) {
        if (state.local.end && stream.match(state.local.end)) {
          var tok = state.local.endToken || null;
          state.local = state.localState = null;
          return tok;
        } else {
          var tok = state.local.mode.token(stream, state.localState), m;
          if (state.local.endScan && (m = state.local.endScan.exec(stream.current())))
            stream.pos = stream.start + m.index;
          return tok;
        }
      }

      var curState = states[state.state];
      for (var i = 0; i < curState.length; i++) {
        var rule = curState[i];
        var matches = (!rule.data.sol || stream.sol()) && stream.match(rule.regex);
        if (matches) {
          if (rule.data.next) {
            state.state = rule.data.next;
          } else if (rule.data.push) {
            (state.stack || (state.stack = [])).push(state.state);
            state.state = rule.data.push;
          } else if (rule.data.pop && state.stack && state.stack.length) {
            state.state = state.stack.pop();
          }

          if (rule.data.mode)
            enterLocalMode(config, state, rule.data.mode, rule.token);
          if (rule.data.indent)
            state.indent.push(stream.indentation() + config.indentUnit);
          if (rule.data.dedent)
            state.indent.pop();
          var token = rule.token
          if (token && token.apply) token = token(matches)
          if (matches.length > 2 && rule.token && typeof rule.token != "string") {
            for (var j = 2; j < matches.length; j++)
              if (matches[j])
                (state.pending || (state.pending = [])).push({text: matches[j], token: rule.token[j - 1]});
            stream.backUp(matches[0].length - (matches[1] ? matches[1].length : 0));
            return token[0];
          } else if (token && token.join) {
            return token[0];
          } else {
            return token;
          }
        }
      }
      stream.next();
      return null;
    };
  }

  function cmp(a, b) {
    if (a === b) return true;
    if (!a || typeof a != "object" || !b || typeof b != "object") return false;
    var props = 0;
    for (var prop in a) if (a.hasOwnProperty(prop)) {
      if (!b.hasOwnProperty(prop) || !cmp(a[prop], b[prop])) return false;
      props++;
    }
    for (var prop in b) if (b.hasOwnProperty(prop)) props--;
    return props == 0;
  }

  function enterLocalMode(config, state, spec, token) {
    var pers;
    if (spec.persistent) for (var p = state.persistentStates; p && !pers; p = p.next)
      if (spec.spec ? cmp(spec.spec, p.spec) : spec.mode == p.mode) pers = p;
    var mode = pers ? pers.mode : spec.mode || CodeMirror.getMode(config, spec.spec);
    var lState = pers ? pers.state : CodeMirror.startState(mode);
    if (spec.persistent && !pers)
      state.persistentStates = {mode: mode, spec: spec.spec, state: lState, next: state.persistentStates};

    state.localState = lState;
    state.local = {mode: mode,
      end: spec.end && toRegex(spec.end),
      endScan: spec.end && spec.forceEnd !== false && toRegex(spec.end, false),
      endToken: token && token.join ? token[token.length - 1] : token};
  }

  function indexOf(val, arr) {
    for (var i = 0; i < arr.length; i++) if (arr[i] === val) return true;
  }

  function indentFunction(states, meta) {
    return function(state, textAfter, line) {
      if (state.local && state.local.mode.indent)
        return state.local.mode.indent(state.localState, textAfter, line);
      if (state.indent == null || state.local || meta.dontIndentStates && indexOf(state.state, meta.dontIndentStates) > -1)
        return CodeMirror.Pass;

      var pos = state.indent.length - 1, rules = states[state.state];
      scan: for (;;) {
        for (var i = 0; i < rules.length; i++) {
          var rule = rules[i];
          if (rule.data.dedent && rule.data.dedentIfLineStart !== false) {
            var m = rule.regex.exec(textAfter);
            if (m && m[0]) {
              pos--;
              if (rule.next || rule.push) rules = states[rule.next || rule.push];
              textAfter = textAfter.slice(m[0].length);
              continue scan;
            }
          }
        }
        break;
      }
      return pos < 0 ? 0 : state.indent[pos];
    };
  }

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


  defineSimpleMode(`pdp11`, {
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
}

// END OF DEFINE LANGUAGE

const REBUILD_AFTER_IDLE_TIME = 350 // mS 

// source-level helpers
//

  function join(args) {
    return args
      .map(a => a.trim())
      .join(`\t`)
      .trimEnd()
  }

function wrapInDiv(txt, cls1, cls2) {
  const div = document.createElement(`div`)
  if (cls1) div.classList.add(cls1)
  if (cls2) div.classList.add(cls2)
  div.textContent = txt
  return div
}

function optionalComment(line) {
  return line.comment || ``
}

function tokens(toks) {
  return toks.map(t => t.text).join(``)
}

function labels(labs) {
  return labs.join(`\n`)
}


// We put generated code in the gutters...

  function mapAssemblerToEditor(ass) {
    const result = [ ]

    ass.sourceLines.forEach((line, lno) => {
      const edline = { }

      switch (line.type) {
        case `BlankLine`:
          edline.text = line.comment || ``
          break

        case `AssignmentLine`:
          edline.text = join([ line.symbol, `=`, tokens(line.rhs), optionalComment(line) ])
          populateValue(edline, line.value)
          break

        case `CodegenLine`:
          // eslint-disable-next-line max-len
          edline.text = join([ labels(line.labels), line.opcode, tokens(line.rhs), optionalComment(line) ])
          populateGeneratedCode(edline, line)
          break

        case `JustLabelsLine`:
          // eslint-disable-next-line max-len
          edline.text = join([ labels(line.labels), optionalComment(line) ])
          populateGeneratedCode(edline, line)
          break

        case `ErrorLine`:
          edline.text = line.lineText
          break

        default:
          throw new Error(`unhandled line type ${line.type}`)
      }

      result[lno] = edline
    })
    return result
  }

function intoWords(code, address) {
  if (!code)
    return []

  const words = []
  const len = code.length
  let index = 0

  if ((address & 1) === 1 && index < len)
    words.push(code[index++] << 8)

  while (index < len - 1) {
    words.push(code[index + 1] << 8 | code[index])
    index += 2
  }

  if (index < len) 
    words.push(code[index])

  return words
}

function populateGeneratedCode(edline, line) {
  edline.address = line.address
  const words = intoWords(line.generatedBytes, line.address)
  edline.inThrees = [ [], [], [] ]
  edline.lineCount = Math.floor((words.length + 2) / 3)

  words.forEach((word, i) => {
    edline.inThrees[i % 3].push(word)
  })


}

function populateValue(edline, value) {
  edline.value = value
}

//////////////////////////////////////////////////////////////////////

  export class Editor {
    constructor(context, elementToUse) {

      this.context = context

      this.mappedSource = {}
      this.markers = []
      this.widgets = []
      this.memoryByAddress = {}
      this.breakpoints = {}

      addLanguageInBrowser(window.CodeMirror)

      this.cm = window.CodeMirror.fromTextArea(elementToUse, {
        gutters:        [ `g-margin`, `g-address`, `g-w0`, `g-w1`, `g-w2`],
        indentWithTabs: true,
        lineNumbers:    true,
        mode:           `pdp11`,
        singleCursorHeightPerLine: true,
        tabSize:        8,
        theme:          `material-palenight`,
      })

      this.cm.on(`renderLine`, (_editor, line, element) => {
        this.handleRenderLine(line, element)
      })

      this.cm.on(`changes`, (_editor, _changes) => {
        this.triggerRebuild()   // handle locally, because we throttle reassembly
      })

      this.cm.on(`gutterClick`, (editor, line, target, ev) => {
        this.gutterClick(editor, line, target, ev)
      })

      this.cm.setValue(this.context.source)
      window.Editor = this
    }

    // onChanged(parentCallback) {
      //   this.parentCallback = parentCallback
      // }

    reset() {
      console.info(`editor reset`)
    }


    redrawOnNumberFormatChange() {
      this.updateGutter()
    }

    updateMemory({ memory_accesses: accesses, memory }) {
      for (let addr of Object.keys(accesses)) {
        let el = this.memoryByAddress[addr]
        if (!el) {
          el = document.getElementsByClassName(`M${addr}`)[0]
          if (!el)
            el = `not shown`
          this.memoryByAddress[addr] = el
        }
        if (el !== `not shown`) {
          el.classList.add(accesses[addr])
          el.textContent = this.context.fmt(memory.getWord(addr), /*audit=*/ false)
        }
      }
    }


    // set the line height based on the number of generated words
    handleRenderLine(line, element) {
      let lno = this.cm.getLineNumber(line)
      const ms = this.mappedSource[lno]

      if (ms && ms.lineCount > 1) {
        element.style.height = `${ms.lineCount * 0.8}em`
      }
    }

    // Rebuild at most once every x ms
    triggerRebuild() {
      if (this.rebuildTimer)
        clearTimeout(this.rebuildTimer)

      this.rebuildTimer = setTimeout(() => {
        this.rebuildTimer = null
        this.context.setSource(this.cm.getValue())
        this.sourceHasBeenRebuilt()
      }, REBUILD_AFTER_IDLE_TIME)
    }

    sourceHasBeenRebuilt() {
      this.memoryByAddress = {}
      this.clearErrorLines()
      this.mappedSource = mapAssemblerToEditor(this.context.build)
      this.addInErrorLines()
      this.updateGutter()
    }

    addInErrorLines() {
      const assembled = this.context.build
      if (assembled.errorCount > 0) {
        assembled.sourceLines.forEach((line, lno) => {
          if (line.type === `ErrorLine`) {
            this.addErrorTo(this.cm, line, lno)
          }
        })
      }
    }

    putErrorBelow(line, message, className) {
      const error = document.createElement(`div`)
      error.innerText = message
      this.widgets.push(this.cm.addLineWidget(line, error, { className }))
    }

    addErrorTo(editor, errorLine, lno) {
      this.putErrorBelow(lno, errorLine.message, `line-error`)

      const line = lno - 1
      const start = errorLine.col - 1
      const end = start + (errorLine.symText ? errorLine.symText.length : 1)
      this.markers.push(editor.markText(
        { line, ch: start }, 
        { line, ch: end }, 
        { className: `symbol-in-error` }
      ))
    }


    findLineForAddress(address) {
      return this.mappedSource.findIndex(line => line.address === address)
    }

    highlightCurrentInstruction(address, useClass = `current-executing-line`) {
      const lno = this.findLineForAddress(address)
      if (this.lastExecutingLine) 
        this.cm.doc.removeLineClass(this.lastExecutingLine, `wrap`, `current-executing-line`)

      this.cm.doc.addLineClass(lno, `wrap`, useClass)
      this.lastExecutingLine = lno
    }

    addEmulatorErrorTo({ pc, message }) {
      const lno = this.emulatorErrorLine = this.findLineForAddress(pc)
      this.cm.doc.addLineClass(lno, `wrap`, `machine-error-line-source`)
      this.putErrorBelow(lno, message, `machine-error-line-message`)
    }

    clearAnyEmulatorErrors() {
      const lno = this.emulatorErrorLine
      if (lno) {
        this.cm.doc.removeLineClass(lno, `wrap`, `machine-error-line-source`)
        this.clearErrorLines()
        this.emulatorErrorLine = null
      }
    }


    generatedCodeInGutter(lno, edline) {
      const columns = edline.inThrees.map((col, colNo) => {
        const marker = document.createElement(`div`)
        col.forEach((w, rowNo) => {
          marker.appendChild(wrapInDiv(this.context.fmt(w), `M${edline.address + colNo * 2 + rowNo * 2 * 3}`))
        })

        return marker
      })

      if (columns) {
        for (let i = 0; i < 3; i++)
          this.cm.doc.setGutterMarker(lno, `g-w${i}`, columns[i])
      }
    }

    updateGutter() {
      this.mappedSource.forEach((ms, lno) => {
        const addr = ms.address
        if (addr) {
          this.cm.doc.setGutterMarker(lno, `g-address`, wrapInDiv(`${this.context.fmt(addr)}:`, `g-address-elt`))
          this.generatedCodeInGutter(lno, ms)
        }
        else if (ms.value) {
          const val = wrapInDiv(this.context.fmt(ms.value), `expression-value`)
          this.cm.doc.setGutterMarker(lno, `g-w2`, val)
        }

      })

    }

    breakpointSetAt(address) {
      return address in this.breakpoints
    }

    setBreakpointIndicator(lno, state) {
      if (state)
        this.cm.doc.addLineClass(lno, `gutter`, state)
      else
        this.cm.doc.removeLineClass(lno, `gutter`)
    }

    toggleBreakpoint(line, address) {
      if (this.breakpoints[address]) {
        delete this.breakpoints[address]
        this.setBreakpointIndicator(line, null)
      }
      else {
        this.breakpoints[address] = line
        this.setBreakpointIndicator(line, `breakpoint-set`)
      }
    }

    gutterClick(_editor, line, gutter, _event) {
      if (gutter === `CodeMirror-linenumbers`) {
        const sourceLine = this.mappedSource[line]
        if (sourceLine && sourceLine.address)
          this.toggleBreakpoint(line, sourceLine.address)
      }
    }

    clearErrorLines() {
      this.widgets.forEach(w => w.clear())
      this.widgets = []
      this.markers.forEach(m => m.clear())
      this.markers = []
    }

    refresh() {
      this.cm.refresh()
    }
  }

