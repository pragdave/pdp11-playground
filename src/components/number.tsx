import { h, Fragment } from "preact"
import { useState } from "preact/hooks"
import { NFContext } from "../playground"

type AFormatter = (val: number) => string
export type ValidBase  = 2| 8 | 10 | 16

type FormatterList = {
    [base in ValidBase]:   AFormatter;
}

const binaryFormatter  = (val: number) => val.toString(2).padStart(16, "0")
const octalFormatter   = (val: number) => val.toString(8).padStart(6, "0")
const decimalFormatter = (val: number) => val.toString()
const hexFormatter     = (val: number) => val.toString(16).padStart(4, "0")

const Formatters: FormatterList = {
  2:  binaryFormatter,
  8:  octalFormatter,
  10: decimalFormatter,
  16: hexFormatter,
}

export const AllBases = Object.keys(Formatters).map(b => parseInt(b))


export function Number(props: {val: number}) {
  const val = props.val

  const [showPopup, setShowPopup] = useState(false)

  return (
  <Fragment>
    <NFContext.Consumer>
      {([base]) => 
        <span class="number"
              onMouseEnter={() => setShowPopup(true)}
              onMouseLeave={() => setShowPopup(false)}>{ Formatters[base as ValidBase](val) }</span>
      }
    </NFContext.Consumer>
    {showPopup && <div class="number-popup">
      <span class="b">{binaryFormatter(val)}</span>
      <span class="o">{octalFormatter(val)}</span>
      <span class="d">{decimalFormatter(val)}</span>
      <span class="x">{hexFormatter(val)}</span>
      </div>
    }
    </Fragment>
  )
}
