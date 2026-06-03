import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VoteButton from '../components/VoteButton';
import { useAuth } from '../context/AuthContext';

// Mock the AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('VoteButton Component', () => {
  let mockLogin;
  let mockOnVote;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLogin = vi.fn();
    mockOnVote = vi.fn();
  });

  it('renders correct score and calls login if unauthenticated on click', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      login: mockLogin,
    });

    render(<VoteButton score={5} userVote={0} onVote={mockOnVote} />);

    expect(screen.getByText('5')).toBeInTheDocument();

    const upBtn = screen.getByTitle('This question/answer is useful');
    const downBtn = screen.getByTitle('This question/answer is not useful');

    fireEvent.click(upBtn);
    expect(mockLogin).toHaveBeenCalledTimes(1);
    expect(mockOnVote).not.toHaveBeenCalled();

    fireEvent.click(downBtn);
    expect(mockLogin).toHaveBeenCalledTimes(2);
  });

  it('calls onVote with 1 or -1 if authenticated on click', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      login: mockLogin,
    });

    render(<VoteButton score={10} userVote={0} onVote={mockOnVote} />);

    const upBtn = screen.getByTitle('This question/answer is useful');
    const downBtn = screen.getByTitle('This question/answer is not useful');

    fireEvent.click(upBtn);
    expect(mockOnVote).toHaveBeenCalledWith(1);

    fireEvent.click(downBtn);
    expect(mockOnVote).toHaveBeenCalledWith(-1);
  });

  it('applies upvoted style and class if userVote is 1', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
    });

    render(<VoteButton score={12} userVote={1} onVote={mockOnVote} />);
    const scoreElement = screen.getByText('12');
    // scoreUp style makes color success
    expect(scoreElement.style.color).toBe('var(--color-success)');
  });

  it('applies downvoted style and class if userVote is -1', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
    });

    render(<VoteButton score={-3} userVote={-1} onVote={mockOnVote} />);
    const scoreElement = screen.getByText('-3');
    // scoreDown style makes color danger
    expect(scoreElement.style.color).toBe('var(--color-danger)');
  });
});
