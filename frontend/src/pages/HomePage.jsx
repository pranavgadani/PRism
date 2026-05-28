import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GitHubLogin from '../components/Auth/GitHubLogin';

const HomePage = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, loading, navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 60% 0%, rgba(124,58,237,0.15) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(59,130,246,0.1) 0%, transparent 60%), var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Floating orbs */}
      <div style={{ position: 'absolute', top: '15%', left: '10%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(124,58,237,0.05)', filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '20%', right: '8%', width: 250, height: 250, borderRadius: '50%', background: 'rgba(59,130,246,0.05)', filter: 'blur(50px)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 680, textAlign: 'center', position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', padding: '0.5rem 1.25rem', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 40 }}>
          <span style={{ fontSize: '1.5rem' }}>🔮</span>
          <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }} className="gradient-text">PRism</span>
          <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', background: 'rgba(124,58,237,0.2)', borderRadius: 4, color: 'var(--accent-purple-light)', fontWeight: 600 }}>BETA</span>
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '1.5rem' }}>
          AI-Powered{' '}
          <span className="gradient-text">Code Reviews</span>
          <br />
          for GitHub PRs
        </h1>

        <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: 520, margin: '0 auto 2.5rem' }}>
          Get instant, intelligent feedback on your pull requests — bug detection, security analysis, code suggestions, and a quality score. Powered by <strong style={{ color: 'var(--accent-purple-light)' }}>LLaMA 3.3 70B</strong>.
        </p>

        {/* CTA */}
        <GitHubLogin />

        {/* Feature Pills */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '3rem' }}>
          {[
            { icon: '🐛', label: 'Bug Detection' },
            { icon: '🔒', label: 'Security Scan' },
            { icon: '⚡', label: 'Performance Tips' },
            { icon: '📊', label: 'Quality Score' },
            { icon: '💬', label: 'Post to GitHub' },
          ].map(({ icon, label }) => (
            <span key={label} style={{ padding: '0.4rem 1rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 9999, fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {icon} {label}
            </span>
          ))}
        </div>

        {/* Stats Row */}
        <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
          {[
            { val: '4-Step', label: 'AI Pipeline' },
            { val: 'Real-time', label: 'Token Streaming' },
            { val: 'LLaMA 3.3', label: '70B Model' },
          ].map(({ val, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <p style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)' }}>{val}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
