# syntax=docker/dockerfile:1
# Stage 1: build the Vue 3 / Vite app with placeholder env values so the
# nginx entrypoint can substitute real values at container start.
FROM node:22-alpine AS build
WORKDIR /app

ARG APP_VERSION=0.0.0
ENV NODE_ENV=production

COPY package.json package-lock.json* ./
# The multi-arch image build (linux/amd64 + linux/arm64, both musl) needs
# platform-specific Rolldown native bindings. `npm ci` fails the
# alt-platform legs entirely; `npm install` (even without --no-package-lock)
# also misses them due to a long-standing npm optionalDependencies bug —
# https://github.com/npm/cli/issues/4828, which Rolldown's runtime error
# explicitly references. Workaround per the Rolldown maintainers: drop the
# lockfile inside the build stage so the resolver runs fresh against the
# build platform. Determinism on non-native deps is preserved by the pinned
# package.json. The lockfile remains the source of truth for `npm ci` in CI
# matrix runs (which only build for the host platform).
RUN rm -f package-lock.json && npm install --include=dev --no-audit --no-fund --no-progress

COPY . .

# Bake placeholder tokens into the bundle. The entrypoint replaces these at
# runtime with the values from VUE_APP_* env vars (kept identical to the
# legacy contract so docker-compose.yaml does not change).
ENV CBOMKIT_HTTP_API_BASE=__CBOMKIT_HTTP_API_BASE__
ENV CBOMKIT_WS_API_BASE=__CBOMKIT_WS_API_BASE__
ENV CBOMKIT_TITLE=__CBOMKIT_TITLE__
ENV CBOMKIT_VIEWER_ONLY=__CBOMKIT_VIEWER_ONLY__
ENV CBOMKIT_POLICY_NAME=__CBOMKIT_POLICY_NAME__

RUN npm run build

# Stage 2: serve the static build via nginx-unprivileged.
FROM nginxinc/nginx-unprivileged:alpine
ARG APP_DIR=/opt/app
ENV TZ=Etc/UTC \
    LANG=C.UTF-8
USER root

COPY --from=build /app/dist ${APP_DIR}
RUN chown -R 101:0 ${APP_DIR} \
    && chmod -R g=u ${APP_DIR}

COPY ./docker/etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf
COPY ./docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000
USER 101
WORKDIR ${APP_DIR}
ENTRYPOINT ["/entrypoint.sh"]
