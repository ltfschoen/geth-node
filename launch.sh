#!/bin/bash
# File: ~/launch.sh

# Original Code Reference: http://dan.doezema.com/2013/04/programmatically-create-title-tabs-within-the-mac-os-x-terminal-app/
# New-BSD License by Original Author Daniel Doezema http://dan.doezema.com/licenses/new-bsd/

# Modified by Luke Schoen in 2017 to include loading new tabs for server and automatically open webpage in browser.

function new_tab() {
  TAB_NAME=$1
  DELAY=$2
  COMMAND=$3
  osascript \
    -e "tell application \"Terminal\"" \
    -e "tell application \"System Events\" to keystroke \"t\" using {command down}" \
    -e "do script \"$DELAY; printf '\\\e]1;$TAB_NAME\\\a'; $COMMAND\" in front window" \
    -e "end tell" > /dev/null
}

# Create new tabs. Wait for Geth Node to load
new_tab "Geth Node Tab" \
        "echo 'Loading Geth Node...'" \
        "geth --datadir=/Users/Ls/code/blockchain/geth-node/chaindata/ --verbosity 3"

new_tab "MIST Tab" \
        "echo 'Waiting for Geth Node to load...'; sleep 5" \
        "open -a mist --args --mode 'mist' --node 'geth' --gethpath '/usr/local/bin/geth' --rpc '/Users/Ls/code/blockchain/geth-node/chaindata/geth.ipc' --node-ipcpath '/Users/Ls/code/blockchain/geth-node/chaindata/geth.ipc' --node-datadir '/Users/Ls/code/blockchain/geth-node/chaindata/geth.ipc' --skiptimesynccheck true"

new_tab "Geth JS Console Tab" \
        "echo 'Waiting for Geth Node before attaching GetH JS Console...'; sleep 5" \
        "geth attach '/Users/Ls/code/blockchain/geth-node/chaindata/geth.ipc'"

new_tab "Editor Tab" \
        "echo 'Waiting for Geth Node before running MIST...'" \
        "cd /Users/Ls/code/blockchain/geth-node; code ."
