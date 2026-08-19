FROM node:24-slim@sha256:3638d9a6fe4030bd716be989438248074489337ba3275657f93595428be4fc03 AS frontend-builder
# pnpm version is pinned via the root package.json "packageManager" field
ENV COREPACK_ENABLE_STRICT=1
RUN corepack enable
WORKDIR /app
# pnpm --frozen-lockfile fails unless every package.json referenced by
# pnpm-workspace.yaml exists, hence the unrelated app manifests below.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/survey.immich.app/package.json apps/survey.immich.app/
COPY apps/survey.immich.app/backend/package.json apps/survey.immich.app/backend/
COPY apps/datasets.immich.app/backend/package.json apps/datasets.immich.app/backend/
COPY apps/futo-backups-survey.immich.app/backend/package.json apps/futo-backups-survey.immich.app/backend/
COPY common/ common/
RUN pnpm install --frozen-lockfile --filter survey...
COPY apps/survey.immich.app/ apps/survey.immich.app/
RUN cd apps/survey.immich.app && pnpm run build

FROM node:24-slim@sha256:3638d9a6fe4030bd716be989438248074489337ba3275657f93595428be4fc03 AS backend-builder
ENV COREPACK_ENABLE_STRICT=1
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/survey.immich.app/package.json apps/survey.immich.app/
COPY apps/survey.immich.app/backend/package.json apps/survey.immich.app/backend/
COPY apps/datasets.immich.app/backend/package.json apps/datasets.immich.app/backend/
COPY apps/futo-backups-survey.immich.app/backend/package.json apps/futo-backups-survey.immich.app/backend/
RUN pnpm install --frozen-lockfile --filter survey-backend...
COPY apps/survey.immich.app/backend/ apps/survey.immich.app/backend/
RUN cd apps/survey.immich.app/backend && npx esbuild src/server.ts --bundle --platform=node --format=esm --outdir=dist --external:better-sqlite3 --external:pg

FROM node:24-slim@sha256:3638d9a6fe4030bd716be989438248074489337ba3275657f93595428be4fc03
ENV COREPACK_ENABLE_STRICT=1
RUN corepack enable
WORKDIR /app

COPY --from=frontend-builder /app/apps/survey.immich.app/build /app/public

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
