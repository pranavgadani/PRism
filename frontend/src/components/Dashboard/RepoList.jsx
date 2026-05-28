import { useState, useEffect } from 'react';
import { githubAPI } from '../../services/api';

const LANG_COLORS = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
  Java: '#b07219', Go: '#00ADD8', Rust: '#dea584', CSS: '#563d7c',
  HTML: '#e34c26', Ruby: '#701516', PHP: '#4F5D95', C: '#555555',
  'C++': '#f34b7d', 'C#': '#178600', Shell: '#89e051', Vue: '#41b883',
  Swift: '#ffac45', Kotlin: '#A97BFF',
};

const RepoCard = ({ repo, onClick, selected }) => {
  const langColor = LANG_COLORS[repo.language] || '#8b8b8b';
  const updatedAt = new Date(repo.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div
      id={`repo-${repo.id}`}
      className="glass-card"
      onClick={() => onClick(repo)}
      style={{
        padding: '1.25rem',
        cursor: 'pointer',
        borderColor: selected ? 'var(--accent-purple)' : undefined,
        boxShadow: selected ? '0 0 20px rgba(124,58,237,0.25)' : undefined,
        background: selected ? 'rgba(124,58,237,0.08)' : undefined,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--text-secondary)">
            <path d="M3 3h18v18H3V3zm2 2v14h14V5H5zm2 4h10v2H7V9zm0 4h6v2H7v-2z" />
          </svg>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--accent-blue)' }}>
            {repo.name}
          </span>
        </div>
        {repo.private && (
          <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', background: 'rgba(245,158,11,0.1)', color: 'var(--accent-yellow)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '4px' }}>
            PRIVATE
          </span>
        )}
      </div>

      {repo.description && (
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {repo.description}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
        {repo.language && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: langColor, display: 'inline-block' }} />
            {repo.language}
          </span>
        )}
        {repo.stargazers_count > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            ⭐ {repo.stargazers_count}
          </span>
        )}
        {repo.forks_count > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            🍴 {repo.forks_count}
          </span>
        )}
        {repo.open_issues_count > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-yellow)' }}>
            ⚠ {repo.open_issues_count} issue{repo.open_issues_count !== 1 ? 's' : ''}
          </span>
        )}
        <span style={{ marginLeft: 'auto' }}>Updated {updatedAt}</span>
      </div>
    </div>
  );
};

const RepoList = ({ onSelectRepo, selectedRepo }) => {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const { data } = await githubAPI.getRepos();
        setRepos(data);
      } catch (err) {
        setError('Failed to fetch repositories');
      } finally {
        setLoading(false);
      }
    };
    fetchRepos();
  }, []);

  const filtered = repos.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 120 }} />
      ))}
    </div>
  );

  if (error) return <p style={{ color: 'var(--accent-red)' }}>{error}</p>;

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <input
          id="repo-search"
          type="text"
          placeholder="Search repositories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '0.625rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none',
          }}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {filtered.map((repo) => (
          <RepoCard
            key={repo.id}
            repo={repo}
            onClick={onSelectRepo}
            selected={selectedRepo?.id === repo.id}
          />
        ))}
      </div>
      {filtered.length === 0 && (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
          No repositories found.
        </p>
      )}
    </div>
  );
};

export default RepoList;
