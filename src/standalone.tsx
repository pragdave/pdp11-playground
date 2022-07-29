import { h, render } from "preact";
import { PlaygroundComponent } from "./playground"
// import "./index.css";


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
document.addEventListener("DOMContentLoaded", () => {  
  render(<PlaygroundComponent />, document.body);
});

