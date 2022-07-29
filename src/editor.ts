import { Context } from "./context"

import { Decoration, DecorationSet, EditorView, keymap, drawSelection, highlightSpecialChars } from "@codemirror/view"
import { lineNumbers  } from "@codemirror/view"
// import { EditorView, Decoration, DecorationSet, gutter, GutterMarker, keymap,
//          lineNumbers, drawSelection, highlightSpecialChars } from "@codemirror/view"
import { EditorState, StateField, Text } from "@codemirror/state"
import {defaultKeymap} from "@codemirror/commands"
import { SourceCode } from "pdp11-assembler-emulator"

import { Macro11 } from "./lang-pdp11/index"
import { classHighlighter} from "@lezer/highlight"
import {syntaxHighlighting} from "@codemirror/language"

export type SourceChangedCB = (newSource: string) => SourceCode

// const myHighlightStyle = HighlightStyle.define([
//   {tag: tags.keyword, color: "#fc6"},
//   {tag: tags.comment, color: "#f5d", fontStyle: "italic"}
// ])

// const BYTES_PER_LINE = 3


export function bytesIntoWords(address: number, bytes: number[]) {
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


// class AssemblyMarker extends GutterMarker {

//   constructor(public address: number, public bytes: number[], private numberFormatter: NumberFormatter) {
//     super()
//   }

//   eq(other: AssemblyMarker) {
//     return this.address == other.address && this.bytes.length == other.bytes.length &&
//       other.bytes.every((b, i) => b == this.bytes[i])
//   }

//   toDOM() {
//     console.log(this.numberFormatter)
//     let result = document.createElement("div")
//     result.className = "line-assembly"
//     let addr = result.appendChild(document.createElement("span"))
//     addr.textContent = this.numberFormatter.format(this.address) + ": "
//     addr.className = "line-address"

//     let bytes = result.appendChild(document.createElement("span"))
//     bytes.className = "line-bytes"
//     const wordText: string[] = []

//     let words = bytesIntoWords(this.address, this.bytes)
//     words.forEach((word, i) => {
//       wordText.push(this.numberFormatter.format(word))
//       wordText.push(i % BYTES_PER_LINE ? " " : "\n")
//     })

//     bytes.textContent = wordText.join("")
//     return result
//   }
// }

// const dummyMarker = new AssemblyMarker(0, [0, 0, 0], new NumberFormatter(16))

// const assemblyGutter = (sf: StateField<AssemblyState>) => gutter({
//   class: "assembly-gutter",
//   markers: view => view.state.field(sf).gutterMarkers,
//   initialSpacer: () => dummyMarker
// })

// const gutterTheme = EditorView.baseTheme({
//   ".line-assembly": {
//     fontFamily: "monospace",
//     fontSize: "80%",
//     display: "flex",
//     alignItems: "flex-start"
//   },
//   ".line-address": {
//     color: "#66f"
//   },
//   ".line-bytes": {
//     whiteSpace: "pre"
//   }
// })

// const assemblyState = (sourceChangedCB?: SourceChangedCB, numberFormatter: NumberFormatter) => StateField.define({
//   create(state: EditorState) {
//     const assembly = AssemblyState.for(state.doc, numberFormatter)
//     // if (sourceChangedCB)
//     //   sourceChangedCB(state.doc.toString())
//     return assembly
//   },
//   update(prev, tr) {
//     if (tr.docChanged) {
//       const assembly = AssemblyState.for(tr.newDoc, numberFormatter)
//         // if (sourceChangedCB)
//         //   sourceChangedCB(tr.newDoc.toString())
//       return assembly  
//     }
//     else {
//       return prev
//     }
//   }
// })



// class AssemblyState {
//   gutterMarkers: DecorationSet
//   spacers: DecorationSet
//   assembled: SourceCode

//   constructor(gutterMarkers: DecorationSet, spacers: DecorationSet, assembled: SourceCode) {
//     this.assembled = assembled
//     this.gutterMarkers = gutterMarkers
//     this.spacers = spacers
//   }

//   static for(doc: Text, numberFormatter: NumberFormatter) {
//     let assembled = assemble(doc.toString())
//     let gutterMarkers = [], spacers = []
//     let pos = 0, i = 0
//     for (let lineText of doc.iterLines()) {
//       let sourceLine = assembled.sourceLines[i++]
//       if (!sourceLine) break
//       if (sourceLine.type == "CodegenLine") {
//         gutterMarkers.push(new AssemblyMarker(sourceLine.address, sourceLine.generatedBytes, numberFormatter).range(pos))
//         let height = sourceLine.height_in_lines
//         console.log(height)
//         if (height > 1) {
//           spacers.push(Decoration.line({
//             attributes: {
//               style: `padding-bottom: calc(var(--line-height)*${height - 1})`
//             }
//           }).range(pos))
//         }
//       }
//       pos += lineText.length + 1
//     }
//     return new AssemblyState(Decoration.set(gutterMarkers), Decoration.set(spacers), assembled)
//   }
// }

// const lineSpacers = (sf: StateField<AssemblyState>) => EditorView.decorations.from(sf, state => state.spacers)

// function displayAssembly(sourceChangedCB: SourceChangedCB, numberFormatter: NumberFormatter) {
//   const state = assemblyState(sourceChangedCB, numberFormatter)
//   return [assemblyGutter(state), gutterTheme, state, lineSpacers(state)]
// }

// notify the outside world when the code changes

function assembleAndGetLineHeights(sourceChangedCB: SourceChangedCB | undefined, doc: Text) {

  const spacers = []

  if (sourceChangedCB) {
    const assembled = sourceChangedCB(doc.toString())
    let pos = 0, lineNo = 0
    for (let editorLine of doc.iterLines()) {
      let assembledLine = assembled.sourceLines[lineNo++]
      if (assembledLine) {  // blank lines at the end of ignored by assembler
        const height = assembledLine.height_in_lines
        if (height > 1) {
          spacers.push(Decoration.line({
            attributes: {
              style: `padding-bottom: calc(var(--line-height)*${height - 1})`
            }
          }).range(pos))
        }
      }
      pos += editorLine.length + 1
    }
  }
  return Decoration.set(spacers)
}

const notifyOnChanges = (sourceChangedCB?: SourceChangedCB) => StateField.define<DecorationSet>({
  create(state: EditorState) {
    console.log("create")
    return assembleAndGetLineHeights(sourceChangedCB, state.doc)
  },

  update(prev, tr) {
    console.log("update")
    if (tr.docChanged)
      return assembleAndGetLineHeights(sourceChangedCB, tr.newDoc)
    else
      return prev
  },

  provide: f => EditorView.decorations.from(f)
})



export class Editor {
  view: EditorView

  constructor(private context: Context, private parent: HTMLElement, sourceChangedCB: SourceChangedCB) {
    this.view = new EditorView({
      doc: this.context.source,
      extensions: [
        keymap.of(defaultKeymap),
        drawSelection(),
        highlightSpecialChars(),
        notifyOnChanges(sourceChangedCB),
        lineNumbers(),
        Macro11(),
        syntaxHighlighting(classHighlighter),
      ],
      parent: this.parent,
    })
  }
}
