import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RepoList from '../components/Dashboard/RepoList';
import PRList from '../components/Dashboard/PRList';
import ReviewHistory from '../components/History/ReviewHistory';
import RepoDetailPanel from '../components/Dashboard/RepoDetailPanel';

const TABS = ['Repositories', 'History'];

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [activeTab, setActiveTab] = useState('Repositories');
  const [detailRepo, setDetailRepo] = useState(null);

  const handleSelectRepo = (repo) => {
    setSelectedRepo(repo);
    setActiveTab('Repositories');
  };

  // Click on repo card → open detail panel
  const handleRepoClick = (repo) => {
    setDetailRepo(repo);
  };

  // "View PRs" button inside detail panel → close panel + select repo
  const handleViewPRs = (repo) => {
    setDetailRepo(null);
    setSelectedRepo(repo);
    setActiveTab('Repositories');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>

      {/* Sidebar */}
      <aside className="sidebar">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.875rem', marginBottom: '1rem' }}>
          <span style={{ fontSize: '1.4rem' }}>🔮</span>
          <span style={{ fontWeight: 800, fontSize: '1.1rem' }} className="gradient-text">PRism</span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span
            className={`sidebar-item ${activeTab === 'Repositories' ? 'active' : ''}`}
            id="nav-repos"
            onClick={() => { setActiveTab('Repositories'); setSelectedRepo(null); }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3h18v18H3z" /><path d="M3 9h18M9 21V9" />
            </svg>
            Repositories
          </span>
          <span
            className={`sidebar-item ${activeTab === 'History' ? 'active' : ''}`}
            id="nav-history"
            onClick={() => setActiveTab('History')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            Review History
          </span>
        </nav>

        {/* User */}
        {user && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <img src={user.avatarUrl} alt={user.username} style={{ width: 34, height: 34, borderRadius: '50%', border: '2px solid var(--border)' }} />
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>{user.username}</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>GitHub</p>
              </div>
            </div>
            <button
              id="logout-btn"
              className="btn-secondary"
              onClick={logout}
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', padding: '0.5rem' }}
            >
              Sign Out
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            {activeTab === 'History' ? 'Review History' : selectedRepo ? `${selectedRepo.full_name}` : 'Your Repositories'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {activeTab === 'History' ? 'Your past AI-generated PR reviews' : selectedRepo ? 'Open pull requests ready for AI review' : 'Select a repository to view its open pull requests'}
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.25rem' }}>
          {TABS.map((tab) => (
            <button
              key={tab}
              id={`tab-${tab.toLowerCase()}`}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.875rem',
                color: activeTab === tab ? 'var(--accent-purple-light)' : 'var(--text-muted)',
                borderBottom: activeTab === tab ? '2px solid var(--accent-purple-light)' : '2px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'Repositories' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <RepoList onSelectRepo={handleRepoClick} selectedRepo={selectedRepo} />
            {selectedRepo && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-blue)' }}>
                    Open Pull Requests — {selectedRepo.name}
                  </h2>
                  <button
                    onClick={() => setSelectedRepo(null)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}
                  >✕</button>
                </div>
                <PRList owner={selectedRepo.owner.login} repo={selectedRepo.name} />
              </div>
            )}
          </div>
        )}

        {activeTab === 'History' && <ReviewHistory />}
      </main>

      {/* Repo Detail Slide-in Panel */}
      {detailRepo && (
        <RepoDetailPanel
          repo={detailRepo}
          onClose={() => setDetailRepo(null)}
          onViewPRs={handleViewPRs}
        />
      )}
    </div>
  );
};

export default DashboardPage;
