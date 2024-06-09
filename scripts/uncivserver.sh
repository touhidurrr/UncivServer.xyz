#!/bin/bash

URL="http://localhost:3000/isalive"
# add your repository path here
REPO_PATH="/path/to/home/UncivServer.xyz"
SERVICES=("caddy" "uncivserver")

restart_services() {
    for service in "${SERVICES[@]}"; do
        echo "Restarting $service..."
        sudo systemctl restart "$service"
    done
}

# Health check
if ! curl -s --max-time 5 "$URL" > /dev/null; then
    echo "Health check failed. Restarting services..."
    restart_services
fi

# Navigate to your repository
cd "$REPO_PATH" || exit

# Fetch the latest changes from the remote repository
git fetch

# Check if there are any new changes
if [ "$(git rev-parse HEAD)" != "$(git rev-parse @{u})" ]; then
    echo "New changes detected."

    # Pull the latest changes
    git pull

    # Install any new dependencies
    bun install -f

    # Restart the services
    restart_services
else
    echo "No new changes detected."
fi
