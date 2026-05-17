import React, { useState, useEffect } from 'react';
import SavedPlans from './components/SavedPlans';
import ItineraryDisplay from './components/ItineraryDisplay';
import { Sparkles, Clock, MapPin, Compass, Settings, ShieldAlert } from 'lucide-react';
import type { Plan, ActivityTile } from './types';

const ACTIVITY_TILES: ActivityTile[] = [
  { label: 'Arts & Crafts', emoji: '🎨' },
  { label: 'Outdoor Play', emoji: '🏃‍♂️' },
  { label: 'Museums & Science', emoji: '🔬' },
  { label: 'Theme Parks & Fun', emoji: '🎢' },
  { label: 'Food & Dining', emoji: '🍔' },
  { label: 'Theater & Music', emoji: '🎭' }
];

const HOURS = [
  '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM',
  '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM'
];

const parseHourToNumber = (h: string): number => {
  const [time, ampm] = h.split(' ');
  let [hours] = time.split(':').map(Number);
  if (ampm === 'PM' && hours !== 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  return hours;
};

const getPlannedHoursCount = (start: string, end: string): number => {
  const s = parseHourToNumber(start);
  const e = parseHourToNumber(end);
  return e > s ? e - s : 24 - s + e;
};

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activePlan, setActivePlan] = useState<Plan | null>(null);
  
  // Form State
  const [location, setLocation] = useState<string>('');
  const [startHour, setStartHour] = useState<string>('9:00 AM');
  const [endHour, setEndHour] = useState<string>('5:00 PM');
  const [timePeriod, setTimePeriod] = useState<string>('9:00 AM to 5:00 PM');
  const [activityType, setActivityType] = useState<string[]>([ACTIVITY_TILES[0].label]);

  const toggleActivityType = (label: string) => {
    if (activityType.includes(label)) {
      if (activityType.length > 1) {
        setActivityType(activityType.filter(a => a !== label));
      }
    } else {
      setActivityType([...activityType, label]);
    }
  };

  // Sync start/end hours to timePeriod
  useEffect(() => {
    setTimePeriod(`${startHour} to ${endHour}`);
  }, [startHour, endHour]);
  
  // API Config
  const [apiUrl, setApiUrl] = useState<string>(import.meta.env.VITE_API_URL || 'http://localhost:8000');
  const [showApiInput, setShowApiInput] = useState<boolean>(false);
  
  // Generation / Loading States
  const [isPlanning, setIsPlanning] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const [apiError, setApiError] = useState<string | null>(null);

  // Load plans from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('parental_plans');
    if (saved) {
      try {
        setPlans(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved plans', e);
      }
    }
  }, []);

  // Sync dark mode class
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  const savePlansToLocal = (updatedPlans: Plan[]) => {
    setPlans(updatedPlans);
    localStorage.setItem('parental_plans', JSON.stringify(updatedPlans));
  };

  const handleSelectPlan = (plan: Plan) => {
    setActivePlan(plan);
    setLocation(plan.location);
    // Parse comma separated activities back into state array
    const parsedActivities = plan.activity_type.split(',').map(s => s.trim());
    const validActivities = parsedActivities.filter(a => ACTIVITY_TILES.some(tile => tile.label === a));
    setActivityType(validActivities.length > 0 ? validActivities : [ACTIVITY_TILES[0].label]);
    
    // Parse start and end hour if formatted as "X to Y"
    const timeParts = plan.time_period.split(' to ');
    if (timeParts.length === 2 && HOURS.includes(timeParts[0]) && HOURS.includes(timeParts[1])) {
      setStartHour(timeParts[0]);
      setEndHour(timeParts[1]);
      setTimePeriod(plan.time_period);
    } else {
      setStartHour('9:00 AM');
      setEndHour('5:00 PM');
      setTimePeriod('9:00 AM to 5:00 PM');
    }
    
    setApiError(null);
  };

  const handleDeletePlan = (id: string) => {
    const updated = plans.filter(p => p.id !== id);
    savePlansToLocal(updated);
    if (activePlan && activePlan.id === id) {
      setActivePlan(null);
    }
  };

  const handleNewPlan = () => {
    setActivePlan(null);
    setLocation('');
    setStartHour('9:00 AM');
    setEndHour('5:00 PM');
    setTimePeriod('9:00 AM to 5:00 PM');
    setActivityType([ACTIVITY_TILES[0].label]);
    setApiError(null);
  };

  const handleSaveActivePlan = () => {
    if (!activePlan) return;
    
    // Check if plan already saved
    if (plans.some(p => p.id === activePlan.id)) {
      alert("This plan is already saved in your history!");
      return;
    }
    
    const updated = [activePlan, ...plans];
    savePlansToLocal(updated);
    alert("Itinerary successfully saved to your Peace Center history!");
  };

  const triggerMultiAgentPlanning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) {
      alert("Please enter a location!");
      return;
    }

    setIsPlanning(true);
    setLoadingStep(0);
    setApiError(null);
    setActivePlan(null);

    // Multi-Agent Simulated Steps Timer (WOW Factor visual loading indicator)
    const stepDuration = 2000;
    const timer = setInterval(() => {
      setLoadingStep(prev => {
        if (prev < 3) return prev + 1;
        clearInterval(timer);
        return prev;
      });
    }, stepDuration);

    try {
      const response = await fetch(`${apiUrl}/plan-itinerary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location: location.trim(),
          time_period: timePeriod,
          activity_type: activityType.join(', ')
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to contact planner API (${response.status})`);
      }

      const data = await response.json();
      clearInterval(timer);

      setLoadingStep(4);
      
      setTimeout(() => {
        const createdPlan: Plan = {
          id: Date.now().toString(),
          location: location.trim(),
          time_period: timePeriod,
          activity_type: activityType.join(', '),
          result: data.result,
          createdAt: new Date().toLocaleDateString()
        };
        
        setActivePlan(createdPlan);
        setIsPlanning(false);
      }, 500);

    } catch (error: any) {
      clearInterval(timer);
      console.error(error);
      setApiError(error.message || "Failed to generate itinerary.");
      setIsPlanning(false);
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar history persistence */}
      <SavedPlans
        plans={plans}
        activePlanId={activePlan?.id}
        onSelectPlan={handleSelectPlan}
        onDeletePlan={handleDeletePlan}
        onNewPlan={handleNewPlan}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* Main Panel Content */}
      <main className="main-content">
        <header className="app-header">
          <div className="brand">
            <div className="brand-icon">🕊️</div>
            <div className="brand-text">
              <h1>Parental Peace Planner</h1>
              <p>AI-Powered Stress-Free Activity Orchestration</p>
            </div>
          </div>
          
          <button 
            onClick={() => setShowApiInput(!showApiInput)} 
            className="api-config-trigger"
          >
            <Settings size={14} />
            <span>Config API</span>
          </button>
        </header>

        {showApiInput && (
          <div className="glass-card flex-row" style={{ gap: '1rem', padding: '1rem', background: 'var(--panel-bg)', justifyContent: 'space-between' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>FastAPI Endpoint URL</label>
              <input 
                type="text" 
                value={apiUrl} 
                onChange={(e) => setApiUrl(e.target.value)} 
                className="form-input" 
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} 
              />
            </div>
            <button 
              onClick={() => setShowApiInput(false)} 
              className="btn btn-secondary" 
              style={{ marginTop: '1.2rem', padding: '0.5rem 1rem', fontSize: '0.8rem' }}
            >
              Apply
            </button>
          </div>
        )}

        {/* API Error Box */}
        {apiError && (
          <div className="glass-card flex-row" style={{ borderColor: 'var(--accent-pink)', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent-pink)', gap: '1rem', textAlign: 'left' }}>
            <ShieldAlert size={24} />
            <div>
              <strong style={{ display: 'block', fontSize: '0.95rem' }}>Connection/Server Error</strong>
              <span style={{ fontSize: '0.85rem' }}>{apiError}. Make sure your FastAPI backend is running at <strong>{apiUrl}</strong>.</span>
            </div>
          </div>
        )}

        {isPlanning ? (
          /* Agent Loading Animation Screen */
          <div className="glass-panel loading-container">
            <div className="spinner-wrapper">
              <div className="spinner-outer"></div>
              <div className="spinner-inner"></div>
              <div className="spinner-core">🕊️</div>
            </div>
            
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Multi-Agent Orchestrator Running
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
              Specialist sub-agents are working together to design your peace-of-mind itinerary.
            </p>

            <div className="loading-steps">
              <div className={`loading-step ${loadingStep === 0 ? 'active' : ''} ${loadingStep > 0 ? 'completed' : ''}`}>
                <div className="step-indicator">
                  {loadingStep > 0 ? '✓' : '1'}
                </div>
                <span>🌦️ Weather Agent: Evaluating environmental conditions...</span>
              </div>

              <div className={`loading-step ${loadingStep === 1 ? 'active' : ''} ${loadingStep > 1 ? 'completed' : ''}`}>
                <div className="step-indicator">
                  {loadingStep > 1 ? '✓' : '2'}
                </div>
                <span>📍 Place Agent: Filtering children-appropriate hotspots...</span>
              </div>

              <div className={`loading-step ${loadingStep === 2 ? 'active' : ''} ${loadingStep > 2 ? 'completed' : ''}`}>
                <div className="step-indicator">
                  {loadingStep > 2 ? '✓' : '3'}
                </div>
                <span>🚗 Logistic Agent: Mapping schedules, breaks & travel routing...</span>
              </div>

              <div className={`loading-step ${loadingStep >= 3 ? 'active' : ''} ${loadingStep > 3 ? 'completed' : ''}`}>
                <div className="step-indicator">
                  {loadingStep > 3 ? '✓' : '4'}
                </div>
                <span>✨ Synthesizer: Finalizing your custom parental peace itinerary...</span>
              </div>
            </div>
          </div>
        ) : activePlan ? (
          /* Itinerary Result Display Screen */
          <ItineraryDisplay
            itineraryText={activePlan.result}
            location={activePlan.location}
            timePeriod={activePlan.time_period}
            activityType={activePlan.activity_type}
            onSave={handleSaveActivePlan}
          />
        ) : (
          /* Default Planner Intake Creator Card & Info Panel */
          <div className="planner-grid">
            {/* Form */}
            <form onSubmit={triggerMultiAgentPlanning} className="glass-panel planning-form-container">
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800, borderBottom: '1px solid var(--panel-border)', paddingBottom: '0.8rem', textAlign: 'left' }}>
                Create stress-free fun days
              </h2>

              <div className="form-group">
                <label className="form-label">
                  <MapPin size={16} />
                  <span>Where are you going?</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter city, park, or destination (e.g. Paris, Central Park)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Clock size={16} style={{ color: 'var(--primary)' }} />
                  <span>Hours of the Day (Timeframe)</span>
                </label>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Start Hour</label>
                    <select 
                      value={startHour} 
                      onChange={(e) => setStartHour(e.target.value)} 
                      className="form-input"
                      style={{ cursor: 'pointer' }}
                    >
                      {HOURS.map(h => (
                        <option key={h} value={h} style={{ background: 'var(--card-bg)', color: 'var(--text-main)' }}>{h}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>End Hour</label>
                    <select 
                      value={endHour} 
                      onChange={(e) => setEndHour(e.target.value)} 
                      className="form-input"
                      style={{ cursor: 'pointer' }}
                    >
                      {HOURS.map(h => (
                        <option key={h} value={h} style={{ background: 'var(--card-bg)', color: 'var(--text-main)' }}>{h}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div 
                  className="glass-card flex-row" 
                  style={{ 
                    marginTop: '0.6rem', 
                    padding: '0.6rem 1rem', 
                    fontSize: '0.85rem', 
                    justifyContent: 'space-between',
                    borderColor: 'var(--primary-glow)',
                    background: 'rgba(139, 92, 246, 0.03)'
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>Selected Schedule:</span>
                  <strong style={{ color: 'var(--primary)' }}>
                    {startHour} – {endHour} ({getPlannedHoursCount(startHour, endHour)} hours total)
                  </strong>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Compass size={16} style={{ color: 'var(--primary)' }} />
                  <span>Preferred Activity Themes (Select one or more)</span>
                </label>
                <div className="tiles-grid">
                  {ACTIVITY_TILES.map((a) => (
                    <div
                      key={a.label}
                      className={`tile ${activityType.includes(a.label) ? 'active' : ''}`}
                      onClick={() => toggleActivityType(a.label)}
                    >
                      <span className="tile-emoji">{a.emoji}</span>
                      <span className="tile-label">{a.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary flex-row" 
                style={{ width: '100%', padding: '1rem', fontSize: '1.05rem', marginTop: '1rem' }}
              >
                <Sparkles size={20} />
                <span>Orchestrate My Plan</span>
              </button>
            </form>

            {/* Premium Info Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="glass-panel" style={{ textAlign: 'left', background: 'rgba(139, 92, 246, 0.05)', borderColor: 'rgba(139, 92, 246, 0.2)' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={16} />
                  <span>How it works</span>
                </h3>
                <p style={{ fontSize: '0.85rem', lineHeight: '1.6', color: 'var(--text-main)' }}>
                  Our AI Agent network runs a highly structured <strong>Sequential Agent Chain</strong>. 
                  When you submit a plan, the coordinator launches three specialized sub-agents:
                </p>
                <ul style={{ marginLeft: '1.2rem', marginTop: '0.6rem', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-muted)' }}>
                  <li>🌤️ <strong>Weather Agent</strong> pulls up-to-the-minute details so your plans never get rained out.</li>
                  <li>📍 <strong>Place Agent</strong> searches child-friendly venues matching your preferences.</li>
                  <li>🚗 <strong>Logistics Agent</strong> builds pacing, schedules, transport times and break buffers.</li>
                </ul>
              </div>

              <div className="glass-panel" style={{ textAlign: 'left' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.6rem' }}>
                  Why Parental Peace?
                </h3>
                <p style={{ fontSize: '0.85rem', lineHeight: '1.6', color: 'var(--text-muted)' }}>
                  Every parent knows planning kids' days requires incredible buffers. We focus on child-paced schedules with weather-ready fallbacks so you can actually enjoy the day with them.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
