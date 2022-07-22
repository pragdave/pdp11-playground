import { EditorView, gutter, GutterMarker, keymap, lineNumbers } from "@codemirror/view"
import { EditorState, StateField } from "@codemirror/state"
import {defaultKeymap} from "@codemirror/commands"
import { assemble } from "pdp11-assembler-emulator"

function dummyGutter(placeholder) {
  const marker = new class extends GutterMarker {
    toDOM() { return document.createTextNode(placeholder) }
  }


  return gutter({
    class: "dummy-gutter",
    lineMarker(_view, _line) {
      return marker
    },
    initialSpacer: () => marker
  })
}

function  dumpAssembledOutput(assembledOutput) {
  const assemblerDisplay = document.querySelector("#assembled #log")
  const result = assembledOutput.sourceLines.map(line => {
    const generated = []
    if (line.type == "CodegenLine") {
      const gb = line.generatedBytes
      for (let i = 0; i < line.generatedBytes.length; i += 2) {
        generated.push(((gb[i+1] << 8) + gb[i]).toString(16).padStart(4, "0"))
      }
    }
    return `${line.line}: [${line.height_in_lines}] ${line.address}  ${generated.join(" ")}` 
  })
  assemblerDisplay.textContent = result.join("\n") + "\n\n-------------------\n\n" + JSON.stringify(assembledOutput, null, 4)
}

export class Editor {
  constructor(context) {
    this.context = context


    let reassembleOnChange = StateField.define({
      create() {
        return assemble(context.source)
      },
      update(previous, tr) {
        if (!tr.docChanged)
          return previous
        const newState = assemble(tr.newDoc.text.join("\n"))
        dumpAssembledOutput(newState)
        return newState
      } 
    })

    const startState = EditorState.create({
      doc: this.context.source,
      extensions: [
        keymap.of(defaultKeymap),
        dummyGutter("addr"),
        dummyGutter("word1"),
        dummyGutter("word2"),
        dummyGutter("word3"),
        lineNumbers(),
        reassembleOnChange,
      ]
    })

    this.view = new EditorView({
      state: startState,
      parent: document.getElementById("edit-wrapper")
    })

    dumpAssembledOutput(assemble(this.context.source))
  }

}

