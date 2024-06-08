#!/bin/bash

# Navigate to your repository
cd /path/to/home/UncivServer.xyz

# Fetch the latest changes from the remote repository
git fetch

# Check if there are any new changes
if [ $(git rev-parse HEAD) != $(git rev-parse @{u}) ]; then
    # There are new changes

    # Pull the latest changes
    git pull

    # Install any new dependencies
    bun install

    # Restart the service
    sudo systemctl restart uncivserver
fi
