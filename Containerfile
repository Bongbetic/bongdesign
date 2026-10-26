# Stage 1: build the gallery from pinned @carbon packages.
FROM docker.io/library/node:24-slim AS site-build
WORKDIR /app
COPY site/package.json site/package-lock.json ./site/
RUN cd site && npm ci --no-audit --no-fund
COPY site/ ./site/
COPY data/ ./data/
RUN cd site && npm run build

# Stage 2: serve gallery + bongdesign MCP. Standard library only.
FROM docker.io/library/python:3.12-slim
WORKDIR /app
COPY data/ ./data/
COPY --from=site-build /app/site/dist/ ./site/dist/
COPY server.py ./
ENV PORT=8000
EXPOSE 8000
CMD ["python3", "server.py"]
