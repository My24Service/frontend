# ---- Base ----
# Pinned: with the 12.18.0 image, installing fails because pnpm cannot find the
# Node that "runtime set" installed. Bump this on purpose, not through a floating tag.
FROM ghcr.io/pnpm/pnpm:12.15.0@sha256:d6148daf3ad2af8fa4ecd1aa06db73da32b2e37f63088987eea2fb375ee7f320 AS base
RUN pnpm runtime set node 24 -g

RUN apt-get update && apt-get install -y git

WORKDIR /app
# write version to assets
COPY . .
RUN ./save_version.sh

# ---- Build ----
FROM base AS build
WORKDIR /app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build

# ---- Release ----
FROM nginx:1.21-alpine
# copy static files to nginx server root
COPY --from=build /app/dist /usr/share/nginx/html
# start Nginx in the foreground when the container is run
CMD ["nginx", "-g", "daemon off;"]
