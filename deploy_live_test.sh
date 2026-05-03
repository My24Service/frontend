#!/bin/bash

rm -fr dist
npm run build
ssh jenkins@my24-live "rm -fr /var/www/my24service/test-frontend-release/dist"
scp -r dist jenkins@my24-live:/var/www/my24service/test-frontend-release
rm -fr dist
