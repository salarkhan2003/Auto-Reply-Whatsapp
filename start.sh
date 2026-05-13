#!/bin/bash

# Add nix profile paths to PATH so we can find nix-installed chromium
export PATH="/root/.nix-profile/bin:/nix/var/nix/profiles/default/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

# Try to find chromium from nix store or system
CHROMIUM_PATH=$(which chromium 2>/dev/null \
    || which chromium-browser 2>/dev/null \
    || which google-chrome 2>/dev/null \
    || find /nix/store -name "chromium" -type f 2>/dev/null | grep "bin/chromium$" | head -1 \
    || find /usr -name "chromium*" -type f 2>/dev/null | head -1)

if [ -z "$CHROMIUM_PATH" ]; then
    echo "[Warning] System chromium not found. Letting puppeteer use its own downloaded Chrome."
    echo "[Warning] If this fails, check nixpacks.toml chromium install."
else
    echo "[System] Chromium found at: $CHROMIUM_PATH"
    export PUPPETEER_EXECUTABLE_PATH="$CHROMIUM_PATH"
fi

exec node index.js
