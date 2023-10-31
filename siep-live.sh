#!/bin/bash

BRANCH="app-layout-merge-dev"
HOST="178.79.153.236"

cd /tmp
rm -fr pt-vue
git clone git@scm.platform.my24service-dev.com:services/pt-vue.git
cd pt-vue
git checkout $BRANCH
git pull origin $BRANCH
npm install
npm run build
tar zcf siep.tgz dist
scp siep.tgz  jenkins@$HOST:~/
ssh jenkins@$HOST rm -fr /var/www/my24service/shltr/*
ssh jenkins@$HOST tar zxf siep.tgz  -C /var/www/my24service/shltr
rm siep.tgz
