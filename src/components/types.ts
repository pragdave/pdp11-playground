import { NumberFormatter } from "src/number_formatter"
import { Context }from "../context"

export type NumberFormatterState = NumberFormatter

export interface ContextProps {
  context: Context,
  formatter: NumberFormatter
}

export interface ContextState {
  context: Context,
}

export interface LoggerCallbacks {
  emtTtyout: (msg: string) => void, 
  emtPrint:  (msg: string) => void, 
}

