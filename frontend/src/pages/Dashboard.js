import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import './Dashboard.css';

function Dashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'messages', 'history', 'logs'
  const [stats, setStats] = useState({ total_messages: 0, total_history: 0, total_logs: 0 });
  const [messages, setMessages] = useState([]);
  const [userHistory, setUserHistory] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchData = () => {
    // 1. Fetch general overview statistics
    fetch('http://127.0.0.1:8000/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error("Stats load failed:", err));

    // 2. Fetch specific tab data
    if (activeTab === 'overview' || activeTab === 'messages') {
      fetch('http://127.0.0.1:8000/api/messages')
        .then(res => res.json())
        .then(data => setMessages(data))
        .catch(err => console.error("Messages fetch failed:", err));
    }
    if (activeTab === 'overview' || activeTab === 'history') {
      fetch('http://127.0.0.1:8000/api/user-history')
        .then(res => res.json())
        .then(data => setUserHistory(data))
        .catch(err => console.error("History fetch failed:", err));
    }
    if (activeTab === 'overview' || activeTab === 'logs') {
      fetch('http://127.0.0.1:8000/api/logs')
        .then(res => res.json())
        .then(data => setSystemLogs(data))
        .catch(err => console.error("Logs fetch failed:", err));
    }
  };

  // Fetch stats and tab data depending on what is active
  useEffect(() => {
    setLoading(true);
    fetchData();
    setLoading(false);
  }, [activeTab]);

  const handleDeleteMessage = (index) => {
    if (window.confirm("Are you sure you want to delete this customer inquiry?")) {
      fetch(`http://127.0.0.1:8000/api/messages/${index}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success') {
            fetchData();
          }
        })
        .catch(err => console.error("Inquiry deletion failed:", err));
    }
  };

  const handleDeleteHistory = (index) => {
    if (window.confirm("Are you sure you want to delete this user history record?")) {
      fetch(`http://127.0.0.1:8000/api/user-history/${index}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success') {
            fetchData();
          }
        })
        .catch(err => console.error("History deletion failed:", err));
    }
  };

  const handleDeleteLog = (index) => {
    if (window.confirm("Are you sure you want to delete this system audit log?")) {
      fetch(`http://127.0.0.1:8000/api/logs/${index}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success') {
            fetchData();
          }
        })
        .catch(err => console.error("Log deletion failed:", err));
    }
  };

  const handleLogout = async () => {
    try {
      if (onLogout) {
        await onLogout();
      }
      navigate('/');
    } catch (err) {
      console.error("Logout failed:", err.message);
    }
  };

  const getTodayFormatted = () => {
    const today = new Date();
    return today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="admin-layout-wrapper">
      {/* 1. Sidebar menu panel */}
      <aside className="admin-sidebar">
        <div className="sidebar-header-brand">
          <div className="brand-icon-box">
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <div className="brand-title-box">
            <h3>Admin <span>Panel</span></h3>
            <p>Control Center</p>
          </div>
        </div>

        <ul className="sidebar-nav-menu">
          <li className={`nav-menu-item ${activeTab === 'overview' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('overview')}>
              <i className="fa-solid fa-chart-pie"></i>
              <span>Dashboard</span>
            </button>
          </li>
          <li className={`nav-menu-item ${activeTab === 'messages' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('messages')}>
              <i className="fa-solid fa-envelope-open-text"></i>
              <span>Messages</span>
            </button>
          </li>
          <li className={`nav-menu-item ${activeTab === 'history' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('history')}>
              <i className="fa-solid fa-user-gear"></i>
              <span>User History</span>
            </button>
          </li>
          <li className={`nav-menu-item ${activeTab === 'logs' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('logs')}>
              <i className="fa-solid fa-clock-rotate-left"></i>
              <span>System Logs</span>
            </button>
          </li>
        </ul>

        {/* Sidebar Footer Buttons */}
        <div className="sidebar-brand-footer">
          <button className="footer-btn-exit" onClick={() => navigate('/')} style={{ marginBottom: '10px' }}>
            <i className="fa-solid fa-house"></i>
            <span>Back to Home</span>
          </button>
          <button className="footer-btn-exit logout" onClick={handleLogout}>
            <i className="fa-solid fa-arrow-right-from-bracket"></i>
            <span>Logout Session</span>
          </button>
        </div>
      </aside>

      {/* 2. Workspace Viewport */}
      <main className="admin-workspace-canvas">
        <header className="workspace-header-bar">
          <div className="header-meta-details">
            <h1>
              {activeTab === 'overview' && 'Overview Analytics'}
              {activeTab === 'messages' && 'Customer Inquiries'}
              {activeTab === 'history' && 'User Access Records'}
              {activeTab === 'logs' && 'System Activity Logs'}
            </h1>
            <p>Welcome back, Administrator. Real-time indicators are listed below.</p>
          </div>
          <div className="header-date-badge">
            <i className="fa-regular fa-calendar-check"></i>
            <span>{getTodayFormatted()}</span>
          </div>
        </header>

        {/* stats overview cards */}
        <section className="stats-summary-deck">
          <div className="stat-deck-card">
            <div className="stat-card-details">
              <h5>Total Inquiries</h5>
              <h3>{stats.total_messages}</h3>
            </div>
            <div className="stat-card-badge inquiries">
              <i className="fa-solid fa-envelope"></i>
            </div>
          </div>

          <div className="stat-deck-card">
            <div className="stat-card-details">
              <h5>Access Audits</h5>
              <h3>{stats.total_history}</h3>
            </div>
            <div className="stat-card-badge sessions">
              <i className="fa-solid fa-fingerprint"></i>
            </div>
          </div>

          <div className="stat-deck-card">
            <div className="stat-card-details">
              <h5>System Activity</h5>
              <h3>{stats.total_logs}</h3>
            </div>
            <div className="stat-card-badge logs">
              <i className="fa-solid fa-clock-rotate-left"></i>
            </div>
          </div>
        </section>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--primary-accent)' }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2.5rem' }}></i>
            <p style={{ marginTop: '15px', fontWeight: 600 }}>Loading workspace content...</p>
          </div>
        ) : (
          <>
            {/* View Tab 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                <div className="workspace-content-card">
                  <div className="content-card-header">
                    <h3>Recent Inquiries</h3>
                  </div>
                  <div className="table-scroller">
                    <table className="premium-data-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Service</th>
                          <th>Message</th>
                          <th>Date</th>
                          <th style={{ textAlign: 'center' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {messages.slice(0, 3).map((item, index) => (
                          <tr key={index}>
                            <td><strong>{item.name}</strong></td>
                            <td><span className="badge-service">{item.service}</span></td>
                            <td>
                              <div className="message-cell-container">{item.message}</div>
                            </td>
                            <td style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>{item.date}</td>
                            <td style={{ textAlign: 'center' }}>
                              <button onClick={() => handleDeleteMessage(index)} className="delete-btn-icon" title="Delete Inquiry">
                                <i className="fa-solid fa-trash-can"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                        {messages.length === 0 && (
                          <tr>
                            <td colSpan="5" className="table-empty-row">
                              <i className="fa-solid fa-envelope-open"></i> No inquiries logged.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="workspace-content-card">
                  <div className="content-card-header">
                    <h3>Recent System Logs</h3>
                  </div>
                  <div className="system-logs-timeline">
                    {systemLogs.slice(0, 3).map((log, index) => (
                      <div className="timeline-item" key={index}>
                        <div className={`timeline-icon-box ${log.type}`}>
                          <i className={`fa-solid ${
                            log.type === 'success' ? 'fa-circle-check' :
                            log.type === 'warning' ? 'fa-triangle-exclamation' :
                            log.type === 'update' ? 'fa-pen-to-square' : 'fa-circle-info'
                          }`}></i>
                        </div>
                        <div className="timeline-content-box">
                          <div className="timeline-meta">
                            <span className="user">{log.user}</span>
                            <span className="time">{log.timestamp}</span>
                          </div>
                          <div className="timeline-text">{log.activity}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* View Tab 2: MESSAGES */}
            {activeTab === 'messages' && (
              <div className="workspace-content-card">
                <div className="content-card-header">
                  <h3>Customer Inquiries Inbox</h3>
                </div>
                <div className="table-scroller">
                  <table className="premium-data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Email</th>
                        <th>Service</th>
                        <th>Message</th>
                        <th>Date</th>
                        <th style={{ textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {messages.map((item, index) => (
                        <tr key={index}>
                          <td><div className="text-wrap-container"><strong>{item.name}</strong></div></td>
                          <td style={{ whiteSpace: 'nowrap' }}>{item.phone}</td>
                          <td><div className="text-wrap-container">{item.email || 'N/A'}</div></td>
                          <td><span className="badge-service">{item.service}</span></td>
                          <td>
                            <div className="message-cell-container">{item.message}</div>
                          </td>
                          <td style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>{item.date}</td>
                          <td style={{ textAlign: 'center' }}>
                            <button onClick={() => handleDeleteMessage(index)} className="delete-btn-icon" title="Delete Inquiry">
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                      {messages.length === 0 && (
                        <tr>
                          <td colSpan="7" className="table-empty-row">
                            <i className="fa-solid fa-folder-open"></i> No inquiries received.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* View Tab 3: USER HISTORY */}
            {activeTab === 'history' && (
              <div className="workspace-content-card">
                <div className="content-card-header">
                  <h3>User Signup & Session History</h3>
                </div>
                <div className="table-scroller">
                  <table className="premium-data-table">
                    <thead>
                      <tr>
                        <th>User Email</th>
                        <th>Event Action</th>
                        <th>Timestamp</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userHistory.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <div className="text-wrap-container"><strong>{item.user_name}</strong></div>
                          </td>
                          <td style={{ fontWeight: 600 }}>{item.action}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{item.timestamp}</td>
                          <td>
                            <span className={`badge-status ${item.status.toLowerCase()}`}>
                              {item.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button onClick={() => handleDeleteHistory(index)} className="delete-btn-icon" title="Delete Log">
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                      {userHistory.length === 0 && (
                        <tr>
                          <td colSpan="5" className="table-empty-row">
                            <i className="fa-solid fa-fingerprint"></i> No session activities recorded.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* View Tab 4: SYSTEM LOGS */}
            {activeTab === 'logs' && (
              <div className="workspace-content-card">
                <div className="content-card-header">
                  <h3>System Audit Timeline</h3>
                </div>
                <div className="system-logs-timeline">
                  {systemLogs.map((log, index) => (
                    <div className="timeline-item" key={index}>
                      <div className={`timeline-icon-box ${log.type}`}>
                        <i className={`fa-solid ${
                          log.type === 'success' ? 'fa-circle-check' :
                          log.type === 'warning' ? 'fa-triangle-exclamation' :
                          log.type === 'update' ? 'fa-pen-to-square' : 'fa-circle-info'
                        }`}></i>
                      </div>
                      <div className="timeline-content-box" style={{ position: 'relative' }}>
                        <div className="timeline-meta">
                          <span className="user">{log.user}</span>
                          <span className="time">{log.timestamp}</span>
                        </div>
                        <div className="timeline-text" style={{ paddingRight: '40px' }}>{log.activity}</div>
                        <button 
                          onClick={() => handleDeleteLog(index)} 
                          className="delete-btn-icon" 
                          title="Delete System Log"
                          style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)' }}
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                  {systemLogs.length === 0 && (
                    <div className="table-empty-row" style={{ border: 'none' }}>
                      <i className="fa-solid fa-timeline"></i> No system logs recorded.
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
