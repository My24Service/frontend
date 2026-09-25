# ---- Base ----
FROM ghcr.io/pnpm/pnpm:12 AS base
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
