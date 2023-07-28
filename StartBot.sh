#!/bin/bash
#if your on Linux,
#sudo chmod +x setupdevenv.sh

cd ./src/
npm run tsc
node Sbot/index.js