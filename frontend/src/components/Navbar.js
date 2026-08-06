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
                <div className={`user-profile-menu ${dropdownOpen ? 'open' : ''}`} onClick={toggleDropdown}>
                  <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
                  <span className="user-profile-name">{user.name.split(' ')[0]}</span>
                  <i className="fa-solid fa-caret-down" style={{ fontSize: '0.75rem', color: 'var(--primary)', marginLeft: '4px' }}></i>
                  
                  <div className="user-dropdown-card">
                    <div className="dropdown-user-info">
                      <strong>{user.name}</strong>
                      <div className="dropdown-user-email">{user.email}</div>
                    </div>
                    {(user.email === 'admin023@gmail.com' || user.email === 'admin002@gmail.com' || user.role === 'admin') && (
                      <button onClick={onOpenDashboard} style={{ textAlign: 'left' }}>
                        <i className="fa-solid fa-chart-line"></i> Admin Panel
                      </button>
                    )}
                    <button onClick={() => handleNavClick('/contact')} style={{ textAlign: 'left' }}>
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
