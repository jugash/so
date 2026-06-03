import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import SearchResultsPage from '../pages/SearchResultsPage';
import api from '../api/api';

vi.mock('../api/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('SearchResultsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search results correctly', async () => {
    const mockSearchResponse = {
      data: {
        content: [
          {
            id: 1,
            title: 'Found React Question',
            body: 'Body of react question',
            voteCount: 5,
            answerCount: 1,
            viewCount: 10,
            isClosed: false,
            createdAt: '2026-01-01T00:00:00Z',
            authorId: 12,
            authorDisplayName: 'Bob Smith',
            tags: [{ id: 1, name: 'react' }],
          },
          {
            id: 2,
            title: 'Long Body Question',
            body: 'A'.repeat(200),
            voteCount: 2,
            answerCount: 0,
            viewCount: 5,
            isClosed: false,
            createdAt: new Date(Date.now() - 5 * 3600000).toISOString(), // 5 hours ago
            authorId: 13,
            authorDisplayName: 'Alice Johnson',
            tags: [],
          },
        ],
        totalPages: 1,
      },
    };

    api.get.mockResolvedValue(mockSearchResponse);

    render(
      <MemoryRouter initialEntries={['/search?q=react']}>
        <SearchResultsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Searching questions...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Found React Question')).toBeInTheDocument();
    });

    expect(screen.getByText('Results for query:')).toBeInTheDocument();
    expect(screen.getByText('"react"')).toBeInTheDocument();
    expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    expect(screen.getByText('react')).toBeInTheDocument();
  });

  it('renders empty state when no results found', async () => {
    api.get.mockResolvedValue({
      data: {
        content: [],
        totalPages: 1,
      },
    });

    render(
      <MemoryRouter initialEntries={['/search?q=unknownquery']}>
        <SearchResultsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });

    expect(screen.getByText('Back to Home')).toBeInTheDocument();
  });

  it('handles search API failure gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    api.get.mockRejectedValue(new Error('API Error'));

    render(
      <MemoryRouter initialEntries={['/search?q=react']}>
        <SearchResultsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Searching questions...')).not.toBeInTheDocument();
    });
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('does not search if query is empty', () => {
    render(
      <MemoryRouter initialEntries={['/search']}>
        <SearchResultsPage />
      </MemoryRouter>
    );
    expect(api.get).not.toHaveBeenCalled();
  });

  it('handles pagination controls and page clicks', async () => {
    const mockSearchResponse = {
      data: {
        content: [
          {
            id: 1,
            title: 'React Question',
            body: 'Body text here',
            voteCount: 5,
            answerCount: 1,
            viewCount: 10,
            isClosed: true,
            createdAt: new Date().toISOString(), // "just now" formatTime trigger
            authorId: 12,
            authorDisplayName: 'Bob Smith',
            tags: [{ id: 1, name: 'react' }],
            acceptedAnswerId: 42,
          },
        ],
        totalPages: 3,
      },
    };

    api.get.mockResolvedValue(mockSearchResponse);

    const { rerender } = render(
      <MemoryRouter initialEntries={['/search?q=test']}>
        <SearchResultsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('React Question')).toBeInTheDocument();
    });

    // We are on page 1 of 3
    expect(screen.getByText('Page 1 of search results')).toBeInTheDocument();
    const nextBtn = screen.getByRole('button', { name: 'Next' });
    const prevBtn = screen.getByRole('button', { name: 'Previous' });

    expect(prevBtn).toBeDisabled();
    expect(nextBtn).not.toBeDisabled();

    // Click Next
    fireEvent.click(nextBtn);
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/api/search?q=test&page=1&size=10');
    });

    // Mock response for page 2
    mockSearchResponse.data.content[0].createdAt = new Date(Date.now() - 5 * 60000).toISOString(); // "5m ago"
    api.get.mockResolvedValue(mockSearchResponse);
    rerender(
      <MemoryRouter initialEntries={['/search?q=test']}>
        <SearchResultsPage />
      </MemoryRouter>
    );

    // Click Previous
    const prevBtn2 = screen.getByRole('button', { name: 'Previous' });
    expect(prevBtn2).not.toBeDisabled();
    fireEvent.click(prevBtn2);
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/api/search?q=test&page=0&size=10');
    });
  });
});

