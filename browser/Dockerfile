# -------------------------------------------------
# Stage 1 – Build the Go binary (optional, if you also want a tiny helper)
# (You can skip this stage completely if the container only runs Playwright.)
# -------------------------------------------------
FROM golang:1.22-alpine AS builder
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
ENV CGO_ENABLED=0 GOOS=linux GOARCH=amd64
RUN go build -ldflags="-s -w" -o /app/placeholder ./cmd/placeholder/main.go  # <-- replace with a real entrypoint if you ever need one

# -------------------------------------------------
# Stage 2 – Playwright base (Chromium only)
# -------------------------------------------------
FROM mcr.microsoft.com/playwright:focal AS base

# Remove the browsers we do NOT need (Firefox & WebKit) – saves ~150 MiB
RUN rm -rf /ms-playwright/firefox* && \
    rm -rf /ms-playwright/webkit* && \
    rm -rf /ms-playwright/ffmpeg*

# Install Playwright driver for Go library compatibility
ENV PLAYWRIGHT_DRIVER_VERSION=1.52.0
RUN npm install -g playwright@${PLAYWRIGHT_DRIVER_VERSION} && \
    playwright install chromium

# Install socat for port forwarding
RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# Expose the DevTools / CDP port – the Go API will connect to this.
EXPOSE 9222

# Set a sane shared-memory size (Chromium needs /dev/shm)
# (The actual size is configured in docker-compose via shm_size)
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Disable D-Bus and other desktop services that aren't available in containers
ENV DBUS_SESSION_BUS_ADDRESS=unix:path=/dev/null
ENV XDG_RUNTIME_DIR=/tmp
ENV DISPLAY=:99

# Create a startup script that runs Chrome and socat
RUN echo '#!/bin/bash\n\
# Start Chrome in the background on localhost:9223\n\
/ms-playwright/chromium-1169/chrome-linux/chrome \\\n\
    --remote-debugging-port=9223 \\\n\
    --headless \\\n\
    --no-sandbox \\\n\
    --disable-setuid-sandbox \\\n\
    --disable-dev-shm-usage \\\n\
    --disable-gpu \\\n\
    --disable-software-rasterizer \\\n\
    --disable-extensions \\\n\
    --disable-default-apps \\\n\
    --disable-features=IsolateOrigins,site-per-process \\\n\
    --no-first-run \\\n\
    --no-default-browser-check \\\n\
    --user-data-dir=/tmp/chrome-data \\\n\
    about:blank &\n\
\n\
# Wait for Chrome to start\n\
sleep 2\n\
\n\
# Start socat to forward 0.0.0.0:9222 to 127.0.0.1:9223\n\
exec socat TCP-LISTEN:9222,fork,reuseaddr,bind=0.0.0.0 TCP:127.0.0.1:9223\n\
' > /start.sh && chmod +x /start.sh

# Default command – start both Chrome and socat proxy
CMD ["/start.sh"]