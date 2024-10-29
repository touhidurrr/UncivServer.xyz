#!/bin/bash

PROJECT_DIR="/path/to/UncivServer.xyz"
cd "$PROJECT_DIR"

# Check for updates
echo "Checking for updates..."
git fetch origin

# If diff avaiable
if [[ `git status --porcelain` ]]; then
    echo "Updates found! Restarting..."
    git pull origin main
    systemctl restart uncivserver
fi
