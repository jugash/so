import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import { MessageSquare, Eye, Award, Clock, ArrowUpRight, X } from 'lucide-react';

const HomePage = () => {
  const { isAuthenticated, login } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('newest'); // 'newest', 'votes', 'unanswered'
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();
  const location = useLocation();

  // Parse tag parameter from search query
  const queryParams = new URLSearchParams(location.search);
  const selectedTag = queryParams.get('tag');

  useEffect(() => {
    setPage(0);
  }, [sort, selectedTag]);

  useEffect(() => {
    fetchQuestions();
  }, [sort, selectedTag, page]);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      let endpoint = '/api/questions';
      const params = [];
      
      if (sort === 'votes') {
        params.push('sort=votes');
      } else if (sort === 'unanswered') {
        params.push('sort=unanswered');
      } else {
        params.push('sort=newest');
      }

      if (selectedTag) {
        params.push(`tag=${encodeURIComponent(selectedTag)}`);
      }

      params.push(`page=${page}`);
      params.push(`size=10`); // Limit to 10 questions per page

      if (params.length > 0) {
        endpoint += '?' + params.join('&');
      }
      
      const response = await api.get(endpoint);
      const data = response.data.content || [];
      const total = response.data.totalPages || 1;
        
      setQuestions(data);
      setTotalPages(total);
    } catch (err) {
      console.error('Error fetching questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await api.get('/api/tags');
      const data = Array.isArray(response.data) 
        ? response.data 
        : response.data.content || [];
      // Top 8 tags
      setTags(data.slice(0, 8));
    } catch (err) {
      console.error('Error fetching tags:', err);
    }
  };

  const handleAskClick = () => {
    if (!isAuthenticated) {
      login();
    } else {
      navigate('/ask');
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div style={styles.container} className="fade-in">
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            {selectedTag ? `Questions Tagged: [${selectedTag}]` : 'All Questions'}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <p style={styles.subtitle}>{questions.length} questions available</p>
            {selectedTag && (
              <Link to="/" style={styles.clearFilterLink}>
                Clear filter <X size={12} style={{ marginLeft: '2px' }} />
              </Link>
            )}
          </div>
        </div>
        <button onClick={handleAskClick} className="btn btn-primary">
          Ask a Question
        </button>
      </div>

      <div style={styles.contentGrid}>
        {/* Main Feed */}
        <div style={styles.feed}>
          {/* Sorting Tabs */}
          <div style={styles.tabsContainer}>
            <div style={styles.tabs}>
              <button
                onClick={() => setSort('newest')}
                style={{
                  ...styles.tabBtn,
                  ...(sort === 'newest' ? styles.tabActive : {}),
                }}
              >
                <Clock size={16} />
                Newest
              </button>
              <button
                onClick={() => setSort('votes')}
                style={{
                  ...styles.tabBtn,
                  ...(sort === 'votes' ? styles.tabActive : {}),
                }}
              >
                <Award size={16} />
                Highest Score
              </button>
              <button
                onClick={() => setSort('unanswered')}
                style={{
                  ...styles.tabBtn,
                  ...(sort === 'unanswered' ? styles.tabActive : {}),
                }}
              >
                <MessageSquare size={16} />
                Unanswered
              </button>
            </div>
          </div>

          {/* Question List */}
          {loading ? (
            <div style={styles.loading}>Loading questions...</div>
          ) : questions.length === 0 ? (
            <div className="card" style={styles.empty}>
              <h3>No questions found</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
                Be the first to ask a question on this system!
              </p>
            </div>
          ) : (
            <div style={styles.list}>
              {questions.map((q) => (
                <div key={q.id} className="card" style={styles.questionCard}>
                  {/* Left Stats Block */}
                  <div style={styles.stats}>
                    <div style={styles.statItem}>
                      <span style={styles.statVal}>{q.voteCount}</span>
                      <span style={styles.statLbl}>votes</span>
                    </div>
                    <div style={{
                      ...styles.statItem,
                      ...(q.answerCount > 0 ? styles.hasAnswers : {}),
                      ...(q.acceptedAnswerId ? styles.hasAcceptedAnswer : {})
                    }}>
                      <span style={styles.statVal}>{q.answerCount}</span>
                      <span style={styles.statLbl}>answers</span>
                    </div>
                    <div style={styles.statItem}>
                      <span style={styles.statVal}>{q.viewCount}</span>
                      <span style={styles.statLbl}>views</span>
                    </div>
                  </div>

                  {/* Right Content Block */}
                  <div style={styles.cardContent}>
                    <h2 style={styles.questionTitle}>
                      <Link to={`/questions/${q.id}`} style={styles.questionLink}>
                        {q.title}
                        {q.isClosed && <span style={styles.closedBadge}>[Closed]</span>}
                      </Link>
                    </h2>
                    
                    <p style={styles.bodySummary}>
                      {q.body.length > 180 ? `${q.body.substring(0, 180)}...` : q.body}
                    </p>

                    <div style={styles.cardFooter}>
                      <div style={styles.tags}>
                        {q.tags?.map((t) => (
                          <Link key={t.id} to={`/?tag=${t.name}`} className="badge tag-badge">
                            {t.name}
                          </Link>
                        ))}
                      </div>

                      <div style={styles.authorInfo}>
                        <span style={{ color: 'var(--text-muted)' }}>asked {formatTime(q.createdAt)} by</span>
                        <Link to={`/users/${q.authorId}`} style={styles.authorName}>
                          {q.authorDisplayName}
                        </Link>
                        <span style={styles.reputation} title="User Reputation">
                          {q.authorReputation || 1}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div style={styles.pagination}>
                  <button
                    onClick={() => setPage(prev => Math.max(0, prev - 1))}
                    disabled={page === 0}
                    className="btn btn-secondary btn-sm"
                  >
                    Previous
                  </button>
                  <span style={styles.pageIndicator}>
                    Page {page + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
                    disabled={page === totalPages - 1}
                    className="btn btn-secondary btn-sm"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Home Sidebar Widgets */}
        <div style={styles.homeSidebar}>
          {/* Top Tags Widget */}
          <div className="card" style={styles.widget}>
            <h3 style={styles.widgetTitle}>Popular Tags</h3>
            <div style={styles.widgetTagsList}>
              {tags.map((t) => (
                <div key={t.id} style={styles.tagItem}>
                  <Link to={`/?tag=${t.name}`} className="badge tag-badge">
                    {t.name}
                  </Link>
                  <span style={styles.tagCount}>× {t.questionCount}</span>
                </div>
              ))}
              {tags.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No tags available yet.</p>
              )}
            </div>
            <Link to="/tags" style={styles.widgetLink}>
              View all tags
              <ArrowUpRight size={14} />
            </Link>
          </div>

          {/* Stats Widget */}
          <div className="card" style={styles.widget}>
            <h3 style={styles.widgetTitle}>Internal Guidelines</h3>
            <p style={styles.widgetText}>
              Welcome to MetalStack, our internal knowledge sharing engine. Use this tool to troubleshoot issues, document setup steps, and collaborate across teams.
            </p>
            <ul style={styles.widgetList}>
              <li>Ensure questions are descriptive.</li>
              <li>Provide code snippets in markdown.</li>
              <li>Accept the correct answer to help others.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    paddingBottom: '40px',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '16px',
    marginTop: '24px',
    paddingTop: '16px',
    borderTop: '1px solid var(--border-color)',
  },
  pageIndicator: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    fontWeight: '600',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    textAlign: 'left',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    letterSpacing: '-0.5px',
    color: 'var(--text-primary)',
    marginBottom: '4px',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
  },
  clearFilterLink: {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#f87171',
    padding: '2px 8px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.75rem',
    fontWeight: '700',
    textDecoration: 'none',
    transition: 'var(--transition-fast)',
  },
  contentGrid: {
    display: 'flex',
    gap: '24px',
  },
  feed: {
    flex: '1',
    minWidth: 0,
  },
  tabsContainer: {
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '12px',
    marginBottom: '20px',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
  },
  tabBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    padding: '8px 16px',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'var(--transition-fast)',
  },
  tabActive: {
    background: 'var(--bg-secondary)',
    color: 'var(--color-primary)',
    borderBottom: '2px solid var(--color-primary)',
    borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: 'var(--text-secondary)',
  },
  empty: {
    textAlign: 'center',
    padding: '40px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  questionCard: {
    display: 'flex',
    gap: '20px',
    padding: '20px',
    textAlign: 'left',
  },
  stats: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '12px',
    width: '70px',
    flexShrink: 0,
    fontSize: '0.85rem',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '4px',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)',
  },
  statVal: {
    fontSize: '1rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  statLbl: {
    fontSize: '0.75rem',
  },
  hasAnswers: {
    border: '1px solid var(--color-primary)',
    color: 'var(--color-primary)',
  },
  hasAcceptedAnswer: {
    background: 'var(--color-success)',
    border: '1px solid var(--color-success)',
    color: '#fff',
  },
  cardContent: {
    flex: '1',
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  questionTitle: {
    fontSize: '1.2rem',
    fontWeight: '600',
    marginBottom: '8px',
  },
  questionLink: {
    color: 'var(--text-primary)',
    transition: 'var(--transition-fast)',
  },
  closedBadge: {
    color: 'var(--color-danger)',
    marginLeft: '8px',
    fontSize: '0.95rem',
  },
  bodySummary: {
    color: 'var(--text-secondary)',
    fontSize: '0.92rem',
    marginBottom: '16px',
    lineHeight: '1.5',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  tags: {
    display: 'flex',
    gap: '6px',
  },
  authorInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.85rem',
  },
  authorName: {
    color: 'var(--color-primary)',
    fontWeight: '600',
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
  homeSidebar: {
    width: '280px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  widget: {
    textAlign: 'left',
    padding: '16px',
  },
  widgetTitle: {
    fontSize: '1rem',
    fontWeight: '700',
    marginBottom: '12px',
    color: 'var(--text-primary)',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '8px',
  },
  widgetTagsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  tagItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tagCount: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  },
  widgetLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.85rem',
    marginTop: '14px',
    fontWeight: '600',
  },
  widgetText: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
    marginBottom: '10px',
  },
  widgetList: {
    fontSize: '0.82rem',
    color: 'var(--text-secondary)',
    paddingLeft: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
};

export default HomePage;
