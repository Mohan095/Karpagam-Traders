import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import apiService from '../api';
import './Dashboard.css';

const ASSET_PRESETS = [
  { name: 'Daily 1', path: '/assets/daily 1.jpeg' },
  { name: 'Daily 2', path: '/assets/daily 2.webp' },
  { name: 'Daily 3', path: '/assets/daily 3.webp' },
  { name: 'Daily 4', path: '/assets/daily 4.webp' },
  { name: 'Monthly 1', path: '/assets/monthly 1.jpg' },
  { name: 'Monthly 2', path: '/assets/monthly 2.webp' },
  { name: 'Monthly 3', path: '/assets/monthly 3.webp' },
  { name: 'Monthly 4', path: '/assets/monthly 4.jpg' },
  { name: 'Cake 1', path: '/assets/cake 1.jpg' },
  { name: 'Cake 2', path: '/assets/cake 2.webp' },
  { name: 'Emblem', path: '/assets/Karpagan Traders Goddess Emblem.png' }
];

function Dashboard({ 
  products = [], 
  notifications = [],
  onAddNotification,
  onDeleteNotification,
  onTogglePinNotification,
  onToggleActiveNotification,
  onAddProduct, 
  onDeleteProduct, 
  onUpdateProductPrice,
  onUpdateProductName,
  onUpdateProductImage,
  onLogout 
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'products', 'notifications', 'users', 'billing', 'messages', 'logs'
  const [messages, setMessages] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [billingRecords, setBillingRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  // New Product Form State
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('daily');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdImage, setNewProdImage] = useState('/assets/daily 1.jpeg');
  const [newProdDesc, setNewProdDesc] = useState('');

  // New Notification / Daily News Form State
  const [notifTitle, setNotifTitle] = useState('');
  const [notifCategory, setNotifCategory] = useState('Daily News');
  const [notifDate, setNotifDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notifContent, setNotifContent] = useState('');
  const [notifImage, setNotifImage] = useState('/assets/daily 1.jpeg');
  const [notifIsPinned, setNotifIsPinned] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Live real-time clock
  const [clockText, setClockText] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setClockText(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) + ' - ' + now.toLocaleTimeString());
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (db) {
        // Users
        try {
          const usersSnap = await db.collection("users").get();
          const uList = [];
          usersSnap.forEach(docSnap => {
            uList.push({ id: docSnap.id, ...docSnap.data() });
          });
          setRegisteredUsers(uList);
        } catch (uErr) {
          console.warn("Users fetch warning:", uErr);
        }

        // Messages from Firestore
        let mList = [];
        try {
          let msgSnap;
          try {
            msgSnap = await db.collection("customer_inquiries").orderBy("timestamp", "desc").get();
          } catch (mSortErr) {
            msgSnap = await db.collection("customer_inquiries").get();
          }
          msgSnap.forEach(docSnap => {
            mList.push({ id: docSnap.id, ...docSnap.data() });
          });
        } catch (mErr) {
          console.warn("Messages fetch warning:", mErr);
        }

        // Merge messages from localStorage
        try {
          const localInquiries = JSON.parse(localStorage.getItem('karpagam_customer_inquiries') || '[]');
          localInquiries.forEach(loc => {
            if (!mList.some(m => (m.id === loc.id) || (m.phone === loc.phone && m.timestamp === loc.timestamp))) {
              mList.push(loc);
            }
          });
        } catch (lsErr) {
          console.warn("LocalStorage inquiries read error:", lsErr);
        }

        // Merge messages from Python Backend API if available
        try {
          const apiMsgs = await apiService.getMessages();
          if (Array.isArray(apiMsgs)) {
            apiMsgs.forEach(am => {
              if (!mList.some(m => (m.id === am.id) || (m.phone === am.phone && m.timestamp === am.timestamp))) {
                mList.push(am);
              }
            });
          }
        } catch (apiErr) {
          // offline; local storage has it
        }

        mList.sort((a, b) => (b.timestamp || b.date || '').localeCompare(a.timestamp || a.date || ''));
        setMessages(mList);

        // System Activity Logs
        try {
          let logsSnap;
          try {
            logsSnap = await db.collection("history").orderBy("timestamp", "desc").get();
          } catch (lSortErr) {
            logsSnap = await db.collection("history").get();
          }
          const lList = [];
          logsSnap.forEach(docSnap => {
            lList.push({ id: docSnap.id, ...docSnap.data() });
          });
          lList.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
          setSystemLogs(lList);
        } catch (lErr) {
          console.warn("Logs fetch warning:", lErr);
        }
      } else {
        // Fallback offline: load inquiries from localStorage
        try {
          const localInquiries = JSON.parse(localStorage.getItem('karpagam_customer_inquiries') || '[]');
          localInquiries.sort((a, b) => (b.timestamp || b.date || '').localeCompare(a.timestamp || a.date || ''));
          setMessages(localInquiries);
        } catch (e) {}
      }
    } catch (err) {
      console.warn("Firestore fetch error, falling back to local records:", err.message);
    }

    setBillingRecords([]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Handle Image Upload for Notifications (reads as Base64 Data URL)
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Please select a valid image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setNotifImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Submit New Notification / News
  const handleCreateNotificationSubmit = async (e) => {
    e.preventDefault();
    if (!notifTitle.trim()) {
      alert("Please enter a title for the notification.");
      return;
    }
    if (!notifContent.trim()) {
      alert("Please enter the news or announcement text.");
      return;
    }

    setNotifLoading(true);

    const newNotifObj = {
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: notifTitle.trim(),
      category: notifCategory,
      content: notifContent.trim(),
      image: notifImage.trim() || '/assets/daily 1.jpeg',
      is_pinned: notifIsPinned,
      is_active: true,
      date: notifDate || new Date().toISOString().split('T')[0]
    };

    if (onAddNotification) {
      await onAddNotification(newNotifObj);
    }

    setNotifTitle('');
    setNotifContent('');
    setNotifImage('/assets/daily 1.jpeg');
    setNotifIsPinned(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setNotifLoading(false);
    alert("✅ Daily News / Announcement published successfully to Home Page!");
  };

  // Submit New Product
  const handleCreateProductSubmit = (e) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdPrice) return;

    const newProdObj = {
      id: Date.now(),
      name: newProdName.trim(),
      category: newProdCategory,
      price: parseFloat(newProdPrice),
      image: newProdImage.trim() || '/assets/daily 1.jpeg',
      description: newProdDesc.trim() || 'Premium Sivakasi printed calendar sheet with high resolution Tamil dates & artwork.'
    };

    if (onAddProduct) {
      onAddProduct(newProdObj);
    }

    setNewProdName('');
    setNewProdPrice('');
    setNewProdImage('/assets/daily 1.jpeg');
    setNewProdDesc('');
    alert("New Calendar Product added successfully!");
  };

  const handleDeleteProductClick = (id) => {
    if (window.confirm("Are you sure you want to delete this calendar product?")) {
      if (onDeleteProduct) {
        onDeleteProduct(id);
      }
    }
  };

  const handleDeleteUserRecord = async (uid, email) => {
    if (email?.toLowerCase() === 'mohantn617@gmail.com') {
      alert("System Administrator account cannot be deleted.");
      return;
    }
    if (window.confirm(`Delete user account ${email}?`)) {
      try {
        if (db) {
          await db.collection("users").doc(uid).delete();
        }
        setRegisteredUsers(prev => prev.filter(u => u.id !== uid));
        alert("User record deleted.");
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if (window.confirm("Are you sure you want to delete this customer inquiry?")) {
      if (db) {
        try {
          await db.collection("customer_inquiries").doc(msgId).delete();
        } catch (e) {
          console.warn("Firestore delete warning:", e);
        }
      }
      try {
        const localInquiries = JSON.parse(localStorage.getItem('karpagam_customer_inquiries') || '[]');
        const updated = localInquiries.filter(m => m.id !== msgId);
        localStorage.setItem('karpagam_customer_inquiries', JSON.stringify(updated));
      } catch (e) {}

      try {
        await apiService.deleteMessage(msgId);
      } catch (e) {}

      setMessages(prev => prev.filter(m => m.id !== msgId));
      alert("Inquiry deleted.");
    }
  };

  const handleToggleMessageStatus = async (msgId, currentStatus) => {
    const nextStatus = currentStatus === 'Replied' ? 'Pending' : 'Replied';
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: nextStatus } : m));
    if (db) {
      try {
        await db.collection("customer_inquiries").doc(msgId).update({ status: nextStatus });
      } catch (e) {}
    }
    try {
      const localInquiries = JSON.parse(localStorage.getItem('karpagam_customer_inquiries') || '[]');
      const updated = localInquiries.map(m => m.id === msgId ? { ...m, status: nextStatus } : m);
      localStorage.setItem('karpagam_customer_inquiries', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleClearBillingHistory = () => {
    if (window.confirm("Are you sure you want to clear all payment and billing history?")) {
      setBillingRecords([]);
    }
  };

  return (
    <div className="admin-layout-wrapper">
      {/* 1. Sidebar Menu */}
      <aside className="admin-sidebar">
        <div className="sidebar-header-brand">
          <div className="brand-icon-box" style={{ overflow: 'hidden', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img 
              src="/logo.png" 
              alt="Karpagam Traders Emblem" 
              style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/icons/icon-192x192.png';
              }} 
            />
          </div>
          <div className="brand-title-box">
            <h3>Admin <span>Control</span></h3>
            <p>Karpagam Printers Portal</p>
          </div>
        </div>

        <ul className="sidebar-nav-menu">
          <li className={`nav-menu-item ${activeTab === 'overview' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('overview')}>
              <i className="fa-solid fa-chart-pie"></i>
              <span>Dashboard Overview</span>
            </button>
          </li>

          <li className={`nav-menu-item ${activeTab === 'products' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('products')}>
              <i className="fa-solid fa-boxes-stacked"></i>
              <span>Manage Products ({products.length})</span>
            </button>
          </li>

          <li className={`nav-menu-item ${activeTab === 'notifications' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('notifications')}>
              <i className="fa-solid fa-bullhorn"></i>
              <span>Daily News & Alerts ({notifications.length})</span>
            </button>
          </li>

          <li className={`nav-menu-item ${activeTab === 'users' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('users')}>
              <i className="fa-solid fa-users-gear"></i>
              <span>User Records</span>
            </button>
          </li>

          <li className={`nav-menu-item ${activeTab === 'billing' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('billing')}>
              <i className="fa-solid fa-file-invoice-dollar"></i>
              <span>Payment & Billing</span>
            </button>
          </li>

          <li className={`nav-menu-item ${activeTab === 'messages' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('messages')}>
              <i className="fa-solid fa-envelope-open-text"></i>
              <span>Customer Inquiries ({messages.length})</span>
            </button>
          </li>

          <li className={`nav-menu-item ${activeTab === 'logs' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('logs')}>
              <i className="fa-solid fa-clock-rotate-left"></i>
              <span>System Audit Logs</span>
            </button>
          </li>
        </ul>
      </aside>

      {/* 2. Main Workspace Canvas */}
      <main className="admin-workspace-canvas">
        <header className="workspace-header-bar">
          <div className="header-meta-details">
            <h1>
              {activeTab === 'overview' && 'Overview Analytics'}
              {activeTab === 'products' && 'Calendar Product Catalog Management'}
              {activeTab === 'notifications' && 'Publish Notifications & Daily News'}
              {activeTab === 'users' && 'Registered User Accounts'}
              {activeTab === 'billing' && 'Billing & Payment Transaction Records'}
              {activeTab === 'messages' && 'Customer Inquiries & Messages'}
              {activeTab === 'logs' && 'System Activity Logs'}
            </h1>
            <p>Logged in as Administrator. Live indicator active.</p>
          </div>

          {/* Top Right Action Buttons: Clock, Back to Home, Logout */}
          <div className="admin-header-actions-right">
            <div className="header-date-badge">
              <i className="fa-regular fa-clock"></i>
              <span>{clockText}</span>
            </div>

            <button className="btn-admin-top-action home-btn" onClick={() => navigate('/')} title="Back to Home">
              <i className="fa-solid fa-house"></i>
              <span>Back to Home</span>
            </button>

            <button className="btn-admin-top-action logout-btn" onClick={onLogout} title="Logout Admin Session">
              <i className="fa-solid fa-arrow-right-from-bracket"></i>
              <span>Logout Admin</span>
            </button>
          </div>
        </header>

        {loading ? (
          <div className="admin-loading-state">
            <i className="fa-solid fa-spinner fa-spin"></i>
            <p>Loading administrative telemetry...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="tab-stack-layout">
                {/* 4 Metric Counter Cards */}
                <div className="stats-kpi-grid">
                  <div className="stat-kpi-card" onClick={() => setActiveTab('products')} style={{ cursor: 'pointer' }}>
                    <div className="kpi-icon-box prods"><i className="fa-solid fa-boxes-stacked"></i></div>
                    <div className="kpi-info-box">
                      <span className="kpi-label">Active Products</span>
                      <h3 className="kpi-value">{products.length}</h3>
                    </div>
                  </div>

                  <div className="stat-kpi-card" onClick={() => setActiveTab('notifications')} style={{ cursor: 'pointer' }}>
                    <div className="kpi-icon-box" style={{ background: '#fef3c7', color: '#d97706' }}><i className="fa-solid fa-bullhorn"></i></div>
                    <div className="kpi-info-box">
                      <span className="kpi-label">Live Announcements</span>
                      <h3 className="kpi-value">{notifications.length}</h3>
                    </div>
                  </div>

                  <div className="stat-kpi-card" onClick={() => setActiveTab('users')} style={{ cursor: 'pointer' }}>
                    <div className="kpi-icon-box users"><i className="fa-solid fa-users"></i></div>
                    <div className="kpi-info-box">
                      <span className="kpi-label">Registered Accounts</span>
                      <h3 className="kpi-value">{registeredUsers.length || 1}</h3>
                    </div>
                  </div>

                  <div className="stat-kpi-card" onClick={() => setActiveTab('messages')} style={{ cursor: 'pointer' }}>
                    <div className="kpi-icon-box inqs"><i className="fa-solid fa-envelope-open-text"></i></div>
                    <div className="kpi-info-box">
                      <span className="kpi-label">Customer Inquiries</span>
                      <h3 className="kpi-value">{messages.length}</h3>
                    </div>
                  </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="workspace-content-card">
                  <div className="content-card-header">
                    <h3><i className="fa-solid fa-bolt"></i> Quick Actions</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', padding: '16px 20px' }}>
                    <button 
                      onClick={() => setActiveTab('notifications')}
                      style={{
                        background: 'var(--primary)',
                        color: 'white',
                        padding: '12px 22px',
                        borderRadius: '25px',
                        border: 'none',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <i className="fa-solid fa-plus-circle"></i> Upload Daily News / Notification
                    </button>

                    <button 
                      onClick={() => setActiveTab('products')}
                      style={{
                        background: '#1e293b',
                        color: 'white',
                        padding: '12px 22px',
                        borderRadius: '25px',
                        border: 'none',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <i className="fa-solid fa-box-open"></i> Manage Shop Products
                    </button>

                    <button 
                      onClick={() => setActiveTab('messages')}
                      style={{
                        background: '#2563eb',
                        color: 'white',
                        padding: '12px 22px',
                        borderRadius: '25px',
                        border: 'none',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <i className="fa-solid fa-reply"></i> Reply to Customer Inquiries ({messages.length})
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PRODUCTS */}
            {activeTab === 'products' && (
              <div className="tab-stack-layout">
                {/* Add Product Card Form */}
                <div className="workspace-content-card">
                  <div className="content-card-header">
                    <h3><i className="fa-solid fa-plus-circle"></i> Add New Calendar Product</h3>
                  </div>

                  <form onSubmit={handleCreateProductSubmit} className="admin-add-product-form">
                    <div className="form-field-grid">
                      <div className="field-group">
                        <label>Product Title *</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="e.g. Daily Calendar 9 (Special Edition)"
                          value={newProdName}
                          onChange={(e) => setNewProdName(e.target.value)}
                        />
                      </div>

                      <div className="field-group">
                        <label>Category *</label>
                        <select 
                          value={newProdCategory}
                          onChange={(e) => setNewProdCategory(e.target.value)}
                        >
                          <option value="daily">Daily Tear-Off Calendar</option>
                          <option value="monthly">Monthly Wall Calendar</option>
                          <option value="specialty">Specialty / Cake / Desk Calendar</option>
                        </select>
                      </div>

                      <div className="field-group">
                        <label>Base Price (₹) *</label>
                        <input 
                          type="number" 
                          required 
                          min="1" 
                          step="1"
                          placeholder="e.g. 399"
                          value={newProdPrice}
                          onChange={(e) => setNewProdPrice(e.target.value)}
                        />
                      </div>

                      <div className="field-group">
                        <label>Image Source (Asset Path)</label>
                        <input 
                          type="text" 
                          placeholder="/assets/daily 1.jpeg"
                          value={newProdImage}
                          onChange={(e) => setNewProdImage(e.target.value)}
                        />
                      </div>

                      <div className="field-group full-width">
                        <label style={{ marginBottom: '6px', display: 'block' }}>Quick Select from Your Assets:</label>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {ASSET_PRESETS.map((a, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className={`notif-chip-btn ${newProdImage === a.path ? 'active' : ''}`}
                              onClick={() => setNewProdImage(a.path)}
                            >
                              {a.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="field-group full-width">
                        <label>Description & Features</label>
                        <textarea 
                          rows="2"
                          placeholder="High-gsm paper, vibrant offset printing, auspicious thithi timings..."
                          value={newProdDesc}
                          onChange={(e) => setNewProdDesc(e.target.value)}
                        ></textarea>
                      </div>
                    </div>

                    <button type="submit" className="btn-save-product">
                      <i className="fa-solid fa-floppy-disk"></i> Add Product to Website
                    </button>
                  </form>
                </div>

                {/* Products List Table */}
                <div className="workspace-content-card">
                  <div className="content-card-header">
                    <h3>Calendar Product Catalog ({products.length} Products)</h3>
                  </div>

                  <div className="table-scroller">
                    <table className="premium-data-table">
                      <thead>
                        <tr>
                          <th>Image</th>
                          <th>Product Name</th>
                          <th>Category</th>
                          <th>Base Price</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((p) => (
                          <tr key={p.id}>
                            <td>
                              <div className="table-prod-img-box">
                                <img 
                                  src={p.image} 
                                  alt={p.name} 
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/assets/daily 1.jpeg';
                                  }}
                                />
                              </div>
                            </td>
                            <td><strong>{p.name}</strong></td>
                            <td><span className={`badge-category ${p.category}`}>{p.category.toUpperCase()}</span></td>
                            <td>
                              <div className="price-edit-box">
                                <span>₹</span>
                                <input 
                                  type="number"
                                  defaultValue={p.price}
                                  onBlur={(e) => onUpdateProductPrice && onUpdateProductPrice(p.id, parseFloat(e.target.value))}
                                  className="admin-price-input"
                                />
                              </div>
                            </td>
                            <td>
                              <button 
                                onClick={() => handleDeleteProductClick(p.id)}
                                className="action-btn-delete"
                                title="Delete Product"
                              >
                                <i className="fa-solid fa-trash-can"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: NOTIFICATIONS & DAILY NEWS */}
            {activeTab === 'notifications' && (
              <div className="tab-stack-layout">
                <div className="notification-admin-grid">
                  {/* Left Column: Create Notification Form */}
                  <div className="workspace-content-card">
                    <div className="content-card-header">
                      <h3><i className="fa-solid fa-bullhorn"></i> Publish Daily News / Announcement</h3>
                    </div>

                    <form onSubmit={handleCreateNotificationSubmit} style={{ padding: '20px' }}>
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                          Announcement Title *
                        </label>
                        <input 
                          type="text" 
                          required
                          placeholder="e.g. 2027 Calendar Booking Started!"
                          value={notifTitle}
                          onChange={(e) => setNotifTitle(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: '10px',
                            border: '1.5px solid #cbd5e1',
                            fontSize: '0.95rem'
                          }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                            Category *
                          </label>
                          <select 
                            value={notifCategory}
                            onChange={(e) => setNotifCategory(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              borderRadius: '10px',
                              border: '1.5px solid #cbd5e1',
                              fontSize: '0.9rem'
                            }}
                          >
                            <option value="Daily News">Daily News</option>
                            <option value="Special Offer">Special Offer</option>
                            <option value="New Arrival">New Arrival</option>
                            <option value="Festival Special">Festival Special</option>
                            <option value="Holiday Notice">Holiday Notice</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                            Date
                          </label>
                          <input 
                            type="date"
                            value={notifDate}
                            onChange={(e) => setNotifDate(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '9px 12px',
                              borderRadius: '10px',
                              border: '1.5px solid #cbd5e1',
                              fontSize: '0.9rem'
                            }}
                          />
                        </div>
                      </div>

                      {/* Image Upload or Asset Selection */}
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                          Upload News Image or Pick From Assets
                        </label>
                        
                        <div className="notif-upload-box" onClick={() => fileInputRef.current && fileInputRef.current.click()}>
                          <input 
                            type="file" 
                            accept="image/*" 
                            ref={fileInputRef} 
                            style={{ display: 'none' }} 
                            onChange={handleImageUpload}
                          />
                          <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: '1.8rem', color: 'var(--primary)', marginBottom: '6px' }}></i>
                          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>
                            Click to Upload Image from Your Device
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            PNG, JPG, WEBP up to 5MB
                          </div>
                        </div>

                        {/* Quick Assets Preset Chips */}
                        <div style={{ marginTop: '10px' }}>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Or pick from existing assets:</span>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {ASSET_PRESETS.map((a, idx) => (
                              <button
                                key={idx}
                                type="button"
                                className={`notif-chip-btn ${notifImage === a.path ? 'active' : ''}`}
                                onClick={() => setNotifImage(a.path)}
                              >
                                {a.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Live Image Preview */}
                        {notifImage && (
                          <div className="notif-preview-wrap">
                            <img 
                              src={notifImage} 
                              alt="Preview" 
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/assets/daily 1.jpeg';
                              }}
                            />
                            <button 
                              type="button" 
                              className="btn-remove-preview"
                              onClick={() => {
                                setNotifImage('');
                                if (fileInputRef.current) fileInputRef.current.value = '';
                              }}
                              title="Remove Image"
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Content Textarea */}
                      <div style={{ marginBottom: '18px' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                          Announcement / News Details *
                        </label>
                        <textarea 
                          required
                          rows="4"
                          placeholder="Enter day-by-day news, calendar booking announcements, pricing discounts, or festival updates..."
                          value={notifContent}
                          onChange={(e) => setNotifContent(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: '10px',
                            border: '1.5px solid #cbd5e1',
                            fontSize: '0.92rem',
                            lineHeight: 1.5
                          }}
                        ></textarea>
                      </div>

                      {/* Pin to Top Banner Checkbox */}
                      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input 
                          type="checkbox" 
                          id="check-pin"
                          checked={notifIsPinned}
                          onChange={(e) => setNotifIsPinned(e.target.checked)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor="check-pin" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', cursor: 'pointer' }}>
                          📌 Pin to Home Page Top Announcement Ticker
                        </label>
                      </div>

                      <button 
                        type="submit" 
                        className="btn-save-product"
                        style={{ width: '100%', pointerEvents: notifLoading ? 'none' : 'auto' }}
                      >
                        {notifLoading ? (
                          <><i className="fa-solid fa-spinner fa-spin"></i> Publishing...</>
                        ) : (
                          <><i className="fa-solid fa-paper-plane"></i> Publish to Home Page</>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Right Column: Existing Announcements List */}
                  <div className="workspace-content-card">
                    <div className="content-card-header">
                      <h3>Active Announcements on Website ({notifications.length})</h3>
                    </div>

                    <div style={{ padding: '20px' }}>
                      <div className="notifications-items-grid">
                        {notifications.map((n) => (
                          <div key={n.id} className="notification-admin-card">
                            {n.image && (
                              <img 
                                src={n.image} 
                                alt={n.title} 
                                className="notif-card-image"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/assets/daily 1.jpeg';
                                }}
                              />
                            )}
                            <div className="notif-card-body">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{
                                  background: n.category === 'Special Offer' ? '#fef3c7' : '#e0f2fe',
                                  color: n.category === 'Special Offer' ? '#b45309' : '#0369a1',
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  padding: '2px 8px',
                                  borderRadius: '8px',
                                  textTransform: 'uppercase'
                                }}>
                                  {n.category || 'News'}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{n.date}</span>
                              </div>

                              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '8px', lineHeight: 1.3 }}>
                                {n.title}
                              </h4>

                              <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {n.content}
                              </p>

                              <div className="notif-card-actions">
                                <button 
                                  type="button"
                                  className={`btn-notif-action pin ${n.is_pinned ? 'active' : ''}`}
                                  onClick={() => onTogglePinNotification && onTogglePinNotification(n.id)}
                                  title={n.is_pinned ? 'Unpin from Top Bar' : 'Pin to Top Bar'}
                                >
                                  <i className="fa-solid fa-thumbtack"></i> {n.is_pinned ? 'Pinned' : 'Pin'}
                                </button>

                                <button 
                                  type="button"
                                  className={`btn-notif-action ${n.is_active ? 'active' : ''}`}
                                  style={{ background: n.is_active ? '#dcfce7' : '#f1f5f9', color: n.is_active ? '#15803d' : '#64748b' }}
                                  onClick={() => onToggleActiveNotification && onToggleActiveNotification(n.id)}
                                  title="Show/Hide on Home Page"
                                >
                                  <i className={`fa-solid ${n.is_active ? 'fa-eye' : 'fa-eye-slash'}`}></i> {n.is_active ? 'Visible' : 'Hidden'}
                                </button>

                                <button 
                                  type="button"
                                  className="btn-notif-action delete"
                                  onClick={() => {
                                    if (window.confirm(`Delete announcement "${n.title}"?`)) {
                                      if (onDeleteNotification) onDeleteNotification(n.id);
                                    }
                                  }}
                                  title="Delete Announcement"
                                >
                                  <i className="fa-solid fa-trash-can"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}

                        {notifications.length === 0 && (
                          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b', gridColumn: '1 / -1' }}>
                            <i className="fa-solid fa-bullhorn" style={{ fontSize: '2.5rem', marginBottom: '12px', opacity: 0.4 }}></i>
                            <p style={{ fontWeight: 600 }}>No announcements published yet. Use the form on the left to publish your first announcement!</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: USERS */}
            {activeTab === 'users' && (
              <div className="workspace-content-card">
                <div className="content-card-header">
                  <h3>Registered User Accounts</h3>
                </div>

                <div className="table-scroller">
                  <table className="premium-data-table">
                    <thead>
                      <tr>
                        <th>User Profile</th>
                        <th>Email Address</th>
                        <th>System Role</th>
                        <th>Joined Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registeredUsers.length > 0 ? (
                        registeredUsers.map((u) => (
                          <tr key={u.id}>
                            <td>
                              <div className="user-table-cell">
                                <div className="avatar-letter">{(u.name || u.email || 'U')[0].toUpperCase()}</div>
                                <span className="user-name">{u.name || 'Anonymous Customer'}</span>
                              </div>
                            </td>
                            <td>{u.email}</td>
                            <td>
                              <span className={`badge-role ${u.role === 'admin' ? 'admin' : 'customer'}`}>
                                {u.role === 'admin' ? 'Administrator' : 'Customer'}
                              </span>
                            </td>
                            <td>{u.joinedDate || '2026-07-01'}</td>
                            <td>
                              <button 
                                onClick={() => handleDeleteUserRecord(u.id, u.email)}
                                className="action-btn-delete"
                                disabled={u.email?.toLowerCase() === 'mohantn617@gmail.com'}
                                title="Delete User"
                              >
                                <i className="fa-solid fa-user-xmark"></i>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        [
                          { id: 'u1', name: 'Administrator', email: 'mohantn617@gmail.com', role: 'admin', joinedDate: '2026-07-01' }
                        ].map((u) => (
                          <tr key={u.id}>
                            <td>
                              <div className="user-table-cell">
                                <div className="avatar-letter">A</div>
                                <span className="user-name">{u.name}</span>
                              </div>
                            </td>
                            <td>{u.email}</td>
                            <td><span className="badge-role admin">Administrator</span></td>
                            <td>{u.joinedDate}</td>
                            <td>—</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 5: BILLING */}
            {activeTab === 'billing' && (
              <div className="workspace-content-card">
                <div className="content-card-header">
                  <h3>Payment & Billing History</h3>
                  <button onClick={handleClearBillingHistory} className="btn-clear-billing">
                    <i className="fa-solid fa-trash-can"></i> Clear All Records
                  </button>
                </div>

                <div className="billing-cards-grid">
                  {billingRecords.map((b) => (
                    <div key={b.id} className="billing-card">
                      <div className="billing-card-header">
                        <span className="billing-inv-id">{b.id}</span>
                        <span className={`status-pill ${b.status.toLowerCase()}`}>{b.status}</span>
                      </div>

                      <div className="billing-card-body">
                        <h4>{b.customerName}</h4>
                        <p className="phone-line"><i className="fa-solid fa-phone"></i> {b.phone}</p>
                        <p className="address-box"><i className="fa-solid fa-location-dot"></i> {b.address}</p>

                        <div className="billing-items-list">
                          <h5>Ordered Items:</h5>
                          {b.items.map((it, idx) => (
                            <div key={idx} className="item-line">
                              <span>{it.name} (x{it.qty})</span>
                              <strong>₹{it.price * it.qty}</strong>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="billing-card-footer">
                        <span>Payment Method: {b.method}</span>
                        <div className="total-amount">Total: ₹{b.total}</div>
                      </div>
                    </div>
                  ))}

                  {billingRecords.length === 0 && (
                    <div className="empty-billing-state">
                      <i className="fa-solid fa-file-invoice"></i> No billing records available.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 6: CUSTOMER INQUIRIES & MESSAGES */}
            {activeTab === 'messages' && (
              <div className="workspace-content-card">
                <div className="content-card-header">
                  <h3>Customer Inquiries ({messages.length})</h3>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Click "WhatsApp" to immediately reply to the customer's phone number
                  </span>
                </div>

                <div className="table-scroller">
                  <table className="premium-data-table">
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Name</th>
                        <th>Phone / Email</th>
                        <th>Service Requested</th>
                        <th>Inquiry Message</th>
                        <th>Date & Time</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {messages.map((m, idx) => (
                        <tr key={m.id || idx}>
                          <td>
                            <button
                              onClick={() => handleToggleMessageStatus(m.id, m.status || 'Pending')}
                              style={{
                                background: (m.status === 'Replied') ? '#dcfce7' : '#fef3c7',
                                color: (m.status === 'Replied') ? '#15803d' : '#b45309',
                                border: 'none',
                                borderRadius: '12px',
                                padding: '4px 10px',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                textTransform: 'uppercase'
                              }}
                              title="Click to toggle status"
                            >
                              {m.status || 'Pending'}
                            </button>
                          </td>
                          <td><strong>{m.name || 'Anonymous Customer'}</strong></td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{m.phone}</div>
                            {m.email && <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{m.email}</span>}
                          </td>
                          <td><span className="badge-service">{m.service || 'Calendar Printing'}</span></td>
                          <td style={{ maxWidth: '300px', lineHeight: 1.5 }}>{m.message}</td>
                          <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{m.timestamp || m.date || 'Today'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              {m.phone && (
                                <a 
                                  href={`https://wa.me/91${m.phone.replace(/[^0-9]/g, '').slice(-10)}?text=${encodeURIComponent(`Hello ${m.name || 'Customer'},\nThank you for reaching out to Karpagam Traders regarding "${m.service || 'Calendar Printing'}". How can we assist you with your requirements today?`)}`}
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  style={{
                                    background: '#25D366',
                                    color: 'white',
                                    padding: '6px 10px',
                                    borderRadius: '8px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    textDecoration: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                  title="Reply on WhatsApp"
                                >
                                  <i className="fa-brands fa-whatsapp"></i> Chat
                                </a>
                              )}
                              <button 
                                onClick={() => handleDeleteMessage(m.id)}
                                className="action-btn-delete"
                                title="Delete Inquiry"
                              >
                                <i className="fa-solid fa-trash-can"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {messages.length === 0 && (
                        <tr>
                          <td colSpan="7" className="table-empty-row">No customer inquiries recorded yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 7: SYSTEM AUDIT LOGS */}
            {activeTab === 'logs' && (
              <div className="workspace-content-card">
                <div className="content-card-header">
                  <h3>Security & Audit Log Timeline</h3>
                </div>

                <div className="system-logs-timeline">
                  {systemLogs.map((l, idx) => (
                    <div key={l.id || idx} className="timeline-item">
                      <div className="timeline-icon-box">
                        <i className="fa-solid fa-shield-cat"></i>
                      </div>
                      <div className="timeline-content-box">
                        <div className="timeline-meta">
                          <span className="user">{l.email || l.user || 'mohantn617@gmail.com'}</span>
                          <span className="time">{l.timestamp}</span>
                        </div>
                        <div className="timeline-text">{l.event || l.activity || 'System operation executed.'}</div>
                      </div>
                    </div>
                  ))}

                  {systemLogs.length === 0 && (
                    <div className="timeline-empty-state">
                      <i className="fa-solid fa-clock-rotate-left"></i> No audit logs captured.
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* 3. Fixed Mobile Bottom Admin Navigation Bar */}
      <div className="mobile-admin-bottom-navbar">
        <button className={`admin-mobile-nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          <i className="fa-solid fa-chart-pie"></i>
          <span>Overview</span>
        </button>

        <button className={`admin-mobile-nav-item ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>
          <i className="fa-solid fa-boxes-stacked"></i>
          <span>Products</span>
        </button>

        <button className={`admin-mobile-nav-item ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
          <i className="fa-solid fa-bullhorn"></i>
          <span>News</span>
        </button>

        <button className={`admin-mobile-nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          <i className="fa-solid fa-users-gear"></i>
          <span>Users</span>
        </button>

        <button className={`admin-mobile-nav-item ${activeTab === 'billing' ? 'active' : ''}`} onClick={() => setActiveTab('billing')}>
          <i className="fa-solid fa-file-invoice-dollar"></i>
          <span>Billing</span>
        </button>

        <button className={`admin-mobile-nav-item ${activeTab === 'messages' ? 'active' : ''}`} onClick={() => setActiveTab('messages')}>
          <i className="fa-solid fa-envelope-open-text"></i>
          <span>Inquiries</span>
        </button>

        <button className={`admin-mobile-nav-item ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>
          <i className="fa-solid fa-clock-rotate-left"></i>
          <span>Logs</span>
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
