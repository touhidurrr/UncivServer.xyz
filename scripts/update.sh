#!/bin/bash

PROJECT_DIR=`dirname $(dirname $0)`
cd "$PROJECT_DIR"

# Check for updates
echo "Checking for updates..."
git fetch

# If diff avaiable
if ! git diff --quiet origin/main; then
    echo "Updates found! Restarting..."
    git pull
    bun upgrade && bun install --frozen-lockfile
    systemctl restart uncivserver
fi
