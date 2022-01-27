import { assemble, Emulator, MachineState } from "pdp11-assembler-emulator"


export const Format = {
  octal(val) {
    return val.toString(8).padStart(6, "0")
  },
  decimal(val) {
    return val.toString()
  },
  hex(val) {
    return val.toString(16).padStart(4, "0")
  },
}
Format.octal.base = 8
Format.decimal.base = 10
Format.hex.base = 16

export class Context {

   constructor(source, callbacks) {
     this.callbacks = callbacks
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

  setSource(source) {
    this.source = source
    this.reset()
  }

  setNumberBase(base) {
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


