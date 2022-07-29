LANG = src/lang-pdp11
TARGET = dist/standalone.js
OTHER_SRC = $(shell find src -name *.ts -o -name *.tsx) 


STANDALONE = src/standalone.tsx

default: $(TARGET)

node_modules:	package.json
	yarn install

$(LANG)/index.ts:   $(LANG)/tokens.ts

$(LANG)/tokens.ts:  $(LANG)/pdp11.terms.js $(LANG)/pdp11.js

$(LANG)/pdp11.terms.js $(LANG)/pdp11.js: node_modules $(LANG)/pdp11.grammar 
	yarn lezer-generator $(LANG)/pdp11.grammar -o $(LANG)/pdp11.js

$(TARGET): $(LANG)/index.ts $(LANG)/pdp11.js $(OTHER_SRC)
	yarn esbuild --bundle --outfile=$(TARGET) --sourcemap $(STANDALONE)

watch:
	${MAKE}
	fswatch src | xargs -n1 -I{} $(MAKE)

clean:
	rm -rf dist
