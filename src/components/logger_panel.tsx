import { h } from "preact"
import { forwardRef, useImperativeHandle } from "preact/compat"
import { ContextProps, LoggerCallbacks } from "./types"


export const LoggerPanel = forwardRef<LoggerCallbacks, ContextProps>((_props, ref) => {

    // these are callbacks from the emulator emt's to the api
    useImperativeHandle(ref, () => ({
      emtTtyout(msg: string) {
        alert(msg)
      },
      emtPrint(msg: string) {
        alert(msg)
      }
    }))

    return (
      <div class="logger-panel">
        Your logger
      </div>
    )
})
