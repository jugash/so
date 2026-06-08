import axios from 'axios';
import keycloak from '../auth/keycloak';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor: attach a valid token if available,
// but never send a stale/expired token (causes 401 on public endpoints).
api.interceptors.request.use(
  async (config) => {
    if (keycloak.authenticated && keycloak.token) {
      try {
        // Refresh if token will expire within 30 seconds
        const refreshed = await keycloak.updateToken(30);
        config.headers.Authorization = `Bearer ${keycloak.token}`;
      } catch (err) {
        // Token refresh failed — session is gone.
        // Remove the header so the request goes through as anonymous.
        console.warn('Token refresh failed, proceeding as anonymous', err);
        delete config.headers.Authorization;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: silently handle 401 on public endpoints.
// On authenticated endpoints, prompt re-login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If the user thought they were authenticated but got 401,
      // try to re-login silently
      if (keycloak.authenticated) {
        console.warn('Got 401 despite being authenticated — session may have expired');
        keycloak.updateToken(-1).catch(() => {
          // Force re-login only if the user is on a page that needs auth
          console.warn('Session expired, user may need to re-login');
        });
      }
    }
    return Promise.reject(error);
  }
);

export default api;
