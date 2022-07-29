import { h, Fragment } from "preact";
import { ContextProps} from "./types"
import { NumberFormatter, ValidBase } from "../number_formatter"

import * as MachineState from "pdp11-assembler-emulator"

export interface FrontPanelCallbacks {
  step: () => void,
  run: () => void,
  reset: () => void,
  setNumberFormat: (base: ValidBase) => void,
}

export interface FrontPanelProps extends ContextProps {
  numberFormatter: NumberFormatter,
  setNumberFormat: (base: ValidBase) => void,
  callbacks: FrontPanelCallbacks,
}

let labelCount = 0

export function OneBase(props: {base: number, checked?: boolean}) {
  const label = `l${labelCount++}`
  return (
    <Fragment>
      <input id={label}type="radio" value={props.base} name="base" checked={props.checked}></input>
      <label for={label}>{props.base}</label>
    </Fragment>
  )
}

interface BaseSelectProps {
  notifyBaseChanged: (b: ValidBase) => void,
  formatter: NumberFormatter,
}

export function BaseSelector(props: BaseSelectProps) {
  const { formatter, notifyBaseChanged } = props

  function baseChanged(event: Event) {
    let newBase = parseInt((event.target as HTMLInputElement).value) as ValidBase
    notifyBaseChanged(newBase)
  }

  return (<div class="Bases">
    Number base:
    <div class="base-selector" onChange={baseChanged}>
    <OneBase base={8}  checked={formatter.base == 8}/>
    <OneBase base={10} checked={formatter.base == 10}/>
    <OneBase base={16} checked={formatter.base == 16}/>
    </div>
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
         <BaseSelector formatter={props.numberFormatter} notifyBaseChanged={props.callbacks.setNumberFormat}/>
          <div class="registers">
            <ul>
              { props.context.machineState.registers.registers.map((reg, i:number) =>
                <li key={i.toString}>{props.numberFormatter.format(reg)}</li>
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


