import { h, Fragment } from "preact";
import { ContextProps} from "./types"
import { ValidBase } from "./number"
import { AllBases, Number } from "./number"
import { NFContext } from "src/playground"

import * as MachineState from "pdp11-assembler-emulator"

export interface FrontPanelCallbacks {
  step: () => void,
  run: () => void,
  reset: () => void,
}

export interface FrontPanelProps extends ContextProps {
  setNumberFormat: (base: ValidBase) => void,
  callbacks: FrontPanelCallbacks,
}

let labelCount = 0

export function OneBase(props: {base: number, checked?: boolean }) {
  const label = `l${labelCount++}`
  return (
    <Fragment>
      <input id={label} type="radio" value={props.base} name="base" checked={props.checked}></input>
      <label for={label}>{props.base}</label>
    </Fragment>
  )
}

interface BaseSelectProps {
}

export function BaseSelector(_props: BaseSelectProps) {

  function updateBaseFrom(e: Event, updateFn: (base: ValidBase) => void) {
    const target = e.target as HTMLElement
    if ("value" in target) {
      const base = parseInt((target as HTMLInputElement).value) as ValidBase
      updateFn(base)
    }
  }
  return (<div class="Bases">
    Number base:
        <NFContext.Consumer>
         {([base, setBase])=>
          <div class="base-selector" onClick={ e => updateBaseFrom(e, setBase) } >
          {
            AllBases.map((b) => 
              <OneBase base={b}  checked={base == b}/>
            )
          }
          </div>
         }
    </NFContext.Consumer>
  </div>)
}

export function FrontPanel(props: FrontPanelProps) {

  function runnable() {
    return props.context.runnable && props.context.machineState.processorState != MachineState.PS.Running
  }

    return (
        <div  class="front-panel" >
        <pre>
        {props.context.source}
        </pre>
         <BaseSelector/>
          <div class="registers">
            <ul>
              { props.context.machineState.registers.registers.map((reg, i:number) =>
                <li key={i.toString}><Number val={reg}/></li>
              )}
            </ul>
          </div>
          <div class="switches">
            {props.context.runnable ? "runnable" : "not runnable" }<br/>
            { props.context.machineState.processorState }<br/>
            { runnable() ? "r1" : "n1" }<br/>
            <button onClick={props.callbacks.run} disabled={!runnable()}>Run</button>
            <button onClick={props.callbacks.step} disabled={!runnable()}>Step</button>
            <button onClick={props.callbacks.reset}>Reset</button>
          </div>
        </div>
        )
}


