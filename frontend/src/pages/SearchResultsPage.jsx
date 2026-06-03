import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import api from '../api/api';
import { Search, Eye, MessageSquare, Clock } from 'lucide-react';

const SearchResultsPage = () => {
  const location = useLocation();
  const query = new URLSearchParams(location.search).get('q') || '';
  
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Reset page when search query changes
  useEffect(() => {
    setPage(0);
  }, [query]);

  useEffect(() => {
    if (query) {
      fetchSearchResults();
    }
  }, [query, page]);

  const fetchSearchResults = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/search?q=${encodeURIComponent(query)}&page=${page}&size=10`);
      const data = response.data.content || [];
      const total = response.data.totalPages || 1;
      
      setQuestions(data);
      setTotalPages(total);
    } catch (err) {
      console.error('Error searching questions:', err);
    } finally {
      setLoading(false);
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
        <h1 style={styles.title}>Search Results</h1>
        <p style={styles.subtitle}>
          Results for query: <strong style={{ color: 'var(--color-primary)' }}>"{query}"</strong>
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Searching questions...</div>
      ) : questions.length === 0 ? (
        <div className="card" style={styles.emptyCard}>
          <Search size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
          <h3>No results found</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            We couldn't find any questions matching your search. Try different keywords or check spelling.
          </p>
          <Link to="/" className="btn btn-secondary" style={{ marginTop: '16px' }}>
            Back to Home
          </Link>
        </div>
      ) : (
        <div style={styles.list}>
          <p style={styles.resultsCount}>Page {page + 1} of search results</p>
          {questions.map((q) => (
            <div key={q.id} className="card" style={styles.questionCard}>
              <div style={styles.stats}>
                <div style={styles.statItem}>
                  <span style={styles.statVal}>{q.voteCount}</span>
                  <span>votes</span>
                </div>
                <div style={{
                  ...styles.statItem,
                  ...(q.answerCount > 0 ? styles.hasAnswers : {}),
                  ...(q.acceptedAnswerId ? styles.hasAcceptedAnswer : {})
                }}>
                  <span style={styles.statVal}>{q.answerCount}</span>
                  <span>answers</span>
                </div>
              </div>

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
  );
};

const styles = {
  container: {
    paddingBottom: '60px',
    textAlign: 'left',
  },
  header: {
    marginBottom: '28px',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '16px',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '4px',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
  },
  emptyCard: {
    textAlign: 'center',
    padding: '48px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  resultsCount: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    marginBottom: '8px',
  },
  questionCard: {
    display: 'flex',
    gap: '20px',
    padding: '20px',
  },
  stats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '70px',
    flexShrink: 0,
    fontSize: '0.8rem',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)',
  },
  statVal: {
    fontSize: '1rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
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
};

export default SearchResultsPage;
