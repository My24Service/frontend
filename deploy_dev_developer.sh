#!/bin/bash

USER=$1

if [ -z "$USER" ]; then
    echo "please enter a user to deploy for (hugo or samuel)"
    exit 1
fi

rm -fr dist
npm run build
ssh $USER@my24-dev "rm -fr /var/www/developers/$USER/frontend/*"
scp -r dist/* $USER@my24-dev:/var/www/developers/$USER/frontend/
rm -fr dist
