import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { NotificationTicker, NotificationModal, AllUpdatesModal } from './NotificationSection';

function Navbar({ 
  user, 
  cartCount = 0,
  notifications = [],
  onOpenCart, 
  onLogout, 
  onOpenAuth, 
  onOpenDashboard, 
  showAlert 
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [updatesOpen, setUpdatesOpen] = useState(false);
  const [selectedNotifForModal, setSelectedNotifForModal] = useState(null);
  const [allUpdatesModalOpen, setAllUpdatesModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const headerRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  const isHomePage = location.pathname === '/';
  const activeNotifications = notifications.filter(n => n.is_active !== false);

  // Measure exact header height and set --navbar-height CSS variable dynamically
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        const h = headerRef.current.offsetHeight;
        if (h > 0) {
          document.documentElement.style.setProperty('--navbar-height', `${h}px`);
        }
      }
    };
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    let ro;
    if (window.ResizeObserver && headerRef.current) {
      ro = new ResizeObserver(updateHeaderHeight);
      ro.observe(headerRef.current);
    }
    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
      if (ro) ro.disconnect();
    };
  }, [notifications]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setDropdownOpen(!dropdownOpen);
    setUpdatesOpen(false);
  };

  const toggleUpdates = (e) => {
    e.stopPropagation();
    setUpdatesOpen(!updatesOpen);
    setDropdownOpen(false);
  };

  const handleNavClick = (path) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Close dropdowns on clicking outside
  React.useEffect(() => {
    const closeAll = () => {
      setDropdownOpen(false);
      setUpdatesOpen(false);
    };
    window.addEventListener('click', closeAll);
    return () => window.removeEventListener('click', closeAll);
  }, []);

  return (
    <>
      <header id="navbar" ref={headerRef} className={`navbar-header ${isScrolled ? 'scrolled' : ''}`}>
        {/* Top Live Announcement Ticker - Front View at the very top of header */}
        <NotificationTicker 
          notifications={notifications}
          onSelectNotification={(notif) => {
            setSelectedNotifForModal(notif);
            const el = document.getElementById('notifications-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        <div className="navbar-main">
          <div className="navbar-container">
          <button onClick={() => handleNavClick('/')} className="logo" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <img 
              src="/logo.png" 
              alt="Karpagam Traders Goddess Emblem" 
              className="logo-img" 
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/icons/icon-192x192.png';
              }}
            />
            <div className="logo-text-wrap">
              <span className="logo-brand">Karpagam <span>Traders</span></span>
              <span className="logo-tagline">Premium Printing Services</span>
            </div>
          </button>
          
          {/* Top Header Navigation Menu: Home, Showcase, Shop, Contact */}
          <nav className="nav-links">
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Home
            </NavLink>
            <NavLink to="/showcase" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Showcase
            </NavLink>
            <NavLink to="/shop" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Shop
            </NavLink>
            <NavLink to="/contact" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Contact
            </NavLink>
          </nav>

          <div className="nav-actions">
            {/* Header Notification / Updates Bell Icon Trigger */}
            <div className="nav-notif-wrapper" style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
              <button 
                className={`nav-notif-icon-btn ${updatesOpen ? 'open' : ''}`}
                onClick={toggleUpdates} 
                title="View Latest News & Announcements"
                style={{
                  background: updatesOpen ? 'var(--primary)' : 'rgba(139, 0, 0, 0.08)',
                  color: updatesOpen ? '#ffffff' : 'var(--primary)',
                  border: '1.5px solid rgba(139, 0, 0, 0.2)',
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.15rem',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.25s ease',
                  marginRight: '8px'
                }}
              >
                <i className="fa-solid fa-bell"></i>
                {activeNotifications.length > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-3px',
                    right: '-3px',
                    background: '#f59e0b',
                    color: '#1e293b',
                    fontSize: '0.68rem',
                    fontWeight: 900,
                    width: '19px',
                    height: '19px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.25)',
                    border: '1.5px solid white'
                  }}>
                    {activeNotifications.length}
                  </span>
                )}
              </button>

              {/* Updates Dropdown Panel */}
              {updatesOpen && (
                <div className="updates-dropdown-panel" style={{
                  position: 'absolute',
                  top: 'calc(100% + 12px)',
                  right: 0,
                  width: '360px',
                  maxWidth: '92vw',
                  background: '#ffffff',
                  borderRadius: '20px',
                  boxShadow: '0 18px 45px rgba(0, 0, 0, 0.22)',
                  border: '1px solid rgba(139, 0, 0, 0.15)',
                  overflow: 'hidden',
                  zIndex: 1000,
                  textAlign: 'left'
                }}>
                  {/* Panel Header */}
                  <div style={{
                    background: 'linear-gradient(135deg, #8b0000 0%, #b30000 100%)',
                    color: 'white',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fa-solid fa-bullhorn" style={{ color: '#ffd700', fontSize: '1.1rem' }}></i>
                      <div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>Daily News & Updates</div>
                        <div style={{ fontSize: '0.72rem', opacity: 0.85 }}>நாள்தோறும் செய்திகள்</div>
                      </div>
                    </div>
                    <span style={{
                      background: 'rgba(255, 215, 0, 0.25)',
                      color: '#ffd700',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '10px'
                    }}>
                      {activeNotifications.length} Active
                    </span>
                  </div>

                  {/* Panel Updates List */}
                  <div style={{ maxHeight: '360px', overflowY: 'auto', padding: '6px 0' }}>
                    {activeNotifications.length > 0 ? (
                      activeNotifications.map((n) => (
                        <div 
                          key={n.id}
                          onClick={() => {
                            setSelectedNotifForModal(n);
                            setUpdatesOpen(false);
                          }}
                          style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid #f1f5f9',
                            cursor: 'pointer',
                            transition: 'background 0.2s ease',
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'flex-start'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
                        >
                          {n.image && (
                            <img 
                              src={n.image} 
                              alt={n.title} 
                              style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '10px',
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <span style={{
                                background: n.category === 'Special Offer' ? '#fef3c7' : '#e0f2fe',
                                color: n.category === 'Special Offer' ? '#b45309' : '#0369a1',
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                padding: '2px 6px',
                                borderRadius: '6px',
                                textTransform: 'uppercase'
                              }}>
                                {n.category || 'News'}
                              </span>
                              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{n.date}</span>
                            </div>
                            <h5 style={{
                              margin: 0,
                              fontSize: '0.85rem',
                              fontWeight: 800,
                              color: 'var(--primary)',
                              lineHeight: 1.3,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {n.title}
                            </h5>
                            <p style={{
                              margin: '3px 0 0',
                              fontSize: '0.78rem',
                              color: '#64748b',
                              lineHeight: 1.4,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}>
                              {n.content}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '30px 20px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                        <i className="fa-solid fa-bell-slash" style={{ fontSize: '1.8rem', opacity: 0.3, marginBottom: '8px', display: 'block' }}></i>
                        No new updates right now. Stay tuned!
                      </div>
                    )}
                  </div>

                  {/* Panel Footer */}
                  <div style={{
                    padding: '10px 16px',
                    background: '#f8fafc',
                    borderTop: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <button 
                      onClick={() => {
                        setUpdatesOpen(false);
                        setAllUpdatesModalOpen(true);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      View All in Window <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '0.7rem' }}></i>
                    </button>

                    <a 
                      href="https://wa.me/919566801402"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: '#16a34a',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <i className="fa-brands fa-whatsapp"></i> Chat Support
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Header Cart Drawer Icon Trigger - HIDDEN ON HOME PAGE */}
            {!isHomePage && (
              <button className="nav-cart-icon-btn" onClick={onOpenCart} title="Open Shopping Cart">
                <i className="fa-solid fa-cart-shopping"></i>
                {cartCount > 0 && <span className="nav-cart-badge">{cartCount}</span>}
              </button>
            )}

            <div id="header-auth-action">
              {user ? (
                <div className={`user-profile-menu ${dropdownOpen ? 'open' : ''}`} onClick={toggleDropdown} title="Click to view profile & account info" style={{ position: 'relative' }}>
                  <div className="user-avatar-img-wrap" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <img 
                      src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=8b0000&color=ffffff`} 
                      alt={user.name} 
                      className="user-profile-avatar-img"
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid #8b0000',
                        boxShadow: '0 3px 10px rgba(139,0,0,0.25)',
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease'
                      }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=8b0000&color=ffffff`;
                      }}
                    />
                    <span style={{
                      position: 'absolute',
                      bottom: '0',
                      right: '0',
                      width: '10px',
                      height: '10px',
                      backgroundColor: '#22c55e',
                      border: '2px solid white',
                      borderRadius: '50%'
                    }}></span>
                  </div>
                  <span className="user-profile-name" style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--primary)', marginLeft: '6px' }}>{user.name.split(' ')[0]}</span>
                  <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.75rem', color: 'var(--primary)', marginLeft: '2px' }}></i>
                  
                  {/* Dropdown Card showing User Name and Email */}
                  <div className="user-dropdown-card animated-dropdown-card" style={{
                    position: 'absolute',
                    top: 'calc(100% + 12px)',
                    right: 0,
                    width: '240px',
                    background: '#ffffff',
                    borderRadius: '20px',
                    boxShadow: '0 15px 35px rgba(0,0,0,0.18)',
                    border: '1px solid rgba(139,0,0,0.12)',
                    padding: '16px 0',
                    zIndex: 1000,
                    textAlign: 'left'
                  }}>
                    <div className="dropdown-user-header" style={{
                      padding: '0 18px 14px',
                      borderBottom: '1px solid #f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <img 
                        src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=8b0000&color=ffffff`} 
                        alt={user.name} 
                        style={{ width: '42px', height: '42px', borderRadius: '50%', border: '2px solid #8b0000', flexShrink: 0 }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=8b0000&color=ffffff`;
                        }}
                      />
                      <div className="dropdown-user-details" style={{ overflow: 'hidden', textAlign: 'left' }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                        <div className="dropdown-user-email" style={{ fontSize: '0.78rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
                        <span style={{ display: 'inline-block', background: user.role === 'admin' ? '#fef3c7' : '#e0f2fe', color: user.role === 'admin' ? '#d97706' : '#0284c7', fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: '10px', marginTop: '4px', textTransform: 'uppercase' }}>
                          {user.role === 'admin' ? 'Administrator' : 'Customer'}
                        </span>
                      </div>
                    </div>

                    <div style={{ paddingTop: '8px' }}>
                      {(user.email?.toLowerCase() === 'mohantn617@gmail.com' || user.role === 'admin') && (
                        <button onClick={onOpenDashboard} style={{ textAlign: 'left', width: '100%', padding: '10px 18px', cursor: 'pointer', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 700, color: '#d97706' }}>
                          <i className="fa-solid fa-chart-line"></i> Admin Panel
                        </button>
                      )}
                      {!isHomePage ? (
                        <button onClick={onOpenCart} style={{ textAlign: 'left', width: '100%', padding: '10px 18px', cursor: 'pointer', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                          <i className="fa-solid fa-cart-shopping" style={{ color: '#8b0000' }}></i> My Cart ({cartCount})
                        </button>
                      ) : (
                        <button onClick={() => setAllUpdatesModalOpen(true)} style={{ textAlign: 'left', width: '100%', padding: '10px 18px', cursor: 'pointer', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                          <i className="fa-solid fa-bell" style={{ color: '#8b0000' }}></i> Daily Updates ({activeNotifications.length})
                        </button>
                      )}
                      <button onClick={() => handleNavClick('/contact')} style={{ textAlign: 'left', width: '100%', padding: '10px 18px', cursor: 'pointer', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                        <i className="fa-solid fa-paper-plane" style={{ color: '#2563eb' }}></i> Contact Support
                      </button>
                      <button onClick={onLogout} className="logout-link" style={{ textAlign: 'left', width: '100%', padding: '10px 18px', cursor: 'pointer', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 700, color: '#dc2626', borderTop: '1px solid #f1f5f9', marginTop: '6px' }}>
                        <i className="fa-solid fa-right-from-bracket"></i> Logout
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button className="nav-cta animated-signin-btn" onClick={onOpenAuth}>
                  <i className="fa-brands fa-google" style={{ fontSize: '1rem', color: '#ffd700' }}></i> <span className="cta-text">Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>

      {/* Detail Modal for update clicked in dropdown */}
      {selectedNotifForModal && (
        <NotificationModal 
          selectedNews={selectedNotifForModal} 
          onClose={() => setSelectedNotifForModal(null)} 
        />
      )}

      {/* Comprehensive All Updates Modal */}
      <AllUpdatesModal 
        notifications={notifications}
        isOpen={allUpdatesModalOpen}
        onClose={() => setAllUpdatesModalOpen(false)}
        onSelectNotification={(item) => {
          setAllUpdatesModalOpen(false);
          setSelectedNotifForModal(item);
        }}
      />

      {/* Classic Style Fixed Mobile Bottom Navigation Bar: Home, Showcase, Shop, Updates/Cart, Contact */}
      <div className="mobile-bottom-navbar classic-style">
        <NavLink to="/" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon-wrap">
            <i className="fa-solid fa-house"></i>
          </span>
          <span className="nav-label">Home</span>
        </NavLink>

        <NavLink to="/showcase" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon-wrap">
            <i className="fa-solid fa-calendar-days"></i>
          </span>
          <span className="nav-label">Showcase</span>
        </NavLink>

        <NavLink to="/shop" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon-wrap">
            <i className="fa-solid fa-store"></i>
          </span>
          <span className="nav-label">Shop</span>
        </NavLink>

        {/* On Home page: show Updates (Bell icon); on other pages: show Cart */}
        {isHomePage ? (
          <button 
            onClick={() => setAllUpdatesModalOpen(true)} 
            className="mobile-nav-item" 
            style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}
            title="View Daily Updates & Announcements"
          >
            <span className="nav-icon-wrap" style={{ position: 'relative' }}>
              <i className="fa-solid fa-bell"></i>
              {activeNotifications.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-8px',
                  background: '#f59e0b',
                  color: '#1e293b',
                  fontSize: '0.62rem',
                  fontWeight: 900,
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}>
                  {activeNotifications.length}
                </span>
              )}
            </span>
            <span className="nav-label">Updates</span>
          </button>
        ) : (
          <button 
            onClick={onOpenCart} 
            className="mobile-nav-item" 
            style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}
            title="Open Shopping Cart"
          >
            <span className="nav-icon-wrap" style={{ position: 'relative' }}>
              <i className="fa-solid fa-cart-shopping"></i>
              {cartCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-8px',
                  background: '#8b0000',
                  color: 'white',
                  fontSize: '0.62rem',
                  fontWeight: 900,
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}>
                  {cartCount}
                </span>
              )}
            </span>
            <span className="nav-label">Cart</span>
          </button>
        )}

        <NavLink to="/contact" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon-wrap">
            <i className="fa-solid fa-envelope"></i>
          </span>
          <span className="nav-label">Contact</span>
        </NavLink>
      </div>
    </>
  );
}

export default Navbar;
