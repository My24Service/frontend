#!/bin/bash

BRANCH="siep-develop-latest"
HOST="139.162.254.243"
REPO_NAME="frontend"

cd /tmp
rm -fr $REPO_NAME
git clone git@github.com:My24Service/$REPO_NAME.git
cd $REPO_NAME
git checkout $BRANCH
git pull origin $BRANCH
npm install
npm run build
tar zcf siep.tgz dist
scp siep.tgz  jenkins@$HOST:~/
ssh jenkins@$HOST rm -fr //var/www/my24service/shltr/*
ssh jenkins@$HOST tar zxf siep.tgz  -C /var/www/my24service/shltr
rm siep.tgz
