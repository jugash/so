import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

// Mock useNavigate and useLocation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('Layout Component', () => {
  let mockLogin;
  let mockLogout;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLogin = vi.fn();
    mockLogout = vi.fn();
    localStorage.clear();
  });

  it('renders correctly for unauthenticated user and handles theme toggle', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      login: mockLogin,
      logout: mockLogout,
      user: null,
      isAdmin: false,
      isModerator: false,
    });

    render(
      <MemoryRouter>
        <Layout>
          <div>Main Content</div>
        </Layout>
      </MemoryRouter>
    );

    // Verify logo and main contents
    expect(screen.getByText('Main Content')).toBeInTheDocument();
    expect(screen.getByText('Log In')).toBeInTheDocument();

    // Trigger login click
    fireEvent.click(screen.getByText('Log In'));
    expect(mockLogin).toHaveBeenCalledTimes(1);

    // Toggle theme
    const themeBtn = screen.getByTitle(/Switch to/i);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    fireEvent.click(themeBtn);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('renders correctly for Admin user and handles logout', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      login: mockLogin,
      logout: mockLogout,
      user: { displayName: 'Alice the Admin' },
      isAdmin: true,
      isModerator: true,
    });

    render(
      <MemoryRouter>
        <Layout>
          <div>Admin Panel</div>
        </Layout>
      </MemoryRouter>
    );

    expect(screen.getByText('Alice the Admin')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument(); // Badge

    // Logout
    const logoutBtn = screen.getByTitle('Log Out');
    fireEvent.click(logoutBtn);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('renders correctly for Moderator user', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      login: mockLogin,
      logout: mockLogout,
      user: { displayName: 'Mod Bob' },
      isAdmin: false,
      isModerator: true,
    });

    render(
      <MemoryRouter>
        <Layout>
          <div>Mod Panel</div>
        </Layout>
      </MemoryRouter>
    );

    expect(screen.getByText('Mod Bob')).toBeInTheDocument();
    expect(screen.getByText('Mod')).toBeInTheDocument(); // Badge
  });

  it('handles search submission with empty/whitespace query and does not navigate', () => {
    useAuth.mockReturnValue({ isAuthenticated: false });
    render(
      <MemoryRouter>
        <Layout>
          <div>Content</div>
        </Layout>
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText('Search questions...');
    fireEvent.change(searchInput, { target: { value: '   ' } });
    const searchForm = searchInput.closest('form');
    fireEvent.submit(searchForm);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('loads theme from localStorage if present', () => {
    localStorage.setItem('theme', 'light');
    useAuth.mockReturnValue({ isAuthenticated: false });
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    const themeBtn = screen.getByTitle(/Switch to/i);
    fireEvent.click(themeBtn);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('highlights the Home link when on path /', () => {
    useAuth.mockReturnValue({ isAuthenticated: true, user: { displayName: 'User' } });
    render(
      <MemoryRouter initialEntries={['/']}>
        <Layout><div>Content</div></Layout>
      </MemoryRouter>
    );
    expect(screen.getByTitle('Home')).toHaveStyle({ color: 'var(--color-primary)', fontWeight: '600' });
  });

  it('highlights the Tags link when on path /tags', () => {
    useAuth.mockReturnValue({ isAuthenticated: true, user: { displayName: 'User' } });
    render(
      <MemoryRouter initialEntries={['/tags']}>
        <Layout><div>Content</div></Layout>
      </MemoryRouter>
    );
    expect(screen.getByTitle('Tags')).toHaveStyle({ color: 'var(--color-primary)', fontWeight: '600' });
  });

  it('highlights the Ask Question link when on path /ask', () => {
    useAuth.mockReturnValue({ isAuthenticated: true, user: { displayName: 'User' } });
    render(
      <MemoryRouter initialEntries={['/ask']}>
        <Layout><div>Content</div></Layout>
      </MemoryRouter>
    );
    expect(screen.getByTitle('Ask Question')).toHaveStyle({ color: 'var(--color-primary)', fontWeight: '600' });
  });

  it('highlights the My Profile link when on path /users/me', () => {
    useAuth.mockReturnValue({ isAuthenticated: true, user: { displayName: 'User' } });
    render(
      <MemoryRouter initialEntries={['/users/me']}>
        <Layout><div>Content</div></Layout>
      </MemoryRouter>
    );
    expect(screen.getByTitle('My Profile')).toHaveStyle({ color: 'var(--color-primary)', fontWeight: '600' });
  });
});

