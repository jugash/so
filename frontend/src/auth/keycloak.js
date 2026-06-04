import Keycloak from 'keycloak-js';

// Get Keycloak URL from runtime config, build environment, or fallback to localhost
const keycloakUrl = window._env_?.VITE_KEYCLOAK_URL || import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8180';
console.log('[Keycloak Debug] window._env_:', window._env_);
console.log('[Keycloak Debug] Resolved URL:', keycloakUrl);

const keycloak = new Keycloak({
  url: keycloakUrl,
  realm: 'metalstack',
  clientId: 'metalstack-frontend',
});

export default keycloak;
