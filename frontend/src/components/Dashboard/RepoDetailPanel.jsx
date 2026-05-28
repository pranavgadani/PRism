import { useEffect, useState } from 'react';
import { githubAPI } from '../../services/api';

const LANG_COLORS = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
  Java: '#b07219', Go: '#00ADD8', Rust: '#dea584', CSS: '#563d7c',
  HTML: '#e34c26', Ruby: '#701516', PHP: '#4F5D95', 'C++': '#f34b7d',
  'C#': '#178600', Shell: '#89e051', Vue: '#41b883', Swift: '#ffac45',
};

// Compute a project health score 0-100 from GitHub repo metadata
const computeScore = (repo) => {
  let score = 0;
  const breakdown = {};

  // Has description (10 pts)
  breakdown.description = repo.description ? 10 : 0;
  score += breakdown.description;

  // Has README / wiki (10 pts)
  breakdown.docs = repo.has_wiki ? 10 : 5;
  score += breakdown.docs;

  // Language detected (10 pts)
  breakdown.language = repo.language ? 10 : 0;
  score += breakdown.language;

  // Recency — updated within last 30 days (25 pts), 90 days (12 pts)
  const daysSince = (Date.now() - new Date(repo.updated_at)) / (1000 * 60 * 60 * 24);
  if (daysSince <= 30) breakdown.recency = 25;
  else if (daysSince <= 90) breakdown.recency = 12;
  else breakdown.recency = 0;
  score += breakdown.recency;

  // Low open issues — fewer is better (20 pts)
  if (repo.open_issues_count === 0) breakdown.issues = 20;
  else if (repo.open_issues_count <= 5) breakdown.issues = 13;
  else if (repo.open_issues_count <= 20) breakdown.issues = 6;
  else breakdown.issues = 0;
  score += breakdown.issues;

  // Forks (up to 15 pts)
  breakdown.forks = Math.min(15, repo.forks_count * 3);
  score += breakdown.forks;

  // License (10 pts)
  breakdown.license = repo.license ? 10 : 0;
  score += breakdown.license;

  return { score: Math.min(100, score), breakdown };
};

const ScoreRing = ({ score }) => {
  const radius = 54;
  const circ = 2 * Math.PI * radius;
  const fill = (score / 100) * circ;
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const label = score >= 75 ? 'Healthy' : score >= 50 ? 'Fair' : 'Needs Work';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      <svg width="130" height="130" viewBox="0 0 130 130">
        <circle cx="65" cy="65" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle
          cx="65" cy="65" r={radius} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 65 65)"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
        <text x="65" y="60" textAnchor="middle" fill={color} fontSize="24" fontWeight="800" fontFamily="Inter">{score}</text>
        <text x="65" y="78" textAnchor="middle" fill="#5a5a72" fontSize="11" fontFamily="Inter">/100</text>
      </svg>
      <span style={{
        fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em',
        padding: '0.2rem 0.75rem', borderRadius: 9999,
        background: `${color}22`, color, border: `1px solid ${color}44`,
      }}>{label}</span>
    </div>
  );
};

const BreakdownBar = ({ label, value, max }) => {
  const pct = Math.round((value / max) * 100);
  const color = pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.78rem' }}>
      <span style={{ width: 90, color: 'var(--text-secondary)', flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 9999, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%', background: color,
          borderRadius: 9999, transition: 'width 0.8s ease',
        }} />
      </div>
      <span style={{ width: 28, textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600 }}>{value}</span>
    </div>
  );
};

