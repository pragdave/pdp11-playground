import { h, createRef, Component, Fragment} from "preact";
import { bytesIntoWords, Editor } from "../editor"
import { ContextProps, ContextState } from "./types"
import { Number} from "./number"

import { AssignmentLine as ALT, BlankLine as BLT, CodegenLine as CLT, ErrorLine as ELT,
         SourceCode, SourceLine, LineType } from "pdp11-assembler-emulator"

interface HandlerProps<T extends SourceLine> {
    line: T,
}

function AssignmentLine(props: HandlerProps<ALT>) {
  const line = props.line
    return (<div class="gutter-line">
      <span class="assignment-value"><Number val={line.value}/></span>
    </div>)
}

function BlankLine(_props: HandlerProps<BLT>) {
  return null
}

function generatedWordsFrom(address: number, bytes: number[]) {
    const words = bytesIntoWords(address, bytes)
  return words.map((word) => <span><Number val={word}/></span>)
}

function CodegenLine(props: HandlerProps<CLT>) {
  const line = props.line
  const address = line.address
  const bytes = line.generatedBytes

    return (
    <div class="gutter-line">
      <span class="address"><Number val={address}/></span>
      <div class="generated-bytes">
        {
          generatedWordsFrom(address, bytes).map((byte) =>
            <Fragment>
              { byte }
            </Fragment>
          )
        } 
    </div>
    </div>)
}

function ErrorLine(_props: HandlerProps<ELT>) {
    return null
}

type LineTypeMapType = Record<LineType, (props: HandlerProps<any>) => (h.JSX.Element | null)>

const LineTypeMap: LineTypeMapType = {
  AssignmentLine,
  BlankLine,
  CodegenLine,
  ErrorLine,
}

function GutterLine(props: {line: SourceLine }) {
  const line = props.line
  const height = `calc(${line.height_in_lines}*var(--line-height))`
  const Handler = LineTypeMap[line.type]
  return (<div class="gutter-line-holder" style={{height: height}}>
     <Handler line={line} />
  </div>)
}


interface GutterProps {
  lines: SourceCode,
}

function Gutter(props: GutterProps) {
  const lines = props.lines.sourceLines

  return (<div class="gutter">
    {lines.map(line => <GutterLine line={line} />)}
  </div>)
}

export interface EditorProps extends ContextProps {
  sourceUpdated: (newSource: string) => SourceCode,
}

export class EditorPanel extends Component<EditorProps, ContextState> {
  panelElement = createRef()

  constructor(props: EditorProps) {
      super(props)
  }

  sourceCodeChanged(newSource:string) {
    return this.props.sourceUpdated(newSource)
  }

  componentDidMount() {
    new Editor(
       this.props.context, 
       this.panelElement.current, 
       (s: string) => this.sourceCodeChanged(s))
  }

  render() {
  return (
    <div class="playground-editor">
    <Gutter lines={this.props.context.build} />
    <div ref={this.panelElement} class="editor-panel" />
    </div>
  )
  }
}

