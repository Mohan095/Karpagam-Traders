import React, { useState } from 'react';

export function NotificationTicker({ notifications = [], onSelectNotification }) {
  const [dismissed, setDismissed] = useState(false);

  // Find the top pinned active notification, or fallback to first active
  const activePinned = notifications.find(n => n.is_active && n.is_pinned) || notifications.find(n => n.is_active);

  if (dismissed || !activePinned) return null;

  return (
    <div className="announcement-top-bar" style={{
      background: 'linear-gradient(90deg, #700000 0%, #8B0000 50%, #9b111e 100%)',
      color: '#ffffff',
      padding: '9px 16px',
      fontSize: '0.86rem',
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'relative',
      zIndex: 1002,
      width: '100%',
      boxSizing: 'border-box',
      boxShadow: '0 2px 10px rgba(139,0,0,0.3)',
      borderBottom: '1px solid rgba(255,215,0,0.35)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden', flex: 1 }}>
        <span style={{
          background: 'rgba(255, 215, 0, 0.95)',
          color: '#8B0000',
          padding: '2px 10px',
          borderRadius: '20px',
          fontSize: '0.72rem',
          fontWeight: 900,
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          flexShrink: 0,
          boxShadow: '0 0 10px rgba(255,215,0,0.5)'
        }}>
          <span style={{
            width: '7px',
            height: '7px',
            backgroundColor: '#8B0000',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'pulseDot 1.5s infinite'
          }}></span>
          DAILY NEWS
        </span>

        <span style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          color: '#fff',
          letterSpacing: '0.2px'
        }}>
          <strong>{activePinned.title}</strong> — {activePinned.content.substring(0, 85)}...
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, marginLeft: '12px' }}>
        <button 
          onClick={() => onSelectNotification && onSelectNotification(activePinned)}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.4)',
            color: 'white',
            padding: '3px 12px',
            borderRadius: '15px',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => { e.target.style.background = 'white'; e.target.style.color = '#8B0000'; }}
          onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.2)'; e.target.style.color = 'white'; }}
        >
          Read News <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.7rem', marginLeft: '4px' }}></i>
        </button>

        <button 
          onClick={() => setDismissed(true)} 
          title="Dismiss Bar"
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer',
            fontSize: '1rem',
            padding: '2px 6px',
            lineHeight: 1
          }}
          onMouseEnter={(e) => { e.target.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.target.style.color = 'rgba(255,255,255,0.7)'; }}
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>
    </div>
  );
}

