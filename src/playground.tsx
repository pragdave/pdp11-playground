import { h } from "preact";
import { useRef, useState } from "preact/hooks";
import { createContext } from "preact/compat"
import { FrontPanel } from "./components/front_panel"
import { EditorPanel } from "./components/editor_panel" 
import { LoggerPanel } from "./components/logger_panel" 
import { LoggerCallbacks } from "./components/types"
import { ValidBase } from "./components/number"

import { Context } from "./context"

export type NFUpdateBaseCallback = (base: ValidBase) => void
export type NFStateType = [ base: number, setBase: NFUpdateBaseCallback ]

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

export const NFContext = createContext<NFStateType>([ 16, () => {}])

export function PlaygroundComponent() {

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

  // handle the global number base
  const nfState = useState(16)


  const fp_callbacks = {
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
    <NFContext.Provider value={nfState}>
    <div class="playground">
        <FrontPanel  context={context}  callbacks={fp_callbacks}/>
        <EditorPanel context={context}  sourceUpdated={sourceUpdated} />
        <LoggerPanel context={context}  ref={loggerRef}/>
    </div>
    </NFContext.Provider>
  )
}
