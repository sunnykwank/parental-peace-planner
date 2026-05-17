import { useState, useEffect } from 'react';
import { CloudRain, CloudSun, MapPin, Navigation, Clock, Check, Sparkles, Printer, FileText } from 'lucide-react';

interface ItineraryDisplayProps {
  itineraryText: string;
  location: string;
  timePeriod: string;
  activityType: string;
  onSave: () => void;
}



interface TimelineItem {
  time: string;
  title: string;
  desc: string;
}

interface RainHour {
  time: string;
  probability: number;
}

interface PlaceCard {
  name: string;
  rating: string;
  address: string;
  isBackup: boolean;
}

interface AdvancedTimelineItem {
  timeRange: string;
  activity: string;
  place: string;
  address: string;
  note: string;
  rawLines: string[];
}

export default function ItineraryDisplay({
  itineraryText,
  location,
  timePeriod,
  activityType,
  onSave
}: ItineraryDisplayProps) {
  const [viewMode, setViewMode] = useState<'timeline' | 'raw'>('timeline');
  const [weatherData, setWeatherData] = useState<string | null>(null);

  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [logisticTips, setLogisticTips] = useState<string>('');

  // Structured Advanced Parsed States
  const [rainHours, setRainHours] = useState<RainHour[]>([]);
  const [classifiedPlaces, setClassifiedPlaces] = useState<PlaceCard[]>([]);
  const [structuredTimeline, setStructuredTimeline] = useState<AdvancedTimelineItem[]>([]);

  useEffect(() => {
    if (!itineraryText) return;
    
    const lines = itineraryText.split('\n');

    // 1. Weather segment text parsing
    let weatherSnippet = 'No explicit weather data provided, but expecting pleasant conditions!';
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (line.includes('weather is classified') || line.includes('forecast') || line.includes('temperature') || line.includes('celsius')) {
        const context = lines.slice(Math.max(0, i), Math.min(lines.length, i + 3));
        weatherSnippet = context.filter(l => l.trim() !== '').join(' ');
        break;
      }
    }
    setWeatherData(weatherSnippet.replace(/[#*`]/g, '').trim());

    // 2. Parse hourly rain probability numbers
    const detectedRainHours: RainHour[] = [];
    lines.forEach(line => {
      // matches e.g. "1:00 PM: 11%" or "2:00 PM: 27% probability" or "3:00 PM - 39%"
      const match = line.match(/(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)\s*[:-\s]\s*(\d+)\s*%/i);
      if (match) {
        detectedRainHours.push({
          time: match[1].trim(),
          probability: parseInt(match[2].trim(), 10)
        });
      }
    });
    setRainHours(detectedRainHours);

    // 3. Parse classified places (support outdoor and rainy backups)

    const detectedClassified: PlaceCard[] = [];
    let isBackupActive = false;

    lines.forEach(line => {
      const trimmed = line.trim();
      const lower = trimmed.toLowerCase();
      
      // Determine if we crossed into backup places recommendations
      if (lower.includes('alternative') || lower.includes('indoor option') || lower.includes('other options found') || lower.includes('backup plan')) {
        isBackupActive = true;
      }

      if (lower.includes('rating:')) {
        const nameMatch = trimmed.match(/^[-*\d.\s]*(.*?)\s*\(\s*Rating/i);
        const ratingMatch = trimmed.match(/Rating:\s*(\d+\.\d+|\d+)/i);
        // Extracts the address part after "):" or ":"
        const addressMatch = trimmed.match(/\):\s*(.*)$/i) || trimmed.match(/Rating:[^)]*\)\s*:\s*(.*)$/i) || trimmed.match(/:\s*([^:]*)$/);

        if (nameMatch && ratingMatch) {
          const pName = nameMatch[1].replace(/[#*`]/g, '').trim();
          const pRating = ratingMatch[1].trim();
          const pAddress = addressMatch ? addressMatch[1].replace(/[#*`]/g, '').trim() : 'Local playground area';
          const isBackup = isBackupActive || lower.includes('indoor') || lower.includes('landing') || lower.includes('lounge') || lower.includes('oxygen');

          detectedClassified.push({
            name: pName,
            rating: pRating,
            address: pAddress,
            isBackup: isBackup
          });


        }
      }
    });

    if (detectedClassified.length === 0) {
      // Fallback defaults
      detectedClassified.push({ name: `${location} Playgrounds`, rating: '4.4', address: `Central Park in ${location}`, isBackup: false });
      detectedClassified.push({ name: "Local Indoor Play Zone", rating: '4.5', address: "Main Street Arcade", isBackup: true });
    }
    setClassifiedPlaces(detectedClassified);



    // 4. Parse structured timeline schedulers
    const parsedStructured: AdvancedTimelineItem[] = [];
    let currentBlock: AdvancedTimelineItem | null = null;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Matches formats like: "1:00 PM - 3:00 PM:**" or "3:00 PM to 5:00 PM"
      const rangeMatch = trimmed.match(/^[-*\d.\s]*(?:(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?\s*[-\s]*to[-\s]*\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)|(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?\s*-\s*\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?))/i);

      if (rangeMatch) {
        if (currentBlock) {
          parsedStructured.push(currentBlock);
        }
        currentBlock = {
          timeRange: (rangeMatch[1] || rangeMatch[2] || '').replace(/[#*`]/g, '').trim(),
          activity: '',
          place: '',
          address: '',
          note: '',
          rawLines: []
        };
      } else if (currentBlock) {
        const lower = trimmed.toLowerCase();
        if (lower.startsWith('suggested activity') || lower.includes('activity:')) {
          currentBlock.activity = trimmed.substring(trimmed.indexOf(':') + 1).replace(/[#*`]/g, '').trim();
        } else if (lower.startsWith('suggested place') || lower.includes('place:')) {
          currentBlock.place = trimmed.substring(trimmed.indexOf(':') + 1).replace(/[#*`]/g, '').trim();
        } else if (lower.startsWith('address') || lower.includes('address:')) {
          currentBlock.address = trimmed.substring(trimmed.indexOf(':') + 1).replace(/[#*`]/g, '').trim();
        } else if (lower.startsWith('note') || lower.includes('note:')) {
          currentBlock.note = trimmed.substring(trimmed.indexOf(':') + 1).replace(/[#*`]/g, '').trim();
        } else if (trimmed !== '') {
          // Normal narrative lines
          currentBlock.rawLines.push(trimmed.replace(/[#*`]/g, ''));
        }
      }
    });

    if (currentBlock) {
      parsedStructured.push(currentBlock);
    }
    setStructuredTimeline(parsedStructured);

    // 5. Normal schedule timeline items fallback
    const parsedTimeline: TimelineItem[] = [];
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const timeMatch = trimmed.match(/^[-*\d.\s]*(?:(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)|(Morning|Afternoon|Evening|Noon|Lunch|Dinner|Late Afternoon))/i);
      
      if (timeMatch) {
        const timeVal = timeMatch[1] || timeMatch[2] || 'Scheduled';
        const descriptionVal = trimmed.replace(/^[-*\d.\s]*(?:(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)|(Morning|Afternoon|Evening|Noon|Lunch|Dinner|Late Afternoon))[:-\s]*/i, '').trim();
        
        if (descriptionVal.length > 5) {
          const splitIdx = descriptionVal.indexOf('.');
          const title = splitIdx !== -1 ? descriptionVal.substring(0, splitIdx).trim() : descriptionVal;
          const desc = splitIdx !== -1 ? descriptionVal.substring(splitIdx + 1).trim() : 'Follow the agent details for logistics.';
          
          parsedTimeline.push({
            time: timeVal,
            title: title.replace(/[#*`]/g, ''),
            desc: desc.replace(/[#*`]/g, '')
          });
        }
      }
    });

    if (parsedTimeline.length === 0) {
      parsedTimeline.push({ time: "09:00 AM", title: "Morning Exploration Kickoff", desc: `Arrive at the destination in ${location} and orient your kids.` });
      parsedTimeline.push({ time: "12:00 PM", title: "Midday Picnic & Lunch break", desc: "Enjoy kids-friendly meals, hydration, and relaxation time." });
      parsedTimeline.push({ time: "02:30 PM", title: "Afternoon High-Energy Activity", desc: `Engage in prime ${activityType} action and explore places.` });
      parsedTimeline.push({ time: "05:00 PM", title: "Wind Down & Cool Off", desc: "Head back, review the fun day, and prepare for peaceful evening routines." });
    }
    setTimelineItems(parsedTimeline);

    // 6. Extract logistics tips
    let logisticsText = 'Double check opening hours and weather details before setting out!';
    const logIdx = itineraryText.toLowerCase().indexOf('logistic');
    if (logIdx !== -1) {
      logisticsText = itineraryText.substring(logIdx).replace(/[#*`]/g, '').split('\n').slice(0, 4).filter(l => l.trim() !== '').join(' ');
    }
    setLogisticTips(logisticsText);

  }, [itineraryText, location, timePeriod, activityType]);

  const renderStyledMarkdown = (text: string) => {
    return text.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('###')) {
        return <h3 key={idx} style={{ marginTop: '1.2rem', marginBottom: '0.6rem', color: 'var(--primary)' }}>{trimmed.replace('###', '').trim()}</h3>;
      }
      if (trimmed.startsWith('##')) {
        return <h2 key={idx} style={{ marginTop: '1.5rem', marginBottom: '0.8rem', borderBottom: '1px solid var(--panel-border)', paddingBottom: '0.3rem' }}>{trimmed.replace('##', '').trim()}</h2>;
      }
      if (trimmed.startsWith('#')) {
        return <h1 key={idx} style={{ marginTop: '1.8rem', marginBottom: '1rem', color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>{trimmed.replace('#', '').trim()}</h1>;
      }
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        return <li key={idx} style={{ marginLeft: '1.2rem', marginBottom: '0.4rem' }}>{trimmed.replace(/^[-*\s]+/, '')}</li>;
      }
      if (trimmed) {
        const boldRegex = /\*\*(.*?)\*\*/g;
        if (boldRegex.test(trimmed)) {
          const parts = trimmed.split('**');
          return (
            <p key={idx} style={{ marginBottom: '0.8rem', lineHeight: '1.6' }}>
              {parts.map((part, i) => i % 2 === 1 ? <strong key={i} style={{ color: 'var(--primary)' }}>{part}</strong> : part)}
            </p>
          );
        }
        return <p key={idx} style={{ marginBottom: '0.8rem', lineHeight: '1.6' }}>{trimmed}</p>;
      }
      return <div key={idx} style={{ height: '0.5rem' }}></div>;
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="itinerary-container">
      {/* Header */}
      <div className="glass-card itinerary-header-card" style={{ background: 'var(--panel-bg)' }}>
        <div className="itinerary-title-area">
          <h2>Itinerary for {location}</h2>
          <p className="flex-row" style={{ gap: '0.4rem', flexWrap: 'wrap' }}>
            <span>A custom <strong>{timePeriod}</strong> schedule packed with kids <strong>{activityType}</strong> activities.</span>
          </p>
        </div>
        <div className="itinerary-actions">
          <button 
            className={`btn ${viewMode === 'timeline' ? 'btn-primary' : 'btn-secondary'} flex-row`}
            onClick={() => setViewMode('timeline')}
            style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}
          >
            <Clock size={16} />
            <span>Timeline</span>
          </button>
          <button 
            className={`btn ${viewMode === 'raw' ? 'btn-primary' : 'btn-secondary'} flex-row`}
            onClick={() => setViewMode('raw')}
            style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}
          >
            <FileText size={16} />
            <span>Agent Output</span>
          </button>
          <button onClick={handlePrint} className="btn btn-secondary btn-icon-only flex-row" title="Print itinerary">
            <Printer size={16} />
          </button>
        </div>
      </div>

      {/* Conditional Rendering */}
      {viewMode === 'timeline' ? (
        <>
          {/* Agent Widgets row */}
          <div className="agent-widgets">
            {/* Weather Widget */}
            <div className="agent-widget-card">
              <div className="widget-icon-box widget-icon-weather">
                {weatherData && weatherData.toLowerCase().includes('rain') ? <CloudRain size={20} /> : <CloudSun size={20} />}
              </div>
              <div className="widget-info">
                <h4>Weather Agent</h4>
                <p>{weatherData || "Optimizing forecast for outdoor activities..."}</p>

                {/* Hourly Rain Probability Sparkline Visualization (Wow Factor) */}
                {rainHours.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.8rem', borderTop: '1px solid var(--panel-border)', paddingTop: '0.6rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <CloudRain size={12} style={{ color: 'var(--accent-blue)' }} />
                      <span>Rain Probability Breakdown</span>
                    </div>
                    {rainHours.map((rh, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.75rem' }}>
                        <span style={{ width: '52px', fontWeight: 600, color: 'var(--text-muted)' }}>{rh.time}</span>
                        <div style={{ flex: 1, height: '6px', background: 'rgba(139, 92, 246, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${rh.probability}%`, height: '100%', background: rh.probability > 30 ? 'var(--accent-pink)' : 'var(--accent-blue)', borderRadius: '3px' }}></div>
                        </div>
                        <span style={{ width: '32px', textAlign: 'right', fontWeight: 700, color: rh.probability > 30 ? 'var(--accent-pink)' : 'var(--accent-blue)' }}>{rh.probability}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Places Widget */}
            <div className="agent-widget-card">
              <div className="widget-icon-box widget-icon-place">
                <MapPin size={20} />
              </div>
              
              <div className="widget-info">
                <h4>Places Agent</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.4rem' }}>
                  {classifiedPlaces.map((place, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        fontSize: '0.8rem', 
                        background: place.isBackup ? 'rgba(244, 63, 94, 0.03)' : 'rgba(16, 185, 129, 0.03)', 
                        borderLeft: `2.5px solid ${place.isBackup ? 'var(--accent-pink)' : 'var(--accent-green)'}`,
                        padding: '0.4rem 0.6rem',
                        borderRadius: '4px',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.4rem' }}>
                        <strong style={{ color: 'var(--text-main)', wordBreak: 'break-word' }}>{place.name}</strong>
                        <span 
                          style={{ 
                            background: place.isBackup ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
                            color: place.isBackup ? 'var(--accent-pink)' : 'var(--accent-green)', 
                            fontSize: '0.65rem', 
                            padding: '1px 4px', 
                            borderRadius: '3px',
                            fontWeight: 700,
                            flexShrink: 0,
                            marginTop: '2px'
                          }}
                        >
                          {place.isBackup ? '☔ Indoor' : '☀️ Outdoor'} ★{place.rating}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', wordBreak: 'break-word', lineHeight: '1.3' }}>
                        {place.address}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Logistics Widget */}
            <div className="agent-widget-card">
              <div className="widget-icon-box widget-icon-logistics">
                <Navigation size={20} />
              </div>
              <div className="widget-info">
                <h4>Logistics Agent</h4>
                <p>{logisticTips || "Mapping efficient pathways and child pacing breaks."}</p>
              </div>
            </div>
          </div>

          {/* Visual Schedule Timeline */}
          <div className="glass-panel" style={{ textAlign: 'left' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock style={{ color: 'var(--primary)' }} />
              <span>Step-by-Step Schedule Plan</span>
            </h3>
            
            <div className="timeline-list">
              {structuredTimeline.length > 0 ? (
                /* Advanced Structured Itinerary Layout */
                structuredTimeline.map((item, idx) => (
                  <div key={idx} className="timeline-item">
                    <div className="timeline-bullet"></div>
                    <div className="timeline-time" style={{ fontSize: '1rem', color: 'var(--primary)', fontWeight: 800 }}>
                      {item.timeRange}
                    </div>
                    
                    <div className="timeline-content-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', borderLeft: '3px solid var(--primary)', paddingLeft: '1.2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <h4 className="timeline-activity-title" style={{ margin: 0, fontSize: '1.15rem', fontFamily: 'var(--font-heading)', fontWeight: 800 }}>
                          ⚡ {item.activity || 'Kids Activity Session'}
                        </h4>
                        {item.place && (
                          <span 
                            className="plan-tag" 
                            style={{ 
                              background: 'rgba(139, 92, 246, 0.1)', 
                              color: 'var(--primary)', 
                              padding: '2px 8px', 
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              borderRadius: '6px'
                            }}
                          >
                            📍 {item.place}
                          </span>
                        )}
                      </div>

                      {item.address && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          <MapPin size={14} style={{ color: 'var(--accent-pink)', flexShrink: 0 }} />
                          <span>{item.address}</span>
                        </div>
                      )}

                      {item.note && (
                        <div 
                          className="glass-card" 
                          style={{ 
                            background: item.note.toLowerCase().includes('rain') ? 'rgba(244, 63, 94, 0.04)' : 'rgba(16, 185, 129, 0.04)', 
                            borderColor: item.note.toLowerCase().includes('rain') ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            padding: '0.7rem 0.9rem',
                            borderRadius: '8px',
                            fontSize: '0.82rem',
                            textAlign: 'left',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.5rem',
                            boxShadow: 'none',
                            marginTop: '0.2rem'
                          }}
                        >
                          {item.note.toLowerCase().includes('rain') ? (
                            <CloudRain size={15} style={{ color: 'var(--accent-pink)', marginTop: '2px', flexShrink: 0 }} />
                          ) : (
                            <Check size={15} style={{ color: 'var(--accent-green)', marginTop: '2px', flexShrink: 0 }} />
                          )}
                          <span style={{ color: item.note.toLowerCase().includes('rain') ? '#be123c' : 'var(--text-main)', lineHeight: '1.4' }}>
                            <strong>Planner Note:</strong> {item.note}
                          </span>
                        </div>
                      )}

                      {item.rawLines.length > 0 && (
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', borderTop: '1px solid var(--panel-border)', paddingTop: '0.6rem', marginTop: '0.3rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          {item.rawLines.map((rl, rIdx) => (
                            <p key={rIdx} style={{ margin: 0, lineHeight: '1.5' }}>• {rl}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                /* Fallback Normal Timeline Schedule Layout */
                timelineItems.map((item, idx) => (
                  <div key={idx} className="timeline-item">
                    <div className="timeline-bullet"></div>
                    <div className="timeline-time">{item.time}</div>
                    <div className="timeline-content-card">
                      <h4 className="timeline-activity-title">{item.title}</h4>
                      <p className="timeline-activity-desc">{item.desc}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      ) : (
        /* Raw/Markdown text view */
        <div className="glass-panel raw-markdown-content">
          {renderStyledMarkdown(itineraryText)}
        </div>
      )}

      {/* Wow Factor: Peace Score */}
      <div className="peace-score-box">
        <div className="peace-score-title">
          <Sparkles size={18} />
          <span>Parental Peace of Mind Guarantee</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="peace-score-value">100/100</div>
          <button 
            onClick={() => {
              if (onSave) onSave();
            }} 
            className="btn btn-primary flex-row" 
            style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
          >
            <Check size={14} />
            <span>Save to History</span>
          </button>
        </div>
      </div>
    </div>
  );
}
