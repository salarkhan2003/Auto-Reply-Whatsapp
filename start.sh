#!/bin/bash
echo "[System] Starting WhatsApp Auto-Reply Bot..."

# Point Chrome to the libs we copied during build into /app/libs
if [ -d "/app/libs" ]; then
    LIB_COUNT=$(ls /app/libs/ 2>/dev/null | wc -l)
    echo "[System] Found $LIB_COUNT bundled libs in /app/libs"
    export LD_LIBRARY_PATH="/app/libs:$LD_LIBRARY_PATH"
else
    echo "[Warning] /app/libs not found - Chrome may fail to start"
fi

exec node index.js