export function NotificationSection({ notifications = [] }) {
  const [selectedNews, setSelectedNews] = useState(null);

  const activeNews = notifications.filter(n => n.is_active !== false);

  if (activeNews.length === 0) {
    return null;
  }

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Special Offer': return { bg: '#fef3c7', text: '#b45309', border: '#fde68a' };
      case 'New Arrival': return { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' };
      case 'Festival Special': return { bg: '#fae8ff', text: '#86198f', border: '#f5d0fe' };
      case 'Holiday Notice': return { bg: '#fee2e2', text: '#b91c1c', border: '#fecaca' };
      default: return { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' };
    }
  };

  return (
    <section className="notifications-home-section" id="notifications-section" style={{
      padding: '70px 5% 60px',
      background: 'linear-gradient(180deg, rgba(248,250,252,0.8) 0%, rgba(255,255,255,1) 100%)',
      position: 'relative'
    }}>
      <div className="section-title scroll-reveal-fade revealed" style={{ textAlign: 'center', marginBottom: '45px' }}>
        <span style={{
          background: 'rgba(139, 0, 0, 0.08)',
          color: 'var(--primary)',
          padding: '6px 18px',
          borderRadius: '30px',
          fontSize: '0.82rem',
          fontWeight: 800,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          display: 'inline-block',
          marginBottom: '12px'
        }}>
          <i className="fa-solid fa-bullhorn" style={{ marginRight: '6px' }}></i> Announcements & Updates
        </span>
        <h2 style={{
          fontFamily: 'var(--font-heading)',
          color: 'var(--primary)',
          fontSize: '2.4rem',
          fontWeight: 900,
          marginBottom: '12px'
        }}>
          Daily News & Special Announcements
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '650px', margin: '0 auto' }}>
          நாள்தோறும் செய்திகள் & அறிவிப்புகள். Stay updated with Sivakasi calendar release schedules, seasonal discounts, and production news.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '28px',
        maxWidth: '1240px',
        margin: '0 auto'
      }}>
        {activeNews.map((item) => {
          const catColors = getCategoryColor(item.category);
          return (
            <div 
              key={item.id}
              className="news-card-interactive"
              style={{
                background: '#ffffff',
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
                border: '1px solid rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1)',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = '0 18px 40px rgba(139,0,0,0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.06)';
              }}
            >
              {/* Image banner */}
              {item.image && (
                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: '210px',
                  overflow: 'hidden',
                  background: '#f1f5f9'
                }}>
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.4s ease'
                    }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/assets/daily 1.jpeg';
                    }}
                  />
                  {item.is_pinned && (
                    <span style={{
                      position: 'absolute',
                      top: '14px',
                      left: '14px',
                      background: 'rgba(139,0,0,0.92)',
                      color: 'white',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '4px 12px',
                      borderRadius: '20px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                      letterSpacing: '0.5px'
                    }}>
                      <i className="fa-solid fa-thumbtack" style={{ marginRight: '5px' }}></i> Pinned News
                    </span>
                  )}
                  <span style={{
                    position: 'absolute',
                    bottom: '12px',
                    right: '14px',
                    background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(4px)',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '12px'
                  }}>
                    <i className="fa-regular fa-calendar-days" style={{ marginRight: '5px' }}></i> {item.date || 'Today'}
                  </span>
                </div>
              )}

              {/* News Body */}
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{
                    background: catColors.bg,
                    color: catColors.text,
                    border: `1px solid ${catColors.border}`,
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    padding: '3px 10px',
                    borderRadius: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {item.category || 'Daily News'}
                  </span>
                  {!item.image && (
                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                      <i className="fa-regular fa-clock" style={{ marginRight: '4px' }}></i> {item.date || 'Today'}
                    </span>
                  )}
                </div>

                <h3 style={{
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--primary)',
                  fontSize: '1.28rem',
                  fontWeight: 800,
                  lineHeight: 1.35,
                  marginBottom: '12px'
                }}>
                  {item.title}
                </h3>

                <p style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.92rem',
                  lineHeight: 1.6,
                  marginBottom: '20px',
                  flex: 1,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {item.content}
                </p>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  paddingTop: '16px',
                  borderTop: '1px solid #f1f5f9'
                }}>
                  <button 
                    onClick={() => setSelectedNews(item)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: 0
                    }}
                  >
                    View Details <i className="fa-solid fa-arrow-right-long"></i>
                  </button>

                  <a 
                    href={`https://wa.me/919566801402?text=${encodeURIComponent(`Hi Karpagam Traders Sivakasi,\nI saw your announcement on the website:\n"${item.title}"\nCould you please share more details?`)}`}
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{
                      background: '#e6f7ec',
                      color: '#16a34a',
                      border: '1px solid #bbf7d0',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                    title="Inquire about this announcement on WhatsApp"
                  >
                    <i className="fa-brands fa-whatsapp" style={{ fontSize: '0.9rem' }}></i> WhatsApp Inquire
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full News Details Modal */}
      {selectedNews && (
        <NotificationModal 
          selectedNews={selectedNews} 
          onClose={() => setSelectedNews(null)} 
        />
      )}
    </section>
  );
}

