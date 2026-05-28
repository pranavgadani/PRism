import { useState, useEffect } from 'react';
import { githubAPI } from '../../services/api';

const DiffViewer = ({ owner, repo, pullNumber }) => {
  const [diff, setDiff] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const fetchDiff = async () => {
      try {
        const { data } = await githubAPI.getDiff(owner, repo, pullNumber);
        setDiff(data);
      } catch (err) {
        setError('Failed to load diff');
      } finally {
        setLoading(false);
      }
    };
    fetchDiff();
  }, [owner, repo, pullNumber]);

  const renderDiff = (diffText) => {
    return diffText.split('\n').map((line, idx) => {
      let className = '';
      let bg = 'transparent';

      if (line.startsWith('+++') || line.startsWith('---')) {
        className = 'diff-header';
        bg = 'rgba(59,130,246,0.08)';
      } else if (line.startsWith('@@')) {
        className = 'diff-header';
        bg = 'rgba(59,130,246,0.05)';
      } else if (line.startsWith('+')) {
        className = 'diff-added';
        bg = 'rgba(16,185,129,0.07)';
      } else if (line.startsWith('-')) {
        className = 'diff-removed';
        bg = 'rgba(239,68,68,0.07)';
      }

      return (
        <div
          key={idx}
          className={className}
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.78rem',
            padding: '0 1rem',
            lineHeight: '1.6',
            background: bg,
            whiteSpace: 'pre',
            overflow: 'hidden',
          }}
        >
          {line || ' '}
        </div>
      );
    });
  };

  return (
    <div className="glass-card" style={{ overflow: 'hidden' }}>
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
        onClick={() => setCollapsed(!collapsed)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem' }}>📄</span>
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Unified Diff</span>
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{collapsed ? '▼ Expand' : '▲ Collapse'}</span>
      </div>

      {!collapsed && (
        <div style={{ maxHeight: 400, overflowY: 'auto', overflowX: 'auto' }}>
          {loading && <div style={{ padding: '1.5rem', color: 'var(--text-muted)' }}>Loading diff…</div>}
          {error && <div style={{ padding: '1.5rem', color: 'var(--accent-red)' }}>{error}</div>}
          {!loading && !error && (
            <div style={{ minWidth: 'max-content' }}>
              {renderDiff(diff)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DiffViewer;
