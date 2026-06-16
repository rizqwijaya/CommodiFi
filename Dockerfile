# CommodiFi API — runs the event indexer + REST endpoints via tsx.
# Uses Node's built-in node:sqlite (needs Node >= 22.5).
# Single-stage: tsx runs the TypeScript directly, so there's no compile step.
FROM node:22-slim

# pnpm via corepack (version pinned by root package.json "packageManager").
RUN corepack enable

WORKDIR /app

# Copy the whole pnpm workspace. The API imports the @commodifi/contracts-abi
# workspace package (TS source), so the full monorepo is needed at install time.
COPY . .

# Install all workspace deps from the committed lockfile.
RUN pnpm install --frozen-lockfile

# Koyeb routes traffic to this port; the app reads PORT from the environment.
ENV PORT=4000
EXPOSE 4000

# Indexer + REST API. tsx executes src/index.ts directly (no build).
CMD ["pnpm", "--filter", "@commodifi/api", "start"]
