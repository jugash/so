import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import MarkdownEditor from '../components/MarkdownEditor';
import { HelpCircle, X, Plus, Info } from 'lucide-react';

const AskPage = () => {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [directedUserInput, setDirectedUserInput] = useState('');
  const [selectedDirectedUser, setSelectedDirectedUser] = useState(null);
  const [directedUserSuggestions, setDirectedUserSuggestions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      login();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!tagInput.trim()) {
        setSuggestions([]);
        return;
      }
      try {
        const response = await api.get(`/api/tags/search?q=${encodeURIComponent(tagInput.trim())}`);
        setSuggestions(response.data || []);
      } catch (err) {
        console.error('Error fetching tag suggestions:', err);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchSuggestions();
    }, 200);

    return () => clearTimeout(delayDebounceFn);
  }, [tagInput]);

  useEffect(() => {
    const fetchUserSuggestions = async () => {
      if (!directedUserInput.trim() || selectedDirectedUser) {
        setDirectedUserSuggestions([]);
        return;
      }
      try {
        const response = await api.get(`/api/users/search?q=${encodeURIComponent(directedUserInput.trim())}`);
        setDirectedUserSuggestions(response.data || []);
      } catch (err) {
        console.error('Error fetching user suggestions:', err);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchUserSuggestions();
    }, 200);

    return () => clearTimeout(delayDebounceFn);
  }, [directedUserInput, selectedDirectedUser]);

  const handleAddTag = (tagName) => {
    const cleanName = tagName.trim().toLowerCase().replace(/[^a-z0-9+#-]/g, '');
    if (!cleanName) return;
    if (selectedTags.includes(cleanName)) {
      setTagInput('');
      setSuggestions([]);
      return;
    }
    if (selectedTags.length >= 5) {
      setError('You can add a maximum of 5 tags');
      return;
    }
    setSelectedTags([...selectedTags, cleanName]);
    setTagInput('');
    setSuggestions([]);
    setError('');
  };

  const handleRemoveTag = (indexToRemove) => {
    setSelectedTags(selectedTags.filter((_, index) => index !== indexToRemove));
  };

  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (tagInput.trim()) {
        handleAddTag(tagInput);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (title.trim().length < 10) {
      setError('Title must be at least 10 characters long.');
      return;
    }
    if (body.trim().length < 20) {
      setError('Question body must be at least 20 characters long.');
      return;
    }
    if (selectedTags.length === 0) {
      setError('Please add at least one tag to categorise your question.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/api/questions', {
        title: title.trim(),
        body: body.trim(),
        tags: selectedTags,
        directedToUserId: selectedDirectedUser ? selectedDirectedUser.id : null,
      });
      navigate(`/questions/${response.data.id}`);
    } catch (err) {
      console.error('Error submitting question:', err);
      setError(
        err.response?.data?.message || 
        'An error occurred while posting your question. Please verify inputs.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.container} className="fade-in">
      <h1 style={styles.title}>Ask a public question</h1>

      <div style={styles.mainGrid}>
        {/* Ask Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div style={styles.errorAlert}>{error}</div>}

          {/* Title Card */}
          <div className="card" style={styles.formCard}>
            <div style={styles.cardHeader}>
              <label htmlFor="question-title" className="input-label" style={styles.formLabel}>Title</label>
              <span style={styles.formHint}>Be specific and imagine you’re asking a question to another person.</span>
            </div>
            <input
              id="question-title"
              type="text"
              placeholder="e.g. How to resolve Spring Boot OAuth2 Resource Server audience claim mismatch?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="input-control"
              style={styles.titleInput}
            />
          </div>

          {/* Body Card */}
          <div className="card" style={styles.formCard}>
            <div style={styles.cardHeader}>
              <label className="input-label" style={styles.formLabel}>What are the details of your problem?</label>
              <span style={styles.formHint}>Introduce the problem and expand on what you put in the title. Minimum 20 characters. Full Markdown supported.</span>
            </div>
            <MarkdownEditor 
              value={body} 
              onChange={setBody} 
              placeholder="Explain the background context, what you have tried, paste code configurations, logs or trace results here..."
              rows={14}
            />
          </div>

          {/* Tags Card */}
          <div className="card" style={styles.formCard}>
            <div style={styles.cardHeader}>
              <label htmlFor="question-tags" className="input-label" style={styles.formLabel}>Tags</label>
              <span style={styles.formHint}>Add up to 5 tags to describe what your question is about. Type and press Enter or comma.</span>
            </div>
            
            <div style={styles.tagInputWrapper}>
              <div style={styles.tagBadgesList}>
                {selectedTags.map((tag, idx) => (
                  <span key={tag} className="badge tag-badge" style={styles.selectedTag}>
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(idx)} style={styles.removeTagBtn}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              
              <div style={{ position: 'relative' }}>
                <input
                  id="question-tags"
                  type="text"
                  placeholder="e.g. spring-boot, react, keycloak"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  className="input-control"
                  style={styles.tagsInput}
                  disabled={selectedTags.length >= 5}
                />
                
                {/* Suggestions Dropdown */}
                {suggestions.length > 0 && (
                  <div style={styles.dropdown}>
                    {suggestions.map((sug) => (
                      <div 
                        key={sug.id} 
                        onClick={() => handleAddTag(sug.name)}
                        style={styles.dropdownItem}
                      >
                        <span style={styles.sugName}>{sug.name}</span>
                        <span style={styles.sugDesc}>{sug.description ? `– ${sug.description}` : ''}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Direct to User Card */}
          <div className="card" style={styles.formCard}>
            <div style={styles.cardHeader}>
              <label htmlFor="directed-user" className="input-label" style={styles.formLabel}>Direct to User (Optional)</label>
              <span style={styles.formHint}>Want to specifically notify a colleague about this question? Search for their username or name.</span>
            </div>
            
            <div style={styles.tagInputWrapper}>
              {selectedDirectedUser ? (
                <div style={styles.tagBadgesList}>
                  <span className="badge tag-badge" style={styles.selectedTag}>
                    @{selectedDirectedUser.username} ({selectedDirectedUser.displayName})
                    <button type="button" onClick={() => { setSelectedDirectedUser(null); setDirectedUserInput(''); }} style={styles.removeTagBtn}>
                      <X size={12} />
                    </button>
                  </span>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <input
                    id="directed-user"
                    type="text"
                    placeholder="Search users..."
                    value={directedUserInput}
                    onChange={(e) => setDirectedUserInput(e.target.value)}
                    className="input-control"
                    style={styles.tagsInput}
                  />
                  
                  {/* Suggestions Dropdown */}
                  {directedUserSuggestions.length > 0 && (
                    <div style={styles.dropdown}>
                      {directedUserSuggestions.map((user) => (
                        <div 
                          key={user.id} 
                          onClick={() => { setSelectedDirectedUser(user); setDirectedUserSuggestions([]); }}
                          style={styles.dropdownItem}
                        >
                          <span style={styles.sugName}>@{user.username}</span>
                          <span style={styles.sugDesc}>– {user.displayName} (Rep: {user.reputation})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', marginTop: '12px' }}>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={submitting || !title.trim() || !body.trim() || selectedTags.length === 0}
            >
              {submitting ? 'Posting your question...' : 'Post Your Question'}
            </button>
          </div>
        </form>

        {/* Sidebar Help */}
        <aside style={styles.helpSidebar}>
          <div className="card" style={styles.helpCard}>
            <h3 style={styles.helpTitle}>Writing a good question</h3>
            <p style={styles.helpText}>
              You’re ready to ask a programming-related question and this guide will help focus your thoughts.
            </p>
            <div style={styles.helpSteps}>
              <div style={styles.stepItem}>
                <div style={styles.stepNum}>1</div>
                <div>
                  <h4 style={styles.stepTitle}>Summarize the problem</h4>
                  <p style={styles.stepDesc}>Include details about your environment, dependencies, and code configuration.</p>
                </div>
              </div>
              <div style={styles.stepItem}>
                <div style={styles.stepNum}>2</div>
                <div>
                  <h4 style={styles.stepTitle}>Describe what you tried</h4>
                  <p style={styles.stepDesc}>Explain what outcomes you expected and what actually happened, highlighting error codes.</p>
                </div>
              </div>
              <div style={styles.stepItem}>
                <div style={styles.stepNum}>3</div>
                <div>
                  <h4 style={styles.stepTitle}>Add code blocks</h4>
                  <p style={styles.stepDesc}>Format code beautifully inside markdown code fences so others can run it.</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

const styles = {
  container: {
    paddingBottom: '60px',
    textAlign: 'left',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '28px',
  },
  mainGrid: {
    display: 'flex',
    gap: '24px',
  },
  form: {
    flex: '1',
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  errorAlert: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid var(--color-danger)',
    color: '#f87171',
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.9rem',
    fontWeight: '500',
  },
  formCard: {
    padding: '24px',
  },
  cardHeader: {
    marginBottom: '14px',
  },
  formLabel: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    display: 'block',
    marginBottom: '4px',
  },
  formHint: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    display: 'block',
  },
  titleInput: {
    fontSize: '1rem',
  },
  tagInputWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  tagBadgesList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  selectedTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    fontSize: '0.85rem',
    borderRadius: 'var(--radius-sm)',
  },
  removeTagBtn: {
    background: 'transparent',
    border: 'none',
    color: 'inherit',
    cursor: 'pointer',
    padding: '2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    transition: 'var(--transition-fast)',
  },
  tagsInput: {
    fontSize: '0.95rem',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    zIndex: 10,
    maxHeight: '200px',
    overflowY: 'auto',
    marginTop: '4px',
    boxShadow: 'var(--shadow-lg)',
  },
  dropdownItem: {
    padding: '10px 16px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'var(--transition-fast)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.02)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  sugName: {
    color: 'var(--color-primary)',
    fontWeight: '600',
  },
  sugDesc: {
    color: 'var(--text-secondary)',
    fontSize: '0.8rem',
  },
  helpSidebar: {
    width: '320px',
    flexShrink: 0,
  },
  helpCard: {
    padding: '20px',
  },
  helpTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '10px',
    marginBottom: '14px',
  },
  helpText: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
    marginBottom: '20px',
  },
  helpSteps: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  stepItem: {
    display: 'flex',
    gap: '12px',
  },
  stepNum: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: 'var(--bg-tertiary)',
    color: 'var(--color-primary)',
    border: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.85rem',
    fontWeight: '700',
    flexShrink: 0,
  },
  stepTitle: {
    fontSize: '0.88rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '2px',
  },
  stepDesc: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
  },
};

// Inject CSS styles dynamically for dropdown hover
if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.innerHTML = `
    div[onClick]:hover {
      background: var(--bg-tertiary) !important;
    }
    .removeTagBtn:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  `;
  document.head.appendChild(styleTag);
}

export default AskPage;
