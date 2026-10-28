import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import './Dashboard.css';

function Dashboard({ 
  products = [], 
  onAddProduct, 
  onDeleteProduct, 
  onUpdateProductPrice,
  onUpdateProductName,
  onUpdateProductImage,
  onLogout 
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'products', 'users', 'billing', 'messages', 'logs'
  const [messages, setMessages] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [billingRecords, setBillingRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  // New Product Form State
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('daily');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdImage, setNewProdImage] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');

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

        // Messages
        try {
          let msgSnap;
          try {
            msgSnap = await db.collection("customer_inquiries").orderBy("timestamp", "desc").get();
          } catch (mSortErr) {
            msgSnap = await db.collection("customer_inquiries").get();
          }
          const mList = [];
          msgSnap.forEach(docSnap => {
            mList.push({ id: docSnap.id, ...docSnap.data() });
          });
          mList.sort((a, b) => (b.timestamp || b.date || '').localeCompare(a.timestamp || a.date || ''));
          setMessages(mList);
        } catch (mErr) {
          console.warn("Messages fetch warning:", mErr);
        }

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
      }
    } catch (err) {
      console.warn("Firestore fetch error, falling back to local records:", err.message);
    }

    // Default billing records empty
    setBillingRecords([]);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleCreateProductSubmit = (e) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdPrice) return;

    const newProdObj = {
      id: Date.now(),
      name: newProdName.trim(),
      category: newProdCategory,
      price: parseFloat(newProdPrice),
      image: newProdImage.trim() || 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=500&auto=format&fit=crop',
      description: newProdDesc.trim() || 'Premium Sivakasi printed calendar sheet with high resolution Tamil dates & artwork.'
    };

    if (onAddProduct) {
      onAddProduct(newProdObj);
    }

    setNewProdName('');
    setNewProdPrice('');
    setNewProdImage('');
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
              <span>Customer Inquiries</span>
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
              {activeTab === 'users' && 'Registered User Accounts'}
              {activeTab === 'billing' && 'Billing & Payment Transaction Records'}
              {activeTab === 'messages' && 'Customer Inquiries Inbox'}
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
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--primary)' }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2.5rem' }}></i>
            <p style={{ marginTop: '15px', fontWeight: 600 }}>Loading workspace content...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="tab-stack-layout">
                <div className="workspace-content-card">
                  <div className="content-card-header">
                    <h3>Catalog Summary</h3>
                  </div>
                  <div className="catalog-summary-flex">
                    <div className="cat-box daily">
                      <h4>Daily Tear-Offs</h4>
                      <p>{products.filter(p => p.category === 'daily').length} Products</p>
                    </div>
                    <div className="cat-box monthly">
                      <h4>Monthly Wall Calendars</h4>
                      <p>{products.filter(p => p.category === 'monthly').length} Products</p>
                    </div>
                    <div className="cat-box specialty">
                      <h4>Specialty & Desk Prints</h4>
                      <p>{products.filter(p => p.category === 'specialty').length} Products</p>
                    </div>
                  </div>
                </div>

                <div className="workspace-content-card">
                  <div className="content-card-header">
                    <h3>Recent Transactions</h3>
                  </div>
                  <div className="table-scroller">
                    <table className="premium-data-table">
                      <thead>
                        <tr>
                          <th>Invoice ID</th>
                          <th>Customer</th>
                          <th>Items</th>
                          <th>Total</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {billingRecords.map((b, idx) => (
                          <tr key={idx}>
                            <td><strong>{b.id}</strong></td>
                            <td>{b.customerName} ({b.phone})</td>
                            <td>{b.items.map(i => `${i.name} (x${i.qty})`).join(', ')}</td>
                            <td><strong>₹{b.total}</strong></td>
                            <td>
                              <span className={`badge-status ${b.status.toLowerCase()}`}>
                                {b.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {billingRecords.length === 0 && (
                          <tr>
                            <td colSpan="5" className="table-empty-row">No transaction records available.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PRODUCTS MANAGEMENT */}
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
                        <label>Image URL / Path</label>
                        <input 
                          type="text" 
                          placeholder="assets/daily 1.jpeg or https://..."
                          value={newProdImage}
                          onChange={(e) => setNewProdImage(e.target.value)}
                        />
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

                {/* Manage Products Table with Editable Name & Image */}
                <div className="workspace-content-card">
                  <div className="content-card-header">
                    <h3>Existing Products Catalog ({products.length})</h3>
                  </div>

                  <div className="table-scroller">
                    <table className="premium-data-table">
                      <thead>
                        <tr>
                          <th>Image & URL</th>
                          <th>Product Name</th>
                          <th>Category</th>
                          <th>Price (₹)</th>
                          <th style={{ textAlign: 'center' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((p) => (
                          <tr key={p.id}>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <img 
                                  src={p.image} 
                                  alt={p.name} 
                                  style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.3)' }}
                                  onError={(e) => e.target.src = 'https://via.placeholder.com/48'}
                                />
                                <input 
                                  type="text" 
                                  defaultValue={p.image}
                                  placeholder="Edit Image URL"
                                  style={{ width: '140px', fontSize: '0.72rem', padding: '4px 6px', borderRadius: '6px', border: '1px solid #ccc' }}
                                  onBlur={(e) => {
                                    const val = e.target.value.trim();
                                    if (val && onUpdateProductImage) {
                                      onUpdateProductImage(p.id, val);
                                    }
                                  }}
                                />
                              </div>
                            </td>
                            <td>
                              <input 
                                type="text" 
                                defaultValue={p.name}
                                style={{ width: '180px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #ccc', fontWeight: '700', fontSize: '0.9rem' }}
                                onBlur={(e) => {
                                  const val = e.target.value.trim();
                                  if (val && onUpdateProductName) {
                                    onUpdateProductName(p.id, val);
                                  }
                                }}
                              />
                            </td>
                            <td>
                              <span className={`badge-cat ${p.category}`}>
                                {p.category.toUpperCase()}
                              </span>
                            </td>
                            <td>
                              <input 
                                type="number" 
                                defaultValue={p.price}
                                style={{ width: '90px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #ccc' }}
                                onBlur={(e) => {
                                  const val = parseFloat(e.target.value);
                                  if (val > 0 && onUpdateProductPrice) {
                                    onUpdateProductPrice(p.id, val);
                                  }
                                }}
                              />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button className="delete-btn-icon" onClick={() => handleDeleteProductClick(p.id)} title="Delete Product">
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

            {/* TAB 3: USER RECORDS */}
            {activeTab === 'users' && (
              <div className="workspace-content-card">
                <div className="content-card-header">
                  <h3>Registered User Accounts</h3>
                </div>

                <div className="table-scroller">
                  <table className="premium-data-table">
                    <thead>
                      <tr>
                        <th>Username / Name</th>
                        <th>Email Address</th>
                        <th>Role</th>
                        <th>Joined Date</th>
                        <th style={{ textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(registeredUsers.length > 0 ? registeredUsers : [
                        { id: 'u1', name: 'Administrator', email: 'mohantn617@gmail.com', role: 'admin', joinedDate: '2026-07-01' }
                      ]).map((u) => (
                        <tr key={u.id}>
                          <td><strong>{u.name}</strong></td>
                          <td>{u.email}</td>
                          <td>
                            <span className={`badge-role ${u.role}`}>
                              {u.role ? u.role.toUpperCase() : 'CUSTOMER'}
                            </span>
                          </td>
                          <td>{u.joinedDate || '2026-07-01'}</td>
                          <td style={{ textAlign: 'center' }}>
                            <button className="delete-btn-icon" onClick={() => handleDeleteUserRecord(u.id, u.email)} title="Delete User">
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: BILLING & PAYMENT */}
            {activeTab === 'billing' && (
              <div className="workspace-content-card">
                <div className="content-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>Customer Invoices & Billing Cards</h3>
                  <button className="btn-clear-history" onClick={handleClearBillingHistory}>
                    <i className="fa-solid fa-trash-arrow-up"></i> Clear History
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

            {/* TAB 5: MESSAGES */}
            {activeTab === 'messages' && (
              <div className="workspace-content-card">
                <div className="content-card-header">
                  <h3>Customer Inquiries</h3>
                </div>

                <div className="table-scroller">
                  <table className="premium-data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Phone / Email</th>
                        <th>Service</th>
                        <th>Message</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {messages.map((m, idx) => (
                        <tr key={m.id || idx}>
                          <td><strong>{m.name}</strong></td>
                          <td>{m.phone} <br/><span style={{ fontSize: '0.8rem', color: '#888' }}>{m.email}</span></td>
                          <td><span className="badge-service">{m.service}</span></td>
                          <td>{m.message}</td>
                          <td>{m.timestamp || m.date || '2026-07-08'}</td>
                        </tr>
                      ))}
                      {messages.length === 0 && (
                        <tr>
                          <td colSpan="5" className="table-empty-row">No customer inquiries recorded.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 6: SYSTEM LOGS */}
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
                    <div className="table-empty-row" style={{ padding: '40px 0' }}>No logs recorded.</div>
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
          <span>Audit Logs</span>
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
