import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Layers, Search, LogIn, LogOut, User, 
  Home, Tag, PlusCircle, HelpCircle, Bell,
  Sun, Moon
} from 'lucide-react';

const Layout = ({ children }) => {
  const { isAuthenticated, user, login, logout, isAdmin, isModerator } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'dark';
  });
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="app-container">
      {/* Header / Navbar */}
      <header style={styles.header}>
        <div style={styles.headerContainer}>
          <Link to="/" style={styles.logo}>
            <Layers size={24} style={{ color: 'var(--color-primary)' }} />
            <span style={styles.logoText}>Metal<span style={{ color: 'var(--color-secondary)' }}>Stack</span></span>
          </Link>

          <form onSubmit={handleSearch} style={styles.searchForm}>
            <Search size={18} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </form>

          <div style={styles.authActions}>
            <button
              onClick={toggleTheme}
              className="theme-toggle"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              type="button"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {isAuthenticated ? (
              <div style={styles.userProfile}>
                <Link to={`/users/me`} style={styles.userLink}>
                  <User size={18} />
                  <span>{user?.displayName}</span>
                  {isAdmin && <span style={styles.roleBadge}>Admin</span>}
                  {!isAdmin && isModerator && <span style={styles.roleBadgeMod}>Mod</span>}
                </Link>
                <button onClick={logout} style={styles.logoutBtn} title="Log Out">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button onClick={login} className="btn btn-primary btn-sm">
                <LogIn size={16} />
                Log In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Body Layout */}
      <div className="main-layout">
        {/* Navigation Sidebar */}
        <aside style={styles.sidebar}>
          <nav style={styles.nav}>
            <Link 
              to="/" 
              style={{
                ...styles.navLink,
                ...(isActive('/') ? styles.navLinkActive : {})
              }}
            >
              <Home size={18} />
              Home
            </Link>
            <Link 
              to="/tags" 
              style={{
                ...styles.navLink,
                ...(isActive('/tags') ? styles.navLinkActive : {})
              }}
            >
              <Tag size={18} />
              Tags
            </Link>
            
            {isAuthenticated && (
              <Link 
                to="/ask" 
                style={{
                  ...styles.navLink,
                  ...(isActive('/ask') ? styles.navLinkActive : {})
                }}
              >
                <PlusCircle size={18} />
                Ask Question
              </Link>
            )}
            
            {isAuthenticated && (
              <Link 
                to="/users/me" 
                style={{
                  ...styles.navLink,
                  ...(isActive('/users/me') ? styles.navLinkActive : {})
                }}
              >
                <User size={18} />
                My Profile
              </Link>
            )}
          </nav>

          <div style={styles.sidebarFooter}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <HelpCircle size={14} />
              <span>MetalStack Internal v1.0</span>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="content-area">
          {children}
        </main>
      </div>
    </div>
  );
};

const styles = {
  header: {
    background: 'var(--bg-glass)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--border-color)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    padding: '12px 20px',
  },
  headerContainer: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '20px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    textDecoration: 'none',
  },
  logoText: {
    fontWeight: '800',
    fontSize: '1.4rem',
    color: 'var(--text-primary)',
    letterSpacing: '-0.5px',
  },
  searchForm: {
    flex: '1',
    maxWidth: '600px',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    color: 'var(--text-muted)',
  },
  searchInput: {
    width: '100%',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    padding: '10px 16px 10px 42px',
    borderRadius: '24px',
    fontSize: '0.95rem',
    transition: 'var(--transition-fast)',
  },
  authActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--text-primary)',
    fontWeight: '500',
    fontSize: '0.95rem',
  },
  roleBadge: {
    background: 'rgba(239, 68, 68, 0.15)',
    color: '#f87171',
    fontSize: '0.7rem',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '4px',
    border: '1px solid rgba(239, 68, 68, 0.3)',
  },
  roleBadgeMod: {
    background: 'rgba(168, 85, 247, 0.15)',
    color: '#c084fc',
    fontSize: '0.7rem',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '4px',
    border: '1px solid rgba(168, 85, 247, 0.3)',
  },
  logoutBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'var(--transition-fast)',
  },
  sidebar: {
    width: '240px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: 'calc(100vh - 100px)',
    position: 'sticky',
    top: '80px',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)',
    fontWeight: '500',
    transition: 'var(--transition-normal)',
  },
  navLinkActive: {
    background: 'var(--bg-secondary)',
    color: 'var(--color-primary)',
    fontWeight: '600',
    borderLeft: '4px solid var(--color-primary)',
    borderRadius: '0 var(--radius-md) var(--radius-md) 0',
    paddingLeft: '12px',
  },
  sidebarFooter: {
    padding: '16px 8px',
    borderTop: '1px solid var(--border-color)',
  },
};

export default Layout;
