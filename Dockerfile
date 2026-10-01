# Production image: one container runs the website. On start it applies
# database migrations and the idempotent seed, then serves on $PORT.
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /app

FROM base AS build
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM base AS run
ENV NODE_ENV=production
COPY --from=build /app /app
RUN chmod +x scripts/start.sh
EXPOSE 3000
CMD ["scripts/start.sh"]
