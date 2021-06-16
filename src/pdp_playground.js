import { Context    } from "./context.js"
import { Editor     } from "./editor.js"
import { FrontPanel } from "./front_panel"
import { Logger     } from "./logger.js"
import { PS         } from "../../m11"


export class PDPPlayground {

  constructor(holder, defaultSource) {
    this.context = new Context(defaultSource, this.callbacks()) 
    this.locateElementsWeUse(holder)
    this.editor = new Editor(this.context, this.editTextEl)
    this.frontPanel = new FrontPanel(this.context, this.panelEl, this.callbacks())
    this.frontPanel.buttonHandlers(this.callbacks())
    this.logger = new Logger(holder)
  }


  callbacks() {
    return {
      // these come from the front panel
      step:         ( ) => this.step(),
      run:          ( ) => this.run(),
      reset:        ( ) => this.reset(),
      numberFormat: ( ) => this.numberFormatChanged(),

      // and these from the emulator (via the context)
      emtPrint:     (msg) => this.emtPrint(msg),
      emtTtyout:    (msg) => this.emtTtyout(msg),
    }
  }

  // front panel button handlers

  step() {
    this.editor.clearAnyEmulatorErrors()
    const emulationState = this.context.emulator.step()
    this.updateFromEmulationState(emulationState)
    switch (emulationState.processorState) {
      case PS.Paused:
      case PS.Running:
        break

      case PS.Halted:
        break

      default:
        throw new Error(`Unhandled processor state: ${emulationState.processorState}`)
    }
    return emulationState
  }


  run() {
    let state
    do 
      state = this.step()
    while (this.continueRunning(state))
  }

  continueRunning(state) {
    if (state.processorState !== PS.Paused)
      return false

    if (this.editor.breakpointSetAt(state.registers[7])) {
      return false
    }
    return true
  }

  reset() {
    this.context.reset()
    this.updateFromEmulationState(this.context.emulator.getEmulationState())
    this.frontPanel.reset()
    this.editor.reset()
  }

  updateFromEmulationState(emulationState) {
    this.frontPanel.updateAfterBuild(emulationState)
    this.editor.updateMemory(emulationState)

    if (emulationState.additionalStatus) {
      this.editor.addEmulatorErrorTo(emulationState.additionalStatus)
    }
    this.editor.highlightCurrentInstruction(emulationState.registers[7])
  }

  locateElementsWeUse(holder) {
    this.holderEl = holder
    this.editorWrapperEl = this.holderEl.querySelector(`.edit-wrapper`)
    this.editTextEl      = this.editorWrapperEl.querySelector(`.edit-text`)
    this.panelEl         = this.holderEl.querySelector(`.front-panel`)
  }

  resetButton() {

  }

  numberFormatChanged() {
    console.log(this.context.fmt)
    this.frontPanel.redrawOnNumberFormatChange()
    this.editor.redrawOnNumberFormatChange()
  }

  // emt functions
  emtPrint(msg) {
    console.info(`.print: `, msg)
    this.logger.print(msg)
  }

  emtTtyout(msg) {
    console.info(`.ttyout: `, msg)
    this.logger.ttyout(msg)
  }
}

