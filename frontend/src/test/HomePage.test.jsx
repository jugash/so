import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../api/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('HomePage Component', () => {
  let mockLogin;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLogin = vi.fn();
  });

  it('renders questions and tags correctly', async () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      login: mockLogin,
    });

    const mockQuestionsResponse = {
      data: {
        content: [
          {
            id: 1,
            title: 'How to write unit tests?',
            body: 'I need to write unit tests for my React components.',
            voteCount: 10,
            answerCount: 2,
            viewCount: 150,
            isClosed: false,
            acceptedAnswerId: null,
            createdAt: new Date(Date.now() - 3600000).toISOString(), // 1h ago
            authorId: 101,
            authorDisplayName: 'John Doe',
            authorReputation: 25,
            tags: [{ id: 1, name: 'react' }],
          },
          {
            id: 2,
            title: 'Second Question',
            body: 'Second Body',
            voteCount: 0,
            answerCount: 0,
            viewCount: 1,
            isClosed: true,
            acceptedAnswerId: 42,
            createdAt: new Date().toISOString(), // just now
            authorId: 102,
            authorDisplayName: 'Jane Doe',
            authorReputation: 1,
            tags: [],
          },
        ],
        totalPages: 2,
      },
    };

    const mockTagsResponse = {
      data: [
        { id: 1, name: 'react', questionCount: 10 },
        { id: 2, name: 'java', questionCount: 5 },
      ],
    };

    api.get.mockImplementation((url) => {
      if (url.includes('/api/questions')) return Promise.resolve(mockQuestionsResponse);
      if (url.includes('/api/tags')) return Promise.resolve(mockTagsResponse);
      return Promise.reject(new Error('Unknown url'));
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByText('Loading questions...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('How to write unit tests?')).toBeInTheDocument();
    });

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getAllByText('react')[0]).toBeInTheDocument();

    expect(screen.getByText('Popular Tags')).toBeInTheDocument();
    expect(screen.getByText('× 10')).toBeInTheDocument();

    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();

    const askBtn = screen.getByText('Ask a Question');
    fireEvent.click(askBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/ask');
  });

  it('triggers login if unauthenticated user clicks Ask a Question', async () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      login: mockLogin,
    });

    api.get.mockResolvedValue({ data: { content: [], totalPages: 1 } });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No questions found')).toBeInTheDocument();
    });

    const askBtn = screen.getByText('Ask a Question');
    fireEvent.click(askBtn);
    expect(mockLogin).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('handles sorting tabs and clear filter link', async () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
    });

    api.get.mockResolvedValue({ data: { content: [], totalPages: 1 } });

    render(
      <MemoryRouter initialEntries={['/?tag=react']}>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Questions Tagged: [react]')).toBeInTheDocument();
    });

    const clearFilter = screen.getByText('Clear filter');
    expect(clearFilter).toBeInTheDocument();

    const votesTab = screen.getByText('Highest Score');
    fireEvent.click(votesTab);
    expect(api.get).toHaveBeenCalledWith(expect.stringContaining('sort=votes'));

    const unansweredTab = screen.getByText('Unanswered');
    fireEvent.click(unansweredTab);
    expect(api.get).toHaveBeenCalledWith(expect.stringContaining('sort=unanswered'));

    const newestTab = screen.getByText('Newest');
    fireEvent.click(newestTab);
    expect(api.get).toHaveBeenCalledWith(expect.stringContaining('sort=newest'));
  });

  it('handles questions and tags API load errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    useAuth.mockReturnValue({ isAuthenticated: true });

    api.get.mockRejectedValue(new Error('Load Error'));

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading questions...')).not.toBeInTheDocument();
    });
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('handles paginated tags response and pagination clicks', async () => {
    useAuth.mockReturnValue({ isAuthenticated: true });

    const mockQuestionsResponse = {
      data: {
        content: [{ id: 1, title: 'Question Title', body: 'body', voteCount: 1, answerCount: 1, viewCount: 1, createdAt: new Date(Date.now() - 5 * 60000).toISOString(), authorId: 1, authorDisplayName: 'Name', tags: [] }],
        totalPages: 3,
      },
    };

    // Return paginated object instead of array for tags to cover the fallback branch
    const mockTagsResponse = {
      data: {
        content: [{ id: 1, name: 'react', questionCount: 5 }]
      }
    };

    api.get.mockImplementation((url) => {
      if (url.includes('/api/questions')) return Promise.resolve(mockQuestionsResponse);
      if (url.includes('/api/tags')) return Promise.resolve(mockTagsResponse);
      return Promise.reject(new Error('Unknown url'));
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Question Title')).toBeInTheDocument();
    });

    // Verify tag from paginated response
    expect(screen.getByText('react')).toBeInTheDocument();

    // Click Next page
    const nextBtn = screen.getByRole('button', { name: 'Next' });
    fireEvent.click(nextBtn);
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('page=1'));
    });

    // Click Previous page
    const prevBtn = screen.getByRole('button', { name: 'Previous' });
    fireEvent.click(prevBtn);
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('page=0'));
    });
  });
});
