import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus } from 'lucide-react';
import { ErrorMessage } from '../components/Common/ErrorMessage';

export const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [clientError, setClientError] = useState<string | null>(null);

  const { register, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setClientError(null);

    if (password !== passwordConfirm) {
      setClientError("Passwords do not match. Please re-enter.");
      return;
    }

    if (password.length < 6) {
      setClientError("Password must be at least 6 characters long.");
      return;
    }

    const success = await register(username, email, password, passwordConfirm);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '3rem auto' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <UserPlus size={40} color="#0d9488" />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.5rem' }}>Officer Registration</h2>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Create your official statistics profile</p>
        </div>

        {(clientError || error) && (
          <ErrorMessage title="Registration Error" message={clientError || error || ''} />
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. stat_officer_raj"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Official Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="officer@gov.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Re-enter password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            className="btn btn-secondary"
            style={{ width: '100%', padding: '0.75rem', color: '#ffffff' }}
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Register Officer Account"}
          </button>
        </form>

        <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.9rem', color: '#64748b' }}>
          Already registered? <Link to="/login" style={{ color: '#0d9488', fontWeight: 600 }}>Sign in here</Link>
        </div>
      </div>
    </div>
  );
};
