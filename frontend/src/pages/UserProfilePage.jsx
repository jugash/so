import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import { User, Mail, Calendar, Award, MessageSquare, HelpCircle, Check, Loader2 } from 'lucide-react';

const UserProfilePage = () => {
  const { id } = useParams();
  const { isAuthenticated, user: authUser } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingNotifications, setUpdatingNotifications] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  const isMe = id === 'me' || (authUser && profile && authUser.username === profile.username);

  useEffect(() => {
    setPage(0);
    setProfile(null);
    setQuestions([]);
    setError(null);
    fetchProfile();
  }, [id]);

  useEffect(() => {
    if (profile) {
      fetchUserQuestions();
    }
  }, [profile?.id, page]);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch user profile
      const profileUrl = id === 'me' ? '/api/users/me' : `/api/users/${id}`;
      const profileRes = await api.get(profileUrl);
      setProfile(profileRes.data);
    } catch (err) {
      console.error('Error fetching user profile data:', err);
      if (err.response?.status === 401 && id === 'me') {
        setError('Please log in to view your profile.');
      } else if (err.response?.status === 404) {
        setError('User not found.');
      } else {
        setError('Failed to load profile. Please try refreshing the page.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUserQuestions = async () => {
    setQuestionsLoading(true);
    try {
      // 2. Fetch user's questions
      const qRes = await api.get(`/api/users/${profile.id}/questions?page=${page}&size=10`);
      const qData = qRes.data.content || [];
      const total = qRes.data.totalPages || 1;
      setQuestions(qData);
      setTotalPages(total);
    } catch (err) {
      console.error('Error fetching user questions:', err);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleToggleNotifications = async (e) => {
    const checked = e.target.checked;
    setUpdatingNotifications(true);
    setSuccessMsg('');
    try {
      await api.put(`/api/users/me/notifications?enabled=${checked}`);
      setProfile(prev => ({ ...prev, emailNotifications: checked }));
      setSuccessMsg('Email preferences updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Failed to update email notifications:', err);
    } finally {
      setUpdatingNotifications(false);
    }
  };

  const formatJoinedDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });
  };

  const formatQuestionDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '100px' }}>Loading profile...</div>;
  }

  if (!profile) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
        <h3>{error ? 'Error' : 'User not found'}</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
          {error || 'This user profile does not exist or you must be logged in.'}
        </p>
        <Link to="/" className="btn btn-secondary" style={{ marginTop: '16px', display: 'inline-block' }}>
          ← Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div style={styles.container} className="fade-in">
      {/* Top Profile Card */}
      <div className="card" style={styles.profileCard}>
        <div style={styles.avatarCol}>
          <div style={styles.avatar}>
            <User size={48} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div style={styles.repBadge} title="Reputation score">
            <Award size={14} />
            <span>{profile.reputation} rep</span>
          </div>
        </div>

        <div style={styles.infoCol}>
          <h1 style={styles.name}>{profile.displayName}</h1>
          <p style={styles.username}>@{profile.username}</p>
          
          <div style={styles.metaRow}>
            {(isMe || (authUser && authUser.role === 'ADMIN')) && (
              <div style={styles.metaItem}>
                <Mail size={16} />
                <span>{profile.email}</span>
              </div>
            )}
            <div style={styles.metaItem}>
              <Calendar size={16} />
              <span>Member since {formatJoinedDate(profile.createdAt)}</span>
            </div>
          </div>

          <p style={styles.about}>
            {profile.about || 'No bio description provided yet.'}
          </p>
        </div>

        <div style={styles.statsCol}>
          <div style={styles.statBox}>
            <span style={styles.statVal}>{profile.questionCount}</span>
            <span style={styles.statLabel}>questions</span>
          </div>
          <div style={styles.statBox}>
            <span style={styles.statVal}>{profile.answerCount}</span>
            <span style={styles.statLabel}>answers</span>
          </div>
        </div>
      </div>

      <div style={styles.lowerGrid}>
        {/* Left List of Questions */}
        <div style={styles.questionsSection}>
          <h2 style={styles.sectionTitle}>Questions Asked ({profile.questionCount || 0})</h2>
          
          <div style={styles.questionsList}>
            {questionsLoading ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                Loading questions...
              </div>
            ) : (
              <>
                {questions.map((q) => (
                  <div key={q.id} className="card" style={styles.questionItem}>
                    <div style={styles.qScoreCol}>
                      <span style={styles.qScore}>{q.voteCount}</span>
                      <span style={styles.qScoreLabel}>votes</span>
                    </div>
                    <div style={styles.qContentCol}>
                      <Link to={`/questions/${q.id}`} style={styles.qTitle}>
                        {q.title}
                      </Link>
                      <div style={styles.qMeta}>
                        <span>asked {formatQuestionDate(q.createdAt)}</span>
                        <span style={{ margin: '0 6px' }}>•</span>
                        <span>{q.answerCount} answers</span>
                      </div>
                    </div>
                  </div>
                ))}
                {questions.length === 0 && (
                  <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No questions asked by this user yet.
                  </div>
                )}
              </>
            )}

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
        </div>

        {/* Right Settings / Preferences (Only if isMe) */}
        {isMe && (
          <div style={styles.settingsSection}>
            <h2 style={styles.sectionTitle}>Settings & Preferences</h2>
            <div className="card" style={styles.settingsCard}>
              <h3 style={styles.settingsHeader}>Notifications</h3>
              <p style={styles.settingsDesc}>
                Manage how you receive alerts from MetalStack.
              </p>
              
              <div style={styles.checkboxRow}>
                <input
                  type="checkbox"
                  id="toggle-notifications"
                  checked={profile.emailNotifications}
                  onChange={handleToggleNotifications}
                  disabled={updatingNotifications}
                  style={styles.checkbox}
                />
                <label htmlFor="toggle-notifications" style={styles.checkboxLabel}>
                  Receive email alerts when my questions are answered
                </label>
                {updatingNotifications && <Loader2 size={16} className="spin" style={{ color: 'var(--color-primary)' }} />}
              </div>

              {successMsg && (
                <div style={styles.successAlert}>
                  <Check size={14} />
                  <span>{successMsg}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    paddingBottom: '60px',
    textAlign: 'left',
  },
  profileCard: {
    display: 'flex',
    gap: '32px',
    padding: '32px',
    marginBottom: '32px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  avatarCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '96px',
    height: '96px',
    borderRadius: '50%',
    background: 'var(--bg-secondary)',
    border: '2px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'var(--shadow-glow)',
  },
  repBadge: {
    background: 'rgba(99, 102, 241, 0.1)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    color: '#818cf8',
    padding: '4px 10px',
    fontSize: '0.85rem',
    fontWeight: '700',
    borderRadius: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  infoCol: {
    flex: '1',
    minWidth: '260px',
  },
  name: {
    fontSize: '2rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
    lineHeight: '1.2',
  },
  username: {
    color: 'var(--color-primary)',
    fontWeight: '600',
    fontSize: '1rem',
    marginBottom: '12px',
  },
  metaRow: {
    display: 'flex',
    gap: '20px',
    color: 'var(--text-secondary)',
    fontSize: '0.85rem',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  about: {
    color: 'var(--text-secondary)',
    fontSize: '0.92rem',
    lineHeight: '1.6',
    borderTop: '1px solid var(--border-color)',
    paddingTop: '12px',
  },
  statsCol: {
    display: 'flex',
    gap: '16px',
  },
  statBox: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    padding: '16px 20px',
    borderRadius: 'var(--radius-md)',
    textAlign: 'center',
    minWidth: '100px',
  },
  statVal: {
    display: 'block',
    fontSize: '1.8rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
  },
  statLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
  },
  lowerGrid: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap',
  },
  questionsSection: {
    flex: '2',
    minWidth: '320px',
  },
  settingsSection: {
    flex: '1',
    minWidth: '280px',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '16px',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '8px',
  },
  questionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  questionItem: {
    display: 'flex',
    gap: '16px',
    padding: '16px',
  },
  qScoreCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-sm)',
    flexShrink: 0,
  },
  qScore: {
    fontSize: '0.95rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  qScoreLabel: {
    fontSize: '0.65rem',
    color: 'var(--text-secondary)',
  },
  qContentCol: {
    flex: '1',
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  qTitle: {
    color: 'var(--text-primary)',
    fontWeight: '600',
    fontSize: '0.95rem',
    marginBottom: '4px',
    transition: 'var(--transition-fast)',
  },
  qMeta: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
  },
  settingsCard: {
    padding: '20px',
  },
  settingsHeader: {
    fontSize: '1rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '4px',
  },
  settingsDesc: {
    fontSize: '0.82rem',
    color: 'var(--text-secondary)',
    marginBottom: '16px',
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '0.88rem',
    color: 'var(--text-primary)',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    accentColor: 'var(--color-primary)',
    cursor: 'pointer',
  },
  checkboxLabel: {
    cursor: 'pointer',
    userSelect: 'none',
  },
  successAlert: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid var(--color-success)',
    color: '#34d399',
    padding: '6px 12px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.8rem',
    marginTop: '12px',
    fontWeight: '500',
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

// Add spinning animation dynamically for loader
if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.innerHTML = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .spin {
      animation: spin 1s linear infinite;
    }
    a.qTitle:hover {
      color: var(--color-primary) !important;
    }
  `;
  document.head.appendChild(styleTag);
}

export default UserProfilePage;
