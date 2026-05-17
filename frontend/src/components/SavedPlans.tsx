import { Sparkles, Trash2, Heart, Calendar, Clock, Sun, Moon, Plus } from 'lucide-react';
import type { Plan } from '../types';

interface SavedPlansProps {
  plans: Plan[];
  activePlanId?: string;
  onSelectPlan: (plan: Plan) => void;
  onDeletePlan: (id: string) => void;
  onNewPlan: () => void;
  darkMode: boolean;
  setDarkMode: (darkMode: boolean) => void;
}

export default function SavedPlans({
  plans = [],
  activePlanId,
  onSelectPlan,
  onDeletePlan,
  onNewPlan,
  darkMode,
  setDarkMode
}: SavedPlansProps) {
  // Calculate quick stats
  const totalPlans = plans.length;
  const peaceScore = totalPlans > 0 ? 100 : 0; // standard fun stat for parents

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title">
          <Sparkles size={20} className="widget-icon-weather" style={{ color: 'var(--primary)' }} />
          <span>My Peace Center</span>
        </div>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="btn btn-secondary btn-icon-only flex-row"
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          style={{ width: '36px', height: '36px', borderRadius: '8px' }}
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      <div className="sidebar-scroll">
        <button onClick={onNewPlan} className="btn btn-primary flex-row" style={{ width: '100%', marginBottom: '0.5rem' }}>
          <Plus size={18} />
          <span>New Itinerary</span>
        </button>

        <div className="stats-box">
          <div className="stat-card">
            <div className="stat-value">{totalPlans}</div>
            <div className="stat-label">Saved Plans</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{peaceScore}%</div>
            <div className="stat-label">Peace Score</div>
          </div>
        </div>

        <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px', fontWeight: '700' }}>
            Itinerary History
          </h4>

          {plans.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <Heart size={28} style={{ color: 'var(--accent-pink)', marginBottom: '0.5rem', opacity: 0.6 }} />
              <p>No plans yet. Create one to claim your parental peace!</p>
            </div>
          ) : (
            plans.map((plan) => (
              <div
                key={plan.id}
                className={`saved-plan-item ${activePlanId === plan.id ? 'active' : ''}`}
                onClick={() => onSelectPlan(plan)}
              >
                <div className="plan-item-title">{plan.location}</div>
                <div className="plan-item-meta">
                  <span className="plan-tag flex-row" style={{ gap: '0.2rem' }}>
                    <Calendar size={10} />
                    {plan.time_period}
                  </span>
                  <span className="plan-tag flex-row" style={{ gap: '0.2rem' }}>
                    <Clock size={10} />
                    {plan.activity_type}
                  </span>
                </div>
                <button
                  className="delete-plan-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeletePlan(plan.id);
                  }}
                  title="Delete plan"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', justifyContent: 'center' }}>
          <span>Parental Peace Planner v2.0</span>
          <Heart size={10} fill="var(--accent-pink)" style={{ color: 'var(--accent-pink)' }} />
        </div>
      </div>
    </aside>
  );
}
