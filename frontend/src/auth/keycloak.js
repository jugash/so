import Keycloak from 'keycloak-js';

// Get Keycloak URL from runtime config, build environment, or fallback to localhost
const keycloakUrl = window._env_?.VITE_KEYCLOAK_URL || import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8180';

const keycloakRealm = window._env_?.VITE_KEYCLOAK_REALM || import.meta.env.VITE_KEYCLOAK_REALM || 'metalstack';
const keycloakClientId = window._env_?.VITE_KEYCLOAK_CLIENT_ID || import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'metalstack-frontend';

console.log('[Keycloak Debug] window._env_:', window._env_);
console.log('[Keycloak Debug] Resolved URL:', keycloakUrl);
console.log('[Keycloak Debug] Resolved Realm:', keycloakRealm);
console.log('[Keycloak Debug] Resolved Client ID:', keycloakClientId);

const keycloak = new Keycloak({
  url: keycloakUrl,
  realm: keycloakRealm,
  clientId: keycloakClientId,
});

export default keycloak;
