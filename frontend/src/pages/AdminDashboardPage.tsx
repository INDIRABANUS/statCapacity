import React from 'react';
import { Shield, Database, Users, Server } from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a' }}>System Admin Dashboard</h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Stage 1 Placeholder — System Management & Data Control</p>
        </div>
        <span className="badge" style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '0.5rem 1rem' }}>
          Admin Mode
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Database size={28} color="#1e3a8a" />
            <div>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Seeded Collections</span>
              <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>5 Collections</p>
            </div>
          </div>
        </div>
        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Server size={28} color="#0d9488" />
            <div>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Total Course Records</span>
              <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>55 (35 iGOT + 20 NSSSTA)</p>
            </div>
          </div>
        </div>
        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Users size={28} color="#8b5cf6" />
            <div>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Prototype Roles</span>
              <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>10 Roles</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Database Taxonomy Administration</h3>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Overview of reference data catalogs stored in MongoDB (`roles`, `skills`, `competencies`, `role_competencies`, `courses`).
        </p>
        <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.375rem', border: '1px solid #e2e8f0' }}>
          <p style={{ color: '#64748b', fontStyle: 'italic', textAlign: 'center' }}>
            [ Administrative Dataset Management & iGOT ETL Controls Placeholder ]
          </p>
        </div>
      </div>
    </div>
  );
};
