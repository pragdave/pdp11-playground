import { el, mount, setAttr, setChildren  } from "redom"

const Cursor = `<span class="cursor"></span>`
export class Logger {

  constructor(parent) {
    this.parent = parent
  }

  print(string) {
    if (string.endsWith("\n")) {
      this.appendText(string.slice(0, string.length-1) + "<br/>")
    }
    else {
      this.appendText(string)
    }
  }


  ttyout(string) {
    if (string == "\n") {
      this.appendText("<br/>")
    }
    else {
      this.appendText(string)
    }
  }

  appendText(newStuff) {
    this.createLoggerElementIfNeeded()
    let text = this.loggerEl.innerHTML
    text = text.replace(Cursor, newStuff)
    this.loggerEl.innerHTML = text + Cursor
  }


  createLoggerElementIfNeeded() {
    if (!this.loggerEl) {
      this.loggerEl = el('div.pdp-logger') 
      this.loggerEl.innerHTML = Cursor
      this.parent.appendChild(this.loggerEl)
    }
  }
}
