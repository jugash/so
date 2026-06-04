#!/bin/sh

# Generate runtime env-config.js from environment variables
echo "window._env_ = {" > /usr/share/nginx/html/env-config.js
if [ -n "$VITE_KEYCLOAK_URL" ]; then
  echo "  VITE_KEYCLOAK_URL: '$VITE_KEYCLOAK_URL'," >> /usr/share/nginx/html/env-config.js
fi
if [ -n "$VITE_KEYCLOAK_REALM" ]; then
  echo "  VITE_KEYCLOAK_REALM: '$VITE_KEYCLOAK_REALM'," >> /usr/share/nginx/html/env-config.js
fi
if [ -n "$VITE_KEYCLOAK_CLIENT_ID" ]; then
  echo "  VITE_KEYCLOAK_CLIENT_ID: '$VITE_KEYCLOAK_CLIENT_ID'," >> /usr/share/nginx/html/env-config.js
fi
echo "};" >> /usr/share/nginx/html/env-config.js

# Ensure ownership is correct
chown appuser:appgroup /usr/share/nginx/html/env-config.js || true

# Execute nginx
exec "$@"
