#!/bin/bash

# Make sure we have all our dependencies installed
npm install

# Package them up into thirdparty.js
browserify index.js -s thirdparty | uglifyjs  --stack_size=100000 -c > ../js/thirdparty.js

# Remove node packages (the extension complains because of PEM keys in some tests)
rm -rf node_modules

