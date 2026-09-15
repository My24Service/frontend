#!/bin/bash

echo $(cat src/version.ts | sed -r "s/^.*'([^']+)'$/\{ version: \'\1\' \}/") > public/assets/version.json
