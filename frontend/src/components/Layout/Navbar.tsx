import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BarChart3, User, LayoutDashboard, Shield, LogIn, UserPlus, LogOut } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <NavLink to="/" className="navbar-brand">
        <BarChart3 size={24} color="#60a5fa" />
        <span>StatCapacity Platform</span>
      </NavLink>

      <nav className="navbar-links">
        <NavLink to="/" className={({ isActive }) => isActive ? "active" : ""}>
          Home
        </NavLink>

        {isAuthenticated ? (
          <>
            <NavLink to="/dashboard" className={({ isActive }) => isActive ? "active" : ""}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <LayoutDashboard size={16} /> Dashboard
              </span>
            </NavLink>
            {user?.role === 'ADMIN' && (
              <NavLink to="/admin" className={({ isActive }) => isActive ? "active" : ""}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Shield size={16} /> Admin
                </span>
              </NavLink>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.5rem', background: 'rgba(255,255,255,0.1)', padding: '0.375rem 0.75rem', borderRadius: '0.375rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <User size={14} /> {user?.username}
                <span style={{
                  fontSize: '0.7rem',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '0.2rem',
                  background: user?.role === 'ADMIN' ? '#ef4444' : '#0d9488',
                  color: '#ffffff',
                  marginLeft: '0.25rem'
                }}>
                  {user?.role}
                </span>
              </span>
              <button
                onClick={handleLogout}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#f87171',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
                title="Sign Out"
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
          </>
        ) : (
          <>
            <NavLink to="/login" className={({ isActive }) => isActive ? "active" : ""}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <LogIn size={16} /> Login
              </span>
            </NavLink>
            <NavLink to="/register" className="btn btn-secondary" style={{ color: '#ffffff' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <UserPlus size={16} /> Register
              </span>
            </NavLink>
          </>
        )}
      </nav>
    </header>
  );
};
