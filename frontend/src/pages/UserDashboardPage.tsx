import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Award,
  BookOpen,
  Target,
  AlertCircle,
  Briefcase,
  Save,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  BarChart2,
  TrendingDown,
  Info
} from 'lucide-react';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { ErrorMessage } from '../components/Common/ErrorMessage';

interface Role {
  role_id: string;
  role_name: string;
  department: string;
  description: string;
}

interface Competency {
  competency_id: string;
  name: string;
  category: string;
  description: string;
  proficiency_levels?: Record<string, string>;
}

interface UserCompetency {
  user_id: string;
  competency_id: string;
  current_level: number;
  source: string;
  updated_at: string;
}

interface SkillGapItem {
  competency_id: string;
  competency: string;
  category: string;
  current_level: number;
  required_level: number;
  gap: number;
  severity: 'No Gap' | 'Low' | 'Moderate' | 'High' | 'Critical';
  explanation: string;
}

export const UserDashboardPage: React.FC = () => {
  const { user, token, updateUser } = useAuth();

  // Role Configuration State
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState<boolean>(true);
  const [rolesError, setRolesError] = useState<string | null>(null);

  const [currentRoleId, setCurrentRoleId] = useState<string>('');
  const [targetRoleId, setTargetRoleId] = useState<string>('');

  const [savingRole, setSavingRole] = useState<boolean>(false);
  const [roleSaveSuccess, setRoleSaveSuccess] = useState<string | null>(null);
  const [roleSaveError, setRoleSaveError] = useState<string | null>(null);

  // Competencies State
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [userCompetencyLevels, setUserCompetencyLevels] = useState<Record<string, number>>({});
  const [initialAssessmentsCount, setInitialAssessmentsCount] = useState<number>(0);
  const [loadingCompetencies, setLoadingCompetencies] = useState<boolean>(true);
  const [competenciesError, setCompetenciesError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const [savingCompetencies, setSavingCompetencies] = useState<boolean>(false);
  const [competenciesSuccess, setCompetenciesSuccess] = useState<string | null>(null);
  const [competenciesSaveError, setCompetenciesSaveError] = useState<string | null>(null);

  // Skill Gaps State
  const [skillGaps, setSkillGaps] = useState<SkillGapItem[]>([]);
  const [loadingGaps, setLoadingGaps] = useState<boolean>(false);
  const [gapsError, setGapsError] = useState<string | null>(null);

  // Fetch skill gaps from backend
  const fetchSkillGaps = useCallback(async (authToken: string) => {
    setLoadingGaps(true);
    setGapsError(null);
    try {
      const res = await fetch('/api/v1/users/me/skill-gaps', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (!res.ok) {
        throw new Error(`Failed to load skill gaps: HTTP ${res.status}`);
      }
      const data: SkillGapItem[] = await res.json();
      setSkillGaps(data);
    } catch (err: any) {
      console.error('Error loading skill gaps:', err);
      setGapsError(err.message || 'Failed to load skill-gap analysis.');
    } finally {
      setLoadingGaps(false);
    }
  }, []);

  // Initial Data Fetching
  useEffect(() => {
    let isMounted = true;

    // 1. Fetch available roles
    fetch('/api/v1/roles')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: Role[]) => {
        if (isMounted) {
          setRoles(data);
          setLoadingRoles(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Error fetching roles:', err);
          setRolesError('Unable to load statistical roles catalog.');
          setLoadingRoles(false);
        }
      });

    // 2. Fetch all competencies
    fetch('/api/v1/competencies')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: Competency[]) => {
        if (isMounted) {
          setCompetencies(data);
          setLoadingCompetencies(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Error fetching competencies:', err);
          setCompetenciesError('Unable to load competencies catalog.');
          setLoadingCompetencies(false);
        }
      });

    // 3. If authenticated, fetch user competencies and latest profile
    if (token) {
      // Sync latest profile
      fetch('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((userData) => {
          if (userData && isMounted) {
            updateUser(userData);
            if (userData.current_role_id) setCurrentRoleId(userData.current_role_id);
            if (userData.target_role_id) setTargetRoleId(userData.target_role_id);
          }
        })
        .catch((err) => console.warn('Could not sync user profile:', err));

      // Fetch user assessed competencies
      fetch('/api/v1/users/me/competencies', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => (res.ok ? res.json() : []))
        .then((userComps: UserCompetency[]) => {
          if (isMounted) {
            const levelMap: Record<string, number> = {};
            userComps.forEach((uc) => {
              levelMap[uc.competency_id] = uc.current_level;
            });
            setUserCompetencyLevels(levelMap);
            setInitialAssessmentsCount(userComps.length);
          }
        })
        .catch((err) => console.warn('Could not fetch user competencies:', err));

      // Fetch skill gaps
      fetchSkillGaps(token);
    }

    return () => {
      isMounted = false;
    };
  }, [token, fetchSkillGaps]);

  // Synchronize state when user changes in context
  useEffect(() => {
    if (user?.current_role_id) setCurrentRoleId(user.current_role_id);
    if (user?.target_role_id) setCurrentRoleId((prev) => prev || user.current_role_id || '');
    if (user?.target_role_id) setTargetRoleId(user.target_role_id);
  }, [user]);

  // Handle Save Roles
  const handleSaveRoles = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoleSaveError(null);
    setRoleSaveSuccess(null);
    setSavingRole(true);

    try {
      const res = await fetch('/api/v1/users/me/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          current_role_id: currentRoleId || null,
          target_role_id: targetRoleId || null
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to update user role configuration.');
      }

      updateUser(data);
      setRoleSaveSuccess('Role configuration saved successfully! Your profile has been updated.');

      // Refresh skill gaps immediately with the new target role
      if (token) {
        fetchSkillGaps(token);
      }
    } catch (err: any) {
      setRoleSaveError(err.message || 'An error occurred while saving role selections.');
    } finally {
      setSavingRole(false);
    }
  };

  // Handle Competency Level Change
  const handleLevelChange = (competencyId: string, value: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(value)));
    setUserCompetencyLevels((prev) => ({
      ...prev,
      [competencyId]: clamped
    }));
    setCompetenciesSuccess(null);
  };

  // Handle Save Competencies
  const handleSaveCompetencies = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompetenciesSaveError(null);
    setCompetenciesSuccess(null);
    setSavingCompetencies(true);

    try {
      const payload = {
        competencies: Object.entries(userCompetencyLevels).map(([comp_id, level]) => ({
          competency_id: comp_id,
          current_level: level
        }))
      };

      const res = await fetch('/api/v1/users/me/competencies', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to save competency assessments.');
      }

      setInitialAssessmentsCount(data.length);
      setCompetenciesSuccess('Competency assessments saved successfully! Your skill profile has been updated.');

      // Refresh skill gaps immediately with the updated assessments
      if (token) {
        fetchSkillGaps(token);
      }
    } catch (err: any) {
      setCompetenciesSaveError(err.message || 'An error occurred while saving competencies.');
    } finally {
      setSavingCompetencies(false);
    }
  };

  const currentRoleObj = roles.find((r) => r.role_id === (user?.current_role_id || currentRoleId));
  const targetRoleObj = roles.find((r) => r.role_id === (user?.target_role_id || targetRoleId));

  // Category filtering
  const categories = ['ALL', ...Array.from(new Set(competencies.map((c) => c.category)))];
  const filteredCompetencies = selectedCategory === 'ALL'
    ? competencies
    : competencies.filter((c) => c.category === selectedCategory);

  // Severity style helper
  const getSeverityBadgeStyle = (severity: SkillGapItem['severity']) => {
    switch (severity) {
      case 'No Gap':
        return { backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #86efac' };
      case 'Low':
        return { backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc' };
      case 'Moderate':
        return { backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fcd34d' };
      case 'High':
        return { backgroundColor: '#ffedd5', color: '#c2410c', border: '1px solid #fdba74' };
      case 'Critical':
        return { backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' };
      default:
        return { backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' };
    }
  };

  // Proficiency level label helper
  const getProficiencyTier = (score: number) => {
    if (score <= 0) return { label: 'Unassessed', color: '#94a3b8' };
    if (score <= 24) return { label: 'Novice (0–24)', color: '#64748b' };
    if (score <= 40) return { label: 'Beginner (25–40)', color: '#3b82f6' };
    if (score <= 65) return { label: 'Intermediate (41–65)', color: '#0d9488' };
    if (score <= 85) return { label: 'Advanced (66–85)', color: '#8b5cf6' };
    return { label: 'Expert (86–100)', color: '#16a34a' };
  };

  // Metrics calculations
  const assessedCount = Object.keys(userCompetencyLevels).length;
  const criticalGaps = skillGaps.filter((g) => g.severity === 'Critical').length;
  const highGaps = skillGaps.filter((g) => g.severity === 'High').length;
  const maxGap = skillGaps.length > 0 ? Math.max(...skillGaps.map((g) => g.gap)) : 0;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1e3a8a', margin: '0 0 0.25rem 0' }}>
            Officer Capacity & Skill-Gap Dashboard
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
            Official Profile: <strong>{user?.username}</strong> ({user?.email}) | Stage 3: Competency & Skill-Gap Engine Active
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span className="badge" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', backgroundColor: '#e0f2fe', color: '#0369a1' }}>
            Current: {currentRoleObj ? currentRoleObj.role_name : 'Unassigned'}
          </span>
          <span className="badge" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', backgroundColor: '#fef3c7', color: '#92400e' }}>
            Target: {targetRoleObj ? targetRoleObj.role_name : 'Unassigned'}
          </span>
        </div>
      </div>

      {/* Overview Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Award size={30} color="#0d9488" />
            <div>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Assessed Competencies</span>
              <p style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>
                {assessedCount} / {competencies.length}
              </p>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Target size={30} color="#3b82f6" />
            <div>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Target Role Benchmarks</span>
              <p style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: targetRoleObj ? '#1e3a8a' : '#94a3b8' }}>
                {targetRoleObj ? `${skillGaps.length} Competencies` : 'Select Target'}
              </p>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <TrendingDown size={30} color={criticalGaps > 0 ? '#ef4444' : maxGap > 0 ? '#f59e0b' : '#10b981'} />
            <div>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Max Competency Gap</span>
              <p style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: criticalGaps > 0 ? '#b91c1c' : '#1e3a8a' }}>
                {targetRoleObj ? (maxGap > 0 ? `-${maxGap} pts` : '0 (Benchmark Met)') : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={30} color={criticalGaps > 0 ? '#b91c1c' : highGaps > 0 ? '#ea580c' : '#10b981'} />
            <div>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Gap Severity Breakdown</span>
              <p style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                {targetRoleObj ? `${criticalGaps} Critical, ${highGaps} High` : 'Role Required'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: Officer Role & Target Configuration */}
      <div className="card" style={{ borderTop: '4px solid #0d9488', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <Briefcase size={26} color="#0d9488" />
          <div>
            <h3 className="card-title" style={{ margin: 0, fontSize: '1.25rem' }}>1. Officer Role & Target Configuration</h3>
            <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
              Select your current statistical post and your target aspirational role for competency gap benchmarking.
            </p>
          </div>
        </div>

        {rolesError && <ErrorMessage title="Roles Catalog Error" message={rolesError} />}
        {roleSaveError && <ErrorMessage title="Update Failed" message={roleSaveError} />}

        {roleSaveSuccess && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '0.375rem',
            color: '#166534',
            marginBottom: '1rem',
            fontSize: '0.9rem'
          }}>
            <CheckCircle2 size={18} color="#16a34a" />
            <span>{roleSaveSuccess}</span>
          </div>
        )}

        {loadingRoles ? (
          <LoadingSpinner message="Loading official statistics roles catalog..." />
        ) : (
          <form onSubmit={handleSaveRoles}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
              {/* Current Role Selection */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600, color: '#1e3a8a' }}>
                  Current Official Role
                </label>
                <select
                  className="form-input"
                  value={currentRoleId}
                  onChange={(e) => {
                    setCurrentRoleId(e.target.value);
                    setRoleSaveSuccess(null);
                  }}
                  style={{ backgroundColor: '#ffffff' }}
                >
                  <option value="">-- Select Current Role --</option>
                  {roles.map((r) => (
                    <option key={`curr-${r.role_id}`} value={r.role_id}>
                      {r.role_name} ({r.department})
                    </option>
                  ))}
                </select>
                {currentRoleId && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.825rem', color: '#64748b', background: '#f8fafc', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #e2e8f0' }}>
                    <strong>{roles.find((r) => r.role_id === currentRoleId)?.role_name}</strong>: {roles.find((r) => r.role_id === currentRoleId)?.description}
                  </div>
                )}
              </div>

              {/* Target Role Selection */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600, color: '#0d9488' }}>
                  Target Aspirational Role
                </label>
                <select
                  className="form-input"
                  value={targetRoleId}
                  onChange={(e) => {
                    setTargetRoleId(e.target.value);
                    setRoleSaveSuccess(null);
                  }}
                  style={{ backgroundColor: '#ffffff' }}
                >
                  <option value="">-- Select Target Role --</option>
                  {roles.map((r) => (
                    <option key={`tgt-${r.role_id}`} value={r.role_id}>
                      {r.role_name} ({r.department})
                    </option>
                  ))}
                </select>
                {targetRoleId && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.825rem', color: '#64748b', background: '#f8fafc', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #e2e8f0' }}>
                    <strong>{roles.find((r) => r.role_id === targetRoleId)?.role_name}</strong>: {roles.find((r) => r.role_id === targetRoleId)?.description}
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={savingRole}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem' }}
            >
              <Save size={16} />
              {savingRole ? 'Saving Role Profile...' : 'Save Role Configuration'}
            </button>
          </form>
        )}
      </div>

      {/* SECTION 2: My Competencies */}
      <div className="card" style={{ borderTop: '4px solid #3b82f6', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Award size={26} color="#3b82f6" />
            <div>
              <h3 className="card-title" style={{ margin: 0, fontSize: '1.25rem' }}>2. My Competencies (Assessed Proficiency Profile)</h3>
              <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
                Enter or update your self-assessed proficiency scores on a transparent 0–100 scale.
              </p>
            </div>
          </div>
          <span className="badge" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', backgroundColor: '#eff6ff', color: '#1e40af' }}>
            {assessedCount} of {competencies.length} Evaluated
          </span>
        </div>

        {/* Empty State Banner when no assessments exist */}
        {initialAssessmentsCount === 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '0.5rem',
            marginBottom: '1.25rem'
          }}>
            <Info size={22} color="#2563eb" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.9rem', color: '#1e40af' }}>
              <strong>No competency assessment on record yet.</strong> Enter your estimated proficiency levels (0–100) below and click <strong>"Save Competencies"</strong> to establish your initial baseline.
            </div>
          </div>
        )}

        {competenciesError && <ErrorMessage title="Competencies Error" message={competenciesError} />}
        {competenciesSaveError && <ErrorMessage title="Save Failed" message={competenciesSaveError} />}

        {competenciesSuccess && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '0.375rem',
            color: '#166534',
            marginBottom: '1rem',
            fontSize: '0.9rem'
          }}>
            <CheckCircle2 size={18} color="#16a34a" />
            <span>{competenciesSuccess}</span>
          </div>
        )}

        {/* Category Filters */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          {categories.map((cat) => (
            <button
              key={`filter-${cat}`}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid',
                borderColor: selectedCategory === cat ? '#3b82f6' : '#e2e8f0',
                backgroundColor: selectedCategory === cat ? '#3b82f6' : '#ffffff',
                color: selectedCategory === cat ? '#ffffff' : '#475569',
                fontSize: '0.825rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {loadingCompetencies ? (
          <LoadingSpinner message="Loading official competency framework..." />
        ) : (
          <form onSubmit={handleSaveCompetencies}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {filteredCompetencies.map((comp) => {
                const currentScore = userCompetencyLevels[comp.competency_id] ?? 0;
                const tier = getProficiencyTier(currentScore);

                return (
                  <div
                    key={comp.competency_id}
                    style={{
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#ffffff',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h4 style={{ margin: 0, fontSize: '1rem', color: '#1e293b', fontWeight: 600 }}>
                        {comp.name}
                      </h4>
                      <span
                        style={{
                          fontSize: '0.725rem',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '0.25rem',
                          backgroundColor: '#f1f5f9',
                          color: '#475569',
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          marginLeft: '0.5rem'
                        }}
                      >
                        {comp.category}
                      </span>
                    </div>

                    <p style={{ color: '#64748b', fontSize: '0.825rem', margin: '0 0 0.75rem 0', lineHeight: 1.4 }}>
                      {comp.description}
                    </p>

                    {/* Level Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={currentScore}
                        onChange={(e) => handleLevelChange(comp.competency_id, Number(e.target.value))}
                        style={{ flex: 1, cursor: 'pointer' }}
                      />
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={currentScore}
                        onChange={(e) => handleLevelChange(comp.competency_id, Number(e.target.value))}
                        style={{
                          width: '65px',
                          padding: '0.35rem',
                          textAlign: 'center',
                          borderRadius: '0.25rem',
                          border: '1px solid #cbd5e1',
                          fontWeight: 700,
                          fontSize: '0.95rem'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', fontSize: '0.775rem' }}>
                      <span style={{ color: tier.color, fontWeight: 600 }}>
                        {tier.label}
                      </span>
                      <span style={{ color: '#94a3b8' }}>Scale: 0–100</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <button
                type="submit"
                className="btn btn-secondary"
                disabled={savingCompetencies}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.5rem', color: '#ffffff' }}
              >
                <Save size={16} />
                {savingCompetencies ? 'Saving Competencies...' : 'Save Competency Assessments'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* SECTION 3: Skill Gap Analysis */}
      <div className="card" style={{ borderTop: '4px solid #8b5cf6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <BarChart2 size={26} color="#8b5cf6" />
            <div>
              <h3 className="card-title" style={{ margin: 0, fontSize: '1.25rem' }}>3. Skill Gap Analysis</h3>
              <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
                Deterministic comparison between your assessed competency levels and target role benchmarks.
              </p>
            </div>
          </div>
          {targetRoleObj && (
            <span className="badge" style={{ padding: '0.4rem 0.75rem', fontSize: '0.825rem', backgroundColor: '#f5f3ff', color: '#6d28d9' }}>
              Target: {targetRoleObj.role_name}
            </span>
          )}
        </div>

        {gapsError && <ErrorMessage title="Gap Analysis Error" message={gapsError} />}

        {/* Behavior 6: If user has no target role */}
        {!targetRoleId && !user?.target_role_id ? (
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            backgroundColor: '#f8fafc',
            borderRadius: '0.5rem',
            border: '2px dashed #cbd5e1'
          }}>
            <Target size={44} color="#94a3b8" style={{ marginBottom: '0.75rem' }} />
            <h4 style={{ fontSize: '1.15rem', color: '#1e293b', marginBottom: '0.5rem', fontWeight: 600 }}>
              Select a target role to calculate your skill gaps.
            </h4>
            <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '500px', margin: '0 auto 1.25rem' }}>
              Skill-gap analysis compares your assessed proficiencies against the official benchmark requirements of an aspirational role.
            </p>
            <a
              href="#top"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Briefcase size={16} /> Configure Target Role Above
            </a>
          </div>
        ) : loadingGaps ? (
          <LoadingSpinner message="Calculating skill-gap metrics against target role benchmarks..." />
        ) : skillGaps.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>
            No required competencies found for this target role.
          </div>
        ) : (
          <div>
            {/* Severity Legend */}
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              flexWrap: 'wrap',
              alignItems: 'center',
              padding: '0.75rem 1rem',
              backgroundColor: '#f8fafc',
              borderRadius: '0.375rem',
              border: '1px solid #e2e8f0',
              marginBottom: '1.25rem',
              fontSize: '0.8rem'
            }}>
              <span style={{ fontWeight: 600, color: '#334155' }}>Severity Scale:</span>
              <span style={{ padding: '0.2rem 0.5rem', borderRadius: '0.25rem', ...getSeverityBadgeStyle('No Gap') }}>No Gap (0)</span>
              <span style={{ padding: '0.2rem 0.5rem', borderRadius: '0.25rem', ...getSeverityBadgeStyle('Low') }}>Low (1–15)</span>
              <span style={{ padding: '0.2rem 0.5rem', borderRadius: '0.25rem', ...getSeverityBadgeStyle('Moderate') }}>Moderate (16–30)</span>
              <span style={{ padding: '0.2rem 0.5rem', borderRadius: '0.25rem', ...getSeverityBadgeStyle('High') }}>High (31–50)</span>
              <span style={{ padding: '0.2rem 0.5rem', borderRadius: '0.25rem', ...getSeverityBadgeStyle('Critical') }}>Critical (&gt;50)</span>
            </div>

            {/* Gap List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {skillGaps.map((item) => {
                const currentPct = Math.min(100, item.current_level);
                const reqPct = Math.min(100, item.required_level);

                return (
                  <div
                    key={`gap-${item.competency_id}`}
                    style={{
                      padding: '1.25rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #e2e8f0',
                      backgroundColor: item.severity === 'Critical' ? '#fffbfb' : '#ffffff',
                      borderLeft: `4px solid ${
                        item.severity === 'Critical' ? '#ef4444' :
                        item.severity === 'High' ? '#f97316' :
                        item.severity === 'Moderate' ? '#f59e0b' :
                        item.severity === 'Low' ? '#3b82f6' : '#10b981'
                      }`
                    }}
                  >
                    {/* Header line */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#1e293b', fontWeight: 600 }}>
                          {item.competency}
                        </h4>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Category: {item.category}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '0.375rem',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            ...getSeverityBadgeStyle(item.severity)
                          }}
                        >
                          {item.severity}
                        </span>
                        <span
                          style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '0.375rem',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            backgroundColor: item.gap > 0 ? '#fee2e2' : '#dcfce7',
                            color: item.gap > 0 ? '#b91c1c' : '#15803d'
                          }}
                        >
                          {item.gap > 0 ? `Gap: -${item.gap}` : 'Requirement Met'}
                        </span>
                      </div>
                    </div>

                    {/* Comparative Dual Progress Bar */}
                    <div style={{ margin: '0.85rem 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem', color: '#475569' }}>
                        <span>
                          Current Assessed: <strong>{item.current_level}</strong> / 100
                        </span>
                        <span>
                          Required Benchmark: <strong>{item.required_level}</strong> / 100
                        </span>
                      </div>

                      <div style={{ position: 'relative', height: '14px', backgroundColor: '#e2e8f0', borderRadius: '7px', overflow: 'hidden' }}>
                        {/* Current Level Fill */}
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            height: '100%',
                            width: `${currentPct}%`,
                            backgroundColor: item.gap === 0 ? '#10b981' : item.current_level >= item.required_level * 0.7 ? '#3b82f6' : '#f59e0b',
                            borderRadius: '7px',
                            transition: 'width 0.4s ease'
                          }}
                        />
                        {/* Required Level Marker */}
                        <div
                          style={{
                            position: 'absolute',
                            left: `calc(${reqPct}% - 2px)`,
                            top: 0,
                            height: '100%',
                            width: '4px',
                            backgroundColor: '#0f172a',
                            zIndex: 2
                          }}
                          title={`Required Threshold: ${item.required_level}`}
                        />
                      </div>
                    </div>

                    {/* Section C: Explanation */}
                    <div style={{
                      padding: '0.6rem 0.85rem',
                      backgroundColor: '#f8fafc',
                      borderRadius: '0.375rem',
                      border: '1px solid #edf2f7',
                      fontSize: '0.85rem',
                      color: '#334155'
                    }}>
                      <span style={{ fontWeight: 600, color: '#1e3a8a' }}>Analysis: </span>
                      {item.explanation}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


