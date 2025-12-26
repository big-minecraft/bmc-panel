#!/bin/bash
set -e  # Exit immediately if any command fails

# Check if config.json exists
if [ ! -f "config.json" ]; then
    echo "Error: config.json not found"
    echo "Please copy config.example.json to config.json and update with your local values"
    echo "  cp config.example.json config.json"
    exit 1
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "Error: jq is not installed"
    echo "Please install jq to use this script:"
    echo "  macOS: brew install jq"
    echo "  Ubuntu/Debian: sudo apt-get install jq"
    exit 1
fi

# Export GLOBAL_VALUES_JSON from config.json
export GLOBAL_VALUES_JSON=$(cat config.json | jq -c .)

# Verify JSON is valid
if [ -z "$GLOBAL_VALUES_JSON" ]; then
    echo "Error: Failed to parse config.json"
    echo "Please ensure config.json is valid JSON"
    exit 1
fi

# Start both server and client in development mode
exec npx concurrently -n "server,client" -c "blue,green" "npm run server:dev" "npm run client:dev" -k
