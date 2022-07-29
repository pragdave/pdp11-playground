import { assemble, Callbacks, Emulator, MachineState, SourceCode } from "pdp11-assembler-emulator"


// Format.octal.base = 8
// Format.decimal.base = 10
// Format.hex.base = 16

export class Context {

  machineState: MachineState
  build: SourceCode
  emulator: Emulator
  runnable: boolean = false

   constructor(public source: string, private callbacks: Callbacks) {
     this.build  = null
     this.machineState = new MachineState(this.callbacks)
     this.emulator     = null
     this.setSource(source)
   }

  reset() {
    this.build  = assemble(this.source)
    this.runnable = this.build.errorCount === 0
    this.machineState = new MachineState(this.callbacks)

    if (this.runnable) {
      this.machineState.loadAssembledCode(this.build)
      this.emulator = new Emulator(this.machineState)
    }
  }

  setSource(source: string) {
    this.source = source
    this.reset()
  }

 }


