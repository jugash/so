import React, { createContext, useContext, useState, useEffect } from 'react';
import keycloak from '../auth/keycloak';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    keycloak
      .init({
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        checkLoginIframe: false,
        silentCheckSsoFallback: false,
      })
      .then((auth) => {
        setAuthenticated(auth);
        if (auth) {
          setToken(keycloak.token);
          setRoles(keycloak.realmAccess?.roles || []);
          
          // Load user profile
          keycloak.loadUserProfile().then((profile) => {
            setUser({
              id: profile.id,
              username: profile.username,
              email: profile.email,
              firstName: profile.firstName,
              lastName: profile.lastName,
              displayName: profile.firstName && profile.lastName 
                ? `${profile.firstName} ${profile.lastName}` 
                : profile.username,
            });
            setLoading(false);
          }).catch((err) => {
            console.error('Failed to load user profile', err);
            setUser({
              username: keycloak.tokenParsed?.preferred_username,
              email: keycloak.tokenParsed?.email,
              displayName: keycloak.tokenParsed?.name || keycloak.tokenParsed?.preferred_username,
            });
            setLoading(false);
          });

          // Set up token auto-refresh
          setInterval(() => {
            keycloak.updateToken(70).then((refreshed) => {
              if (refreshed) {
                setToken(keycloak.token);
              }
            }).catch((err) => {
              console.error('Failed to refresh token', err);
            });
          }, 60000);

        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Keycloak initialization failed:', err);
        setLoading(false);
      });
  }, []);

  const login = () => keycloak.login();
  const logout = () => keycloak.logout({ redirectUri: window.location.origin });

  const hasRole = (role) => {
    return roles.includes(role);
  };

  const isAdmin = hasRole('ADMIN');
  const isModerator = hasRole('MODERATOR') || hasRole('ADMIN');

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: authenticated,
        loading,
        token,
        user,
        roles,
        isAdmin,
        isModerator,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
