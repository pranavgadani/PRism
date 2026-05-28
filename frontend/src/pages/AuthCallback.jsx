import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

const AuthCallback = () => {
  const [params] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    const error = params.get('error');

    if (error || !token) {
      console.error('Auth error:', error);
      navigate('/');
      return;
    }

    const finishAuth = async () => {
      try {
        localStorage.setItem('prism_token', token);
        const { data: user } = await authAPI.getMe();
        login(token, user);
        navigate('/dashboard');
      } catch (err) {
        console.error('Failed to fetch user:', err);
        navigate('/');
      }
    };

    finishAuth();
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', background: 'var(--bg-primary)' }}>
      <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
      <p style={{ color: 'var(--text-secondary)' }}>Signing you in…</p>
    </div>
  );
};

export default AuthCallback;