const RepoDetailPanel = ({ repo, onClose, onViewPRs }) => {
  const [prCount, setPrCount] = useState(null);
  const [visible, setVisible] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(true);
  const [analysisError, setAnalysisError] = useState(false);

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setVisible(true));

    // Fetch open PR count
    githubAPI.getPulls(repo.owner.login, repo.name)
      .then(({ data }) => setPrCount(data.length))
      .catch(() => setPrCount(0));

    // Fetch AI analysis
    setAnalysisLoading(true);
    setAnalysisError(false);
    setAnalysis(null);
    githubAPI.analyzeRepo(repo.owner.login, repo.name)
      .then(({ data }) => { setAnalysis(data); setAnalysisLoading(false); })
      .catch(() => { setAnalysisError(true); setAnalysisLoading(false); });
  }, [repo]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const { score, breakdown } = computeScore(repo);
  const langColor = LANG_COLORS[repo.language] || '#8b8b8b';
  const updatedAt = new Date(repo.updated_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const createdAt = new Date(repo.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)', zIndex: 50,
          opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 420,
        background: 'var(--bg-secondary)',
        borderLeft: '1px solid var(--border)',
        zIndex: 51, overflowY: 'auto', padding: '1.75rem',
        display: 'flex', flexDirection: 'column', gap: '1.5rem',
        transform: visible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--accent-blue)">
                <path d="M3 3h18v18H3V3zm2 2v14h14V5H5zm2 4h10v2H7V9zm0 4h6v2H7v-2z" />
              </svg>
              {repo.private && (
                <span style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem', background: 'rgba(245,158,11,0.15)', color: 'var(--accent-yellow)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 4, fontWeight: 700 }}>PRIVATE</span>
              )}
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-blue)', wordBreak: 'break-all' }}>
              {repo.full_name}
            </h2>
          </div>
          <button
            onClick={handleClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem', fontSize: '1.25rem', lineHeight: 1, flexShrink: 0 }}
          >✕</button>
        </div>

        {/* Description */}
        {repo.description ? (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7, padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid var(--border)' }}>
            {repo.description}
          </p>
        ) : (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No description provided.</p>
        )}

        {/* AI Project Insight */}
        <div style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 14, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1rem' }}>🤖</span>
            <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--accent-purple-light)', fontWeight: 700 }}>AI Project Insight</p>
            {analysisLoading && <div className="spinner" style={{ marginLeft: 'auto', width: 14, height: 14, borderWidth: 2 }} />}
          </div>

          {analysisLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[80, 60, 90, 70].map((w, i) => (
                <div key={i} className="skeleton" style={{ height: 12, width: `${w}%`, borderRadius: 6 }} />
              ))}
            </div>
          )}

          {analysisError && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Could not generate analysis for this repository.</p>
          )}

          {analysis && !analysisLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Type + Complexity badges */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {analysis.projectType && (
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.7rem', borderRadius: 9999, background: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)', border: '1px solid rgba(59,130,246,0.3)' }}>
                    {analysis.projectType}
                  </span>
                )}
                {analysis.complexity && (
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.7rem', borderRadius: 9999,
                    background: analysis.complexity === 'Beginner' ? 'rgba(16,185,129,0.15)' : analysis.complexity === 'Advanced' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                    color: analysis.complexity === 'Beginner' ? 'var(--accent-green)' : analysis.complexity === 'Advanced' ? 'var(--accent-red)' : 'var(--accent-yellow)',
                    border: `1px solid ${analysis.complexity === 'Beginner' ? 'rgba(16,185,129,0.3)' : analysis.complexity === 'Advanced' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
                  }}>
                    {analysis.complexity}
                  </span>
                )}
              </div>

              {/* What */}
              {analysis.what && (
                <div>
                  <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.3rem' }}>📌 What is this?</p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{analysis.what}</p>
                </div>
              )}

              {/* Why */}
              {analysis.why && (
                <div>
                  <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.3rem' }}>💡 Why use this?</p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{analysis.why}</p>
                </div>
              )}

              {/* Target Audience */}
              {analysis.targetAudience && (
                <div>
                  <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.3rem' }}>👥 Who is it for?</p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{analysis.targetAudience}</p>
                </div>
              )}

              {/* Tech Stack */}
              {analysis.techStack?.length > 0 && (
                <div>
                  <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.4rem' }}>🛠 Tech Stack</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {analysis.techStack.map((t) => (
                      <span key={t} style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', background: 'rgba(6,182,212,0.12)', color: 'var(--accent-cyan)', border: '1px solid rgba(6,182,212,0.25)', borderRadius: 6, fontFamily: 'JetBrains Mono, monospace' }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Features */}
              {analysis.keyFeatures?.length > 0 && (
                <div>
                  <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.4rem' }}>✨ Key Features</p>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {analysis.keyFeatures.map((f, i) => (
                      <li key={i} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                        <span style={{ color: 'var(--accent-green)', flexShrink: 0 }}>▸</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tags */}
              {analysis.tags?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {analysis.tags.map((t) => (
                    <span key={t} style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem', background: 'rgba(168,85,247,0.1)', color: 'var(--accent-purple-light)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 9999 }}>
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Score Ring */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.25rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '1rem' }}>Project Health Score</p>
          <ScoreRing score={score} />
        </div>

        {/* Score Breakdown */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', fontWeight: 700 }}>Score Breakdown</p>
          <BreakdownBar label="Description"  value={breakdown.description}  max={10} />
          <BreakdownBar label="Docs / Wiki"  value={breakdown.docs}         max={10} />
          <BreakdownBar label="Language"     value={breakdown.language}     max={10} />
          <BreakdownBar label="Recency"      value={breakdown.recency}      max={25} />
          <BreakdownBar label="Issues"       value={breakdown.issues}       max={20} />
          <BreakdownBar label="Forks"        value={breakdown.forks}        max={15} />
          <BreakdownBar label="License"      value={breakdown.license}      max={10} />
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {[
            { icon: '📦', label: 'Size',         val: repo.size >= 1024 ? `${(repo.size / 1024).toFixed(1)} MB` : `${repo.size} KB` },
            { icon: '🍴', label: 'Forks',         val: repo.forks_count },
            { icon: '⚠',  label: 'Open Issues',  val: repo.open_issues_count, color: repo.open_issues_count > 10 ? 'var(--accent-red)' : undefined },
            { icon: '🔃', label: 'Open PRs',      val: prCount !== null ? prCount : '…', color: prCount > 0 ? 'var(--accent-purple-light)' : undefined },
          ].map(({ icon, label, val, color }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.875rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{icon}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: color || 'var(--text-primary)' }}>{val}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Meta info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.8rem' }}>
          {repo.language && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Language</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: langColor, display: 'inline-block' }} />
                {repo.language}
              </span>
            </div>
          )}
          {repo.license && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>License</span>
              <span style={{ fontWeight: 600 }}>{repo.license.spdx_id}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Created</span>
            <span style={{ fontWeight: 600 }}>{createdAt}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Last updated</span>
            <span style={{ fontWeight: 600 }}>{updatedAt}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Visibility</span>
            <span style={{ fontWeight: 600 }}>{repo.private ? 'Private 🔒' : 'Public 🌍'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Default branch</span>
            <span style={{ fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>{repo.default_branch}</span>
          </div>
        </div>

        {/* Topics */}
        {repo.topics?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {repo.topics.map((t) => (
              <span key={t} style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', background: 'rgba(59,130,246,0.12)', color: 'var(--accent-blue)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 9999 }}>
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
          <button
            className="btn-primary"
            style={{ justifyContent: 'center' }}
            onClick={() => { handleClose(); onViewPRs(repo); }}
          >
            🔃 View Open Pull Requests {prCount !== null && prCount > 0 ? `(${prCount})` : ''}
          </button>
          <a
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
            style={{ justifyContent: 'center', textDecoration: 'none' }}
          >
            ↗ Open on GitHub
          </a>
        </div>
      </div>
    </>
  );
};

export default RepoDetailPanel;
