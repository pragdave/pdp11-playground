import "./assets/index.scss"

import { PDPPlayground } from "./pdp_playground"


const defaultSource = 
`; Convert number in r0 to octal string in _buff_
start:	mov 	#123456, r0
	mov 	#buff,   r2
	sec			; make sure we set the bottom bit of
	br	first		; r0 the first time around
	
next:	clc
	rol	r0
	beq	done
	rol	r1
	rol	r0
	rol	r1
first:	rol	r0
	rol	r1
	bic	#^c7, r1
	add	#'0,  r1
	movb	r1,  (r2)+
	br	next

done:	mov	#msg, r0
	.print
	halt

msg:	.ascii	"Result is: "
buff:	.blkb	6
	.asciz	"."

	.end 	start
`

const holders = document.querySelectorAll(`.pdp11-window`)
if (!holders) 
  throw new Error(`Can't find pdp11-window`)

console.log(holders)

holders.forEach(h => new PDPPlayground(h, defaultSource))

