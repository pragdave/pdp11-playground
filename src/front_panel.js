import { el, mount, setAttr, setChildren  } from "redom"
import { Format }from "./context"
import { PS } from "pdp11-assembler-emulator"

class Status {

  constructor() {
    this.el = this.buildDom()
  }

  buildDom() {
    this.message = el(`div.msg`)
    this.icon    = el(`div.icon`)
    return el(`div.processor-status`, [ this.icon, this.message ])
  }

  setMessage(msg) {
    if (!msg)
      msg = ``
    this.message.textContent = msg
  }

}

class PSW {
  constructor(context) {
    this.context = context
    this.el  = this.buildDOM()
    this.updateValue()
  }

  buildDOM() {
    this.valueEl = el(`div.value`)
    return el(
      `div.register.psw`,
      { title: `N: negative • Z: zero • V: overflow • C: carry` },
      [
        el(`legend`, `PSW`),
        this.valueEl,
      ])
  }

  updateValue(_highlight = null) {
    this.valueEl.textContent = this.value()
  }

  value() {
    return this.context.machineState.psw
  }

  redraw() {
    this.updateValue()
  }
}

class Register {
  constructor(context, parent, rno, title = `R${rno}`) {
    this.context = context
    this.parent = parent
    this.rno = rno
    this.el  = this.buildDOM(title)
  }

  buildDOM(title) {
    this.valueEl = el(`div.value`, { title: `` }, this.valueAsString())
    return el(
      `div.register`,
      [
        el(`legend`, title),
        this.valueEl,
      ])
  }

  value() {
    return this.context.machineState.registers[this.rno]
  }

  valueAsString() {
    return this.context.fmt(this.value())
  }

  updateValue(highlight = null) {
    const value = this.value()
    const title =
      `^b${Format.octal(value)} • ` +
      `^d${Format.decimal(value)} • ` +
      `^x${Format.hex(value)}`

    this.valueEl.textContent = this.valueAsString()
    setAttr(this.valueEl, { title })
    if (highlight)
      setAttr(this.el, { class: `register ${highlight}` })
  }
  redraw() {
    this.updateValue()
  }
}

const ANIMATION_CLASSES = [ `R`, `RW`, `WR`, `W` ]
const ANIMATION_SELECTOR = ANIMATION_CLASSES.map(c => `.${c}`).join(`,`)

function remove_this_elements_animation_classes(ev) {
  ev.target.classList.remove(...ANIMATION_CLASSES)  
}


class Registers {

  constructor(context, parent) {
    this.context = context
    this.parent = parent
    this.psw = new PSW(context)
    this.registers = [
      new Register(this.context, this, 0),
      new Register(this.context, this, 1),
      new Register(this.context, this, 2),
      new Register(this.context, this, 3),
      new Register(this.context, this, 4),
      new Register(this.context, this, 5),
      new Register(this.context, this, 6, `R6/SP`),
      new Register(this.context, this, 7, `R7/PC`),
      this.psw,
    ] 
    this.el = el(`div.registers`, this.registers)
    this.el.addEventListener(`animationend`, remove_this_elements_animation_classes)
  }

  setRegister(rno, value, highlight) {
    this.registers[rno].setValue(value, highlight)
  }

  setPSW(newPSW) {
    this.psw.setValue(newPSW)
  }

  reset() {
    this.el.querySelectorAll(ANIMATION_SELECTOR).forEach(el => {
      el.classList.remove(ANIMATION_CLASSES)
    })
  }

  redraw() {
    this.registers.forEach(r => r.redraw())
  }

  // setRegisters(values) {
  //   this.registers.forEach((r, i) => { r.setValue(values[i]) })
  // }
}


class NumberBase {

  constructor(parent) {
    this.parent = parent
    this.base = 8
    this.el = this.createRadioButtons()
  }

  changeBase(newBase) {
    this.base = newBase
    this.parent.changeNumberBase(newBase)
    // this.cb(NumberFormatters[newBase])
  }

  createRadioButtons() {
    return el(`div.selectBase`,
      [ [ `octal`, 8 ],
        [ `decimal`, 10 ],
        [ `hex`, 16 ],
      ].map(([name, value]) => this.createButton(name, value))
    )
  }

  createButton(name, value) {
    const id = `b${value}`
    const ip = el(`input`, { type: `radio`, id, name: `bae`, value, checked: value == this.base })
    ip.onchange = () => this.changeBase(value)

    return [
      ip,
      el(`label`, name, { for: id })
    ]
  }

}

// ------------------------------------------------------------ front panel

export class FrontPanel {

  constructor(context, mountPoint) {
    this.context = context

    this.stepButton   = el(`button`, `Step`)
    this.runButton    = el(`button`, `Run`)
    this.resetButton  = el(`button`, `Reset`)
    this.errors       = el(`div.errorCount`)
    this.statusEl     = new Status()
    this.registers    = new Registers(this.context, this)
    this.numberBaseEl = new NumberBase(this)

    this.errorCount = 0


    this.el = el(`div.fp`)
    this.addChildElements()

    mount(mountPoint, this.el)
  }

  changeNumberBase(newBase) {
    this.context.setNumberBase(newBase)
    this.numberChangeNotifier()  // callback to top level
  }

  redrawOnNumberFormatChange() {
    this.registers.redraw()
  }

  addChildElements() {
    if (this.context.runnable) {
      setChildren(this.el,
        [
          this.stepButton, 
          this.runButton,
          el(`.run-reset-divider`),
          this.resetButton,
          el(`.run-reset-divider`),
          this.statusEl,
          this.registers,
          this.numberBaseEl,
        ]
      )
    }
    else {
      setChildren(this.el,
        [
          this.errors,
          this.registers,
          this.numberBaseEl,
        ]
      )
    }
  }

  setErrorCount(count) {
    if (count !== this.errorCount) {
      this.errors.textContent = `Source code errors: ${count}`
      this.errorCount = count
      this.addChildElements()
    }
  }

  buttonHandlers(handlers) {
    this.stepButton.onclick = handlers.step
    this.runButton.onclick = handlers.run
    this.resetButton.onclick = handlers.reset
    this.numberChangeNotifier = handlers.numberFormat
  }

  updateAfterBuild(buildResult) {
    this.setErrorCount(buildResult.errorCount)
    this.registers.redraw()
  }

  updateAfterExecution({ psw, registers, register_accesses: accesses, processorState: state }) {
    Object.keys(accesses).forEach(rno => {
      const value = registers[rno]
      this.registers.setRegister(rno, value, accesses[rno])
    })

    this.registers.setPSW(psw)

    switch (state) {
      case PS.Halted:
        this.statusEl.setMessage(`Your program has halted`)
        break

      default:
        this.statusEl.setMessage(false)
        break 
    }
  }

  reset() {
    this.registers.reset()
  }
}
