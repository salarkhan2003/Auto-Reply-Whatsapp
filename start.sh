#!/bin/bash
echo "[System] Starting WhatsApp Auto-Reply Bot..."

# Install missing Chrome system dependencies at runtime
echo "[System] Installing required system libraries..."
apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libpango-1.0-0 \
    libcairo2 \
    fonts-liberation \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxext6 \
    libxi6 \
    libxtst6 \
    libxss1 \
    2>/dev/null || echo "[Warning] Some libs may already be installed, continuing..."

echo "[System] Libraries ready. Launching bot..."
exec node index.js
