# Stage 1: Build frontend
FROM node:20-slim AS frontend-builder
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/survey.immich.app/package.json apps/survey.immich.app/
COPY common/ common/
RUN pnpm install --frozen-lockfile
COPY apps/survey.immich.app/ apps/survey.immich.app/
RUN cd apps/survey.immich.app && pnpm run build

# Stage 2: Bundle backend
FROM node:20-slim AS backend-builder
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/survey.immich.app/backend/package.json apps/survey.immich.app/backend/
RUN pnpm install --frozen-lockfile
COPY apps/survey.immich.app/backend/ apps/survey.immich.app/backend/
RUN cd apps/survey.immich.app/backend && npx esbuild src/server.ts --bundle --platform=node --format=esm --outdir=dist --external:better-sqlite3 --external:pg

# Stage 3: Runtime
FROM node:20-slim
RUN corepack enable
WORKDIR /app

# Copy built frontend
COPY --from=frontend-builder /app/apps/survey.immich.app/build /app/public

# Copy bundled backend + native deps
COPY --from=backend-builder /app/apps/survey.immich.app/backend/dist /app/dist
COPY --from=backend-builder /app/apps/survey.immich.app/backend/migrations /app/migrations
COPY --from=backend-builder /app/apps/survey.immich.app/backend/package.json /app/
RUN pnpm install --prod

ENV PORT=3000
ENV STATIC_DIR=/app/public
ENV DATABASE_URL=/data/survey.db

EXPOSE 3000
VOLUME /data

CMD ["node", "dist/server.js"]
