type AFormatter = (val: number) => string
export type ValidBase  = 8 | 10 | 16

type FormatterList = {
    [base in ValidBase]:   AFormatter;
}

const Formatters: FormatterList = {
  8: (val: number)  => { return val.toString(8).padStart(6, "0") },
  10: (val: number) => { return val.toString() },
  16: (val: number) => { return val.toString(16).padStart(4, "0") },
}


export class NumberFormatter {

  format: AFormatter = Formatters[16]
  _base: ValidBase

  constructor(defaultBase: ValidBase = 16) {
    this._base = defaultBase
    this.setFormatter()
  }

  get base() {
    return this._base
  }

  set base(newBase: ValidBase) {
    this._base = newBase
    this.setFormatter()
  }

  setFormatter() {
    this.format = Formatters[this._base]
  }
}


