import { Context    } from "./context"
import { Editor     } from "./editor"


const defaultSource = 
`; Convert number in r0 to octal string in _buff_
start:	mov     #123456, r0
first:  mov     #buff,   r2
        sec                 ; make sure we set the bottom bit of
        br      first       ; r0 the first time around
buff:   .word   1, 2, 3, 4, 5    
        .end    start
`
    
const context = new Context(defaultSource, {})
new Editor(context)

