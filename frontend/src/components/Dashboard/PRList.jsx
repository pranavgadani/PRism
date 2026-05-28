import { useState, useEffect } from 'react';
import { githubAPI } from '../../services/api';
import PRCard from './PRCard';

const PRList = ({ owner, repo }) => {
  const [prs, setPrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!owner || !repo) return;
    const fetchPRs = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await githubAPI.getPulls(owner, repo);
        setPrs(data);
      } catch (err) {
        setError('Failed to fetch pull requests');
      } finally {
        setLoading(false);
      }
    };
    fetchPRs();
  }, [owner, repo]);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 100 }} />
      ))}
    </div>
  );

  if (error) return <p style={{ color: 'var(--accent-red)' }}>{error}</p>;

  if (prs.length === 0) return (
    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎉</div>
      <p>No open pull requests for <strong style={{ color: 'var(--text-secondary)' }}>{repo}</strong></p>
    </div>
  );

  return (
    <div>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
        {prs.length} open pull request{prs.length !== 1 ? 's' : ''} in <span style={{ color: 'var(--accent-blue)' }}>{owner}/{repo}</span>
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {prs.map((pr) => (
          <PRCard key={pr.id} pr={pr} owner={owner} repo={repo} />
        ))}
      </div>
    </div>
  );
};

export default PRList;
