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

# Perform placeholder replacement in Nginx configuration
if [ -n "$PROXY_KEYCLOAK_URL" ]; then
  # Strip trailing slash if present
  PROXY_KEYCLOAK_URL_CLEANED=$(echo "$PROXY_KEYCLOAK_URL" | sed 's|/$||')
  # Strip protocol to get host for proxy_set_header Host
  TEMP_HOST=$(echo "$PROXY_KEYCLOAK_URL_CLEANED" | sed -e 's|https://||' -e 's|http://||')
  PROXY_KEYCLOAK_HOST=$(echo "$TEMP_HOST" | cut -d'/' -f1)

  echo "Configuring Nginx Keycloak proxy: URL=$PROXY_KEYCLOAK_URL_CLEANED, Host=$PROXY_KEYCLOAK_HOST"
  sed -i "s|__PROXY_KEYCLOAK_URL__|$PROXY_KEYCLOAK_URL_CLEANED|g" /etc/nginx/conf.d/metalstack.conf
  sed -i "s|__PROXY_KEYCLOAK_HOST__|$PROXY_KEYCLOAK_HOST|g" /etc/nginx/conf.d/metalstack.conf
else
  echo "No external Keycloak proxy URL configured, falling back to local metalstack-keycloak:8080"
  sed -i "s|__PROXY_KEYCLOAK_URL__|http://metalstack-keycloak:8080|g" /etc/nginx/conf.d/metalstack.conf
  sed -i "s|__PROXY_KEYCLOAK_HOST__|metalstack-keycloak:8080|g" /etc/nginx/conf.d/metalstack.conf
fi

# Execute nginx
exec "$@"
