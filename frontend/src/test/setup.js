import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Global mocks for keycloak, browser APIs, etc.
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock Keycloak and auth context if needed
vi.mock('../auth/keycloak', () => ({
  default: {
    init: vi.fn().mockResolvedValue(true),
    login: vi.fn(),
    logout: vi.fn(),
    token: 'mock-token',
    tokenParsed: {
      preferred_username: 'testuser',
      name: 'Test User',
      email: 'testuser@example.com',
      realm_access: { roles: ['USER'] },
    },
    authenticated: true,
  },
}));
