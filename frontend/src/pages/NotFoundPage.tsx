import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <AlertTriangle size={64} color="#f59e0b" style={{ marginBottom: '1rem' }} />
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e293b' }}>404 — Page Not Found</h1>
      <p style={{ color: '#64748b', fontSize: '1.1rem', margin: '1rem auto 2rem', maxWidth: '500px' }}>
        The requested page URL does not exist or has been moved.
      </p>
      <Link to="/" className="btn btn-primary">
        Return to Home Page
      </Link>
    </div>
  );
};
