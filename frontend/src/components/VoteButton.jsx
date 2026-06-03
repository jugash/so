import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const VoteButton = ({ score, userVote, onVote }) => {
  const { isAuthenticated, login } = useAuth();

  const handleUpvote = () => {
    if (!isAuthenticated) {
      login();
      return;
    }
    onVote(1);
  };

  const handleDownvote = () => {
    if (!isAuthenticated) {
      login();
      return;
    }
    onVote(-1);
  };

  return (
    <div style={styles.container}>
      <button 
        onClick={handleUpvote} 
        style={{
          ...styles.arrowBtn,
          ...(userVote === 1 ? styles.upvoted : {})
        }}
        title="This question/answer is useful"
      >
        <ChevronUp size={32} strokeWidth={2.5} />
      </button>

      <span style={{
        ...styles.score,
        ...(userVote === 1 ? styles.scoreUp : userVote === -1 ? styles.scoreDown : {})
      }}>
        {score}
      </span>

      <button 
        onClick={handleDownvote} 
        style={{
          ...styles.arrowBtn,
          ...(userVote === -1 ? styles.downvoted : {})
        }}
        title="This question/answer is not useful"
      >
        <ChevronDown size={32} strokeWidth={2.5} />
      </button>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    width: '48px',
  },
  arrowBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'var(--transition-fast)',
  },
  upvoted: {
    color: 'var(--color-success)',
    background: 'rgba(16, 185, 129, 0.1)',
  },
  downvoted: {
    color: 'var(--color-danger)',
    background: 'rgba(239, 108, 108, 0.1)',
  },
  score: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    userSelect: 'none',
  },
  scoreUp: {
    color: 'var(--color-success)',
  },
  scoreDown: {
    color: 'var(--color-danger)',
  },
};

// Add styles dynamically for hover effects on chevrons
if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.innerHTML = `
    button[title]:hover {
      background: var(--bg-tertiary);
    }
  `;
  document.head.appendChild(styleTag);
}

export default VoteButton;
