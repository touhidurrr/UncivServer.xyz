#!/bin/bash

# restart server if health check fails
URL="http://localhost:3000/isalive"

if ! curl -s --max-time 5 "$URL" > /dev/null; then
  sudo systemctl restart caddy
  sudo systemctl restart uncivserver
fi

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
