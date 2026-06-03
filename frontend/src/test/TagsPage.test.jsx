import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import TagsPage from '../pages/TagsPage';
import api from '../api/api';

vi.mock('../api/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('TagsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders and filters tags correctly', async () => {
    const mockTags = [
      { id: 1, name: 'react', description: 'A JS library', questionCount: 15 },
      { id: 2, name: 'java', description: 'A backend lang', questionCount: 8 },
    ];

    api.get.mockResolvedValue({ data: mockTags });

    render(
      <MemoryRouter>
        <TagsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Loading tags...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('react')).toBeInTheDocument();
    });

    expect(screen.getByText('java')).toBeInTheDocument();
    expect(screen.getByText('A JS library')).toBeInTheDocument();
    expect(screen.getByText('A backend lang')).toBeInTheDocument();

    // Search filter
    const searchInput = screen.getByPlaceholderText(/Filter by tag/i);
    fireEvent.change(searchInput, { target: { value: 'react' } });

    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.queryByText('java')).not.toBeInTheDocument();

    // Clear search and find nothing
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    expect(screen.queryByText('react')).not.toBeInTheDocument();
    expect(screen.getByText('No tags found')).toBeInTheDocument();
  });

  it('handles API get failures and empty descriptions', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    api.get.mockRejectedValue(new Error('Tags load error'));

    render(
      <MemoryRouter>
        <TagsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading tags...')).not.toBeInTheDocument();
    });
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('supports paginated response and matching on description search', async () => {
    const mockPaginated = {
      data: {
        content: [
          { id: 1, name: 'javascript', description: 'Web scripting', questionCount: 20 },
          { id: 2, name: 'python', description: '', questionCount: 5 }
        ]
      }
    };
    api.get.mockResolvedValue(mockPaginated);

    render(
      <MemoryRouter>
        <TagsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('javascript')).toBeInTheDocument();
    });

    // Check fallback description for python
    expect(screen.getByText(/No description available for this tag/i)).toBeInTheDocument();

    // Filter by description part
    const searchInput = screen.getByPlaceholderText(/Filter by tag/i);
    fireEvent.change(searchInput, { target: { value: 'scripting' } });

    expect(screen.getByText('javascript')).toBeInTheDocument();
    expect(screen.queryByText('python')).not.toBeInTheDocument();
  });
});
