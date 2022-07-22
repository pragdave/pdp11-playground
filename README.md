### Marjin:

The CodeMirror stuff is in `src/editor.js`.

The `main` branch is my current CM5 code (kind of embarrassing...)

The `cm6` branch is stripped down to just the editor. It includes 
an index.html to drive it.

* setup with: `yarn`
* run with: `yarn dev`

If you open localhost:3000, you'll see an environment with the editor on
the left and the result of running the assembler on the right. I have
two objectives:

1. Get the address and generated words data from the assembler output
   into the corresponding gutter fields.

2. Use the height_in_lines field from the assembler output to set the
   height of the corresponding editor line.

If you have questions, I can hop on a chat just about any time.


