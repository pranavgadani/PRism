import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { useReview } from '../hooks/useReview';
import ReviewPanel from '../components/Review/ReviewPanel';
import DiffViewer from '../components/Review/DiffViewer';

const ReviewPage = () => {
  const { owner, repo, pull_number } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { socket, connected } = useSocket(token);
  const { steps, activeStep, prInfo, result, error, isReviewing, startReview } = useReview(socket);

  const handleStartReview = () => {
    startReview({ owner, repo, pull_number: Number(pull_number) });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>

      {/* Top Bar */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)', padding: '0.875rem 1.5rem',
        display: 'flex', alignItems: 'center', gap: '1rem',
      }}>
        <button id="back-btn" onClick={() => navigate('/dashboard')} className="btn-secondary" style={{ padding: '0.4rem 0.875rem', fontSize: '0.8rem' }}>
          ← Back
        </button>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
          <span style={{ fontSize: '1.2rem' }}>🔮</span>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <span style={{ color: 'var(--accent-blue)' }}>{owner}/{repo}</span>
              <span style={{ color: 'var(--text-muted)' }}> — PR #{pull_number}</span>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: connected ? 'var(--accent-green)' : 'var(--accent-red)', boxShadow: connected ? '0 0 6px var(--accent-green)' : 'none' }} />
          <span style={{ color: 'var(--text-muted)' }}>{connected ? 'Connected' : 'Connecting…'}</span>
        </div>

        {user && (
          <img src={user.avatarUrl} alt={user.username} style={{ width: 30, height: 30, borderRadius: '50%', border: '2px solid var(--border)' }} />
        )}
      </header>

      {/* Body */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', padding: '1.5rem', maxWidth: 1400, margin: '0 auto' }}>

        {/* Left: Diff Viewer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-secondary)' }}>📄 Code Changes</h2>
          <DiffViewer owner={owner} repo={repo} pullNumber={pull_number} />
        </div>

        {/* Right: Review Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-secondary)' }}>🤖 AI Review</h2>
          <ReviewPanel
            steps={steps}
            activeStep={activeStep}
            prInfo={prInfo}
            result={result}
            error={error}
            isReviewing={isReviewing}
            onStart={handleStartReview}
            owner={owner}
            repo={repo}
            pullNumber={pull_number}
          />
        </div>
      </div>
    </div>
  );
};

export default ReviewPage;
