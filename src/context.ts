import { assemble, Callbacks, Emulator, MachineState, SourceCode } from "pdp11-assembler-emulator"


export const Format = {
  octal(val: number) {
    return val.toString(8).padStart(6, "0")
  },
  decimal(val: number) {
    return val.toString()
  },
  hex(val: number) {
    return val.toString(16).padStart(4, "0")
  },
}
// Format.octal.base = 8
// Format.decimal.base = 10
// Format.hex.base = 16

export class Context {

  public fmt: (val: number) => string

  machineState: MachineState
  build: SourceCode
  emulator: Emulator
  runnable: boolean = false

   constructor(public source: string, private callbacks: Callbacks) {
     this.build  = null
     this.fmt    = Format.octal
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

  setNumberBase(base: number) {
    switch (base) {
      case 8: 
        this.fmt = Format.octal
        break
      case 10: 
        this.fmt = Format.decimal
        break
      case 16: 
        this.fmt = Format.hex
        break
      default:
        console.error(`invalid number base ${base}`)
    }
  }

 }


