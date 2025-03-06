#!/bin/bash

rm -fr dist
npm run build
ssh my24-dev "rm -fr ~/frontend/*"
scp -r dist/* my24-dev:~/frontend
rm -fr dist
