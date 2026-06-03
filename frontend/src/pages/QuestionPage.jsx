import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  MessageSquare, Eye, Award, CheckCircle, Clock, Trash2, 
  Lock, MessageCircle, ArrowLeft, ShieldAlert
} from 'lucide-react';
import VoteButton from '../components/VoteButton';
import MarkdownEditor from '../components/MarkdownEditor';

const QuestionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, login, isAdmin, isModerator } = useAuth();
  
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newAnswer, setNewAnswer] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  
  // Comments UI state
  const [questionComment, setQuestionComment] = useState('');
  const [showQCommentForm, setShowQCommentForm] = useState(false);
  const [answerComment, setAnswerComment] = useState({}); // { [answerId]: '' }
  const [showACommentForm, setShowACommentForm] = useState({}); // { [answerId]: boolean }

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const qRes = await api.get(`/api/questions/${id}`);
      setQuestion(qRes.data);

      const aRes = await api.get(`/api/questions/${id}/answers`);
      setAnswers(aRes.data);
    } catch (err) {
      console.error('Error fetching question detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVoteQuestion = async (value) => {
    try {
      await api.post('/api/votes', { questionId: parseInt(id), value });
      // Reload to reflect vote
      const qRes = await api.get(`/api/questions/${id}`);
      setQuestion(qRes.data);
    } catch (err) {
      console.error('Error voting on question:', err);
    }
  };

  const handleVoteAnswer = async (answerId, value) => {
    try {
      await api.post('/api/votes', { answerId, value });
      // Reload answers
      const aRes = await api.get(`/api/questions/${id}/answers`);
      setAnswers(aRes.data);
    } catch (err) {
      console.error('Error voting on answer:', err);
    }
  };

  const handleAddQuestionComment = async (e) => {
    e.preventDefault();
    if (!questionComment.trim()) return;

    try {
      const response = await api.post(`/api/questions/${id}/comments`, { body: questionComment });
      setQuestion(prev => ({
        ...prev,
        comments: [...(prev.comments || []), response.data]
      }));
      setQuestionComment('');
      setShowQCommentForm(false);
    } catch (err) {
      console.error('Error adding question comment:', err);
    }
  };

  const handleAddAnswerComment = async (e, answerId) => {
    e.preventDefault();
    const commentBody = answerComment[answerId];
    if (!commentBody || !commentBody.trim()) return;

    try {
      const response = await api.post(`/api/answers/${answerId}/comments`, { body: commentBody });
      setAnswers(prevAnswers => prevAnswers.map(ans => {
        if (ans.id === answerId) {
          return {
            ...ans,
            comments: [...(ans.comments || []), response.data]
          };
        }
        return ans;
      }));
      setAnswerComment(prev => ({ ...prev, [answerId]: '' }));
      setShowACommentForm(prev => ({ ...prev, [answerId]: false }));
    } catch (err) {
      console.error('Error adding answer comment:', err);
    }
  };

  const handleAcceptAnswer = async (answerId) => {
    try {
      await api.post(`/api/questions/${id}/accept/${answerId}`);
      // Reload everything
      const qRes = await api.get(`/api/questions/${id}`);
      setQuestion(qRes.data);
      const aRes = await api.get(`/api/questions/${id}/answers`);
      setAnswers(aRes.data);
    } catch (err) {
      console.error('Error accepting answer:', err);
    }
  };

  const handleCloseQuestion = async () => {
    if (!window.confirm('Are you sure you want to close this question to new answers?')) return;
    try {
      await api.post(`/api/questions/${id}/close`);
      setQuestion(prev => ({ ...prev, isClosed: true }));
    } catch (err) {
      console.error('Error closing question:', err);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!window.confirm('Are you sure you want to delete this question? This action is permanent.')) return;
    try {
      await api.delete(`/api/questions/${id}`);
      navigate('/');
    } catch (err) {
      console.error('Error deleting question:', err);
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!newAnswer.trim()) return;

    setSubmittingAnswer(true);
    try {
      await api.post(`/api/questions/${id}/answers`, { body: newAnswer });
      setNewAnswer('');
      // Reload answers
      const aRes = await api.get(`/api/questions/${id}/answers`);
      setAnswers(aRes.data);
      // Reload question stats
      const qRes = await api.get(`/api/questions/${id}`);
      setQuestion(qRes.data);
    } catch (err) {
      console.error('Error submitting answer:', err);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '100px' }}>Loading question...</div>;
  }

  if (!question) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <ShieldAlert size={48} style={{ color: 'var(--color-danger)', marginBottom: '16px' }} />
        <h2>Question not found</h2>
        <Link to="/" className="btn btn-secondary" style={{ marginTop: '16px' }}>
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </div>
    );
  }

  // Permissions check
  const isQuestionOwner = user && user.username === question.author.username;
  const canDeleteQuestion = isAdmin || isQuestionOwner;
  const canCloseQuestion = isModerator || isAdmin;

  return (
    <div style={styles.container} className="fade-in">
      {/* Back Button */}
      <Link to="/" style={styles.backLink}>
        <ArrowLeft size={16} /> Back to questions
      </Link>

      {/* Title */}
      <div style={styles.header}>
        <h1 style={styles.title}>
          {question.title}
          {question.isClosed && <span style={styles.closedBadge}>[Closed]</span>}
        </h1>
        <div style={styles.metaRow}>
          <div style={styles.metaItem}>
            <Clock size={14} />
            <span>Asked {formatTime(question.createdAt)}</span>
          </div>
          <div style={styles.metaItem}>
            <Eye size={14} />
            <span>{question.viewCount} views</span>
          </div>
          {question.updatedAt !== question.createdAt && (
            <div style={styles.metaItem}>
              <span>Active {formatTime(question.updatedAt)}</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', margin: '20px 0' }}>
        {/* Main Q&A Section */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Question Block */}
          <div className="card" style={styles.mainBlock}>
            <div style={styles.leftCol}>
              <VoteButton 
                score={question.voteCount} 
                userVote={question.userVote} 
                onVote={handleVoteQuestion} 
              />
            </div>
            
            <div style={styles.rightCol}>
              {/* Question Body */}
              <div className="markdown-content" style={{ textAlign: 'left' }}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={atomDark}
                          language={match[1]}
                          PreTag="div"
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {question.body}
                </ReactMarkdown>
              </div>

              {/* Tags */}
              <div style={styles.tagsContainer}>
                {question.tags?.map((t) => (
                  <Link key={t.id} to={`/?tag=${t.name}`} className="badge tag-badge">
                    {t.name}
                  </Link>
                ))}
              </div>

              {/* Author & Actions Row */}
              <div style={styles.cardActionsRow}>
                {/* Admin/Mod/Owner Actions */}
                <div style={styles.actionsGroup}>
                  {canCloseQuestion && !question.isClosed && (
                    <button onClick={handleCloseQuestion} style={styles.actionBtn}>
                      <Lock size={14} />
                      Close
                    </button>
                  )}
                  {canDeleteQuestion && (
                    <button onClick={handleDeleteQuestion} style={styles.deleteBtn}>
                      <Trash2 size={14} />
                      Delete
                    </button>
                  )}
                </div>

                {/* Author Info */}
                <div style={styles.authorBox}>
                  <div style={styles.authorHeader}>asked by</div>
                  <div style={styles.authorDetail}>
                    <Link to={`/users/${question.author.id}`} style={styles.authorName}>
                      {question.author.displayName}
                    </Link>
                    <span style={styles.reputation}>{question.author.reputation}</span>
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              <div style={styles.commentsArea}>
                <div style={styles.commentsList}>
                  {question.comments?.map((c) => (
                    <div key={c.id} style={styles.commentItem}>
                      <span style={styles.commentBody}>{c.body}</span>
                      <span style={styles.commentMeta}>
                        –{' '}
                        <Link to={`/users/${c.author.id}`} style={styles.commentAuthor}>
                          {c.author.displayName}
                        </Link>{' '}
                        <span style={{ color: 'var(--text-muted)' }}>{formatTime(c.createdAt)}</span>
                      </span>
                    </div>
                  ))}
                </div>

                {isAuthenticated ? (
                  <div style={{ marginTop: '10px' }}>
                    {!showQCommentForm ? (
                      <button 
                        onClick={() => setShowQCommentForm(true)} 
                        style={styles.addCommentTrigger}
                      >
                        add a comment
                      </button>
                    ) : (
                      <form onSubmit={handleAddQuestionComment} style={styles.commentForm}>
                        <input
                          type="text"
                          placeholder="Use comments to ask for clarification. Up to 600 chars."
                          value={questionComment}
                          onChange={(e) => setQuestionComment(e.target.value)}
                          maxLength={600}
                          style={styles.commentInput}
                          className="input-control"
                        />
                        <div style={styles.commentActions}>
                          <button type="submit" className="btn btn-primary btn-sm">
                            Add Comment
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-secondary btn-sm"
                            onClick={() => setShowQCommentForm(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    Please <span onClick={login} style={{ color: 'var(--color-primary)', cursor: 'pointer', fontWeight: '600' }}>log in</span> to add comments.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Answers Header */}
          <div style={styles.answersHeader}>
            <h2>{answers.length} Answers</h2>
          </div>

          {/* Answers List */}
          <div style={styles.answersList}>
            {answers.map((ans) => {
              const isAccepted = question.acceptedAnswerId === ans.id;
              
              return (
                <div key={ans.id} className="card" style={{
                  ...styles.mainBlock,
                  ...(isAccepted ? styles.acceptedCard : {})
                }}>
                  <div style={styles.leftCol}>
                    <VoteButton 
                      score={ans.voteCount} 
                      userVote={ans.userVote} 
                      onVote={(val) => handleVoteAnswer(ans.id, val)} 
                    />
                    {isAccepted ? (
                      <div style={styles.acceptedIndicator} title="Accepted by author">
                        <CheckCircle size={32} style={{ color: 'var(--color-success)', fill: 'rgba(16, 185, 129, 0.1)' }} />
                      </div>
                    ) : (
                      isQuestionOwner && (
                        <button 
                          onClick={() => handleAcceptAnswer(ans.id)} 
                          style={styles.acceptBtn}
                          title="Accept this answer"
                        >
                          <CheckCircle size={28} />
                        </button>
                      )
                    )}
                  </div>

                  <div style={styles.rightCol}>
                    {/* Answer Body */}
                    <div className="markdown-content" style={{ textAlign: 'left' }}>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ node, inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline && match ? (
                              <SyntaxHighlighter
                                style={atomDark}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {ans.body}
                      </ReactMarkdown>
                    </div>

                    {/* Author & Metadata Row */}
                    <div style={styles.cardActionsRow}>
                      <div />
                      <div style={styles.authorBox}>
                        <div style={styles.authorHeader}>answered {formatTime(ans.createdAt)} by</div>
                        <div style={styles.authorDetail}>
                          <Link to={`/users/${ans.author.id}`} style={styles.authorName}>
                            {ans.author.displayName}
                          </Link>
                          <span style={styles.reputation}>{ans.author.reputation}</span>
                        </div>
                      </div>
                    </div>

                    {/* Answer Comments Section */}
                    <div style={styles.commentsArea}>
                      <div style={styles.commentsList}>
                        {ans.comments?.map((c) => (
                          <div key={c.id} style={styles.commentItem}>
                            <span style={styles.commentBody}>{c.body}</span>
                            <span style={styles.commentMeta}>
                              –{' '}
                              <Link to={`/users/${c.author.id}`} style={styles.commentAuthor}>
                                {c.author.displayName}
                              </Link>{' '}
                              <span style={{ color: 'var(--text-muted)' }}>{formatTime(c.createdAt)}</span>
                            </span>
                          </div>
                        ))}
                      </div>

                      {isAuthenticated ? (
                        <div style={{ marginTop: '10px' }}>
                          {!showACommentForm[ans.id] ? (
                            <button 
                              onClick={() => setShowACommentForm(prev => ({ ...prev, [ans.id]: true }))} 
                              style={styles.addCommentTrigger}
                            >
                              add a comment
                            </button>
                          ) : (
                            <form onSubmit={(e) => handleAddAnswerComment(e, ans.id)} style={styles.commentForm}>
                              <input
                                type="text"
                                placeholder="Use comments to ask for clarification. Up to 600 chars."
                                value={answerComment[ans.id] || ''}
                                onChange={(e) => setAnswerComment(prev => ({ ...prev, [ans.id]: e.target.value }))}
                                maxLength={600}
                                style={styles.commentInput}
                                className="input-control"
                              />
                              <div style={styles.commentActions}>
                                <button type="submit" className="btn btn-primary btn-sm">
                                  Add Comment
                                </button>
                                <button 
                                  type="button" 
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => setShowACommentForm(prev => ({ ...prev, [ans.id]: false }))}
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          )}
                        </div>
                      ) : (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                          Please <span onClick={login} style={{ color: 'var(--color-primary)', cursor: 'pointer', fontWeight: '600' }}>log in</span> to add comments.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Post Answer Section */}
          <div style={styles.submitAnswerSection}>
            {question.isClosed ? (
              <div className="card" style={styles.closedNotice}>
                <Lock size={20} style={{ color: 'var(--color-danger)' }} />
                <span>This question has been closed by moderators. No further answers are allowed.</span>
              </div>
            ) : isAuthenticated ? (
              <form onSubmit={handleSubmitAnswer} style={styles.answerForm}>
                <h3 style={{ marginBottom: '12px', fontSize: '1.2rem', textAlign: 'left', fontWeight: '600' }}>
                  Your Answer
                </h3>
                <MarkdownEditor 
                  value={newAnswer} 
                  onChange={setNewAnswer} 
                  placeholder="Provide detailed information, cite resources, and add code blocks..."
                  rows={12}
                />
                <div style={{ display: 'flex', marginTop: '16px' }}>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={submittingAnswer || !newAnswer.trim()}
                  >
                    {submittingAnswer ? 'Posting...' : 'Post Your Answer'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="card" style={styles.loginNotice}>
                <MessageCircle size={20} />
                <span>You must <strong onClick={login} style={{ color: 'var(--color-primary)', cursor: 'pointer' }}>log in</strong> to contribute an answer to this question.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    paddingBottom: '60px',
    textAlign: 'left',
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    marginBottom: '20px',
  },
  header: {
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '16px',
    marginBottom: '24px',
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  closedBadge: {
    color: 'var(--color-danger)',
    fontSize: '1.2rem',
  },
  metaRow: {
    display: 'flex',
    gap: '16px',
    color: 'var(--text-secondary)',
    fontSize: '0.85rem',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  mainBlock: {
    display: 'flex',
    gap: '20px',
    padding: '24px',
    marginBottom: '20px',
  },
  acceptedCard: {
    borderColor: 'var(--color-success)',
    boxShadow: '0 0 15px rgba(16, 185, 129, 0.1)',
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '48px',
    flexShrink: 0,
  },
  rightCol: {
    flex: '1',
    minWidth: 0,
  },
  tagsContainer: {
    display: 'flex',
    gap: '6px',
    marginTop: '16px',
    marginBottom: '20px',
  },
  cardActionsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTop: '1px solid var(--border-color)',
    paddingTop: '14px',
    marginBottom: '16px',
  },
  actionsGroup: {
    display: 'flex',
    gap: '12px',
  },
  actionBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.85rem',
    transition: 'var(--transition-fast)',
  },
  deleteBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--color-danger)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.85rem',
    transition: 'var(--transition-fast)',
    opacity: 0.8,
  },
  authorBox: {
    background: 'var(--bg-secondary)',
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)',
    minWidth: '180px',
  },
  authorHeader: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginBottom: '4px',
  },
  authorDetail: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  authorName: {
    color: 'var(--color-primary)',
    fontWeight: '600',
    fontSize: '0.9rem',
  },
  reputation: {
    background: 'var(--bg-tertiary)',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: '700',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-color)',
  },
  commentsArea: {
    borderTop: '1px dotted var(--border-color)',
    paddingTop: '12px',
  },
  commentsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  commentItem: {
    fontSize: '0.85rem',
    borderBottom: '1px solid rgba(255,255,255,0.03)',
    paddingBottom: '8px',
    lineHeight: '1.4',
  },
  commentBody: {
    color: 'var(--text-primary)',
  },
  commentMeta: {
    fontSize: '0.8rem',
    marginLeft: '6px',
  },
  commentAuthor: {
    color: 'var(--color-secondary)',
    fontWeight: '500',
  },
  addCommentTrigger: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
  },
  commentForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '8px',
  },
  commentInput: {
    padding: '8px 12px',
    fontSize: '0.88rem',
    borderRadius: 'var(--radius-sm)',
  },
  commentActions: {
    display: 'flex',
    gap: '8px',
  },
  answersHeader: {
    marginTop: '32px',
    marginBottom: '16px',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '8px',
  },
  answersList: {
    display: 'flex',
    flexDirection: 'column',
  },
  acceptedIndicator: {
    marginTop: '12px',
  },
  acceptBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    marginTop: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'var(--transition-fast)',
  },
  submitAnswerSection: {
    marginTop: '36px',
  },
  answerForm: {
    display: 'flex',
    flexDirection: 'column',
  },
  closedNotice: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    background: 'rgba(239, 68, 68, 0.05)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
  },
  loginNotice: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
  },
};

// Add styles dynamically for hover effects on triggers/actions
if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.innerHTML = `
    .addCommentTrigger:hover {
      color: var(--color-primary) !important;
    }
    .actionBtn:hover {
      color: var(--text-primary) !important;
    }
    .deleteBtn:hover {
      opacity: 1 !important;
    }
    .acceptBtn:hover {
      color: var(--color-success) !important;
    }
  `;
  document.head.appendChild(styleTag);
}

export default QuestionPage;
