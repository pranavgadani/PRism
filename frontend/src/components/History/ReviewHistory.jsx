import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reviewAPI } from '../../services/api';
import ScoreBadge from '../Review/ScoreBadge';

const VerdictChip = ({ verdict }) => {
  if (!verdict) return null;
  const cls = verdict === 'APPROVE' ? 'verdict-approve' : verdict === 'REQUEST CHANGES' ? 'verdict-changes' : 'verdict-discussion';
  return <span className={cls}>{verdict}</span>;
};

const ReviewHistory = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await reviewAPI.getHistory();
        setReviews(data);
      } catch (err) {
        setError('Failed to load review history');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 72 }} />)}
    </div>
  );

  if (error) return <p style={{ color: 'var(--accent-red)' }}>{error}</p>;

  if (reviews.length === 0) return (
    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤖</div>
      <p>No reviews yet. Start by selecting a repository!</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {reviews.map((review) => (
        <div
          key={review._id}
          id={`history-${review._id}`}
          className="glass-card fade-in"
          onClick={() => navigate(`/review/${review.owner}/${review.repo}/${review.pullNumber}`)}
          style={{ padding: '1rem 1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem' }}
        >
          <ScoreBadge score={review.score} size={52} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {review.prTitle || `PR #${review.pullNumber}`}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--accent-blue)' }}>{review.owner}/{review.repo}</span>
              {' '}· #{review.pullNumber} · {review.filesChanged} files
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
            <VerdictChip verdict={review.verdict} />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReviewHistory;
