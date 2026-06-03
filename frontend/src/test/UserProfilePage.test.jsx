import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import UserProfilePage from '../pages/UserProfilePage';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../api/api', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

describe('UserProfilePage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders other user profile correctly without settings', async () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { username: 'currentuser' },
    });

    api.get.mockImplementation((url) => {
      if (url.includes('/api/users/123/questions')) {
        return Promise.resolve({
          data: {
            content: [
              {
                id: 45,
                title: 'Alice Question',
                voteCount: 4,
                answerCount: 0,
                createdAt: '2026-02-01T00:00:00Z',
              },
            ],
            totalPages: 1,
          },
        });
      }
      if (url.includes('/api/users/123')) {
        return Promise.resolve({
          data: {
            id: 123,
            username: 'alice',
            displayName: 'Alice Cooper',
            email: 'alice@example.com',
            reputation: 150,
            questionCount: 1,
            answerCount: 5,
            about: 'Bio here',
            createdAt: '2026-01-01T00:00:00Z',
          },
        });
      }
      return Promise.reject(new Error('not found'));
    });

    render(
      <MemoryRouter initialEntries={['/users/123']}>
        <Routes>
          <Route path="/users/:id" element={<UserProfilePage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Loading profile...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Alice Cooper')).toBeInTheDocument();
      expect(screen.getByText('Alice Question')).toBeInTheDocument();
    });

    expect(screen.getByText('@alice')).toBeInTheDocument();
    expect(screen.getByText('150 rep')).toBeInTheDocument();
    expect(screen.getByText('Bio here')).toBeInTheDocument();

    // Verify settings card does NOT render
    expect(screen.queryByText('Settings & Preferences')).not.toBeInTheDocument();
  });

  it('renders current user profile ("me") with settings and notifications toggles', async () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { username: 'alice' },
    });

    api.get.mockImplementation((url) => {
      if (url.includes('/api/users/me')) {
        return Promise.resolve({
          data: {
            id: 123,
            username: 'alice',
            displayName: 'Alice Cooper',
            email: 'alice@example.com',
            reputation: 150,
            questionCount: 0,
            answerCount: 0,
            emailNotifications: true,
            createdAt: '2026-01-01T00:00:00Z',
          },
        });
      }
      if (url.includes('/api/users/123/questions')) {
        return Promise.resolve({
          data: { content: [], totalPages: 1 },
        });
      }
      return Promise.reject(new Error('not found'));
    });

    api.put.mockResolvedValue({ data: {} });

    render(
      <MemoryRouter initialEntries={['/users/me']}>
        <Routes>
          <Route path="/users/:id" element={<UserProfilePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Settings & Preferences')).toBeInTheDocument();
    });

    const checkbox = screen.getByLabelText('Receive email alerts when my questions are answered');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toBeChecked();

    // Toggle notification setting
    fireEvent.click(checkbox);

    expect(api.put).toHaveBeenCalledWith('/api/users/me/notifications?enabled=false');

    await waitFor(() => {
      expect(screen.getByText('Email preferences updated successfully!')).toBeInTheDocument();
    });
  });

  it('renders "User not found" when profile api call fails', async () => {
    useAuth.mockReturnValue({ isAuthenticated: false });
    api.get.mockRejectedValue(new Error('Profile load failed'));

    render(
      <MemoryRouter initialEntries={['/users/123']}>
        <Routes>
          <Route path="/users/:id" element={<UserProfilePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('User not found')).toBeInTheDocument();
    });
  });

  it('handles notification toggle API error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { username: 'alice' },
    });

    api.get.mockImplementation((url) => {
      if (url.includes('/api/users/me')) {
        return Promise.resolve({
          data: {
            id: 123,
            username: 'alice',
            displayName: 'Alice Cooper',
            emailNotifications: true,
            createdAt: '2026-01-01T00:00:00Z',
          },
        });
      }
      if (url.includes('/api/users/123/questions')) {
        return Promise.resolve({ data: { content: [], totalPages: 1 } });
      }
      return Promise.reject(new Error('not found'));
    });

    api.put.mockRejectedValue(new Error('Update failed'));

    render(
      <MemoryRouter initialEntries={['/users/me']}>
        <Routes>
          <Route path="/users/:id" element={<UserProfilePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Settings & Preferences')).toBeInTheDocument();
    });

    const checkbox = screen.getByLabelText('Receive email alerts when my questions are answered');
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });
    consoleSpy.mockRestore();
  });

  it('handles user questions list API error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    useAuth.mockReturnValue({ isAuthenticated: false });

    api.get.mockImplementation((url) => {
      if (url.includes('/api/users/123/questions')) {
        return Promise.reject(new Error('Questions list error'));
      }
      if (url.includes('/api/users/123')) {
        return Promise.resolve({
          data: {
            id: 123,
            username: 'alice',
            displayName: 'Alice Cooper',
            createdAt: '2026-01-01T00:00:00Z',
          },
        });
      }
      return Promise.reject(new Error('not found'));
    });

    render(
      <MemoryRouter initialEntries={['/users/123']}>
        <Routes>
          <Route path="/users/:id" element={<UserProfilePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Alice Cooper')).toBeInTheDocument();
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it('handles user questions list pagination clicks on success', async () => {
    useAuth.mockReturnValue({ isAuthenticated: false });

    api.get.mockImplementation((url) => {
      if (url.includes('/api/users/123/questions')) {
        return Promise.resolve({
          data: {
            content: [{ id: 45, title: 'Alice Question 1', voteCount: 4, createdAt: '2026-02-01T00:00:00Z' }],
            totalPages: 3,
          },
        });
      }
      if (url.includes('/api/users/123')) {
        return Promise.resolve({
          data: {
            id: 123,
            username: 'alice',
            displayName: 'Alice Cooper',
            createdAt: '2026-01-01T00:00:00Z',
          },
        });
      }
      return Promise.reject(new Error('not found'));
    });

    render(
      <MemoryRouter initialEntries={['/users/123']}>
        <Routes>
          <Route path="/users/:id" element={<UserProfilePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Alice Question 1')).toBeInTheDocument();
    });

    const nextBtn = screen.getByRole('button', { name: 'Next' });
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/api/users/123/questions?page=1&size=10');
    });

    const prevBtn = screen.getByRole('button', { name: 'Previous' });
    fireEvent.click(prevBtn);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/api/users/123/questions?page=0&size=10');
    });
  });
});

