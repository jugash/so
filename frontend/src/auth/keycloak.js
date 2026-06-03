import Keycloak from 'keycloak-js';

// Get Keycloak URL from environment or fallback to localhost
const keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8180';

const keycloak = new Keycloak({
  url: keycloakUrl,
  realm: 'metalstack',
  clientId: 'metalstack-frontend',
});

export default keycloak;
