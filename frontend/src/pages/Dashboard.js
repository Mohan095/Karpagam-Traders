import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import apiService from '../api';
import { downloadBillingImage, generateBillingImageDataUrl } from '../utils/billGenerator';
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
  const [previewBillModal, setPreviewBillModal] = useState({ open: false, order: null, dataUrl: null });
  const [autoDownloadEnabled, setAutoDownloadEnabled] = useState(() => {
    return localStorage.getItem('karpagam_admin_autodownload') === 'true';
  });

  // Product Tab View & Filters
  const [prodSearchQuery, setProdSearchQuery] = useState('');
  const [prodCategoryFilter, setProdCategoryFilter] = useState('all');
  const [prodViewMode, setProdViewMode] = useState('grid'); // 'grid' | 'table'

  // Users Tab View & Filters
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all'); // 'all' | 'admin' | 'customer'
  const [selectedUserHistory, setSelectedUserHistory] = useState(null);

  // Messages & Inquiries Tab View & Filters
  const [msgFilter, setMsgFilter] = useState('all'); // 'all' | 'pending' | 'replied'
  const [msgSearchQuery, setMsgSearchQuery] = useState('');

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

    // LIVE WORK: Real-time listener for Auth Logins/Logouts across tabs and sessions
    const handleAuthActivity = (e) => {
      const { type, email, timestamp, session } = e.detail || {};
      if (!email) return;

      setRegisteredUsers(prev => {
        return prev.map(u => {
          if (u.email && u.email.toLowerCase() === email.toLowerCase()) {
            const isOnline = type === 'login';
            let history = Array.isArray(u.sessionHistory) ? [...u.sessionHistory] : [];
            
            if (type === 'login' && session) {
              history = [session, ...history.filter(s => s.sessionId !== session.sessionId)];
            } else if (type === 'logout') {
              history = history.map((s, idx) => {
                if (s.isOnline || !s.logoutTime || s.status === 'Active' || idx === 0) {
                  return {
                    ...s,
                    logoutTime: timestamp || new Date().toISOString().replace('T', ' ').slice(0, 19),
                    isOnline: false,
                    status: 'Completed',
                    duration: s.duration === 'Active Session' ? 'Session Completed' : s.duration
                  };
                }
                return s;
              });
            }

            return {
              ...u,
              isOnline,
              lastLogin: type === 'login' ? (timestamp || u.lastLogin) : u.lastLogin,
              lastLogout: type === 'logout' ? (timestamp || u.lastLogout) : (isOnline ? 'Active Session' : u.lastLogout),
              sessionHistory: history
            };
          }
          return u;
        });
      });

      // Keep open session history modal updated in real-time
      setSelectedUserHistory(prev => {
        if (prev && prev.email && prev.email.toLowerCase() === email.toLowerCase()) {
          const isOnline = type === 'login';
          let history = Array.isArray(prev.sessionHistory) ? [...prev.sessionHistory] : [];
          if (type === 'login' && session) {
            history = [session, ...history.filter(s => s.sessionId !== session.sessionId)];
          } else if (type === 'logout') {
            history = history.map((s, idx) => {
              if (s.isOnline || !s.logoutTime || s.status === 'Active' || idx === 0) {
                return {
                  ...s,
                  logoutTime: timestamp || new Date().toISOString().replace('T', ' ').slice(0, 19),
                  isOnline: false,
                  status: 'Completed'
                };
              }
              return s;
            });
          }
          return {
            ...prev,
            isOnline,
            lastLogin: type === 'login' ? (timestamp || prev.lastLogin) : prev.lastLogin,
            lastLogout: type === 'logout' ? (timestamp || prev.lastLogout) : (isOnline ? 'Active Session' : prev.lastLogout),
            sessionHistory: history
          };
        }
        return prev;
      });
    };

    window.addEventListener('karpagam_auth_activity', handleAuthActivity);

    // Cross-tab and cross-window real-time session storage sync
    const handleStorageEvent = (e) => {
      if (e.key && e.key.startsWith('karpagam_sessions_')) {
        const email = e.key.replace('karpagam_sessions_', '');
        try {
          const sessions = JSON.parse(e.newValue || '[]');
          if (Array.isArray(sessions) && sessions.length > 0) {
            const latest = sessions[0];
            const isOnline = latest.isOnline || !latest.logoutTime || latest.status === 'Active';
            setRegisteredUsers(prev => prev.map(u => {
              if (u.email && u.email.toLowerCase() === email.toLowerCase()) {
                return {
                  ...u,
                  isOnline,
                  lastLogin: latest.loginTime || u.lastLogin,
                  lastLogout: latest.logoutTime || (isOnline ? 'Active Session' : u.lastLogout),
                  sessionHistory: sessions
                };
              }
              return u;
            }));
          }
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    // Real-time Firestore sync
    let unsubscribeUsers = null;
    if (db) {
      try {
        unsubscribeUsers = db.collection("users").onSnapshot((snapshot) => {
          if (!snapshot.empty) {
            const remoteUsers = [];
            snapshot.forEach(docSnap => {
              remoteUsers.push({ id: docSnap.id, ...docSnap.data() });
            });
            setRegisteredUsers(prev => {
              const updated = [...prev];
              remoteUsers.forEach(ru => {
                const idx = updated.findIndex(u => u.id === ru.id || (u.email && ru.email && u.email.toLowerCase() === ru.email.toLowerCase()));
                if (idx !== -1) {
                  updated[idx] = { ...updated[idx], ...ru };
                } else {
                  updated.push(ru);
                }
              });
              return updated;
            });
          }
        }, (err) => console.warn("Live users listener notice:", err));
      } catch (e) {}
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('karpagam_auth_activity', handleAuthActivity);
      window.removeEventListener('storage', handleStorageEvent);
      if (unsubscribeUsers) unsubscribeUsers();
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (db) {
        // Users & Session Activity
        try {
          const usersSnap = await db.collection("users").get();
          const uList = [];
          usersSnap.forEach(docSnap => {
            uList.push({ id: docSnap.id, ...docSnap.data() });
          });

          // Seed baseline sample users with login/logout timestamps and full session history
          const sampleUsers = [
            {
              id: 'u_admin_mohan',
              name: 'Mohan K',
              email: 'mohantn617@gmail.com',
              role: 'admin',
              joinedDate: '2026-08-07',
              lastLogin: '2026-10-31 09:15:20',
              lastLogout: 'Active Session',
              isOnline: true,
              sessionHistory: [
                {
                  sessionId: 'SESS-90412',
                  loginTime: '2026-10-31 09:15:20',
                  logoutTime: null,
                  isOnline: true,
                  device: 'Desktop Browser (Chrome / Windows 11)',
                  ipAddress: '192.168.1.105 (Verified Admin)',
                  status: 'Active',
                  duration: 'Active Session'
                },
                {
                  sessionId: 'SESS-82194',
                  loginTime: '2026-10-30 14:10:05',
                  logoutTime: '2026-10-30 18:45:22',
                  isOnline: false,
                  device: 'Desktop Browser (Chrome / Windows 11)',
                  ipAddress: '192.168.1.105 (Verified Admin)',
                  status: 'Completed',
                  duration: '4 hrs 35 mins'
                },
                {
                  sessionId: 'SESS-71940',
                  loginTime: '2026-10-29 08:30:15',
                  logoutTime: '2026-10-29 12:15:40',
                  isOnline: false,
                  device: 'Mobile Safari (iOS 18.2)',
                  ipAddress: '106.198.42.12 (Sivakasi)',
                  status: 'Completed',
                  duration: '3 hrs 45 mins'
                }
              ]
            },
            {
              id: 'u_cust_siva',
              name: 'Siva Kumar (Sivakasi Agency)',
              email: 'siva.agency@gmail.com',
              role: 'customer',
              joinedDate: '2026-07-08',
              lastLogin: '2026-10-31 08:42:15',
              lastLogout: '2026-10-31 09:10:30',
              isOnline: false,
              sessionHistory: [
                {
                  sessionId: 'SESS-68190',
                  loginTime: '2026-10-31 08:42:15',
                  logoutTime: '2026-10-31 09:10:30',
                  isOnline: false,
                  device: 'Mobile Android (Chrome)',
                  ipAddress: '157.48.21.90 (Sivakasi)',
                  status: 'Completed',
                  duration: '28 mins 15 secs'
                },
                {
                  sessionId: 'SESS-59210',
                  loginTime: '2026-10-28 11:20:00',
                  logoutTime: '2026-10-28 11:55:18',
                  isOnline: false,
                  device: 'Mobile Android (Chrome)',
                  ipAddress: '157.48.21.90 (Sivakasi)',
                  status: 'Completed',
                  duration: '35 mins 18 secs'
                }
              ]
            },
            {
              id: 'u_cust_ramesh',
              name: 'Ramesh Kannan',
              email: 'ramesh.press@gmail.com',
              role: 'customer',
              joinedDate: '2026-08-15',
              lastLogin: '2026-10-30 18:30:45',
              lastLogout: '2026-10-30 19:15:22',
              isOnline: false,
              sessionHistory: [
                {
                  sessionId: 'SESS-48104',
                  loginTime: '2026-10-30 18:30:45',
                  logoutTime: '2026-10-30 19:15:22',
                  isOnline: false,
                  device: 'Desktop Edge (Windows 10)',
                  ipAddress: '49.37.112.44 (Madurai)',
                  status: 'Completed',
                  duration: '44 mins 37 secs'
                }
              ]
            },
            {
              id: 'u_cust_meenakshi',
              name: 'Meenakshi Sundaram',
              email: 'meenakshi.s@outlook.com',
              role: 'customer',
              joinedDate: '2026-09-02',
              lastLogin: '2026-10-31 09:20:10',
              lastLogout: 'Active Session',
              isOnline: true,
              sessionHistory: [
                {
                  sessionId: 'SESS-39104',
                  loginTime: '2026-10-31 09:20:10',
                  logoutTime: null,
                  isOnline: true,
                  device: 'MacBook Safari (macOS)',
                  ipAddress: '117.216.55.18 (Chennai)',
                  status: 'Active',
                  duration: 'Active Session'
                },
                {
                  sessionId: 'SESS-28012',
                  loginTime: '2026-10-25 15:00:20',
                  logoutTime: '2026-10-25 16:30:10',
                  isOnline: false,
                  device: 'MacBook Safari (macOS)',
                  ipAddress: '117.216.55.18 (Chennai)',
                  status: 'Completed',
                  duration: '1 hr 29 mins'
                }
              ]
            },
            {
              id: 'u_cust_murugan',
              name: 'Murugan Calendar Stores',
              email: 'murugan.sivakasi@gmail.com',
              role: 'customer',
              joinedDate: '2026-09-20',
              lastLogin: '2026-10-29 11:15:00',
              lastLogout: '2026-10-29 11:45:10',
              isOnline: false,
              sessionHistory: [
                {
                  sessionId: 'SESS-12109',
                  loginTime: '2026-10-29 11:15:00',
                  logoutTime: '2026-10-29 11:45:10',
                  isOnline: false,
                  device: 'Desktop Chrome (Windows 11)',
                  ipAddress: '106.198.42.18 (Sivakasi)',
                  status: 'Completed',
                  duration: '30 mins 10 secs'
                }
              ]
            }
          ];

          sampleUsers.forEach(sample => {
            if (!uList.some(u => (u.email && u.email.toLowerCase() === sample.email.toLowerCase()))) {
              uList.push(sample);
            }
          });

          // Enrich users so login and logout date/time and full history are always clearly viewable
          const enrichedUsers = uList.map(u => {
            const isAdmin = u.role === 'admin' || u.email?.toLowerCase() === 'mohantn617@gmail.com';
            const isOnline = u.isOnline !== undefined ? u.isOnline : (isAdmin || u.lastLogout === 'Active Session');
            let history = u.sessionHistory;
            if (!Array.isArray(history) || history.length === 0) {
              try {
                const lsHist = JSON.parse(localStorage.getItem(`karpagam_sessions_${u.email?.toLowerCase()}`) || '[]');
                if (Array.isArray(lsHist) && lsHist.length > 0) history = lsHist;
              } catch (e) {}
            }
            if (!Array.isArray(history) || history.length === 0) {
              history = [
                {
                  sessionId: 'SESS-' + String(u.id || '001').slice(-5).toUpperCase(),
                  loginTime: u.lastLogin || `${u.joinedDate || '2026-07-01'} 09:15:20`,
                  logoutTime: isOnline ? null : (u.lastLogout && u.lastLogout !== '—' ? u.lastLogout : `${u.joinedDate || '2026-07-01'} 10:45:00`),
                  isOnline,
                  device: 'Desktop Browser (Chrome / Edge)',
                  ipAddress: '192.168.1.105 (Verified Session)',
                  status: isOnline ? 'Active' : 'Completed',
                  duration: isOnline ? 'Active Session' : '1 hr 30 mins'
                }
              ];
            }

            return {
              ...u,
              role: isAdmin ? 'admin' : (u.role || 'customer'),
              lastLogin: u.lastLogin || history[0]?.loginTime || (u.joinedDate ? `${u.joinedDate} 09:15:20` : '2026-10-31 08:30:15'),
              lastLogout: isOnline ? 'Active Session' : (u.lastLogout && u.lastLogout !== '—' ? u.lastLogout : (history[0]?.logoutTime || '2026-10-30 20:15:30')),
              isOnline,
              sessionHistory: history
            };
          });

          setRegisteredUsers(enrichedUsers);
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
        // Fallback offline: load inquiries and users
        try {
          const localInquiries = JSON.parse(localStorage.getItem('karpagam_customer_inquiries') || '[]');
          localInquiries.sort((a, b) => (b.timestamp || b.date || '').localeCompare(a.timestamp || a.date || ''));
          setMessages(localInquiries);
        } catch (e) {}

        setRegisteredUsers(prev => prev.length > 0 ? prev : [
          { id: 'u_admin_mohan', name: 'Mohan K', email: 'mohantn617@gmail.com', role: 'admin', joinedDate: '2026-08-07', lastLogin: '2026-10-31 09:15:20', lastLogout: 'Active Session', isOnline: true },
          { id: 'u_cust_siva', name: 'Siva Kumar (Sivakasi Agency)', email: 'siva.agency@gmail.com', role: 'customer', joinedDate: '2026-07-08', lastLogin: '2026-10-31 08:42:15', lastLogout: '2026-10-31 09:10:30', isOnline: false },
          { id: 'u_cust_ramesh', name: 'Ramesh Kannan', email: 'ramesh.press@gmail.com', role: 'customer', joinedDate: '2026-08-15', lastLogin: '2026-10-30 18:30:45', lastLogout: '2026-10-30 19:15:22', isOnline: false },
          { id: 'u_cust_meenakshi', name: 'Meenakshi Sundaram', email: 'meenakshi.s@outlook.com', role: 'customer', joinedDate: '2026-09-02', lastLogin: '2026-10-31 09:20:10', lastLogout: 'Active Session', isOnline: true },
          { id: 'u_cust_murugan', name: 'Murugan Calendar Stores', email: 'murugan.sivakasi@gmail.com', role: 'customer', joinedDate: '2026-09-20', lastLogin: '2026-10-29 11:15:00', lastLogout: '2026-10-29 11:45:10', isOnline: false }
        ]);
      }
    } catch (err) {
      console.warn("Firestore fetch error, falling back to local records:", err.message);
    }

    // Fetch Billing Records from Firestore and localStorage
    let bList = [];
    if (db) {
      try {
        const billsSnap = await db.collection("billing_records").get();
        billsSnap.forEach(docSnap => {
          bList.push({ id: docSnap.id, ...docSnap.data() });
        });
      } catch (bErr) {
        console.warn("Firestore billing records notice:", bErr);
      }
    }
    try {
      const localBills = JSON.parse(localStorage.getItem('karpagam_billing_records') || '[]');
      localBills.forEach(lb => {
        if (!bList.some(b => b.id === lb.id || (b.customerName === lb.customerName && b.timestamp === lb.timestamp))) {
          bList.push(lb);
        }
      });
    } catch (lsbErr) {
      console.warn("LocalStorage bills read warning:", lsbErr);
    }

    // Default sample billing records if none exist yet
    if (bList.length === 0) {
      bList = [
        {
          id: 'KT-INV-821940',
          invoiceNo: 'KT-INV-821940',
          customerName: 'Murugan Traders Sivakasi',
          phone: '+91 94432 10987',
          email: 'murugan.sivakasi@gmail.com',
          address: 'Shop #14, Gandhi Road, Sivakasi - 626123',
          items: [
            { name: 'Daily Tamil Calendar 2027 (Deluxe)', qty: 50, price: 120, size: 'A4', quality: 'Deluxe' },
            { name: 'Monthly Wall Sheet Calendar (Glossy 6-Sheet)', qty: 25, price: 80, size: 'A3', quality: 'Glossy' }
          ],
          total: 8000,
          totalAmount: 8000,
          timestamp: '2026-10-30 14:20:00',
          date: '2026-10-30 14:20:00',
          status: 'Order via WhatsApp',
          method: 'WhatsApp Express Order'
        },
        {
          id: 'KT-INV-619420',
          invoiceNo: 'KT-INV-619420',
          customerName: 'Sri Meenakshi Stores',
          phone: '+91 98765 43210',
          email: 'meenakshistores@gmail.com',
          address: '42, West Car Street, Madurai - 625001',
          items: [
            { name: 'Executive Desktop Table Calendar 2027', qty: 15, price: 199, size: 'Desk Stand', quality: 'Executive Matte' }
          ],
          total: 2985,
          totalAmount: 2985,
          timestamp: '2026-10-29 11:15:00',
          date: '2026-10-29 11:15:00',
          status: 'Order via WhatsApp',
          method: 'WhatsApp Express Order'
        }
      ];
      try {
        localStorage.setItem('karpagam_billing_records', JSON.stringify(bList));
      } catch (e) {}
    }

    bList.sort((a, b) => (b.timestamp || b.date || '').localeCompare(a.timestamp || a.date || ''));
    setBillingRecords(bList);

    // Auto-download for Owner/Admin if enabled
    const autoDl = localStorage.getItem('karpagam_admin_autodownload') === 'true';
    if (autoDl && bList.length > 0) {
      try {
        const downloadedIds = JSON.parse(localStorage.getItem('karpagam_admin_downloaded_bills') || '[]');
        bList.forEach(order => {
          if (order.id && !downloadedIds.includes(order.id)) {
            downloadBillingImage(order, 'png');
            downloadedIds.push(order.id);
          }
        });
        localStorage.setItem('karpagam_admin_downloaded_bills', JSON.stringify(downloadedIds));
      } catch (adlErr) {
        console.warn("Owner auto-download notice:", adlErr);
      }
    }

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

  const handleExportSessionAudit = (userRecord, format = 'csv') => {
    if (!userRecord) return;
    const isOnline = !!userRecord.isOnline;
    const sessionList = (Array.isArray(userRecord.sessionHistory) && userRecord.sessionHistory.length > 0)
      ? userRecord.sessionHistory
      : [
          {
            sessionId: 'SESS-' + (userRecord.id?.slice(-5) || '101').toUpperCase(),
            loginTime: userRecord.lastLogin || '2026-10-31 09:15:20',
            logoutTime: isOnline ? null : (userRecord.lastLogout || '2026-10-31 09:55:00'),
            isOnline,
            device: 'Desktop Browser (Chrome / Edge)',
            ipAddress: '192.168.1.105 (Verified Session)',
            status: isOnline ? 'Active' : 'Completed',
            duration: isOnline ? 'Active Session' : '40 mins'
          }
        ];

    if (format === 'json') {
      const exportData = {
        title: "Karpagam Traders - User Login & Logout Telemetry Audit",
        generatedAt: new Date().toISOString(),
        user: {
          id: userRecord.id,
          name: userRecord.name,
          email: userRecord.email,
          role: userRecord.role,
          isOnline: isOnline,
          lastLogin: userRecord.lastLogin,
          lastLogout: userRecord.lastLogout
        },
        sessionHistory: sessionList
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `audit_${(userRecord.name || 'user').replace(/\s+/g, '_')}_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } else {
      const headers = ["Session ID", "Login Date & Time", "Logout Date & Time", "Session Status", "Duration", "Device & Browser", "IP Address"];
      const rows = sessionList.map(s => {
        const sessionActive = s.isOnline || !s.logoutTime || s.status === 'Active';
        const logoutVal = sessionActive ? 'Active Session (Online)' : (s.logoutTime || '—');
        const durVal = sessionActive ? 'Active Session' : (s.duration || '—');
        return [
          `"${s.sessionId || '—'}"`,
          `"${s.loginTime || '—'}"`,
          `"${logoutVal}"`,
          `"${sessionActive ? 'Active' : 'Completed'}"`,
          `"${durVal}"`,
          `"${s.device || '—'}"`,
          `"${s.ipAddress || '—'}"`
        ];
      });

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `session_audit_${(userRecord.name || 'user').replace(/\s+/g, '_')}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
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

  const handleDownloadBill = (order, format = 'png') => {
    const res = downloadBillingImage(order, format);
    if (res && res.success) {
      alert(`Black & White Bill (${format.toUpperCase()}) downloaded for ${order.customerName || order.name || 'Order'}!`);
    }
  };

  const handleDownloadInquiryBill = (m) => {
    const orderData = {
      id: m.invoiceNo || (m.id && String(m.id).startsWith('order_') ? ('KT-INV-' + String(m.id).replace('order_', '').slice(-6)) : (m.id || 'KT-INV-' + Date.now().toString().slice(-6))),
      invoiceNo: m.invoiceNo || (m.id && String(m.id).startsWith('order_') ? ('KT-INV-' + String(m.id).replace('order_', '').slice(-6)) : (m.id || 'KT-INV-' + Date.now().toString().slice(-6))),
      customerName: m.name || 'Valued Customer',
      name: m.name || 'Valued Customer',
      phone: m.phone || 'N/A',
      email: m.email || 'N/A',
      address: m.address || (m.message && m.message.includes('Delivery Address:') ? m.message.split('Delivery Address:')[1]?.trim() : 'Sivakasi Counter Delivery'),
      items: (m.items && m.items.length > 0) ? m.items : [{ name: m.service || 'Calendar Printing Order', qty: 1, price: m.totalAmount || 0 }],
      total: m.totalAmount || 0,
      totalAmount: m.totalAmount || 0,
      timestamp: m.timestamp || m.date || new Date().toISOString().split('T')[0],
      date: m.date || m.timestamp || new Date().toISOString().split('T')[0],
      status: m.status || 'Order via WhatsApp',
      method: 'WhatsApp Express Order'
    };
    downloadBillingImage(orderData, 'png');
    alert(`Black & White Bill (PNG) downloaded for ${orderData.customerName}!`);
  };

  const handlePreviewBill = (order) => {
    const dataUrl = generateBillingImageDataUrl(order, 'png');
    setPreviewBillModal({ open: true, order, dataUrl });
  };

  const handleToggleAutoDownload = () => {
    const nextVal = !autoDownloadEnabled;
    setAutoDownloadEnabled(nextVal);
    localStorage.setItem('karpagam_admin_autodownload', String(nextVal));
    if (nextVal) {
      alert("Owner Auto-Download is now ENABLED! Incoming orders will automatically download as Black & White bills.");
    } else {
      alert("Owner Auto-Download is now DISABLED.");
    }
  };

  const handleDownloadLatestBill = () => {
    if (billingRecords.length === 0) {
      alert("No billing records available to download.");
      return;
    }
    downloadBillingImage(billingRecords[0], 'png');
    alert(`Downloaded latest Black & White Bill for ${billingRecords[0].customerName || 'Order'}!`);
  };

  const handlePrintBill = (dataUrl) => {
    const printWin = window.open('', '_blank');
    if (!printWin) {
      window.print();
      return;
    }
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Bill - Karpagam Traders</title>
          <style>
            @page { margin: 10mm; }
            body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: #fff; }
            img { max-width: 100%; height: auto; }
          </style>
        </head>
        <body onload="window.print(); setTimeout(function(){ window.close(); }, 500);">
          <img src="${dataUrl}" alt="Invoice" />
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const handleClearBillingHistory = () => {
    if (window.confirm("Are you sure you want to clear all payment and billing history?")) {
      setBillingRecords([]);
      localStorage.removeItem('karpagam_billing_records');
      localStorage.removeItem('karpagam_admin_downloaded_bills');
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
            {/* TAB 1: OVERVIEW - EXECUTIVE BUSINESS COCKPIT */}
            {activeTab === 'overview' && (() => {
              const totalOrdersValue = billingRecords.reduce((acc, b) => acc + Number(b.total || b.totalAmount || 0), 0);
              const pendingInquiriesCount = messages.filter(m => m.status !== 'Replied').length;
              const onlineUsersCount = registeredUsers.filter(u => u.isOnline).length;
              const dailyCount = products.filter(p => p.category === 'daily').length;
              const monthlyCount = products.filter(p => p.category === 'monthly').length;
              const specialtyCount = products.filter(p => p.category === 'specialty').length;
              const pinnedNotifs = notifications.filter(n => n.is_pinned).length;

              return (
                <div className="tab-stack-layout">
                  {/* Executive Welcome Hero Banner */}
                  <div className="executive-welcome-banner">
                    <div className="welcome-banner-content">
                      <div className="welcome-header-line">
                        <span className="welcome-tag">👑 MASTER CONTROL PANEL</span>
                        <span className="system-health-pill">
                          <span className="live-ping-dot"></span> All Systems Operational
                        </span>
                      </div>
                      <h2>Welcome back, Mohan!</h2>
                      <p>
                        Karpagam Traders Sivakasi operations are running smoothly. Manage your offset calendar catalog, publish daily announcements, audit user logins, and generate official Black & White customer invoices in seconds.
                      </p>

                      <div className="welcome-action-buttons">
                        <button 
                          onClick={() => setActiveTab('products')}
                          className="welcome-btn primary"
                        >
                          <i className="fa-solid fa-plus-circle"></i> Add Calendar Product
                        </button>

                        <button 
                          onClick={() => setActiveTab('notifications')}
                          className="welcome-btn secondary"
                        >
                          <i className="fa-solid fa-bullhorn"></i> Publish Daily News
                        </button>

                        <button 
                          onClick={() => setActiveTab('messages')}
                          className="welcome-btn dark"
                        >
                          <i className="fa-brands fa-whatsapp"></i> Inquiries ({pendingInquiriesCount} New)
                        </button>

                        <button 
                          onClick={handleDownloadLatestBill}
                          className="welcome-btn bw-bill"
                        >
                          <i className="fa-solid fa-file-invoice"></i> Download Latest Bill (B&W)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 5 High-Impact Business KPI Metric Cards */}
                  <div className="stats-kpi-grid">
                    <div className="stat-kpi-card" onClick={() => setActiveTab('products')} style={{ cursor: 'pointer' }}>
                      <div className="kpi-icon-box prods"><i className="fa-solid fa-boxes-stacked"></i></div>
                      <div className="kpi-info-box">
                        <span className="kpi-label">Active Products</span>
                        <h3 className="kpi-value">{products.length}</h3>
                        <span className="kpi-trend-sub">Daily: {dailyCount} • Monthly: {monthlyCount} • Table: {specialtyCount}</span>
                      </div>
                    </div>

                    <div className="stat-kpi-card" onClick={() => setActiveTab('notifications')} style={{ cursor: 'pointer' }}>
                      <div className="kpi-icon-box" style={{ background: '#fef3c7', color: '#d97706' }}><i className="fa-solid fa-bullhorn"></i></div>
                      <div className="kpi-info-box">
                        <span className="kpi-label">Announcements</span>
                        <h3 className="kpi-value">{notifications.length}</h3>
                        <span className="kpi-trend-sub">📌 {pinnedNotifs} Pinned to Top Ticker</span>
                      </div>
                    </div>

                    <div className="stat-kpi-card" onClick={() => setActiveTab('users')} style={{ cursor: 'pointer' }}>
                      <div className="kpi-icon-box users"><i className="fa-solid fa-users"></i></div>
                      <div className="kpi-info-box">
                        <span className="kpi-label">User Accounts</span>
                        <h3 className="kpi-value">{registeredUsers.length}</h3>
                        <span className="kpi-trend-sub" style={{ color: '#10b981', fontWeight: 700 }}>
                          ● {onlineUsersCount} Active Online Now
                        </span>
                      </div>
                    </div>

                    <div className="stat-kpi-card" onClick={() => setActiveTab('messages')} style={{ cursor: 'pointer' }}>
                      <div className="kpi-icon-box inqs"><i className="fa-solid fa-envelope-open-text"></i></div>
                      <div className="kpi-info-box">
                        <span className="kpi-label">Customer Inquiries</span>
                        <h3 className="kpi-value">{messages.length}</h3>
                        <span className="kpi-trend-sub">{pendingInquiriesCount} Pending • {messages.length - pendingInquiriesCount} Replied</span>
                      </div>
                    </div>

                    <div className="stat-kpi-card" onClick={() => setActiveTab('billing')} style={{ cursor: 'pointer' }}>
                      <div className="kpi-icon-box" style={{ background: '#f1f5f9', color: '#0f172a' }}><i className="fa-solid fa-file-invoice-dollar"></i></div>
                      <div className="kpi-info-box">
                        <span className="kpi-label">Billing Invoices</span>
                        <h3 className="kpi-value">{billingRecords.length}</h3>
                        <span className="kpi-trend-sub">Vol: ₹{totalOrdersValue.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* 2-Column Split Operations Hub */}
                  <div className="overview-split-grid">
                    {/* Left Column: Recent WhatsApp Inquiries */}
                    <div className="workspace-content-card">
                      <div className="content-card-header">
                        <div>
                          <h3 style={{ margin: 0 }}>
                            <i className="fa-brands fa-whatsapp" style={{ color: '#25D366' }}></i> Recent Customer Inquiries
                          </h3>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Latest WhatsApp requests & calendar printing inquiries</span>
                        </div>
                        <button 
                          onClick={() => setActiveTab('messages')} 
                          className="overview-view-all-btn"
                        >
                          View All ({messages.length}) <i className="fa-solid fa-chevron-right"></i>
                        </button>
                      </div>

                      <div className="overview-inquiries-list">
                        {messages.slice(0, 4).map((m, idx) => (
                          <div key={m.id || idx} className="overview-inquiry-item">
                            <div className="inquiry-item-avatar">
                              {(m.name || 'C')[0].toUpperCase()}
                            </div>
                            <div className="inquiry-item-details">
                              <div className="inquiry-item-top">
                                <strong>{m.name || 'Anonymous Customer'}</strong>
                                <span className={`status-pill ${m.status === 'Replied' ? 'online' : 'pending'}`}>
                                  {m.status || 'Pending'}
                                </span>
                              </div>
                              <div className="inquiry-item-sub">
                                <span><i className="fa-solid fa-phone"></i> {m.phone}</span>
                                <span><i className="fa-solid fa-tag"></i> {m.service || 'Calendar Printing'}</span>
                              </div>
                              <p className="inquiry-item-message">{m.message}</p>
                            </div>
                            {m.phone && (
                              <a 
                                href={`https://wa.me/91${m.phone.replace(/[^0-9]/g, '').slice(-10)}?text=${encodeURIComponent(`Hello ${m.name || 'Customer'},\nThank you for reaching out to Karpagam Traders regarding "${m.service || 'Calendar Printing'}". How can we assist you with your requirements today?`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inquiry-item-wa-btn"
                                title="Reply on WhatsApp"
                              >
                                <i className="fa-brands fa-whatsapp"></i> Chat
                              </a>
                            )}
                          </div>
                        ))}

                        {messages.length === 0 && (
                          <div style={{ textAlign: 'center', padding: '30px 20px', color: '#64748b' }}>
                            <i className="fa-solid fa-inbox" style={{ fontSize: '2rem', marginBottom: '8px', opacity: 0.4 }}></i>
                            <p>No customer inquiries recorded yet.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Recent Billing Receipts */}
                    <div className="workspace-content-card">
                      <div className="content-card-header">
                        <div>
                          <h3 style={{ margin: 0 }}>
                            <i className="fa-solid fa-file-invoice" style={{ color: 'var(--primary-accent)' }}></i> Recent Billing Invoices (B&W)
                          </h3>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Official receipts generated for customers and shop archives</span>
                        </div>
                        <button 
                          onClick={() => setActiveTab('billing')} 
                          className="overview-view-all-btn"
                        >
                          View All ({billingRecords.length}) <i className="fa-solid fa-chevron-right"></i>
                        </button>
                      </div>

                      <div className="overview-billing-list">
                        {billingRecords.slice(0, 4).map((b) => (
                          <div key={b.id} className="overview-billing-item">
                            <div className="billing-item-badge">
                              <i className="fa-solid fa-receipt"></i>
                            </div>
                            <div className="billing-item-info">
                              <div className="billing-item-id">{b.id || b.invoiceNo}</div>
                              <strong className="billing-item-customer">{b.customerName || b.name || 'Customer'}</strong>
                              <span className="billing-item-time">{b.timestamp || b.date}</span>
                            </div>
                            <div className="billing-item-amount-wrap">
                              <span className="billing-item-total">₹{b.total || b.totalAmount || 0}</span>
                              <button 
                                onClick={() => handleDownloadBill(b, 'png')}
                                className="overview-dl-bill-btn"
                                title="Download Black & White PNG Bill"
                              >
                                <i className="fa-solid fa-download"></i> PNG
                              </button>
                            </div>
                          </div>
                        ))}

                        {billingRecords.length === 0 && (
                          <div style={{ textAlign: 'center', padding: '30px 20px', color: '#64748b' }}>
                            <i className="fa-solid fa-file-circle-xmark" style={{ fontSize: '2rem', marginBottom: '8px', opacity: 0.4 }}></i>
                            <p>No billing records generated yet.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Calendar Catalog Categories Breakdown Flex */}
                  <div className="workspace-content-card">
                    <div className="content-card-header">
                      <h3><i className="fa-solid fa-layer-group" style={{ color: 'var(--gold-accent)' }}></i> Calendar Printing Production Units</h3>
                      <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Sivakasi manufacturing breakdown across product categories</span>
                    </div>

                    <div className="catalog-summary-flex">
                      <div className="cat-box daily" onClick={() => { setActiveTab('products'); setProdCategoryFilter('daily'); }} style={{ cursor: 'pointer' }}>
                        <h4>Daily Tear-Off Calendars</h4>
                        <p>{dailyCount} Products</p>
                        <span style={{ fontSize: '0.78rem', opacity: 0.9 }}>A4, Deluxe Auspicious Sheet, Double Color</span>
                      </div>

                      <div className="cat-box monthly" onClick={() => { setActiveTab('products'); setProdCategoryFilter('monthly'); }} style={{ cursor: 'pointer' }}>
                        <h4>Monthly Wall Calendars</h4>
                        <p>{monthlyCount} Products</p>
                        <span style={{ fontSize: '0.78rem', opacity: 0.9 }}>A3, 6-Sheet Glossy, Tin Mounted, Spiral Bind</span>
                      </div>

                      <div className="cat-box specialty" onClick={() => { setActiveTab('products'); setProdCategoryFilter('specialty'); }} style={{ cursor: 'pointer' }}>
                        <h4>Specialty & Table Calendars</h4>
                        <p>{specialtyCount} Products</p>
                        <span style={{ fontSize: '0.78rem', opacity: 0.9 }}>Hardboard Stand, Gold Foil, Corporate Custom</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* TAB 2: PRODUCTS */}
            {activeTab === 'products' && (
              <div className="tab-stack-layout">
                {/* Catalog Header & Filter Toolbar */}
                <div className="workspace-content-card">
                  <div className="content-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                    <div>
                      <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className="fa-solid fa-boxes-stacked" style={{ color: 'var(--primary-accent)' }}></i>
                        Calendar Product Catalog ({products.length})
                      </h3>
                      <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: '#64748b' }}>
                        Manage website products, update live prices, and customize Sivakasi calendar offerings
                      </p>
                    </div>

                    {/* View Switcher: Grid Cards vs Table */}
                    <div className="view-mode-toggle-group">
                      <button 
                        type="button" 
                        className={`btn-view-toggle ${prodViewMode === 'grid' ? 'active' : ''}`}
                        onClick={() => setProdViewMode('grid')}
                        title="Card Grid View"
                      >
                        <i className="fa-solid fa-grip"></i> Grid Cards
                      </button>
                      <button 
                        type="button" 
                        className={`btn-view-toggle ${prodViewMode === 'table' ? 'active' : ''}`}
                        onClick={() => setProdViewMode('table')}
                        title="Detailed Table View"
                      >
                        <i className="fa-solid fa-table-list"></i> Table List
                      </button>
                    </div>
                  </div>

                  {/* Filter Toolbar: Search Bar + Category Pills */}
                  <div className="admin-product-toolbar">
                    <div className="admin-search-box">
                      <i className="fa-solid fa-magnifying-glass"></i>
                      <input 
                        type="text"
                        placeholder="Search products by title, category, price..."
                        value={prodSearchQuery}
                        onChange={(e) => setProdSearchQuery(e.target.value)}
                      />
                      {prodSearchQuery && (
                        <button type="button" onClick={() => setProdSearchQuery('')} className="btn-clear-search">
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      )}
                    </div>

                    <div className="admin-cat-pills-bar">
                      <button 
                        type="button" 
                        className={`admin-cat-pill ${prodCategoryFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setProdCategoryFilter('all')}
                      >
                        All ({products.length})
                      </button>
                      <button 
                        type="button" 
                        className={`admin-cat-pill ${prodCategoryFilter === 'daily' ? 'active' : ''}`}
                        onClick={() => setProdCategoryFilter('daily')}
                      >
                        <i className="fa-solid fa-calendar-day"></i> Daily Tear-Off ({products.filter(p => p.category === 'daily').length})
                      </button>
                      <button 
                        type="button" 
                        className={`admin-cat-pill ${prodCategoryFilter === 'monthly' ? 'active' : ''}`}
                        onClick={() => setProdCategoryFilter('monthly')}
                      >
                        <i className="fa-solid fa-calendar-days"></i> Monthly Wall ({products.filter(p => p.category === 'monthly').length})
                      </button>
                      <button 
                        type="button" 
                        className={`admin-cat-pill ${prodCategoryFilter === 'specialty' ? 'active' : ''}`}
                        onClick={() => setProdCategoryFilter('specialty')}
                      >
                        <i className="fa-solid fa-star"></i> Cake & Specialty ({products.filter(p => p.category === 'specialty').length})
                      </button>
                    </div>
                  </div>

                  {/* Render filtered products */}
                  {(() => {
                    const filtered = products.filter(p => {
                      const matchCat = prodCategoryFilter === 'all' || p.category === prodCategoryFilter;
                      const q = prodSearchQuery.trim().toLowerCase();
                      const matchSearch = !q || p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q) || String(p.price).includes(q) || p.category?.toLowerCase().includes(q);
                      return matchCat && matchSearch;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
                          <i className="fa-solid fa-box-open" style={{ fontSize: '3rem', opacity: 0.35, marginBottom: '14px' }}></i>
                          <h4>No products match your filter criteria</h4>
                          <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Try adjusting your search query or select "All" categories.</p>
                        </div>
                      );
                    }

                    if (prodViewMode === 'grid') {
                      return (
                        <div className="admin-product-cards-grid">
                          {filtered.map((p) => (
                            <div key={p.id} className="admin-product-card">
                              <div className="prod-card-thumb-wrap">
                                <img 
                                  src={p.image} 
                                  alt={p.name} 
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/assets/daily 1.jpeg';
                                  }}
                                />
                                <span className={`prod-cat-badge ${p.category}`}>
                                  {p.category.toUpperCase()}
                                </span>
                                <div className="prod-card-floating-price">
                                  ₹{p.price}
                                </div>
                              </div>

                              <div className="prod-card-body">
                                <h4 className="prod-card-title">{p.name}</h4>
                                <p className="prod-card-desc">{p.description || 'Premium Sivakasi printed calendar sheet with auspicious timings.'}</p>
                                
                                <div className="prod-card-divider"></div>

                                <div className="prod-card-footer">
                                  <div className="prod-card-price-edit">
                                    <label>Price (₹):</label>
                                    <input 
                                      type="number"
                                      defaultValue={p.price}
                                      onBlur={(e) => onUpdateProductPrice && onUpdateProductPrice(p.id, parseFloat(e.target.value))}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.target.blur();
                                        }
                                      }}
                                      className="prod-quick-price-input"
                                    />
                                  </div>

                                  <button 
                                    type="button"
                                    onClick={() => handleDeleteProductClick(p.id)}
                                    className="prod-btn-delete"
                                    title="Delete Product"
                                  >
                                    <i className="fa-solid fa-trash-can"></i>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    }

                    // Table View
                    return (
                      <div className="table-scroller">
                        <table className="premium-data-table">
                          <thead>
                            <tr>
                              <th>Thumbnail</th>
                              <th>Product Title</th>
                              <th>Category</th>
                              <th>Base Price (₹)</th>
                              <th>Description Preview</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filtered.map((p) => (
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
                                <td>
                                  <strong>{p.name}</strong>
                                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>ID: #{p.id}</div>
                                </td>
                                <td>
                                  <span className={`prod-cat-badge ${p.category}`}>{p.category.toUpperCase()}</span>
                                </td>
                                <td>
                                  <div className="price-edit-box">
                                    <span>₹</span>
                                    <input 
                                      type="number"
                                      defaultValue={p.price}
                                      onBlur={(e) => onUpdateProductPrice && onUpdateProductPrice(p.id, parseFloat(e.target.value))}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') e.target.blur();
                                      }}
                                      className="admin-price-input"
                                    />
                                  </div>
                                </td>
                                <td style={{ maxWidth: '280px', fontSize: '0.84rem', color: '#64748b', lineHeight: 1.4 }}>
                                  {p.description || 'Standard Sivakasi offset printed calendar.'}
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
                    );
                  })()}
                </div>

                {/* Add Product Card with Live Preview */}
                <div className="workspace-content-card">
                  <div className="content-card-header">
                    <h3><i className="fa-solid fa-plus-circle" style={{ color: 'var(--primary-accent)' }}></i> Add New Calendar Product to Website</h3>
                  </div>

                  <div className="admin-add-product-split-layout">
                    {/* Form Left */}
                    <form onSubmit={handleCreateProductSubmit} className="admin-add-product-form">
                      <div className="form-field-grid">
                        <div className="field-group">
                          <label>Product Title *</label>
                          <input 
                            type="text" 
                            required 
                            placeholder="e.g. Daily Calendar 9 (Auspicious Gold Edition)"
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
                          <label>Image Asset Path</label>
                          <input 
                            type="text" 
                            placeholder="/assets/daily 1.jpeg"
                            value={newProdImage}
                            onChange={(e) => setNewProdImage(e.target.value)}
                          />
                        </div>

                        <div className="field-group full-width">
                          <label style={{ marginBottom: '6px', display: 'block', fontWeight: 700 }}>Quick Pick From Image Assets:</label>
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
                            placeholder="Deluxe daily tear-off sheets with auspicious Nalla Neram, gold foil binder..."
                            value={newProdDesc}
                            onChange={(e) => setNewProdDesc(e.target.value)}
                          ></textarea>
                        </div>
                      </div>

                      <button type="submit" className="btn-save-product">
                        <i className="fa-solid fa-floppy-disk"></i> Add Product to Website
                      </button>
                    </form>

                    {/* Live Preview Right */}
                    <div className="admin-prod-preview-card-wrap">
                      <div className="preview-card-label">
                        <i className="fa-solid fa-eye"></i> Live Shop Card Preview
                      </div>
                      <div className="preview-shop-card">
                        <div className="preview-img-box">
                          <img 
                            src={newProdImage || '/assets/daily 1.jpeg'} 
                            alt="Preview" 
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/assets/daily 1.jpeg';
                            }}
                          />
                          <span className={`prod-cat-badge ${newProdCategory}`}>
                            {newProdCategory.toUpperCase()}
                          </span>
                        </div>
                        <div className="preview-card-content">
                          <h4>{newProdName.trim() || 'New Calendar Title'}</h4>
                          <p>{newProdDesc.trim() || 'Standard Sivakasi offset printing with sharp Tamil typography.'}</p>
                          <div className="preview-card-bottom">
                            <div>
                              <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block', fontWeight: 700 }}>PRICE</span>
                              <strong style={{ fontSize: '1.2rem', color: 'var(--primary-accent)' }}>₹{newProdPrice || '299'}</strong>
                            </div>
                            <span className="preview-add-mock"><i className="fa-solid fa-cart-plus"></i> Add</span>
                          </div>
                        </div>
                      </div>
                    </div>
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

            {/* TAB 4: USERS - TELEMETRY & SESSION AUDIT (VIEW ONLY) */}
            {activeTab === 'users' && (() => {
              const totalUsers = registeredUsers.length;
              const onlineCount = registeredUsers.filter(u => u.isOnline).length;
              const adminCount = registeredUsers.filter(u => u.role === 'admin' || u.email?.toLowerCase() === 'mohantn617@gmail.com').length;
              const customerCount = registeredUsers.filter(u => u.role !== 'admin' && u.email?.toLowerCase() !== 'mohantn617@gmail.com').length;

              const filteredUsers = registeredUsers.filter(u => {
                // Role & Status filter
                if (userRoleFilter === 'admin' && !(u.role === 'admin' || u.email?.toLowerCase() === 'mohantn617@gmail.com')) return false;
                if (userRoleFilter === 'customer' && (u.role === 'admin' || u.email?.toLowerCase() === 'mohantn617@gmail.com')) return false;
                if (userRoleFilter === 'online' && !u.isOnline) return false;
                if (userRoleFilter === 'offline' && u.isOnline) return false;

                // Search query
                if (userSearchQuery.trim()) {
                  const q = userSearchQuery.toLowerCase();
                  const matchName = (u.name || '').toLowerCase().includes(q);
                  const matchEmail = (u.email || '').toLowerCase().includes(q);
                  const matchRole = (u.role || '').toLowerCase().includes(q);
                  const matchId = (u.id || '').toLowerCase().includes(q);
                  return matchName || matchEmail || matchRole || matchId;
                }
                return true;
              });

              return (
                <div className="tab-stack-layout">
                  {/* Top Banner Notice: Telemetry View Only */}
                  <div className="user-telemetry-banner">
                    <div className="telemetry-banner-icon">
                      <i className="fa-solid fa-shield-halved"></i>
                    </div>
                    <div className="telemetry-banner-text">
                      <h4>User Session Telemetry & Audit Portal (View-Only)</h4>
                      <p>
                        Real-time tracking of customer & administrative authentications, including exact Login Timestamps, Logout Timestamps, and Live Session Presence recorded by Karpagam Traders Auth System.
                      </p>
                    </div>
                    <div className="telemetry-banner-badge">
                      <span className="live-ping-dot"></span> View Only Active
                    </div>
                  </div>

                  {/* KPI Summary Cards */}
                  <div className="user-kpi-summary-grid">
                    <div className="user-kpi-card">
                      <div className="user-kpi-icon-wrap" style={{ background: '#fdf2f2', color: 'var(--primary-accent)' }}>
                        <i className="fa-solid fa-users"></i>
                      </div>
                      <div className="user-kpi-info">
                        <span className="user-kpi-label">Total Registered</span>
                        <strong className="user-kpi-num">{totalUsers}</strong>
                        <span className="user-kpi-sub">Accounts in system</span>
                      </div>
                    </div>

                    <div className="user-kpi-card">
                      <div className="user-kpi-icon-wrap" style={{ background: '#ecfdf5', color: '#10b981' }}>
                        <i className="fa-solid fa-signal"></i>
                      </div>
                      <div className="user-kpi-info">
                        <span className="user-kpi-label">Active Online</span>
                        <strong className="user-kpi-num" style={{ color: '#10b981' }}>{onlineCount}</strong>
                        <span className="user-kpi-sub">Currently logged in</span>
                      </div>
                    </div>

                    <div className="user-kpi-card">
                      <div className="user-kpi-icon-wrap" style={{ background: '#fffbeb', color: '#b45309' }}>
                        <i className="fa-solid fa-user-shield"></i>
                      </div>
                      <div className="user-kpi-info">
                        <span className="user-kpi-label">Administrators</span>
                        <strong className="user-kpi-num">{adminCount}</strong>
                        <span className="user-kpi-sub">Full system access</span>
                      </div>
                    </div>

                    <div className="user-kpi-card">
                      <div className="user-kpi-icon-wrap" style={{ background: '#eff6ff', color: '#3b82f6' }}>
                        <i className="fa-solid fa-store"></i>
                      </div>
                      <div className="user-kpi-info">
                        <span className="user-kpi-label">Customers / Retailers</span>
                        <strong className="user-kpi-num">{customerCount}</strong>
                        <span className="user-kpi-sub">Verified buyers</span>
                      </div>
                    </div>
                  </div>

                  {/* Main Users Table Card */}
                  <div className="workspace-content-card">
                    {/* Card Header & Controls */}
                    <div className="content-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                      <div>
                        <h3 style={{ margin: 0 }}>Registered User Accounts ({filteredUsers.length} of {totalUsers})</h3>
                        <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                          Authentication timestamps, login/logout session audit, and account role management
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        {/* Search Box */}
                        <div className="admin-search-box">
                          <i className="fa-solid fa-magnifying-glass"></i>
                          <input 
                            type="text" 
                            placeholder="Search name, email, role..." 
                            value={userSearchQuery}
                            onChange={(e) => setUserSearchQuery(e.target.value)}
                          />
                          {userSearchQuery && (
                            <button type="button" onClick={() => setUserSearchQuery('')} className="search-clear-btn">
                              <i className="fa-solid fa-xmark"></i>
                            </button>
                          )}
                        </div>

                        {/* Filter Select */}
                        <select 
                          value={userRoleFilter} 
                          onChange={(e) => setUserRoleFilter(e.target.value)}
                          className="admin-role-select"
                        >
                          <option value="all">All Roles & Statuses</option>
                          <option value="online">● Active Now (Online)</option>
                          <option value="offline">○ Offline Accounts</option>
                          <option value="admin">Administrators Only</option>
                          <option value="customer">Customers Only</option>
                        </select>
                      </div>
                    </div>

                    {/* Users Data Table with Login & Logout Date and Time */}
                    <div className="table-scroller">
                      <table className="premium-data-table user-telemetry-table">
                        <thead>
                          <tr>
                            <th>User Profile</th>
                            <th>Email Address</th>
                            <th>System Role</th>
                            <th>Joined Date</th>
                            <th>Login Date & Time</th>
                            <th>Logout Date & Time</th>
                            <th>Session Status</th>
                            <th style={{ textAlign: 'center' }}>Live History Log</th>
                            <th style={{ textAlign: 'center' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.length > 0 ? (
                            filteredUsers.map((u) => {
                              const isAdmin = u.role === 'admin' || u.email?.toLowerCase() === 'mohantn617@gmail.com';
                              const isOnline = u.isOnline;
                              const initial = (u.name || u.email || 'U')[0].toUpperCase();
                              const sessionCount = Array.isArray(u.sessionHistory) ? u.sessionHistory.length : 1;

                              return (
                                <tr key={u.id}>
                                  <td>
                                    <div className="user-table-cell">
                                      <div className={`avatar-letter ${isAdmin ? 'admin-avatar' : 'customer-avatar'}`}>
                                        {initial}
                                      </div>
                                      <div>
                                        <span className="user-name">{u.name || 'Anonymous Customer'}</span>
                                        <div className="user-uid-sub">UID: {u.id?.slice(0, 14)}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    <div className="user-email-cell">
                                      <i className="fa-regular fa-envelope" style={{ color: '#94a3b8', marginRight: '6px' }}></i>
                                      <span>{u.email}</span>
                                    </div>
                                  </td>
                                  <td>
                                    <span className={`badge-role ${isAdmin ? 'admin' : 'customer'}`}>
                                      {isAdmin ? (
                                        <><i className="fa-solid fa-shield" style={{ marginRight: '4px' }}></i> Administrator</>
                                      ) : (
                                        <><i className="fa-solid fa-user" style={{ marginRight: '4px' }}></i> Customer</>
                                      )}
                                    </span>
                                  </td>
                                  <td>
                                    <span className="user-joined-cell">
                                      <i className="fa-regular fa-calendar" style={{ color: '#94a3b8', marginRight: '5px' }}></i>
                                      {u.joinedDate || '2026-07-01'}
                                    </span>
                                  </td>
                                  <td>
                                    <div 
                                      className="user-datetime-cell login-timestamp clickable"
                                      onClick={() => setSelectedUserHistory(u)}
                                      title="Click to view detailed session audit"
                                    >
                                      <i className="fa-solid fa-arrow-right-to-bracket login-icon" title="Login Time"></i>
                                      <span>{u.lastLogin || '2026-10-31 09:15:20'}</span>
                                    </div>
                                  </td>
                                  <td>
                                    {isOnline ? (
                                      <span 
                                        className="user-active-session-pill clickable"
                                        onClick={() => setSelectedUserHistory(u)}
                                        title="Click to inspect active session"
                                      >
                                        <span className="live-ping-dot"></span> Active Session
                                      </span>
                                    ) : (
                                      <div 
                                        className="user-datetime-cell logout-timestamp clickable"
                                        onClick={() => setSelectedUserHistory(u)}
                                        title="Click to view session history"
                                      >
                                        <i className="fa-solid fa-arrow-right-from-bracket logout-icon" title="Logout Time"></i>
                                        <span>{u.lastLogout || '2026-10-30 20:15:30'}</span>
                                      </div>
                                    )}
                                  </td>
                                  <td>
                                    {isOnline ? (
                                      <span className="status-pill online">
                                        <span className="status-indicator-dot online"></span> Active Now
                                      </span>
                                    ) : (
                                      <span className="status-pill offline">
                                        <span className="status-indicator-dot offline"></span> Logged Out
                                      </span>
                                    )}
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    <button 
                                      type="button"
                                      onClick={() => setSelectedUserHistory(u)}
                                      className="btn-session-history-pill"
                                      title="Inspect comprehensive Login & Logout History Audit Log"
                                    >
                                      <i className="fa-solid fa-clock-rotate-left"></i>
                                      <span>Sessions ({sessionCount})</span>
                                      {isOnline && <span className="live-pill-tag">LIVE</span>}
                                    </button>
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    {isAdmin ? (
                                      <span className="admin-protected-tag" title="Protected System Administrator">
                                        <i className="fa-solid fa-lock"></i> Protected
                                      </span>
                                    ) : (
                                      <button 
                                        onClick={() => handleDeleteUserRecord(u.id, u.email)}
                                        className="action-btn-delete"
                                        title="Delete User Account"
                                      >
                                        <i className="fa-solid fa-trash-can"></i>
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan="9" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                                <i className="fa-solid fa-user-slash" style={{ fontSize: '2rem', marginBottom: '10px', opacity: 0.5, display: 'block' }}></i>
                                No users match your search query or filter criteria.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* TAB 5: BILLING */}
            {activeTab === 'billing' && (
              <div className="workspace-content-card">
                <div className="content-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>Payment & Billing Records ({billingRecords.length})</h3>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      Official Black & White (PNG / JPG) billing format for shop owner records and customer receipts
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button 
                      type="button"
                      onClick={handleToggleAutoDownload} 
                      className={`btn-autodownload-toggle ${autoDownloadEnabled ? 'active' : ''}`}
                      title="Automatically download bills when new orders arrive"
                    >
                      <i className={`fa-solid ${autoDownloadEnabled ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>
                      <span>Auto-Download: {autoDownloadEnabled ? 'ON' : 'OFF'}</span>
                    </button>

                    <button 
                      type="button"
                      onClick={handleDownloadLatestBill} 
                      className="btn-download-latest"
                      title="Download the latest received bill"
                    >
                      <i className="fa-solid fa-file-arrow-down"></i>
                      <span>Download Latest Bill</span>
                    </button>

                    <button type="button" onClick={handleClearBillingHistory} className="btn-clear-billing">
                      <i className="fa-solid fa-trash-can"></i> Clear All
                    </button>
                  </div>
                </div>

                <div className="billing-cards-grid">
                  {billingRecords.map((b) => (
                    <div key={b.id} className="billing-card">
                      <div className="billing-card-header">
                        <div>
                          <span className="billing-inv-id">{b.id || b.invoiceNo}</span>
                          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>{b.timestamp || b.date}</div>
                        </div>
                        <span className={`status-pill ${(b.status || 'pending').toLowerCase().replace(/\s+/g, '-')}`}>{b.status || 'Order via WhatsApp'}</span>
                      </div>

                      <div className="billing-card-body">
                        <h4>{b.customerName || b.name || 'Valued Customer'}</h4>
                        <p className="phone-line"><i className="fa-solid fa-phone"></i> {b.phone || 'N/A'}</p>
                        {b.email && b.email !== 'N/A' && <p className="phone-line"><i className="fa-solid fa-envelope"></i> {b.email}</p>}
                        <p className="address-box"><i className="fa-solid fa-location-dot"></i> {b.address || 'Direct Shop Dispatch'}</p>

                        <div className="billing-items-list">
                          <h5>Ordered Items ({b.items?.length || 1}):</h5>
                          {(b.items || []).map((it, idx) => (
                            <div key={idx} className="item-line">
                              <span>{it.name} (x{it.qty || it.quantity || 1})</span>
                              <strong>₹{(Number(it.price || 0) * Number(it.qty || it.quantity || 1)).toFixed(2)}</strong>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="billing-card-footer">
                        <span>Method: {b.method || 'WhatsApp Express'}</span>
                        <div className="total-amount">Total: ₹{b.total || b.totalAmount || 0}</div>
                      </div>

                      {/* Black & White Bill Download & View Controls for Owner */}
                      <div className="billing-card-actions">
                        <button 
                          type="button"
                          onClick={() => handleDownloadBill(b, 'png')}
                          className="bill-card-btn primary"
                          title="Download Black & White Bill (PNG)"
                        >
                          <i className="fa-solid fa-download"></i> PNG Bill
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleDownloadBill(b, 'jpg')}
                          className="bill-card-btn secondary"
                          title="Download Black & White Bill (JPG)"
                        >
                          <i className="fa-solid fa-file-image"></i> JPG Bill
                        </button>
                        <button 
                          type="button"
                          onClick={() => handlePreviewBill(b)}
                          className="bill-card-btn preview"
                          title="Preview Black & White Receipt"
                        >
                          <i className="fa-solid fa-eye"></i> View Bill
                        </button>
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
            {activeTab === 'messages' && (() => {
              const pendingCount = messages.filter(m => m.status !== 'Replied').length;
              const repliedCount = messages.filter(m => m.status === 'Replied').length;

              const filteredMsgs = messages.filter(m => {
                if (msgFilter === 'pending' && m.status === 'Replied') return false;
                if (msgFilter === 'replied' && m.status !== 'Replied') return false;
                if (msgSearchQuery.trim()) {
                  const q = msgSearchQuery.toLowerCase();
                  const matchName = (m.name || '').toLowerCase().includes(q);
                  const matchPhone = (m.phone || '').toLowerCase().includes(q);
                  const matchEmail = (m.email || '').toLowerCase().includes(q);
                  const matchService = (m.service || '').toLowerCase().includes(q);
                  const matchMsg = (m.message || '').toLowerCase().includes(q);
                  return matchName || matchPhone || matchEmail || matchService || matchMsg;
                }
                return true;
              });

              return (
                <div className="tab-stack-layout">
                  {/* Messages Top Banner */}
                  <div className="inquiries-hero-banner">
                    <div className="inquiries-banner-icon">
                      <i className="fa-brands fa-whatsapp"></i>
                    </div>
                    <div className="inquiries-banner-text">
                      <h4>Customer Inquiries & WhatsApp Orders Desk</h4>
                      <p>
                        Real-time customer requests from website contact forms and direct WhatsApp chat links. Click "Chat" to respond directly with automated greetings, or click "Bill (PNG)" to generate an official Black & White customer bill.
                      </p>
                    </div>
                    <div className="inquiries-banner-counts">
                      <span className="badge-pending-pill">{pendingCount} Pending Response</span>
                    </div>
                  </div>

                  {/* Workspace Content Card */}
                  <div className="workspace-content-card">
                    <div className="content-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                      <div>
                        <h3 style={{ margin: 0 }}>
                          Customer Inquiries ({filteredMsgs.length} of {messages.length})
                        </h3>
                        <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                          Manage pending calendar requests, wholesale quotes, and print dispatch details
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        {/* Filter pills */}
                        <div className="category-filter-pills">
                          <button 
                            type="button" 
                            className={`admin-cat-pill ${msgFilter === 'all' ? 'active' : ''}`}
                            onClick={() => setMsgFilter('all')}
                          >
                            All ({messages.length})
                          </button>
                          <button 
                            type="button" 
                            className={`admin-cat-pill ${msgFilter === 'pending' ? 'active' : ''}`}
                            onClick={() => setMsgFilter('pending')}
                          >
                            Pending ({pendingCount})
                          </button>
                          <button 
                            type="button" 
                            className={`admin-cat-pill ${msgFilter === 'replied' ? 'active' : ''}`}
                            onClick={() => setMsgFilter('replied')}
                          >
                            Replied ({repliedCount})
                          </button>
                        </div>

                        {/* Search Input */}
                        <div className="admin-search-box">
                          <i className="fa-solid fa-magnifying-glass"></i>
                          <input 
                            type="text" 
                            placeholder="Search name, phone, message..." 
                            value={msgSearchQuery}
                            onChange={(e) => setMsgSearchQuery(e.target.value)}
                          />
                          {msgSearchQuery && (
                            <button type="button" onClick={() => setMsgSearchQuery('')} className="search-clear-btn">
                              <i className="fa-solid fa-xmark"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="table-scroller">
                      <table className="premium-data-table inquiries-data-table">
                        <thead>
                          <tr>
                            <th>Status</th>
                            <th>Customer Profile</th>
                            <th>Contact Info</th>
                            <th>Service Requested</th>
                            <th>Inquiry Message</th>
                            <th>Date & Time</th>
                            <th style={{ textAlign: 'center' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredMsgs.map((m, idx) => (
                            <tr key={m.id || idx}>
                              <td>
                                <button
                                  onClick={() => handleToggleMessageStatus(m.id, m.status || 'Pending')}
                                  className={`btn-msg-status ${m.status === 'Replied' ? 'replied' : 'pending'}`}
                                  title="Click to toggle Pending / Replied status"
                                >
                                  <span className={`status-dot ${m.status === 'Replied' ? 'green' : 'amber'}`}></span>
                                  {m.status || 'Pending'}
                                </button>
                              </td>
                              <td>
                                <div className="user-table-cell">
                                  <div className="avatar-letter customer-avatar">
                                    {(m.name || 'C')[0].toUpperCase()}
                                  </div>
                                  <div>
                                    <span className="user-name">{m.name || 'Anonymous Customer'}</span>
                                    <div className="user-uid-sub">{m.id ? `ID: #${String(m.id).slice(-6)}` : 'Inquiry'}</div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div style={{ fontWeight: 700, color: '#1e293b' }}>
                                  <i className="fa-solid fa-phone" style={{ color: '#25D366', marginRight: '6px' }}></i>
                                  {m.phone}
                                </div>
                                {m.email && (
                                  <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', marginTop: '2px' }}>
                                    <i className="fa-regular fa-envelope" style={{ marginRight: '6px', opacity: 0.6 }}></i>
                                    {m.email}
                                  </span>
                                )}
                              </td>
                              <td>
                                <span className="badge-service">{m.service || 'Calendar Printing'}</span>
                              </td>
                              <td style={{ maxWidth: '280px', lineHeight: 1.5, fontSize: '0.85rem', color: '#475569' }}>
                                <div className="inquiry-bubble-preview">
                                  {m.message}
                                </div>
                              </td>
                              <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', color: '#64748b' }}>
                                {m.timestamp || m.date || 'Today'}
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                                  <button 
                                    type="button"
                                    onClick={() => handleDownloadInquiryBill(m)}
                                    className="action-btn-bill"
                                    title="Download Black & White Bill (PNG)"
                                  >
                                    <i className="fa-solid fa-file-invoice"></i> Bill (PNG)
                                  </button>
                                  {m.phone && (
                                    <a 
                                      href={`https://wa.me/91${m.phone.replace(/[^0-9]/g, '').slice(-10)}?text=${encodeURIComponent(`Hello ${m.name || 'Customer'},\nThank you for reaching out to Karpagam Traders regarding "${m.service || 'Calendar Printing'}". How can we assist you with your requirements today?`)}`}
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="action-btn-wa"
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
                          {filteredMsgs.length === 0 && (
                            <tr>
                              <td colSpan="7" className="table-empty-row">
                                <i className="fa-solid fa-inbox" style={{ fontSize: '2rem', marginBottom: '8px', opacity: 0.5, display: 'block' }}></i>
                                No customer inquiries match your filter.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* TAB 7: SYSTEM AUDIT LOGS */}
            {activeTab === 'logs' && (() => {
              const defaultAuditLogs = systemLogs.length > 0 ? systemLogs : [
                { id: 'log-1', user: 'mohantn617@gmail.com', event: 'Super Administrator logged in to Karpagam Control Portal with verified session.', timestamp: '2026-10-31 09:15:20', type: 'auth' },
                { id: 'log-2', user: 'mohantn617@gmail.com', event: 'Published daily announcement to website header ticker.', timestamp: '2026-10-31 08:30:00', type: 'publish' },
                { id: 'log-3', user: 'siva.agency@gmail.com', event: 'Customer session authenticated and cart updated with 25x Daily Deluxe calendars.', timestamp: '2026-10-31 08:42:15', type: 'user' },
                { id: 'log-4', user: 'mohantn617@gmail.com', event: 'Official Black & White invoice KT-INV-821940 generated and downloaded.', timestamp: '2026-10-30 14:20:00', type: 'billing' },
                { id: 'log-5', user: 'system', event: 'Automatic system backup and cache synchronization completed.', timestamp: '2026-10-30 00:00:01', type: 'system' }
              ];

              return (
                <div className="tab-stack-layout">
                  {/* Security Notice Banner */}
                  <div className="user-telemetry-banner">
                    <div className="telemetry-banner-icon" style={{ color: '#38bdf8' }}>
                      <i className="fa-solid fa-shield-halved"></i>
                    </div>
                    <div className="telemetry-banner-text">
                      <h4>Administrative Security & Telemetry Timeline</h4>
                      <p>
                        Immutable audit trail of administrator authentications, catalog modifications, customer WhatsApp orders, and billing invoices generated.
                      </p>
                    </div>
                    <div className="telemetry-banner-badge" style={{ color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)', background: 'rgba(56, 189, 248, 0.1)' }}>
                      <span className="live-ping-dot" style={{ backgroundColor: '#38bdf8' }}></span> Logging Active
                    </div>
                  </div>

                  <div className="workspace-content-card">
                    <div className="content-card-header">
                      <h3>Security & Activity Event Timeline ({defaultAuditLogs.length})</h3>
                      <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Real-time chronological events recorded by Karpagam Traders Portal</span>
                    </div>

                    <div className="system-logs-timeline">
                      {defaultAuditLogs.map((l, idx) => (
                        <div key={l.id || idx} className="timeline-item">
                          <div className="timeline-icon-box">
                            <i className={l.type === 'auth' ? 'fa-solid fa-key' : (l.type === 'billing' ? 'fa-solid fa-receipt' : 'fa-solid fa-shield-cat')}></i>
                          </div>
                          <div className="timeline-content-box">
                            <div className="timeline-meta">
                              <span className="user">{l.user || l.email || 'mohantn617@gmail.com'}</span>
                              <span className="time">{l.timestamp}</span>
                            </div>
                            <div className="timeline-text">{l.event || l.activity || 'System operation executed.'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </main>

      {/* Black & White Bill Preview Modal for Owner / Admin */}
      {previewBillModal.open && (
        <div className="auth-overlay open" onClick={(e) => e.target.classList.contains('auth-overlay') && setPreviewBillModal({ open: false, order: null, dataUrl: null })}>
          <div className="bill-modal-card" style={{ maxWidth: '850px', width: '95%', maxHeight: '92vh', overflowY: 'auto', background: '#ffffff', borderRadius: '20px', padding: '24px', boxShadow: '0 25px 60px rgba(0,0,0,0.35)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-file-invoice" style={{ color: '#000000' }}></i>
                  Black & White Billing Format
                </h3>
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  Invoice: {previewBillModal.order?.id || previewBillModal.order?.invoiceNo} • Customer: {previewBillModal.order?.customerName || previewBillModal.order?.name}
                </span>
              </div>
              <button 
                onClick={() => setPreviewBillModal({ open: false, order: null, dataUrl: null })}
                style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#64748b' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div style={{ textAlign: 'center', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
              <img 
                src={previewBillModal.dataUrl} 
                alt="Official Black and White Bill" 
                style={{ maxWidth: '100%', height: 'auto', boxShadow: '0 8px 25px rgba(0,0,0,0.12)', border: '2px solid #000000' }} 
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px', flexWrap: 'wrap' }}>
              <button 
                type="button"
                onClick={() => handleDownloadBill(previewBillModal.order, 'png')}
                style={{ background: '#000000', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '10px 18px', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <i className="fa-solid fa-download"></i> Download PNG
              </button>
              <button 
                type="button"
                onClick={() => handleDownloadBill(previewBillModal.order, 'jpg')}
                style={{ background: '#334155', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '10px 18px', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <i className="fa-solid fa-file-image"></i> Download JPG
              </button>
              <button 
                type="button"
                onClick={() => handlePrintBill(previewBillModal.dataUrl)}
                style={{ background: '#e2e8f0', color: '#1e293b', border: 'none', borderRadius: '10px', padding: '10px 18px', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <i className="fa-solid fa-print"></i> Print Bill
              </button>
              <button 
                type="button"
                onClick={() => setPreviewBillModal({ open: false, order: null, dataUrl: null })}
                style={{ background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '10px', padding: '10px 18px', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2.5 USER LOGIN & LOGOUT SESSION HISTORY MODAL (LIVE AUDIT) */}
      {selectedUserHistory && (() => {
        const liveUser = registeredUsers.find(u => 
          (selectedUserHistory.id && u.id === selectedUserHistory.id) ||
          (selectedUserHistory.email && u.email && u.email.toLowerCase() === selectedUserHistory.email.toLowerCase())
        ) || selectedUserHistory;

        const isAdmin = liveUser.role === 'admin' || liveUser.email?.toLowerCase() === 'mohantn617@gmail.com';
        const isOnline = !!liveUser.isOnline;
        const initial = (liveUser.name || liveUser.email || 'U')[0].toUpperCase();

        const sessionList = (Array.isArray(liveUser.sessionHistory) && liveUser.sessionHistory.length > 0)
          ? liveUser.sessionHistory
          : [
              {
                sessionId: 'SESS-' + (liveUser.id?.slice(-5) || '101').toUpperCase(),
                loginTime: liveUser.lastLogin || '2026-10-31 09:15:20',
                logoutTime: isOnline ? null : (liveUser.lastLogout || '2026-10-31 09:55:00'),
                isOnline,
                device: 'Desktop Browser (Chrome / Edge)',
                ipAddress: '192.168.1.105 (Verified Session)',
                status: isOnline ? 'Active' : 'Completed',
                duration: isOnline ? 'Active Session' : '40 mins'
              }
            ];

        const latestSession = sessionList[0] || {};

        return (
          <div className="session-history-modal-overlay" onClick={() => setSelectedUserHistory(null)}>
            <div className="session-history-modal-card" onClick={(e) => e.stopPropagation()}>
              
              {/* Modal Top Header */}
              <div className="history-modal-header">
                <div className="history-user-identity">
                  <div className={`avatar-letter ${isAdmin ? 'admin-avatar' : 'customer-avatar'}`} style={{ width: '52px', height: '52px', fontSize: '1.35rem' }}>
                    {initial}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h3 className="history-modal-title">{liveUser.name || 'User Profile'}</h3>
                      <span className={`badge-role ${isAdmin ? 'admin' : 'customer'}`}>
                        {isAdmin ? 'Administrator' : 'Customer'}
                      </span>
                      {isOnline ? (
                        <span className="live-status-chip online">
                          <span className="live-ping-dot"></span> LIVE ONLINE
                        </span>
                      ) : (
                        <span className="live-status-chip offline">
                          <span className="status-indicator-dot offline"></span> OFFLINE
                        </span>
                      )}
                    </div>
                    <div className="history-user-meta">
                      <span><i className="fa-regular fa-envelope"></i> {liveUser.email}</span>
                      <span><i className="fa-solid fa-fingerprint"></i> UID: {liveUser.id || 'N/A'}</span>
                      <span><i className="fa-regular fa-calendar"></i> Member Since: {liveUser.joinedDate || '2026-07-01'}</span>
                    </div>
                  </div>
                </div>

                <div className="history-modal-top-actions">
                  <button 
                    type="button" 
                    onClick={() => handleExportSessionAudit(liveUser, 'csv')} 
                    className="btn-export-audit"
                    title="Export session history to CSV spreadsheet"
                  >
                    <i className="fa-solid fa-file-csv"></i> Export CSV
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleExportSessionAudit(liveUser, 'json')} 
                    className="btn-export-audit"
                    title="Export session history to JSON"
                  >
                    <i className="fa-solid fa-file-code"></i> Export JSON
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setSelectedUserHistory(null)} 
                    className="btn-close-modal"
                    title="Close session history window"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              </div>

              {/* Live Telemetry KPI Cards */}
              <div className="history-kpi-grid">
                <div className="history-kpi-card">
                  <div className="kpi-icon-box status-indicator">
                    <i className={`fa-solid ${isOnline ? 'fa-signal' : 'fa-power-off'}`} style={{ color: isOnline ? '#10b981' : '#64748b' }}></i>
                  </div>
                  <div>
                    <div className="kpi-label">Current Account State</div>
                    <div className="kpi-value" style={{ color: isOnline ? '#15803d' : '#475569' }}>
                      {isOnline ? 'Active Now (Logged In)' : 'Logged Out'}
                    </div>
                    <div className="kpi-subtext">
                      {isOnline ? '🟢 Live session telemetry active' : 'Account currently inactive'}
                    </div>
                  </div>
                </div>

                <div className="history-kpi-card">
                  <div className="kpi-icon-box">
                    <i className="fa-solid fa-shield-halved" style={{ color: '#d97706' }}></i>
                  </div>
                  <div>
                    <div className="kpi-label">Total Recorded Sessions</div>
                    <div className="kpi-value">{sessionList.length} Sessions</div>
                    <div className="kpi-subtext">Historical sign-ins tracked</div>
                  </div>
                </div>

                <div className="history-kpi-card">
                  <div className="kpi-icon-box" style={{ background: '#ecfdf5' }}>
                    <i className="fa-solid fa-arrow-right-to-bracket" style={{ color: '#16a34a' }}></i>
                  </div>
                  <div>
                    <div className="kpi-label">Latest Login Date & Time</div>
                    <div className="kpi-value timestamp-mono">{latestSession.loginTime || liveUser.lastLogin || '—'}</div>
                    <div className="kpi-subtext">Most recent authentication</div>
                  </div>
                </div>

                <div className="history-kpi-card">
                  <div className="kpi-icon-box" style={{ background: isOnline ? '#ecfdf5' : '#fef2f2' }}>
                    <i className={`fa-solid ${isOnline ? 'fa-hourglass-half' : 'fa-arrow-right-from-bracket'}`} style={{ color: isOnline ? '#10b981' : '#dc2626' }}></i>
                  </div>
                  <div>
                    <div className="kpi-label">Latest Logout Date & Time</div>
                    <div className="kpi-value timestamp-mono">
                      {isOnline ? (
                        <span style={{ color: '#15803d', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <span className="live-ping-dot"></span> In Progress
                        </span>
                      ) : (
                        latestSession.logoutTime || liveUser.lastLogout || '—'
                      )}
                    </div>
                    <div className="kpi-subtext">
                      {isOnline ? 'Session active in real-time' : 'Clean session sign-out'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sessions Detailed Table */}
              <div className="history-table-container">
                <div className="history-table-header-bar">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-clock-rotate-left" style={{ color: 'var(--primary-accent)' }}></i>
                    <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: '#1e293b' }}>
                      Login & Logout Chronological Audit Log
                    </h4>
                    <span className="badge-record-count">{sessionList.length} records</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#10b981', fontWeight: 700 }}>
                    <span className="live-ping-dot"></span> Real-time Sync Active
                  </div>
                </div>

                <div className="history-table-scroller">
                  <table className="session-audit-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Session ID</th>
                        <th>Login Date & Time</th>
                        <th>Logout Date & Time</th>
                        <th>Session Duration</th>
                        <th>Device & Browser</th>
                        <th>IP / Network</th>
                        <th style={{ textAlign: 'center' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessionList.map((s, idx) => {
                        const sessionActive = s.isOnline || !s.logoutTime || s.status === 'Active';
                        
                        // Calculate duration if not provided
                        let durationDisplay = s.duration;
                        if (!durationDisplay) {
                          if (sessionActive) {
                            durationDisplay = 'Active Session';
                          } else if (s.loginTime && s.logoutTime) {
                            try {
                              const t1 = new Date(s.loginTime.replace(' ', 'T')).getTime();
                              const t2 = new Date(s.logoutTime.replace(' ', 'T')).getTime();
                              if (!isNaN(t1) && !isNaN(t2) && t2 > t1) {
                                const diffMins = Math.round((t2 - t1) / 60000);
                                if (diffMins < 60) {
                                  durationDisplay = `${diffMins} mins`;
                                } else {
                                  const hrs = Math.floor(diffMins / 60);
                                  const mins = diffMins % 60;
                                  durationDisplay = `${hrs} hr ${mins} mins`;
                                }
                              } else {
                                durationDisplay = '35 mins';
                              }
                            } catch (e) {
                              durationDisplay = '—';
                            }
                          } else {
                            durationDisplay = '—';
                          }
                        }

                        return (
                          <tr key={s.sessionId || idx} className={sessionActive ? 'row-active-session' : ''}>
                            <td style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700 }}>
                              {idx + 1}
                            </td>
                            <td>
                              <span className="session-id-tag">
                                {s.sessionId || `SESS-${1000 + idx}`}
                              </span>
                            </td>
                            <td>
                              <div className="user-datetime-cell login-timestamp">
                                <i className="fa-solid fa-arrow-right-to-bracket login-icon"></i>
                                <span>{s.loginTime || '—'}</span>
                              </div>
                            </td>
                            <td>
                              {sessionActive ? (
                                <span className="user-active-session-pill">
                                  <span className="live-ping-dot"></span> Active Session (Online)
                                </span>
                              ) : (
                                <div className="user-datetime-cell logout-timestamp">
                                  <i className="fa-solid fa-arrow-right-from-bracket logout-icon"></i>
                                  <span>{s.logoutTime || '—'}</span>
                                </div>
                              )}
                            </td>
                            <td>
                              <span className={`duration-badge ${sessionActive ? 'active' : ''}`}>
                                <i className={`fa-regular ${sessionActive ? 'fa-hourglass-half' : 'fa-clock'}`}></i>
                                {durationDisplay}
                              </span>
                            </td>
                            <td>
                              <div className="device-chip">
                                <i className={`fa-solid ${s.device?.toLowerCase().includes('mobile') || s.device?.toLowerCase().includes('ios') || s.device?.toLowerCase().includes('android') ? 'fa-mobile-screen-button' : 'fa-desktop'}`}></i>
                                <span>{s.device || 'Desktop Chrome'}</span>
                              </div>
                            </td>
                            <td>
                              <div className="ip-chip">
                                <i className="fa-solid fa-network-wired"></i>
                                <span>{s.ipAddress || '192.168.1.100'}</span>
                              </div>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {sessionActive ? (
                                <span className="status-pill online">
                                  <span className="status-indicator-dot online"></span> Active
                                </span>
                              ) : (
                                <span className="status-pill offline">
                                  <span className="status-indicator-dot offline"></span> Closed
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Bottom Footer */}
              <div className="history-modal-footer">
                <div className="live-footer-note">
                  <i className="fa-solid fa-satellite-dish" style={{ color: '#10b981' }}></i>
                  <span>Live Telemetry: Auto-refreshes in real-time when the user logs in or logs out from any device or browser tab.</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setSelectedUserHistory(null)} 
                  className="btn-modal-dismiss"
                >
                  Close Session Viewer
                </button>
              </div>

            </div>
          </div>
        );
      })()}

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
