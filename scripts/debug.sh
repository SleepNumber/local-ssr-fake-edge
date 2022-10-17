#!/bin/zsh
source ~/.zshrc
# Must be on node version 14
nvm use v14
yarn nodemon --inspect=localhost:9229 main.js