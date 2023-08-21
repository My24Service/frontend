#!/bin/bash

docker compose build && docker login && docker compose push
