#!/bin/bash

# Setup
PROJECT_DIR="/path/to/project/dir"
BUN_DIR="/path/to/bun"

# Update
alias bun="$BUN_DIR/.bin/bun"
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
