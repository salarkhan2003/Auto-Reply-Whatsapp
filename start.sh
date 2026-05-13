#!/bin/bash
# Simple startup script - Railpack (Debian) handles all system libs via apt
# No custom chromium path needed - puppeteer uses its own cached Chrome
echo "[System] Starting WhatsApp Auto-Reply Bot..."
exec node index.js
