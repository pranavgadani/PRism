import { useState } from 'react';
import StreamingText from './StreamingText';
import ScoreBadge from './ScoreBadge';
import { githubAPI } from '../../services/api';

const STEP_META = {
  1: { label: 'PR Summary', icon: '📋', color: 'var(--accent-blue)' },
  2: { label: 'Issue Detection', icon: '🐛', color: 'var(--accent-red)' },
  3: { label: 'Suggestions', icon: '💡', color: 'var(--accent-yellow)' },
  4: { label: 'Score', icon: '📊', color: 'var(--accent-green)' },
};

const VerdictChip = ({ verdict }) => {
  const cls = verdict === 'APPROVE' ? 'verdict-approve' : verdict === 'REQUEST CHANGES' ? 'verdict-changes' : 'verdict-discussion';
  const icon = verdict === 'APPROVE' ? '✅' : verdict === 'REQUEST CHANGES' ? '❌' : '💬';
  return <span className={cls}>{icon} {verdict}</span>;
};

const StepCard = ({ stepNum, stepData, isActive }) => {
  const [open, setOpen] = useState(true);
  const meta = STEP_META[stepNum];

  if (!stepData.label && !stepData.streaming) return null;

  return (
    <div
      className="glass-card fade-in"
      style={{
        overflow: 'hidden',
        borderColor: isActive ? meta.color : undefined,
        boxShadow: isActive ? `0 0 20px ${meta.color}33` : undefined,
      }}
    >
      {/* Header */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1.25rem', cursor: 'pointer', borderBottom: open ? '1px solid var(--border)' : 'none' }}
        onClick={() => setOpen(!open)}
      >
        <span style={{ fontSize: '1.1rem' }}>{meta.icon}</span>
        <span style={{ fontWeight: 600, fontSize: '0.9rem', flex: 1 }}>
          Step {stepNum} — {meta.label}
        </span>
        {isActive && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: meta.color, fontSize: '0.8rem' }}>
            <div className="spinner" style={{ borderTopColor: meta.color }} />
            {stepData.label}
          </div>
        )}
        {stepData.done && <span style={{ color: 'var(--accent-green)', fontSize: '0.8rem' }}>✓ Done</span>}
        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{open ? '▲' : '▼'}</span>
      </div>

      {/* Body */}
      {open && (stepData.content || stepData.streaming) && (
        <div style={{ padding: '1.25rem', maxHeight: 400, overflowY: 'auto' }}>
          <StreamingText content={stepData.content} isStreaming={stepData.streaming} />
        </div>
      )}
    </div>
  );
};

const ReviewPanel = ({ steps, activeStep, prInfo, result, error, isReviewing, onStart, owner, repo, pullNumber, reviewId }) => {
  const [postingComment, setPostingComment] = useState(false);
  const [commentPosted, setCommentPosted] = useState(false);

  const handlePostComment = async () => {
    if (!result) return;
    setPostingComment(true);
    try {
      await githubAPI.postComment({
        owner,
        repo,
        pull_number: pullNumber,
        summary: steps[1]?.content || '',
        issues: steps[2]?.content || '',
        suggestions: steps[3]?.content || '',
        score: result.score,
        scoreBreakdown: result.scoreBreakdown,
        verdict: result.verdict,
      });
      setCommentPosted(true);
    } catch (err) {
      alert('Failed to post comment: ' + err.message);
    } finally {
      setPostingComment(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* PR Info Header */}
      {prInfo && (
        <div className="glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: '1rem' }}>{prInfo.title}</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {prInfo.filesChanged} files changed ·{' '}
              <a href={prInfo.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-blue)' }}>
                View on GitHub ↗
              </a>
            </p>
          </div>
          {result && <ScoreBadge score={result.score} size={80} />}
        </div>
      )}

      {/* Step Progress Bar */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        {[1, 2, 3, 4].map((s) => {
          const meta = STEP_META[s];
          const isDone = steps[s]?.done;
          const isAct = activeStep === s;
          return (
            <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{
                height: 4, borderRadius: 2,
                background: isDone ? meta.color : isAct ? `${meta.color}66` : 'var(--border)',
                transition: 'background 0.4s ease',
                boxShadow: isDone ? `0 0 8px ${meta.color}66` : 'none',
              }} />
              <span style={{ fontSize: '0.65rem', color: isDone || isAct ? meta.color : 'var(--text-muted)', textAlign: 'center', transition: 'color 0.3s' }}>
                {meta.icon} {meta.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Start Review Button */}
      {!isReviewing && !result && (
        <button id="start-review-btn" className="btn-primary" onClick={onStart} style={{ alignSelf: 'flex-start', fontSize: '1rem', padding: '0.875rem 2rem' }}>
          🤖 Start AI Review
        </button>
      )}

      {/* Error */}
      {error && (
        <div className="glass-card" style={{ padding: '1rem', borderColor: 'var(--accent-red)', background: 'rgba(239,68,68,0.05)' }}>
          <p style={{ color: 'var(--accent-red)' }}>⚠️ {error}</p>
        </div>
      )}

      {/* Step Cards */}
      {[1, 2, 3, 4].map((s) => (
        <StepCard key={s} stepNum={s} stepData={steps[s]} isActive={activeStep === s} />
      ))}

      {/* Final Result */}
      {result && (
        <div className="glass-card fade-in" style={{ padding: '1.5rem', borderColor: 'var(--accent-green)', background: 'rgba(16,185,129,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>✅ Review Complete</p>
              <VerdictChip verdict={result.verdict} />
            </div>
            <ScoreBadge score={result.score} size={100} />
          </div>

          {/* Score Breakdown */}
          {result.scoreBreakdown && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
              {Object.entries(result.scoreBreakdown).map(([key, val]) => (
                <div key={key} style={{ background: 'var(--bg-card)', borderRadius: 8, padding: '0.625rem 0.875rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                    {key.replace(/([A-Z])/g, ' $1')}
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-purple-light)' }}>{val}/25</span>
                </div>
              ))}
            </div>
          )}

          {/* Post to GitHub */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              id="post-comment-btn"
              className="btn-primary"
              onClick={handlePostComment}
              disabled={postingComment || commentPosted}
              style={{ opacity: commentPosted ? 0.7 : 1 }}
            >
              {commentPosted ? '✅ Posted to GitHub' : postingComment ? 'Posting…' : '💬 Post to GitHub'}
            </button>
            {prInfo?.url && (
              <a href={prInfo.url} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                View PR ↗
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewPanel;
