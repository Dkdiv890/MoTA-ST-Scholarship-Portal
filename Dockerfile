# Stage 1: Build Next.js Frontend
FROM node:20-bookworm-slim AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend ./
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV BACKEND_URL=http://127.0.0.1:8000
RUN npm run build

# Stage 2: Final Fullstack Runtime Container
FROM python:3.11-slim

# Install system dependencies & Node.js 20 runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    gnupg \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Hugging Face Spaces runs as user ID 1000
RUN useradd -m -u 1000 user

WORKDIR /app

# Install Python backend dependencies
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend code
COPY backend ./backend

# Copy built frontend
COPY --from=frontend-builder /app/frontend ./frontend

# Create upload directory and set user permissions
RUN mkdir -p /app/backend/uploads /app/uploads && \
    chown -R user:user /app

# Copy and setup start script
COPY start.sh ./start.sh
RUN chmod +x ./start.sh && chown user:user ./start.sh

USER user

ENV PORT=7860
ENV BACKEND_URL=http://127.0.0.1:8000
EXPOSE 7860

CMD ["./start.sh"]
