import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AskPage from '../pages/AskPage';
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
    post: vi.fn(),
  },
}));

describe('AskPage Component', () => {
  let mockLogin;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLogin = vi.fn();
  });

  it('redirects to login if unauthenticated', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      login: mockLogin,
    });

    render(
      <MemoryRouter>
        <AskPage />
      </MemoryRouter>
    );

    expect(mockLogin).toHaveBeenCalledTimes(1);
  });

  it('renders correctly and handles tag creation, deletion and validations', async () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
    });

    api.get.mockResolvedValue({
      data: [{ id: 1, name: 'react', description: 'React JS' }],
    });

    render(
      <MemoryRouter>
        <AskPage />
      </MemoryRouter>
    );

    const titleInput = screen.getByLabelText('Title');
    const tagInput = screen.getByLabelText('Tags');

    // 1. Submit empty form (should be disabled by disabled expression in button)
    const submitBtn = screen.getByRole('button', { name: /Post Your Question/i });
    expect(submitBtn).toBeDisabled();

    // 2. Set title
    fireEvent.change(titleInput, { target: { value: 'Too Short' } });

    // 3. Set body (MarkdownEditor is rendered, we can find textarea by placeholder)
    const bodyTextarea = screen.getByPlaceholderText(/Explain the background context/i);
    fireEvent.change(bodyTextarea, { target: { value: 'This is the body content which is short' } });

    // 4. Test typing and adding tags
    fireEvent.change(tagInput, { target: { value: 'react' } });

    // Wait for debounce search suggestion mock
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/api/tags/search?q=react');
    });

    // Select suggestion to add tag
    await waitFor(() => {
      const suggestion = screen.getByText(/React JS/);
      expect(suggestion).toBeInTheDocument();
      fireEvent.click(suggestion);
    });

    // Verify tag is added
    expect(screen.getByText('react')).toBeInTheDocument();

    // Submit with short title validation check (since submit button is disabled by DOM if fields empty, but let's test custom validation code paths by setting values and calling submit)
    // To trigger form submit, we can fill details and submit form
    fireEvent.change(titleInput, { target: { value: 'Valid Title of the Question' } });
    fireEvent.change(bodyTextarea, { target: { value: 'Valid Body Content of the Question that is more than twenty characters long' } });

    expect(submitBtn).not.toBeDisabled();

    api.post.mockResolvedValue({ data: { id: 999 } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/questions', {
        title: 'Valid Title of the Question',
        body: 'Valid Body Content of the Question that is more than twenty characters long',
        tags: ['react'],
        directedToUserId: null,
      });
      expect(mockNavigate).toHaveBeenCalledWith('/questions/999');
    });
  });

  it('handles validation error messages and API post failure', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    useAuth.mockReturnValue({
      isAuthenticated: true,
    });

    render(
      <MemoryRouter>
        <AskPage />
      </MemoryRouter>
    );

    const titleInput = screen.getByLabelText('Title');
    const bodyTextarea = screen.getByPlaceholderText(/Explain the background context/i);
    const tagInput = screen.getByLabelText('Tags');
    const form = titleInput.closest('form');

    // 1. Title < 10 characters
    fireEvent.change(titleInput, { target: { value: 'Short' } });
    fireEvent.submit(form);
    expect(screen.getByText('Title must be at least 10 characters long.')).toBeInTheDocument();

    // 2. Body < 20 characters
    fireEvent.change(titleInput, { target: { value: 'This is a long enough title' } });
    fireEvent.change(bodyTextarea, { target: { value: 'short body' } });
    fireEvent.submit(form);
    expect(screen.getByText('Question body must be at least 20 characters long.')).toBeInTheDocument();

    // 3. No tags added
    fireEvent.change(bodyTextarea, { target: { value: 'This is a long enough body for the question to pass the validation' } });
    fireEvent.submit(form);
    expect(screen.getByText('Please add at least one tag to categorise your question.')).toBeInTheDocument();

    // 4. API submission failure
    // Add a tag first
    fireEvent.change(tagInput, { target: { value: 'java' } });
    fireEvent.keyDown(tagInput, { key: 'Enter', code: 'Enter' });

    const mockErrorResponse = {
      response: {
        data: {
          message: 'Backend validation error for question'
        }
      }
    };
    api.post.mockRejectedValue(mockErrorResponse);
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Backend validation error for question')).toBeInTheDocument();
    });

    // 5. API submission failure without error message
    api.post.mockRejectedValue(new Error('Generic failure'));
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('An error occurred while posting your question. Please verify inputs.')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('handles duplicate tags, tag limit of 5, tag removal, and tag input keydowns', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    useAuth.mockReturnValue({ isAuthenticated: true });
    api.get.mockRejectedValue(new Error('Tag search failed'));

    render(
      <MemoryRouter>
        <AskPage />
      </MemoryRouter>
    );

    const tagInput = screen.getByLabelText('Tags');

    // Test search suggestion failure console log
    fireEvent.change(tagInput, { target: { value: 'react' } });
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/api/tags/search?q=react');
    });
    expect(consoleSpy).toHaveBeenCalled();

    // Test search suggestion empty tagInput triggers early return
    fireEvent.change(tagInput, { target: { value: '   ' } });
    await waitFor(() => {
      // Allow debounce timeout to fire and run the !tagInput.trim() branch
    });

    // Test adding tag with Comma key
    fireEvent.change(tagInput, { target: { value: 'react' } });
    fireEvent.keyDown(tagInput, { key: ',' });
    expect(screen.getByText('react')).toBeInTheDocument();

    // Test duplicate tag
    fireEvent.change(tagInput, { target: { value: 'react' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });
    // should still only have 1 tag
    const tags = screen.getAllByText('react');
    expect(tags.length).toBe(1);

    // Test adding empty tag or spaces
    fireEvent.change(tagInput, { target: { value: '   ' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });
    // no change

    // Test other key down (should not add tag)
    fireEvent.change(tagInput, { target: { value: 'vue' } });
    fireEvent.keyDown(tagInput, { key: 'a' });
    expect(screen.queryByText('vue')).not.toBeInTheDocument();

    // Test adding more than 5 tags
    const extraTags = ['angular', 'vue', 'svelte', 'ember', 'backbone'];
    for (const t of extraTags) {
      fireEvent.change(tagInput, { target: { value: t } });
      fireEvent.keyDown(tagInput, { key: 'Enter' });
    }

    // React, Angular, Vue, Svelte, Ember should be present. Backbone should trigger error
    expect(screen.getByText('angular')).toBeInTheDocument();
    expect(screen.getByText('vue')).toBeInTheDocument();
    expect(screen.getByText('svelte')).toBeInTheDocument();
    expect(screen.getByText('ember')).toBeInTheDocument();
    expect(screen.queryByText('backbone')).not.toBeInTheDocument();
    expect(screen.getByText('You can add a maximum of 5 tags')).toBeInTheDocument();

    // Remove a tag
    const reactTagElement = screen.getByText('react');
    const removeTagBtn = reactTagElement.querySelector('button');
    fireEvent.click(removeTagBtn);
    // 'react' tag should be gone
    expect(screen.queryByText('react')).not.toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});

