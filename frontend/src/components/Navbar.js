import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

function Navbar({ 
  user, 
  cartCount = 0,
  onOpenCart, 
  onLogout, 
  onOpenAuth, 
  onOpenDashboard, 
  showAlert 
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setDropdownOpen(!dropdownOpen);
  };

  const handleNavClick = (path) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Close dropdown on clicking window
  React.useEffect(() => {
    const closeDropdown = () => setDropdownOpen(false);
    window.addEventListener('click', closeDropdown);
    return () => window.removeEventListener('click', closeDropdown);
  }, []);

  return (
    <>
      <header id="navbar" className="navbar-header">
        <div className="navbar-container">
          <button onClick={() => handleNavClick('/')} className="logo" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <img src="https://karpagamtraderssivakasi.com/images/logo.jpeg" alt="Karpagam Traders Logo" className="logo-img" />
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
            {/* Header Cart Drawer Icon Trigger */}
            <button className="nav-cart-icon-btn" onClick={onOpenCart} title="Open Shopping Cart">
              <i className="fa-solid fa-cart-shopping"></i>
              {cartCount > 0 && <span className="nav-cart-badge">{cartCount}</span>}
            </button>

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
                    textStyle: 'left'
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
      </header>

      {/* Classic Style Fixed Mobile Bottom Navigation Bar: Home, Showcase, Shop, Contact */}
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
