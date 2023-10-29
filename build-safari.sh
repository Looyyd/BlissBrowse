#!/bin/bash
folder="safari"
rm -rf ./$folder
mkdir ./$folder
xcrun safari-web-extension-converter . --project-location ./$folder --no-prompt --no-open
