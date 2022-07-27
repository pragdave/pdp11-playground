import { Context } from "./context"

import { EditorView, Decoration, DecorationSet, gutter, GutterMarker, keymap,
         lineNumbers, drawSelection, highlightSpecialChars } from "@codemirror/view"
import { EditorState, StateField, Text } from "@codemirror/state"
import {defaultKeymap} from "@codemirror/commands"
import { assemble } from "pdp11-assembler-emulator"

import { Macro11 } from "./lang-pdp11/index"
import { classHighlighter} from "@lezer/highlight"
import {syntaxHighlighting} from "@codemirror/language"

// const myHighlightStyle = HighlightStyle.define([
//   {tag: tags.keyword, color: "#fc6"},
//   {tag: tags.comment, color: "#f5d", fontStyle: "italic"}
// ])

function hex6(n) { return n.toString(16).padStart(6, "0") }

const BYTES_PER_LINE = 3


function bytesIntoWords(address: number, bytes: number[]) {
  if (!bytes)
    return []

  const words = []
  const len = bytes.length
  let index = 0

  if ((address & 1) === 1 && index < len)
    words.push(bytes[index++] << 8)

  while (index < len - 1) {
    words.push(bytes[index + 1] << 8 | bytes[index])
    index += 2
  }

  if (index < len) 
    words.push(bytes[index])

  return words
}


class AssemblyMarker extends GutterMarker {

  constructor(public address: number, public bytes: number[]) {
    super()
  }

  eq(other: AssemblyMarker) {
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
    bytes.className = "line-bytes"
    const wordText: string[] = []

    let words = bytesIntoWords(this.address, this.bytes)
    words.forEach((word, i) => {
      wordText.push(hex6(word))
      wordText.push(i % BYTES_PER_LINE ? " " : "\n")
    })

    bytes.textContent = wordText.join("")
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
  create(state: EditorState) {
    return AssemblyState.for(state.doc)
  },
  update(prev, tr) {
    return tr.docChanged ? AssemblyState.for(tr.newDoc) : prev
  }
})

const lineSpacers = EditorView.decorations.from(assemblyState, state => state.spacers)


class AssemblyState {
  gutterMarkers: DecorationSet
  spacers: DecorationSet

  constructor(gutterMarkers: DecorationSet, spacers: DecorationSet) {
    this.gutterMarkers = gutterMarkers
    this.spacers = spacers
  }

  static for(doc: Text) {
    let assembled = assemble(doc.toString())
    let gutterMarkers = [], spacers = []
    let pos = 0, i = 0
    for (let lineText of doc.iterLines()) {
      let sourceLine = assembled.sourceLines[i++]
      if (!sourceLine) break
      if (sourceLine.type == "CodegenLine") {
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
  view: EditorView
  constructor(private context: Context) {
    this.view = new EditorView({
      doc: this.context.source,
      extensions: [
        keymap.of(defaultKeymap),
        drawSelection(),
        highlightSpecialChars(),
        displayAssembly(),
        lineNumbers(),
        Macro11(),
        syntaxHighlighting(classHighlighter),
      ],
      parent: document.getElementById("edit-wrapper")
    })
  }
}
