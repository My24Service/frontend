#!/bin/bash

BRANCH="app-layout-merge-dev"
HOST="139.162.254.243"

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
ssh jenkins@$HOST tar zxf siep.tgz  -C /var/www/my24service/shltr
rm siep.tgz
