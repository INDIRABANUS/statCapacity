import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn } from 'lucide-react';
import { ErrorMessage } from '../components/Common/ErrorMessage';

export const LoginPage: React.FC = () => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!emailOrUsername.trim() || !password) return;

    const success = await login(emailOrUsername, password);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div style={{ maxWidth: '450px', margin: '3rem auto' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <LogIn size={40} color="#1e3a8a" />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.5rem' }}>Officer Login</h2>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Sign in to access your capacity profile</p>
        </div>

        {error && <ErrorMessage title="Authentication Failed" message={error} />}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email or Username</label>
            <input
              type="text"
              className="form-input"
              placeholder="username or officer@gov.in"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem' }}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.9rem', color: '#64748b' }}>
          Don't have an officer account? <Link to="/register" style={{ color: '#3b82f6', fontWeight: 600 }}>Register here</Link>
        </div>
      </div>
    </div>
  );
};
