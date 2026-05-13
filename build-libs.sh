#!/bin/bash
# Run during npm postinstall - copies Chrome system libs into /app/libs
# so they are available in the runtime container via LD_LIBRARY_PATH

echo "[Build] Copying Chrome system libraries to /app/libs..."
mkdir -p /app/libs

SEARCH_PATHS="/usr/lib/x86_64-linux-gnu /usr/lib/aarch64-linux-gnu /lib/x86_64-linux-gnu"
LIB_PATTERNS="libglib-2.0 libnss3 libnssutil3 libnspr4 libatk-1.0 libatk-bridge libcups libdrm libxkbcommon libgbm libpango libcairo libx11 libxcb libxext libxfixes libxrandr libxcomposite libxdamage libexpat libfontconfig libfreetype"

for SEARCH_PATH in $SEARCH_PATHS; do
    if [ -d "$SEARCH_PATH" ]; then
        for PATTERN in $LIB_PATTERNS; do
            find "$SEARCH_PATH" -name "${PATTERN}*" -type f 2>/dev/null | while read -r LIB; do
                cp -n "$LIB" /app/libs/ 2>/dev/null || true
            done
        done
    fi
done

COUNT=$(ls /app/libs/ 2>/dev/null | wc -l)
echo "[Build] Done. Copied $COUNT libs to /app/libs"
