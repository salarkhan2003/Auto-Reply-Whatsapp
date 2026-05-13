#!/bin/bash
# Find chromium path from nix/system
CHROMIUM_PATH=$(which chromium 2>/dev/null || which chromium-browser 2>/dev/null || which google-chrome 2>/dev/null)

if [ -z "$CHROMIUM_PATH" ]; then
    echo "[Error] Chromium not found! Check nixpacks.toml"
    exit 1
fi

echo "[System] Chromium found at: $CHROMIUM_PATH"
export PUPPETEER_EXECUTABLE_PATH="$CHROMIUM_PATH"
exec node index.js
