import { EditorView, Decoration, gutter, GutterMarker, keymap,
         lineNumbers, drawSelection, highlightSpecialChars } from "@codemirror/view"
import { EditorState, StateField } from "@codemirror/state"
import {defaultKeymap} from "@codemirror/commands"
import { assemble } from "pdp11-assembler-emulator"

import { Macro11 } from "./lang-pdp11"
import { json } from "@codemirror/lang-json"
import {tags} from "@lezer/highlight"
import {HighlightStyle, syntaxHighlighting} from "@codemirror/language"

const myHighlightStyle = HighlightStyle.define([
  {tag: tags.keyword, color: "#fc6"},
  {tag: tags.comment, color: "#f5d", fontStyle: "italic"}
])

function hex6(n) { return n.toString(16).padStart(6, "0") }

const BYTES_PER_LINE = 3

class AssemblyMarker extends GutterMarker {
  constructor(address, bytes) {
    super()
    this.address = address
    this.bytes = bytes
  }
  eq(other) {
    return this.address == other.address && this.bytes.length == other.bytes.length &&
      other.bytes.every((b, i) => b == this.bytes[i])
  }
  toDOM() {
    let result = document.createElement("div")
    result.className = "line-assembly"
    let addr = result.appendChild(document.createElement("span"))
    addr.textContent = hex6(this.address) + ": "
    addr.className = "line-address"
    let bytes = result.appendChild(document.createElement("span"))
    let byteText = ""
    for (let i = 0; i < this.bytes.length; i++) {
      if (i) byteText += i % BYTES_PER_LINE ? " " : "\n"
      byteText += hex6(this.bytes[i])
    }
    bytes.textContent = byteText
    bytes.className = "line-bytes"
    return result
  }
}

const dummyMarker = new AssemblyMarker(0, [0, 0, 0])

const assemblyGutter = gutter({
  class: "assembly-gutter",
  markers: view => view.state.field(assemblyState).gutterMarkers,
  initialSpacer: () => dummyMarker
})

const gutterTheme = EditorView.baseTheme({
  ".line-assembly": {
    fontFamily: "monospace",
    fontSize: "80%",
    display: "flex",
    alignItems: "flex-start"
  },
  ".line-address": {
    color: "#66f"
  },
  ".line-bytes": {
    whiteSpace: "pre"
  }
})

const assemblyState = StateField.define({
  create(state) {
    return AssemblyState.for(state.doc)
  },
  update(prev, tr) {
    return tr.docChanged ? AssemblyState.for(tr.newDoc) : prev
  }
})

const lineSpacers = EditorView.decorations.from(assemblyState, state => state.spacers)

class AssemblyState {
  constructor(gutterMarkers, spacers) {
    this.gutterMarkers = gutterMarkers
    this.spacers = spacers
  }

  static for(doc) {
    let assembled = assemble(doc.toString())
    let gutterMarkers = [], spacers = []
    let pos = 0, i = 0
    for (let lineText of doc.iterLines()) {
      let sourceLine = assembled.sourceLines[i++]
      if (!sourceLine) break
      if (sourceLine.address != null) {
        gutterMarkers.push(new AssemblyMarker(sourceLine.address, sourceLine.generatedBytes).range(pos))
        let height = Math.ceil(sourceLine.generatedBytes.length / BYTES_PER_LINE)
        if (height > 1) {
          // FIXME get accurate height?
          spacers.push(Decoration.line({attributes: {style: `padding-bottom: ${height - 1}em`}}).range(pos))
        }
      }
      pos += lineText.length + 1
    }
    return new AssemblyState(Decoration.set(gutterMarkers), Decoration.set(spacers))
  }

  static empty = new AssemblyState(Decoration.none, Decoration.none)
}

function displayAssembly() {
  return [assemblyGutter, gutterTheme, assemblyState, lineSpacers]
}

export class Editor {
  constructor(context) {
    this.context = context
  debugger
    this.view = new EditorView({
      doc: this.context.source,
      extensions: [
        // keymap.of(defaultKeymap),
        // drawSelection(),
        // highlightSpecialChars(),
        // // displayAssembly(),
        // lineNumbers(),
        syntaxHighlighting(myHighlightStyle),
      ],
      parent: document.getElementById("edit-wrapper")
    })
  }
}
