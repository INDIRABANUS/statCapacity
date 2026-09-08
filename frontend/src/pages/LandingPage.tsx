import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart2, BookOpen, Target, CheckCircle2, Server } from 'lucide-react';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { ErrorMessage } from '../components/Common/ErrorMessage';

interface HealthStatus {
  status: string;
  database_connected: boolean;
  project: string;
}

export const LandingPage: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/health')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setHealth(data);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Health check error:", err);
        setError("Backend API offline or unreachable");
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#ffffff', borderRadius: '0.75rem', marginBottom: '2rem', border: '1px solid #e2e8f0' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e3a8a', marginBottom: '1rem' }}>
          Official Statistics Capacity Building Platform
        </h1>
        <p style={{ fontSize: '1.15rem', color: '#475569', maxWidth: '800px', margin: '0 auto 2rem' }}>
          Unified competency framework, skill-gap analysis, and tailored training recommendations for government statistical organizations.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/register" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
            Get Started
          </Link>
          <Link to="/dashboard" className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
            View Dashboard Shell
          </Link>
        </div>
      </div>

      {/* Backend Status Section */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Server size={20} color="#1e3a8a" />
          <h3 className="card-title" style={{ margin: 0 }}>Backend Service Status</h3>
        </div>
        {loading && <LoadingSpinner message="Checking backend API health..." />}
        {error && <ErrorMessage title="Connection Warning" message={error} />}
        {health && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>API Status</span>
              <p style={{ fontWeight: 700, color: '#10b981' }}>{health.status}</p>
            </div>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>MongoDB Connection</span>
              <p style={{ fontWeight: 700, color: health.database_connected ? '#10b981' : '#f59e0b' }}>
                {health.database_connected ? 'Connected' : 'Offline / Standard Fallback'}
              </p>
            </div>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Stage</span>
              <p style={{ fontWeight: 700, color: '#1e3a8a' }}>Stage 1 — Full-Stack Foundation</p>
            </div>
          </div>
        )}
      </div>

      {/* Feature Highlights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div className="card">
          <Target size={32} color="#0d9488" style={{ marginBottom: '0.75rem' }} />
          <h3 className="card-title">Competency Mapping</h3>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
            Structured 0–100 proficiency benchmarking mapping official statistical roles to required competencies.
          </p>
        </div>
        <div className="card">
          <BookOpen size={32} color="#3b82f6" style={{ marginBottom: '0.75rem' }} />
          <h3 className="card-title">iGOT & NSSSTA Integration</h3>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
            Standardized course catalogs bridging iGOT Karmayogi civil service training and NSSSTA statistical modules.
          </p>
        </div>
        <div className="card">
          <BarChart2 size={32} color="#8b5cf6" style={{ marginBottom: '0.75rem' }} />
          <h3 className="card-title">Skill-Gap Engine</h3>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
            Automated targeted recommendations designed to elevate statistical capacity across national authorities.
          </p>
        </div>
      </div>
    </div>
  );
};
