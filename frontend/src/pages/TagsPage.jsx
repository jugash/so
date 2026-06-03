import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import { Tag, Search, BookOpen } from 'lucide-react';

const TagsPage = () => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/tags');
      const data = Array.isArray(response.data) 
        ? response.data 
        : response.data.content || [];
      setTags(data);
    } catch (err) {
      console.error('Error fetching tags:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTags = tags.filter((t) => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    (t.description && t.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={styles.container} className="fade-in">
      <div style={styles.header}>
        <h1 style={styles.title}>Tags</h1>
        <p style={styles.subtitle}>
          A tag is a keyword or label that categorizes your question with other, similar questions. Using the right tags makes it easier for others to find and answer your question.
        </p>

        <div style={styles.searchWrapper}>
          <Search size={18} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Filter by tag name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
            className="input-control"
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading tags...</div>
      ) : filteredTags.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <h3>No tags found</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            No tags match your filter criteria.
          </p>
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredTags.map((tag) => (
            <div key={tag.id} className="card" style={styles.tagCard}>
              <div style={styles.tagHeader}>
                <Link to={`/?tag=${tag.name}`} className="badge tag-badge" style={styles.tagBadge}>
                  <Tag size={12} style={{ marginRight: '4px' }} />
                  {tag.name}
                </Link>
                <span style={styles.count}>{tag.questionCount} questions</span>
              </div>
              <p style={styles.description}>
                {tag.description || 'No description available for this tag. Edit this description to help clarify usage.'}
              </p>
            </div>
          ))}
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
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '8px',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
    maxWidth: '800px',
    lineHeight: '1.5',
    marginBottom: '20px',
  },
  searchWrapper: {
    position: 'relative',
    maxWidth: '360px',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    color: 'var(--text-muted)',
  },
  searchInput: {
    paddingLeft: '42px',
    borderRadius: 'var(--radius-md)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '16px',
  },
  tagCard: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '140px',
    padding: '16px',
  },
  tagHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  tagBadge: {
    fontSize: '0.8rem',
    padding: '4px 8px',
  },
  count: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
  description: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.45',
    flex: '1',
  },
};

export default TagsPage;
