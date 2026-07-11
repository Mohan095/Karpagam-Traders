import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function Navbar({ user, onLogout, onOpenAuth, onOpenDashboard, showAlert }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setDropdownOpen(!dropdownOpen);
  };

  const handleMobileToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLinkClick = (selector) => {
    setMobileMenuOpen(false);
    const element = document.querySelector(selector);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Close dropdown on clicking window
  React.useEffect(() => {
    const closeDropdown = () => setDropdownOpen(false);
    window.addEventListener('click', closeDropdown);
    return () => window.removeEventListener('click', closeDropdown);
  }, []);

  return (
    <header id="navbar" className="navbar-header">
      <div className="navbar-container">
        <button onClick={() => handleLinkClick('#home')} className="logo" style={{ background: 'none', border: 'none' }}>
          <img src="https://karpagamtraderssivakasi.com/images/logo.jpeg" alt="Karpagam Traders Logo" className="logo-img" />
          <div className="logo-text-wrap">
            <span className="logo-brand">Karpagam <span>Traders</span></span>
            <span className="logo-tagline">Premium Printing Services</span>
          </div>
        </button>
        
        <nav className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
          <button onClick={() => handleLinkClick('#home')} className="nav-link">Home</button>
          <button onClick={() => handleLinkClick('#about')} className="nav-link">About</button>
          <button onClick={() => handleLinkClick('#calendar-section')} className="nav-link">Calendars</button>
          <button onClick={() => handleLinkClick('#contact')} className="nav-link">Contact</button>
        </nav>

        <div className="nav-actions">
          <div id="header-auth-action">
            {user ? (
              <div className={`user-profile-menu ${dropdownOpen ? 'open' : ''}`} onClick={toggleDropdown}>
                <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
                <span className="user-profile-name">{user.name.split(' ')[0]}</span>
                <i className="fa-solid fa-caret-down" style={{ fontSize: '0.75rem', color: 'var(--primary)', marginLeft: '4px' }}></i>
                
                <div className="user-dropdown-card">
                  <div className="dropdown-user-info">
                    <strong>{user.name}</strong>
                    <div className="dropdown-user-email">{user.email}</div>
                  </div>
                  {user.email === 'admin023@gmail.com' && (
                    <button onClick={onOpenDashboard} style={{ textAlign: 'left' }}>
                      <i className="fa-solid fa-chart-line"></i> Admin Panel
                    </button>
                  )}
                  <button onClick={() => handleLinkClick('#contact')} style={{ textAlign: 'left' }}>
                    <i className="fa-solid fa-paper-plane"></i> Contact Support
                  </button>
                  <button onClick={onLogout} className="logout-link" style={{ textAlign: 'left' }}>
                    <i className="fa-solid fa-right-from-bracket"></i> Logout
                  </button>
                </div>
              </div>
            ) : (
              <button className="nav-cta" onClick={onOpenAuth}>
                <i className="fa-solid fa-user-lock"></i> <span className="cta-text">Login / Signup</span>
              </button>
            )}
          </div>

          <button className={`mobile-menu-toggle ${mobileMenuOpen ? 'open' : ''}`} aria-label="Toggle Menu" onClick={handleMobileToggle}>
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
