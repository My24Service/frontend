#!/bin/bash

echo $(cat src/version.js | sed -r "s/^.*'([^']+)'$/\{ version: \'\1\' \}/") > public/assets/version.json
