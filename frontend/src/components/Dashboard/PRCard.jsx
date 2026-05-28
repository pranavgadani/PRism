import { useNavigate } from 'react-router-dom';

const PRCard = ({ pr, owner, repo }) => {
  const navigate = useNavigate();
  const additions = pr.additions ?? 0;
  const deletions = pr.deletions ?? 0;
  const files = pr.changed_files ?? '?';
  const updatedAt = new Date(pr.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div
      id={`pr-${pr.number}`}
      className="glass-card fade-in"
      onClick={() => navigate(`/review/${owner}/${repo}/${pr.number}`)}
      style={{ padding: '1.25rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <img
          src={pr.user.avatar_url}
          alt={pr.user.login}
          style={{ width: 34, height: 34, borderRadius: '50%', border: '2px solid var(--border)', flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {pr.title}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            #{pr.number} by <span style={{ color: 'var(--accent-blue)' }}>@{pr.user.login}</span> · {updatedAt}
          </p>
        </div>
      </div>

      {/* Labels */}
      {pr.labels?.length > 0 && (
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {pr.labels.slice(0, 3).map((label) => (
            <span key={label.id} style={{
              fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: 4,
              background: `#${label.color}22`, color: `#${label.color}`, border: `1px solid #${label.color}44`,
            }}>
              {label.name}
            </span>
          ))}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem' }}>
        <span style={{ color: 'var(--accent-green)' }}>+{additions}</span>
        <span style={{ color: 'var(--accent-red)' }}>-{deletions}</span>
        <span style={{ color: 'var(--text-muted)' }}>{files} files</span>
        <span style={{ marginLeft: 'auto', color: 'var(--accent-purple-light)', fontWeight: 600 }}>
          Review →
        </span>
      </div>
    </div>
  );
};

export default PRCard;