export function NotificationModal({ selectedNews: selNews, notification, onClose }) {
  const selectedNews = selNews || notification;
  if (!selectedNews) return null;

  return (
    <div 
      className="auth-overlay open" 
      onClick={(e) => e.target.classList.contains('auth-overlay') && onClose && onClose()}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '20px'
      }}
    >
      <div style={{
        background: '#ffffff',
        borderRadius: '28px',
        maxWidth: '620px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
        position: 'relative'
      }}>
        {selectedNews.image && (
          <div style={{ width: '100%', height: '280px', overflow: 'hidden', position: 'relative' }}>
            <img 
              src={selectedNews.image} 
              alt={selectedNews.title} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/assets/daily 1.jpeg';
              }} 
            />
            <button 
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(0,0,0,0.6)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem'
              }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        )}

        <div style={{ padding: '28px' }}>
          {!selectedNews.image && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
              <button 
                onClick={onClose}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer'
                }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{
              background: 'var(--primary)',
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: 800,
              padding: '3px 12px',
              borderRadius: '12px',
              textTransform: 'uppercase'
            }}>
              {selectedNews.category || 'Daily News'}
            </span>
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
              <i className="fa-regular fa-calendar-days" style={{ marginRight: '5px' }}></i> {selectedNews.date}
            </span>
          </div>

          <h2 style={{
            fontFamily: 'var(--font-heading)',
            color: 'var(--primary)',
            fontSize: '1.65rem',
            fontWeight: 900,
            lineHeight: 1.3,
            marginBottom: '16px'
          }}>
            {selectedNews.title}
          </h2>

          <p style={{
            color: '#334155',
            fontSize: '1.02rem',
            lineHeight: 1.7,
            whiteSpace: 'pre-line',
            marginBottom: '28px'
          }}>
            {selectedNews.content}
          </p>

          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <a 
              href={`https://wa.me/919566801402?text=${encodeURIComponent(`Hi Karpagam Traders Sivakasi,\nI saw your update on the website:\n"${selectedNews.title}"\nCould you please provide more information?`)}`}
              target="_blank" 
              rel="noopener noreferrer" 
              style={{
                flex: '1 1 200px',
                background: '#25D366',
                color: 'white',
                padding: '12px 20px',
                borderRadius: '25px',
                fontWeight: 800,
                textDecoration: 'none',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <i className="fa-brands fa-whatsapp" style={{ fontSize: '1.2rem' }}></i> Inquire on WhatsApp
            </a>

            <button 
              onClick={onClose}
              style={{
                padding: '12px 24px',
                borderRadius: '25px',
                border: '1.5px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AllUpdatesModal({ notifications = [], isOpen, onClose, onSelectNotification }) {
  if (!isOpen) return null;
  const activeNews = notifications.filter(n => n.is_active !== false);

  return (
    <div 
      className="auth-overlay open animated-backdrop"
      onClick={(e) => {
        if (e.target.classList.contains('auth-overlay')) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(7px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '20px'
      }}
    >
      <div style={{
        background: '#ffffff',
        borderRadius: '28px',
        maxWidth: '680px',
        width: '100%',
        maxHeight: '88vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #8b0000 0%, #b30000 100%)',
          color: 'white',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              color: '#ffd700'
            }}>
              <i className="fa-solid fa-bell"></i>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                Daily News & Updates
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.82rem', opacity: 0.9 }}>
                நாள்தோறும் செய்திகள் & சிறப்பு அறிவிப்புகள் ({activeNews.length} Active)
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.18)',
              border: 'none',
              color: 'white',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem'
            }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Scrollable Updates Content */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {activeNews.length > 0 ? (
            activeNews.map((item) => (
              <div 
                key={item.id}
                onClick={() => {
                  onSelectNotification(item);
                }}
                style={{
                  display: 'flex',
                  gap: '16px',
                  padding: '16px',
                  borderRadius: '18px',
                  border: '1.5px solid #f1f5f9',
                  background: '#f8fafc',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(139,0,0,0.08)';
                  e.currentTarget.style.borderColor = 'rgba(139,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#f1f5f9';
                }}
              >
                {item.image && (
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '14px',
                      objectFit: 'cover',
                      flexShrink: 0,
                      border: '1px solid #e2e8f0'
                    }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/assets/daily 1.jpeg';
                    }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{
                      background: item.category === 'Special Offer' ? '#fef3c7' : '#e0f2fe',
                      color: item.category === 'Special Offer' ? '#b45309' : '#0369a1',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '8px',
                      textTransform: 'uppercase'
                    }}>
                      {item.category || 'News'}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{item.date}</span>
                  </div>
                  <h4 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 800, color: 'var(--primary)' }}>
                    {item.title}
                  </h4>
                  <p style={{
                    margin: 0,
                    fontSize: '0.84rem',
                    color: '#64748b',
                    lineHeight: 1.45,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {item.content}
                  </p>
                </div>
                <div style={{ color: 'var(--primary)', fontSize: '1.1rem', paddingLeft: '8px' }}>
                  <i className="fa-solid fa-chevron-right"></i>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
              <i className="fa-solid fa-bell-slash" style={{ fontSize: '2.5rem', opacity: 0.3, marginBottom: '12px' }}></i>
              <p style={{ margin: 0, fontWeight: 600 }}>No active news or announcements at the moment.</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '14px 24px',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <a 
            href="https://wa.me/919566801402"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#16a34a',
              fontSize: '0.88rem',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <i className="fa-brands fa-whatsapp" style={{ fontSize: '1.1rem' }}></i> Direct WhatsApp Enquiry
          </a>

          <button 
            onClick={onClose}
            style={{
              background: '#e2e8f0',
              border: 'none',
              color: '#334155',
              padding: '8px 20px',
              borderRadius: '20px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

