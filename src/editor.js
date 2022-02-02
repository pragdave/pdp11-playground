let CodeMirror = null;
if (typeof window !== 'undefined' && typeof window.navigator !== 'undefined') {
  CodeMirror  = require("codemirror/lib/codemirror")
  require("codemirror/theme/material-palenight.css")
  require("./editor/pdp11-mode")
}


const REBUILD_AFTER_IDLE_TIME = 350 // mS 

// source-level helpers
//

function octal(n) {
  return n.toString(8).padStart(6, `0`)
}

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

    this.cm = CodeMirror.fromTextArea(elementToUse, {
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

