import React from 'react';
import { LayoutDashboard, Award, BookOpen, Target, AlertCircle } from 'lucide-react';

export const UserDashboardPage: React.FC = () => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1e3a8a' }}>Officer Dashboard</h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Stage 1 Placeholder — User Profile & Skill-Gap Analysis Shell</p>
        </div>
        <span className="badge" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
          Role: Statistical Officer (Assigned)
        </span>
      </div>

      <div className="card" style={{ borderLeft: '4px solid #3b82f6', background: '#eff6ff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertCircle color="#1d4ed8" size={24} />
          <div>
            <h4 style={{ color: '#1e40af', fontWeight: 600 }}>Stage 1 Foundation Status</h4>
            <p style={{ color: '#1e3a8a', fontSize: '0.9rem' }}>
              Real-time user assessment scores, competency gap metrics, and iGOT course recommendations will populate in subsequent MVP stages.
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Award size={28} color="#0d9488" />
            <div>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Assessed Competencies</span>
              <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>5 / 18</p>
            </div>
          </div>
        </div>
        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Target size={28} color="#3b82f6" />
            <div>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Target Role Gap</span>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f59e0b' }}>-15% Baseline</p>
            </div>
          </div>
        </div>
        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <BookOpen size={28} color="#8b5cf6" />
            <div>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Recommended Courses</span>
              <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>3 Modules</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section Shell */}
      <div className="card">
        <h3 className="card-title">Competency Progress Overview</h3>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Visual progress bars comparing current assessed proficiency (0–100) vs. required benchmark level.
        </p>
        <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.375rem', border: '1px border #e2e8f0' }}>
          <p style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center' }}>
            [ Competency Gap Engine Visual Component Shell Placeholder ]
          </p>
        </div>
      </div>
    </div>
  );
};
