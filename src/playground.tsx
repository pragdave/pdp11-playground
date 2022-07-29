import { createContext, h } from "preact";
import { useContext, useRef, useState } from "preact/hooks";
import { FrontPanel } from "./components/front_panel"
import { EditorPanel } from "./components/editor_panel" 
import { LoggerPanel } from "./components/logger_panel" 
import { LoggerCallbacks } from "./components/types"

import { Context } from "./context"
import { NumberFormatter, ValidBase } from "./number_formatter";

const defaultSource = 
`; Convert number in r0 to octal string in _buff_
fred = 1
start:	mov     #123456, r0
first:  mov     #buff,   r2
        sec                 ; make sure we set the bottom bit of
        br      first       ; r0 the first time around
buff:   .word   1, 2, 3, 4, 5    
.end    start
`

export function PlaygroundComponent() {

  const [ numberFormatter, setNumberFormatter ] = useState(new NumberFormatter(16) )

  // callbacks from the emulator to the console logger
  const loggerRef = useRef<LoggerCallbacks>(null)

  const emulatorCallbacks = {
    emtTtyout(msg: string) { loggerRef.current?.emtTtyout(msg)},
    emtPrint(msg: string)  { loggerRef.current?.emtPrint(msg) } 
  }

  const [ context, setContext ] = useState(new Context(defaultSource, emulatorCallbacks))



  // callback from the editor
  function sourceUpdated(newSource: string) {
    const newContext = new Context(newSource, emulatorCallbacks)
    console.log("source updated")
    setContext((_prev: Context) => {
      return newContext
    })
    return newContext.build
  }

  // callbacks from the frontpanel

  const fp_callbacks = {
    setNumberFormat(base: ValidBase) {
      numberFormatter.base = base   // hack for the editor...
      setNumberFormatter(new NumberFormatter(base))
    },

    step() {
      const newEmulatorState = context.emulator.step()
      setContext({...context, machineState: newEmulatorState })
      console.log(context)
    },

    run() {
      alert("run")
    },

    reset() {
      alert("reset")
    }
  }
    
  return (
    <div class="playground">
        <FrontPanel  context={context} numberFormatter={numberFormatter} callbacks={fp_callbacks}/>
        <EditorPanel context={context} numberFormatter={numberFormatter} sourceUpdated={sourceUpdated} />
        <LoggerPanel context={context} numberFormatter={numberFormatter} ref={loggerRef}/>
    </div>
  )
}
