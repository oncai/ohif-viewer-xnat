#!/bin/bash

set -eu

cd /plugin
./build_plugin.sh

mkdir -p /plugin/output
mv /plugin/build/* /plugin/output

cd /plugin/output/libs
mv ohif-viewer-3.6.1-fat.jar ohif-viewer-3.6.1-fat-${VERSION}.jar
