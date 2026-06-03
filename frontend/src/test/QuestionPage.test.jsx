import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import QuestionPage from '../pages/QuestionPage';
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
    delete: vi.fn(),
  },
}));

describe('QuestionPage Component', () => {
  let mockQuestion;
  let mockAnswers;

  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn().mockReturnValue(true);

    mockQuestion = {
      id: 50,
      title: 'OAuth2 Audience Mismatch',
      body: 'Can anyone help? `inline code` \n\n```javascript\nconst a = 1;\n```',
      voteCount: 3,
      viewCount: 120,
      answerCount: 1,
      isClosed: false,
      acceptedAnswerId: null,
      createdAt: '2026-05-01T12:00:00Z',
      updatedAt: '2026-05-01T14:00:00Z',
      author: { id: 10, username: 'alice', displayName: 'Alice A', reputation: 100 },
      tags: [{ id: 1, name: 'spring-boot' }],
      comments: [{ id: 1, body: 'Nice question', createdAt: '2026-05-01T12:30:00Z', author: { id: 12, displayName: 'Bob' } }],
    };

    mockAnswers = [
      {
        id: 70,
        body: 'Use this config. `inline code` \n\n```javascript\nconst b = 2;\n```',
        voteCount: 2,
        isAccepted: false,
        createdAt: '2026-05-01T13:00:00Z',
        author: { id: 11, username: 'charlie', displayName: 'Charlie C', reputation: 50 },
        comments: [],
      },
    ];

    api.get.mockImplementation((url) => {
      console.log('GET URL:', url);
      if (url.includes('/api/questions/50/answers')) return Promise.resolve({ data: mockAnswers });
      if (url.includes('/api/questions/50')) return Promise.resolve({ data: mockQuestion });
      return Promise.reject(new Error('not found'));
    });
  });

  it('renders question and answer details correctly', async () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { username: 'alice' },
      isAdmin: false,
      isModerator: false,
    });

    render(
      <MemoryRouter initialEntries={['/questions/50']}>
        <Routes>
          <Route path="/questions/:id" element={<QuestionPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Loading question...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('OAuth2 Audience Mismatch')).toBeInTheDocument();
    });

    expect(screen.getByText('Can anyone help?')).toBeInTheDocument();
    expect(screen.getByText('Use this config.')).toBeInTheDocument();
    expect(screen.getByText('Nice question')).toBeInTheDocument();

    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('handles question voting, answer voting, commenting, and answering', async () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { username: 'alice' },
    });

    api.post.mockImplementation((url) => {
      if (url.includes('/api/votes')) return Promise.resolve({ data: {} });
      if (url.includes('/api/questions/50/comments')) {
        return Promise.resolve({
          data: { id: 2, body: 'New comment text', author: { displayName: 'Alice A' } },
        });
      }
      if (url.includes('/api/questions/50/answers')) {
        return Promise.resolve({ data: {} });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    render(
      <MemoryRouter initialEntries={['/questions/50']}>
        <Routes>
          <Route path="/questions/:id" element={<QuestionPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('OAuth2 Audience Mismatch')).toBeInTheDocument();
    });

    const qUpvoteBtn = screen.getAllByTitle('This question/answer is useful')[0];
    fireEvent.click(qUpvoteBtn);
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/votes', { questionId: 50, value: 1 });
      expect(api.get).toHaveBeenCalledTimes(3);
    });

    const addCommentBtn = (await screen.findAllByText('add a comment'))[0];
    fireEvent.click(addCommentBtn);

    const commentInput = screen.getByPlaceholderText('Use comments to ask for clarification. Up to 600 chars.');
    fireEvent.change(commentInput, { target: { value: 'New comment text' } });

    const submitCommentBtn = screen.getByRole('button', { name: 'Add Comment' });
    fireEvent.click(submitCommentBtn);

    await waitFor(() => {
      expect(screen.getByText('New comment text')).toBeInTheDocument();
    });

    const answerTextarea = screen.getByPlaceholderText(/Provide detailed information/i);
    fireEvent.change(answerTextarea, { target: { value: 'This is my newly posted answer!' } });

    const submitAnswerBtn = screen.getByText('Post Your Answer');
    fireEvent.click(submitAnswerBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/questions/50/answers', {
        body: 'This is my newly posted answer!',
      });
    });
  });

  it('handles admin actions like delete, close and accept answer', async () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { username: 'charlie' },
      isAdmin: true,
      isModerator: true,
    });

    api.post.mockResolvedValue({ data: {} });
    api.delete.mockResolvedValue({ data: {} });

    render(
      <MemoryRouter initialEntries={['/questions/50']}>
        <Routes>
          <Route path="/questions/:id" element={<QuestionPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('OAuth2 Audience Mismatch')).toBeInTheDocument();
    });

    const closeBtn = screen.getByText('Close');
    fireEvent.click(closeBtn);

    expect(window.confirm).toHaveBeenCalled();
    expect(api.post).toHaveBeenCalledWith('/api/questions/50/close');

    const deleteBtn = screen.getByText('Delete');
    fireEvent.click(deleteBtn);
    expect(api.delete).toHaveBeenCalledWith('/api/questions/50');
  });

  it('handles question not found / API load failure', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    api.get.mockRejectedValue(new Error('Load failed'));

    render(
      <MemoryRouter initialEntries={['/questions/50']}>
        <Routes>
          <Route path="/questions/:id" element={<QuestionPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Question not found')).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('handles errors for voting, comment submission, and answer submission', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { username: 'alice' },
    });

    api.post.mockRejectedValue(new Error('API failure'));

    render(
      <MemoryRouter initialEntries={['/questions/50']}>
        <Routes>
          <Route path="/questions/:id" element={<QuestionPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('OAuth2 Audience Mismatch')).toBeInTheDocument();
    });

    // 1. Question Vote error
    const qUpvoteBtn = screen.getAllByTitle('This question/answer is useful')[0];
    fireEvent.click(qUpvoteBtn);
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    // 2. Answer Vote error
    const aUpvoteBtn = screen.getAllByTitle('This question/answer is useful')[1];
    fireEvent.click(aUpvoteBtn);
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    // 3. Question Comment error
    const addCommentBtn = screen.getAllByText('add a comment')[0];
    fireEvent.click(addCommentBtn);
    const commentInput = screen.getByPlaceholderText('Use comments to ask for clarification. Up to 600 chars.');
    fireEvent.change(commentInput, { target: { value: 'Err comment' } });
    const submitCommentBtn = screen.getByRole('button', { name: 'Add Comment' });
    fireEvent.click(submitCommentBtn);
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    // 4. Answer Post error
    const answerTextarea = screen.getByPlaceholderText(/Provide detailed information/i);
    fireEvent.change(answerTextarea, { target: { value: 'Err answer' } });
    const submitAnswerBtn = screen.getByText('Post Your Answer');
    fireEvent.click(submitAnswerBtn);
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it('handles close/delete confirmation cancels, and actions errors', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { username: 'charlie' },
      isAdmin: true,
      isModerator: true,
    });

    render(
      <MemoryRouter initialEntries={['/questions/50']}>
        <Routes>
          <Route path="/questions/:id" element={<QuestionPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('OAuth2 Audience Mismatch')).toBeInTheDocument();
    });

    // Cancel confirms
    window.confirm = vi.fn().mockReturnValue(false);
    
    const closeBtn = screen.getByText('Close');
    fireEvent.click(closeBtn);
    expect(api.post).not.toHaveBeenCalledWith('/api/questions/50/close');

    const deleteBtn = screen.getByText('Delete');
    fireEvent.click(deleteBtn);
    expect(api.delete).not.toHaveBeenCalledWith('/api/questions/50');

    // Restore confirm to true, trigger API errors
    window.confirm = vi.fn().mockReturnValue(true);
    api.post.mockRejectedValue(new Error('Close/Accept error'));
    api.delete.mockRejectedValue(new Error('Delete error'));

    fireEvent.click(closeBtn);
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    fireEvent.click(deleteBtn);
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it('handles question comment cancellation, empty checks, and unauthenticated login clicks', async () => {
    const mockLogin = vi.fn();
    useAuth.mockReturnValue({
      isAuthenticated: false,
      login: mockLogin,
    });

    render(
      <MemoryRouter initialEntries={['/questions/50']}>
        <Routes>
          <Route path="/questions/:id" element={<QuestionPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('OAuth2 Audience Mismatch')).toBeInTheDocument();
    });

    // Check login links
    const loginTextLink = screen.getAllByText('log in', { selector: 'span' })[0];
    fireEvent.click(loginTextLink);
    expect(mockLogin).toHaveBeenCalledTimes(1);

    const loginTextLink2 = screen.getByText('log in', { selector: 'strong' });
    fireEvent.click(loginTextLink2);
    expect(mockLogin).toHaveBeenCalledTimes(2);

    // Swap back to authenticated to test comment cancellations/empty validation
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { username: 'alice' },
    });

    const { rerender } = render(
      <MemoryRouter initialEntries={['/questions/50']}>
        <Routes>
          <Route path="/questions/:id" element={<QuestionPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('OAuth2 Audience Mismatch')).toBeInTheDocument();
    });

    // Open comment form
    const addCommentBtn = screen.getAllByText('add a comment')[0];
    fireEvent.click(addCommentBtn);

    // Cancel it
    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelBtn);
    expect(screen.queryByPlaceholderText('Use comments to ask for clarification. Up to 600 chars.')).not.toBeInTheDocument();

    // Open again, trigger empty submit
    fireEvent.click(screen.getAllByText('add a comment')[0]);
    const commentInput = screen.getByPlaceholderText('Use comments to ask for clarification. Up to 600 chars.');
    fireEvent.change(commentInput, { target: { value: '   ' } });
    const form = commentInput.closest('form');
    fireEvent.submit(form);
    expect(api.post).not.toHaveBeenCalled();
  });

  it('handles answer comments actions: add, cancel, submit empty, and submit error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { username: 'alice' }, // Alice is question owner, charlie is answer owner
    });

    render(
      <MemoryRouter initialEntries={['/questions/50']}>
        <Routes>
          <Route path="/questions/:id" element={<QuestionPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('OAuth2 Audience Mismatch')).toBeInTheDocument();
    });

    // Answer comment trigger is index 1
    const addAnsCommentBtn = screen.getAllByText('add a comment')[1];
    fireEvent.click(addAnsCommentBtn);

    const cancelAnsCommentBtn = screen.getAllByRole('button', { name: 'Cancel' })[0];
    fireEvent.click(cancelAnsCommentBtn);

    // Open again, write empty and submit
    fireEvent.click(screen.getAllByText('add a comment')[1]);
    const inputField = screen.getByPlaceholderText('Use comments to ask for clarification. Up to 600 chars.');
    fireEvent.change(inputField, { target: { value: '   ' } });
    const form = inputField.closest('form');
    fireEvent.submit(form);
    expect(api.post).not.toHaveBeenCalled();

    // Now submit valid, but fails API
    api.post.mockRejectedValue(new Error('Answer comment failure'));
    fireEvent.change(inputField, { target: { value: 'Valid comment' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    // Now submit successfully
    api.post.mockResolvedValue({
      data: { id: 3, body: 'Nice answer comment', author: { displayName: 'Alice A' }, createdAt: '2026-05-01T14:00:00Z' }
    });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Nice answer comment')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('handles accepting answer and error paths', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { username: 'alice' }, // Alice is question owner, so she can accept Charlie's answer
    });

    api.post.mockRejectedValue(new Error('Accept error'));

    render(
      <MemoryRouter initialEntries={['/questions/50']}>
        <Routes>
          <Route path="/questions/:id" element={<QuestionPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('OAuth2 Audience Mismatch')).toBeInTheDocument();
    });

    const acceptBtn = screen.getByTitle('Accept this answer');
    fireEvent.click(acceptBtn);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    // Accept succeeds
    api.post.mockResolvedValue({ data: {} });
    api.get.mockImplementation((url) => {
      if (url.includes('/api/questions/50/answers')) return Promise.resolve({ data: mockAnswers });
      if (url.includes('/api/questions/50')) return Promise.resolve({ data: { ...mockQuestion, acceptedAnswerId: 70 } });
      return Promise.reject(new Error('not found'));
    });
    fireEvent.click(acceptBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/questions/50/accept/70');
    });

    consoleSpy.mockRestore();
  });
});

