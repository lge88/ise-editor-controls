
SRC = $(wildcard lib/*.js) $(wildcard lib/*.css) $(wildcard lib/*.html)

UNAME := $(shell uname)

ifeq ($(UNAME), Linux)
	OPEN=gnome-open
endif
ifeq ($(UNAME), Darwin)
	OPEN=open
endif

build: components $(SRC) component.json
	@(node _ise_/build && touch components)

2013-09-06-20-36-12.js: components
	@component build --standalone 2013-09-06-20-36-12 --name 2013-09-06-20-36-12 --out .

components: component.json
	@(component install --dev && touch components)

clean:
	rm -fr build components template.js

component.json: $(SRC)
	@node _ise_/build/auto-update-file-list.js

test: build
	$(OPEN) test/index.html

demo: build
	$(OPEN) examples/index.html

.PHONY: clean 2013-09-06-20-36-12.js test
