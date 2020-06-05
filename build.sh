#!/usr/bin/env bash

rm -r dist
tsc --noEmit false --target es3 --outFile dist/restate.es5.js --declaration --sourceMap *.ts
tsc --noEmit false --target es6 --lib es6,dom --outFile dist/restate.es6.js --declaration --sourceMap restate.ts

find ./dist -name '*.js' | while read file; do
	babel-minify "$file" > "$(echo "$file" | sed 's/.js/.min.js/')"
done

find ./examples -name '*.ts' | while read file; do
	tsc --noEmit false --target es3 --sourceMap ./dist/restate.es5.d.ts "$file"
done

rm -r docs
docco restate.ts && mv docs/restate.html docs/index.html
