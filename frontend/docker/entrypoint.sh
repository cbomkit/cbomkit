#!/bin/sh
set -eu

ROOT_DIR=/opt/app

# Map the legacy VUE_APP_* env var names (still used by docker-compose.yaml)
# onto the new CBOMKIT_* placeholder tokens baked into the Vite build.
: "${VUE_APP_HTTP_API_BASE:=}"
: "${VUE_APP_WS_API_BASE:=}"
: "${VUE_APP_TITLE:=CBOMkit}"
: "${VUE_APP_VIEWER_ONLY:=false}"
: "${VUE_APP_POLICY_NAME:=quantum_safe}"

echo "Replacing env placeholders in built assets"
find "$ROOT_DIR" -type f \( -name '*.js' -o -name '*.html' -o -name '*.css' \) | while IFS= read -r file; do
  sed -i \
    -e "s|__CBOMKIT_HTTP_API_BASE__|${VUE_APP_HTTP_API_BASE}|g" \
    -e "s|__CBOMKIT_WS_API_BASE__|${VUE_APP_WS_API_BASE}|g" \
    -e "s|__CBOMKIT_TITLE__|${VUE_APP_TITLE}|g" \
    -e "s|__CBOMKIT_VIEWER_ONLY__|${VUE_APP_VIEWER_ONLY}|g" \
    -e "s|__CBOMKIT_POLICY_NAME__|${VUE_APP_POLICY_NAME}|g" \
    "$file"
done

echo "Starting Nginx"
nginx -g 'daemon off;'
