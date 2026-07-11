import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import CalendarShowcase from './components/CalendarShowcase';
import ContactForm from './components/ContactForm';
import { auth, db, googleProvider } from './firebase';
import Dashboard from './pages/Dashboard';

function App() {
  const [preloaderActive, setPreloaderActive] = useState(true);
  const [user, setUser] = useState(null);
  const isSigningUpRef = React.useRef(false);

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login'); // 'login' or 'signup'
  const [monthlyModalOpen, setMonthlyModalOpen] = useState(false);
  const [monthlyPreview, setMonthlyPreview] = useState('cover'); // 'cover' or 'sheet'
  const [dailyModalOpen, setDailyModalOpen] = useState(false);
  const [dailyPreview, setDailyPreview] = useState('board'); // 'board' or 'sheet'

  // Dashboard state
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [dashboardTab, setDashboardTab] = useState('overview'); // 'overview', 'users', 'history', 'messages'
  const [stats, setStats] = useState({ totalUsers: 0, totalMessages: 0, totalLogs: 0 });
  const [dbUsers, setDbUsers] = useState([]);
  const [dbLogs, setDbLogs] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [dbMessages, setDbMessages] = useState([]);

  // Contact section service trigger state
  const [selectedService, setSelectedService] = useState('');

  const location = useLocation();
  const navigate = useNavigate();

  // Scroll to top on every route change (Scroll Restoration)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Watch for /admin pathname to trigger overlays
  useEffect(() => {
    if (location.pathname === '/admin') {
      if (user) {
        if (user.email !== 'admin023@gmail.com') {
          showAlert('Restricted Access: admin023@gmail.com only.', 'warning');
          navigate('/');
        }
      } else {
        setAuthModalOpen(true);
        setAuthTab('login');
      }
    }
  }, [location.pathname, user, navigate]);

  const handleCloseDashboard = () => {
    setDashboardOpen(false);
    if (location.pathname === '/admin') {
      navigate('/');
    }
  };

  const handleCloseAuth = () => {
    setAuthModalOpen(false);
    if (location.pathname === '/admin') {
      navigate('/');
    }
    setLoginEmail('');
    setLoginPassword('');
    setSignupName('');
    setSignupEmail('');
    setSignupPassword('');
  };

  // Auth Inputs
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  // Custom Toast Alerts State
  const [toast, setToast] = useState(null);

  // Helper date/time functions
  const getCurrentTimestamp = () => {
    const now = new Date();
    return now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0') + ' ' +
      String(now.getHours()).padStart(2, '0') + ':' +
      String(now.getMinutes()).padStart(2, '0') + ':' +
      String(now.getSeconds()).padStart(2, '0');
  };

  const getCurrentDate = () => {
    const now = new Date();
    return now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0');
  };

  // Toast System
  const showAlert = (message, type = 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Seeding and preloader fade out
  useEffect(() => {
    const runStartup = async () => {
      // 1. Database Seeder
      if (db && auth) {
        try {
          const seedDocRef = db.collection("settings").doc("seeded");
          const seedSnap = await seedDocRef.get();

          if (!seedSnap.exists) {
            console.log("React: Database seeding starting...");

            // Seed defaults
            await db.collection("history").add({ email: "admin023@gmail.com", event: "Sign Up", timestamp: "2026-07-01 09:00:23" });
            await db.collection("history").add({ email: "customer@example.com", event: "Sign Up", timestamp: "2026-07-05 14:12:05" });
            await db.collection("history").add({ email: "customer@example.com", event: "Sign In", timestamp: "2026-07-05 14:13:55" });
            await db.collection("history").add({ email: "siva@example.com", event: "Sign Up", timestamp: "2026-07-08 10:15:30" });

            await db.collection("customer_inquiries").add({ name: "Siva Kumar", phone: "+91 9443210987", service: "Calendar Printing", message: "Inquire quote for 500 copies of 2027 Monthly Tamil Calendar sheets.", timestamp: "2026-07-08 10:20:00", status: "Pending" });
            await db.collection("customer_inquiries").add({ name: "Ramesh K", phone: "+91 9876543210", service: "Business Cards", message: "Need urgent delivery of premium business cards with gold foil borders.", timestamp: "2026-07-09 11:32:00", status: "Replied" });

            await seedDocRef.set({ seeded: true });
            console.log("React: Seeding complete!");
          }
        } catch (e) {
          console.warn("Seeding failed or skipped: ", e.message);
        }
      }

      // 2. Hide Preloader after delay
      setTimeout(() => {
        setPreloaderActive(false);
      }, 1000);
    };

    runStartup();
  }, []);

  // Listen to Auth changes
  useEffect(() => {
    if (!auth || !db) return;

    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        if (isSigningUpRef.current) return;
        try {
          const userDocRef = db.collection("users").doc(firebaseUser.uid);
          const userSnap = await userDocRef.get();

          let role = "customer";
          let name = firebaseUser.displayName || firebaseUser.email.split('@')[0];

          if (userSnap.exists) {
            role = userSnap.data().role || "customer";
            name = userSnap.data().name || name;
          } else {
            // Self healing register user profile record
            await userDocRef.set({
              name,
              email: firebaseUser.email,
              role,
              joinedDate: getCurrentDate()
            });
          }

          const loggedInUser = {
            id: firebaseUser.uid,
            name,
            email: firebaseUser.email,
            role
          };
          setUser(loggedInUser);
          localStorage.setItem('kp_session', JSON.stringify(loggedInUser));
        } catch (err) {
          console.error("Auth state fetch failed: ", err.message);
        }
      } else {
        setUser(null);
        localStorage.removeItem('kp_session');
      }
    });

    return () => unsubscribe();
  }, []);

  // Load session cache on startup
  useEffect(() => {
    const cached = localStorage.getItem('kp_session');
    if (cached) {
      setUser(JSON.parse(cached));
    }
  }, []);

  // Source protection & scroll reveal init
  useEffect(() => {
    // Disable right click
    const handleContextMenu = (e) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);

    // Block keyboard shortcuts
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'u') e.preventDefault();
      if (e.ctrlKey && e.key === 's') e.preventDefault();
      if (e.ctrlKey && e.shiftKey && e.key === 'I') e.preventDefault();
      if (e.ctrlKey && e.shiftKey && e.key === 'J') e.preventDefault();
      if (e.ctrlKey && e.shiftKey && e.key === 'C') e.preventDefault();
    };
    document.addEventListener('keydown', handleKeyDown);

    // Scroll reveal mock observer
    const revealElements = document.querySelectorAll('.scroll-reveal-fade');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        }
      });
    }, { threshold: 0.12 });
    revealElements.forEach(el => observer.observe(el));

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      observer.disconnect();
    };
  }, []);

  // Sync dashboard panel data depending on tab
  useEffect(() => {
    if (!dashboardOpen || !db) return;

    const loadDashboardData = async () => {
      try {
        if (dashboardTab === 'overview') {
          const usersSnap = await db.collection("users").get();
          const messagesSnap = await db.collection("customer_inquiries").get();
          const logsSnapAll = await db.collection("history").get();

          setStats({
            totalUsers: usersSnap.size,
            totalMessages: messagesSnap.size,
            totalLogs: logsSnapAll.size
          });

          // Recent 4 logs
          const recentLogsSnap = await db.collection("history")
            .orderBy("timestamp", "desc")
            .limit(4)
            .get();

          const logs = [];
          recentLogsSnap.forEach(docSnap => {
            logs.push({ id: docSnap.id, ...docSnap.data() });
          });
          setRecentLogs(logs);

        } else if (dashboardTab === 'users') {
          const usersSnap = await db.collection("users").get();
          const list = [];
          usersSnap.forEach(docSnap => {
            list.push({ id: docSnap.id, ...docSnap.data() });
          });
          setDbUsers(list);

        } else if (dashboardTab === 'history') {
          const logsSnap = await db.collection("history").orderBy("timestamp", "desc").get();
          const logs = [];
          logsSnap.forEach(docSnap => {
            logs.push({ id: docSnap.id, ...docSnap.data() });
          });
          setDbLogs(logs);

        } else if (dashboardTab === 'messages') {
          const messagesSnap = await db.collection("customer_inquiries").orderBy("timestamp", "desc").get();
          const messages = [];
          messagesSnap.forEach(docSnap => {
            messages.push({ id: docSnap.id, ...docSnap.data() });
          });
          setDbMessages(messages);
        }
      } catch (err) {
        console.error("Dashboard pull failed: ", err.message);
      }
    };

    loadDashboardData();
  }, [dashboardOpen, dashboardTab]);

  const addAuditLog = async (email, eventName) => {
    if (!db) return;
    try {
      await db.collection("history").add({
        email,
        event: eventName,
        timestamp: getCurrentTimestamp()
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Auth Operations
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!auth || !db) return;
    try {
      const cred = await auth.signInWithEmailAndPassword(loginEmail.trim(), loginPassword);
      const userObj = cred.user;
      await addAuditLog(userObj.email, 'Sign In');
      
      const userDoc = await db.collection("users").doc(userObj.uid).get();
      let role = "customer";
      let name = userObj.displayName || userObj.email.split('@')[0];
      if (userDoc.exists) {
        role = userDoc.data().role || "customer";
        name = userDoc.data().name || name;
      }

      const loggedInUser = {
        id: userObj.uid,
        name,
        email: userObj.email,
        role
      };
      
      setUser(loggedInUser);
      localStorage.setItem('kp_session', JSON.stringify(loggedInUser));
      setAuthModalOpen(false);
      showAlert(`Welcome back, ${name}!`, 'success');

      // Clear inputs
      setLoginEmail('');
      setLoginPassword('');

      // Auto open dashboard if admin
      if (userObj.email === 'admin023@gmail.com') {
        navigate('/admin');
      }
    } catch (err) {
      showAlert("Login Failed: " + err.message, 'error');
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!auth || !db) return;
    isSigningUpRef.current = true;
    try {
      const cred = await auth.createUserWithEmailAndPassword(signupEmail.trim(), signupPassword);
      await cred.user.updateProfile({ displayName: signupName.trim() });

      const newUserData = {
        name: signupName.trim(),
        email: signupEmail.trim(),
        role: 'customer',
        joinedDate: getCurrentDate()
      };

      await db.collection("users").doc(cred.user.uid).set(newUserData);

      await addAuditLog(signupEmail.trim(), 'Sign Up');
      await addAuditLog(signupEmail.trim(), 'Sign In');

      const loggedInUser = {
        id: cred.user.uid,
        name: signupName.trim(),
        email: signupEmail.trim(),
        role: 'customer'
      };

      setUser(loggedInUser);
      localStorage.setItem('kp_session', JSON.stringify(loggedInUser));
      setAuthModalOpen(false);
      showAlert(`Registration Successful! Welcome, ${signupName}.`, 'success');

      // Clear inputs
      setSignupName('');
      setSignupEmail('');
      setSignupPassword('');
    } catch (err) {
      showAlert("Registration Failed: " + err.message, 'error');
    } finally {
      isSigningUpRef.current = false;
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth || !db || !googleProvider) return;
    try {
      const result = await auth.signInWithPopup(googleProvider);
      const u = result.user;

      const userDocRef = db.collection("users").doc(u.uid);
      const userSnap = await userDocRef.get();
      
      let role = "customer";
      let name = u.displayName || u.email.split('@')[0];
      
      if (userSnap.exists) {
        role = userSnap.data().role || "customer";
        name = userSnap.data().name || name;
      } else {
        await userDocRef.set({
          name,
          email: u.email,
          role,
          joinedDate: getCurrentDate()
        });
      }

      const loggedInUser = {
        id: u.uid,
        name,
        email: u.email,
        role
      };

      setUser(loggedInUser);
      localStorage.setItem('kp_session', JSON.stringify(loggedInUser));

      await addAuditLog(u.email, 'Sign In (Google)');
      setAuthModalOpen(false);
      showAlert(`Welcome back, ${name}!`, 'success');
    } catch (err) {
      showAlert("Google Sign-In Failed: " + err.message, 'error');
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    try {
      if (user) {
        await addAuditLog(user.email, 'Sign Out');
      }
      await auth.signOut();
      showAlert("Successfully logged out.", 'info');
      setDashboardOpen(false);
    } catch (err) {
      showAlert("Logout Failed: " + err.message, 'error');
    }
  };

  // Admin Dashboard Actions
  const handleDeleteUser = async (uid, email) => {
    if (email === 'admin023@gmail.com') return;
    if (!window.confirm("Are you sure you want to delete this user profile document? This cannot be undone.")) return;

    try {
      await db.collection("users").doc(uid).delete();
      await addAuditLog(user.email, `Deleted user profile ${email}`);

      // refresh users list
      const usersSnap = await db.collection("users").get();
      const list = [];
      usersSnap.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setDbUsers(list);
      showAlert(`Deleted profile for ${email}`, 'success');
    } catch (err) {
      showAlert("Delete failed: " + err.message, 'error');
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm("Are you sure you want to purge all system logs from Firestore?")) return;

    try {
      const logsSnap = await db.collection("history").get();
      const batch = db.batch();
      logsSnap.forEach(docSnap => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
      setDbLogs([]);
      showAlert("System logs purged successfully", 'info');
    } catch (err) {
      showAlert("Failed to clear logs: " + err.message, 'error');
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm("Delete this message log?")) return;

    try {
      await db.collection("customer_inquiries").doc(msgId).delete();

      // refresh messages list
      const messagesSnap = await db.collection("customer_inquiries").orderBy("timestamp", "desc").get();
      const messages = [];
      messagesSnap.forEach(docSnap => {
        messages.push({ id: docSnap.id, ...docSnap.data() });
      });
      setDbMessages(messages);
      showAlert("Message inquiry deleted", 'info');
    } catch (err) {
      showAlert("Delete failed: " + err.message, 'error');
    }
  };

  // Inquire Order Modal Hooks
  const orderMonthlyCalendar = () => {
    setMonthlyModalOpen(false);
    setSelectedService('Calendar Printing');
    const element = document.getElementById('contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    const txtArea = document.getElementById('msg-content');
    if (txtArea) {
      txtArea.value = "Hi, I would like to order a Custom Monthly Tamil Calendar (A3 Wall / A4 Desk size). Please share pricing details.";
      txtArea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  const orderDailyCalendar = () => {
    setDailyModalOpen(false);
    setSelectedService('Calendar Printing');
    const element = document.getElementById('contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    const txtArea = document.getElementById('msg-content');
    if (txtArea) {
      txtArea.value = "Hi, I would like to order a Custom Daily Tamil Calendar (Tear-off Wall / Table Stand). Please share pricing details.";
      txtArea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  const isAdminPage = location.pathname === '/admin';

  return (
    <div>
      {/* 1. Preloader */}
      {!isAdminPage && (
        <div id="preloader" className={preloaderActive ? '' : 'fade-out'}>
          <div className="preloader-content">
            <div className="preloader-icon">
              <i className="fa-solid fa-calendar-days"></i>
            </div>
            <div className="preloader-title">Karpagam <span>Traders</span></div>
            <div className="preloader-bar">
              <div className="preloader-progress"></div>
            </div>
            <div className="preloader-status">Preparing Premium Prints...</div>
          </div>
        </div>
      )}

      {/* 2. Ambient background blobs */}
      {!isAdminPage && (
        <div className="blob-container">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
          <div className="blob blob-3"></div>
        </div>
      )}

      {/* 3. Navigation Header */}
      {!isAdminPage && (
        <Navbar
          user={user}
          onLogout={handleLogout}
          onOpenAuth={() => {
            setAuthModalOpen(true);
            setAuthTab('login');
          }}
          onOpenDashboard={() => {
            navigate('/admin');
          }}
          showAlert={showAlert}
        />
      )}

      {/* 4. Content Page Sections (Routes) */}
      <Routes>
        {/* Main Landing Page Route */}
        <Route path="/" element={
          <>
            <Hero />

            {/* About Section */}
            <section id="about">
              <div className="section-title scroll-reveal-fade revealed">
                <h2>About Karpagam Traders</h2>
                <p>Your trusted partner for all printing needs in Sivakasi</p>
              </div>

              <div className="about-grid">
                <div className="card scroll-reveal-fade revealed">
                  <h3>Excellence in Every Print</h3>
                  <p>
                    Located in the heart of Sivakasi, Karpagam Traders has been serving customers with state-of-the-art premium
                    printing services. We specialize in producing beautiful religious & modern calendars, business materials,
                    diaries, boxes, and bespoke custom prints that represent your brand with prestige.
                  </p>

                  <div className="stats">
                    <div className="stat-card">
                      <div className="stat-number">500+</div>
                      <div className="stat-label">Happy Customers</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-number">10+</div>
                      <div className="stat-label">Years Experience</div>
                    </div>
                  </div>
                </div>

                <div className="card info-card scroll-reveal-fade revealed">
                  <h3>Contact Information</h3>
                  <ul className="info-list">
                    <li>
                      <i className="fa-solid fa-location-dot"></i>
                      <div>
                        <strong>Factory & Office</strong>
                        <span>261/12a Muniyasamy Nagar, Sn Puram Road, Thiruthangal, Sivakasi, TN, 626130</span>
                      </div>
                    </li>
                    <li>
                      <i className="fa-solid fa-phone"></i>
                      <div>
                        <strong>Phone Lines</strong>
                        <span>+91 9566801402<br />+91 9489691402</span>
                      </div>
                    </li>
                    <li>
                      <i className="fa-solid fa-envelope"></i>
                      <div>
                        <strong>Email Address</strong>
                        <span>Karpagamtraderssivakasi@gmail.com</span>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Showcase Section */}
            <CalendarShowcase
              onOpenMonthlyModal={() => {
                setMonthlyModalOpen(true);
                setMonthlyPreview('cover');
              }}
              onOpenDailyModal={() => {
                setDailyModalOpen(true);
                setDailyPreview('board');
              }}
            />

            {/* Contact Form Inquiry Section */}
            <ContactForm
              selectedService={selectedService}
              onClearService={() => setSelectedService('')}
              showAlert={showAlert}
            />

            {/* Footer */}
            <footer>
              <div className="footer-container">
                <div className="footer-grid">
                  <div className="footer-col scroll-reveal-fade revealed">
                    <h3>Karpagam Traders</h3>
                    <p className="footer-desc">Premium printing services located in Sivakasi. Delivering custom, traditional, and modern prints that help your brand make a statement.</p>
                    <div className="social-icons">
                      <a href="https://wa.me/919566801402" target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-whatsapp"></i></a>
                      <a href="tel:+919566801402"><i className="fa-solid fa-phone"></i></a>
                      <a href="mailto:Karpagamtraderssivakasi@gmail.com"><i className="fa-solid fa-envelope"></i></a>
                    </div>
                  </div>

                  <div className="footer-col scroll-reveal-fade revealed">
                    <h4>Our Services</h4>
                    <ul className="footer-links">
                      <li><a href="#calendar-section"><i className="fa-solid fa-chevron-right"></i> Calendar Printing</a></li>
                      <li><a href="#contact"><i className="fa-solid fa-chevron-right"></i> Business Cards</a></li>
                      <li><a href="#contact"><i className="fa-solid fa-chevron-right"></i> Brochures & Flyers</a></li>
                      <li><a href="#contact"><i className="fa-solid fa-chevron-right"></i> Wedding Cards</a></li>
                      <li><a href="#contact"><i className="fa-solid fa-chevron-right"></i> Banners & Posters</a></li>
                      <li><a href="#contact"><i className="fa-solid fa-chevron-right"></i> Custom Printing</a></li>
                    </ul>
                  </div>

                  <div className="footer-col scroll-reveal-fade revealed">
                    <h4>Contact Info</h4>
                    <ul className="footer-contact-info">
                      <li><i className="fa-solid fa-location-dot"></i> Sn Puram Road, Thiruthangal, Sivakasi, Tamil Nadu</li>
                      <li><i className="fa-solid fa-phone"></i> +91 9566801402<br />+91 9489691402</li>
                      <li><i className="fa-solid fa-envelope"></i> Karpagamtraderssivakasi@gmail.com</li>
                    </ul>
                  </div>

                  <div className="footer-col scroll-reveal-fade revealed">
                    <h4>Business Hours</h4>
                    <ul className="footer-hours">
                      <li><span>Monday - Saturday:</span> 9:00 AM - 8:00 PM</li>
                      <li><span>Sunday:</span> 10:00 AM - 6:00 PM</li>
                    </ul>
                  </div>
                </div>

                <div className="copyright">
                  <p>&copy; 2026 Karpagam Traders. All rights reserved.</p>
                  <p style={{ fontSize: '0.75rem', marginTop: '5px', color: 'rgba(255,255,255,0.4)' }}>Designed with premium aesthetics & micro-animations.</p>
                </div>
              </div>
            </footer>
          </>
        } />

        {/* Dedicated Admin Dashboard Route */}
        <Route path="/admin" element={
          user && user.email === 'admin023@gmail.com' ? (
            <Dashboard onLogout={handleLogout} />
          ) : (
            <div style={{ padding: '80px 24px', textAlign: 'center', minHeight: '80vh', backgroundColor: 'var(--secondary-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa-solid fa-lock" style={{ fontSize: '3.5rem', color: 'var(--primary)', marginBottom: '20px' }}></i>
              <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary)', marginBottom: '10px', fontSize: '2rem', fontWeight: 800 }}>Restricted Access</h2>
              <p style={{ color: 'var(--text-muted)', maxWidth: '450px', margin: '0 auto 20px', fontSize: '1rem', lineHeight: 1.5 }}>Only the designated administrator (admin023@gmail.com) can access this page.</p>
              <button className="auth-btn" onClick={() => { setAuthTab('login'); setAuthModalOpen(true); }} style={{ marginTop: '20px', borderRadius: '30px', padding: '12px 30px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(139, 0, 0, 0.15)' }}>Log In as Admin</button>
            </div>
          )
        } />
      </Routes>

      {/* 5. Custom Toast Alerts Notification */}
      {toast && (
        <div id="custom-alert-toast" style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: '99999',
          background: toast.type === 'success' ? '#f0fdf4' : toast.type === 'error' ? '#fff1f2' : toast.type === 'warning' ? '#fffbeb' : '#eff6ff',
          border: `1.5px solid ${toast.type === 'success' ? '#22c55e' : toast.type === 'error' ? '#f43f5e' : toast.type === 'warning' ? '#f59e0b' : '#3b82f6'}`,
          borderRadius: '14px', padding: '16px 18px', maxWidth: '360px', width: 'calc(100vw - 48px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.13)', opacity: 1, transform: 'translateY(0) scale(1)',
          transition: 'all 0.35s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <i className={`fa-solid ${toast.type === 'success' ? 'fa-circle-check' : toast.type === 'error' ? 'fa-circle-xmark' : toast.type === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-info'
              }`} style={{
                fontSize: '1.3rem',
                color: toast.type === 'success' ? '#16a34a' : toast.type === 'error' ? '#e11d48' : toast.type === 'warning' ? '#d97706' : '#2563eb',
                flexShrink: 0, marginTop: '2px'
              }}></i>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: 'var(--font-body)', fontSize: '0.92rem', fontWeight: 600,
                color: toast.type === 'success' ? '#14532d' : toast.type === 'error' ? '#881337' : toast.type === 'warning' ? '#78350f' : '#1e3a8a',
                lineHeight: 1.4, textAlign: 'left'
              }}>{toast.message}</div>
            </div>
            <button onClick={() => setToast(null)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: toast.type === 'success' ? '#16a34a' : toast.type === 'error' ? '#e11d48' : toast.type === 'warning' ? '#d97706' : '#2563eb',
              fontSize: '1rem', padding: 0, flexShrink: 0
            }}><i className="fa-solid fa-xmark"></i></button>
          </div>
        </div>
      )}

      {/* 6. Auth Modal Overlay */}
      {authModalOpen && (
        <div className="auth-overlay open" onClick={(e) => e.target.classList.contains('auth-overlay') && handleCloseAuth()}>
          <div className="auth-modal">
            <div className="auth-modal-header">
              <div className="auth-title" id="auth-modal-title">Access Panel</div>
              <button className="close-auth-btn" onClick={handleCloseAuth}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="auth-tabs">
              <div className={`auth-tab ${authTab === 'login' ? 'active' : ''}`} onClick={() => setAuthTab('login')}>Log In</div>
              <div className={`auth-tab ${authTab === 'signup' ? 'active' : ''}`} onClick={() => setAuthTab('signup')}>Sign Up</div>
            </div>

            <div className="auth-forms-container">
              {/* Login Form */}
              <form className={`auth-form ${authTab === 'login' ? 'active' : ''}`} onSubmit={handleLoginSubmit}>
                <div className="input-wrapper">
                  <input type="email" required placeholder=" " value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
                  <label>Email Address</label>
                  <i className="fa-solid fa-envelope input-icon"></i>
                </div>
                <div className="input-wrapper">
                  <input type="password" required placeholder=" " value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
                  <label>Password</label>
                  <i className="fa-solid fa-lock input-icon"></i>
                </div>
                <button type="submit" className="auth-btn">Log In <i className="fa-solid fa-right-to-bracket"></i></button>
              </form>

              {/* Signup Form */}
              <form className={`auth-form ${authTab === 'signup' ? 'active' : ''}`} onSubmit={handleSignupSubmit}>
                <div className="input-wrapper">
                  <input type="text" required placeholder=" " value={signupName} onChange={(e) => setSignupName(e.target.value)} />
                  <label>Full Name</label>
                  <i className="fa-solid fa-user input-icon"></i>
                </div>
                <div className="input-wrapper">
                  <input type="email" required placeholder=" " value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} />
                  <label>Email Address</label>
                  <i className="fa-solid fa-envelope input-icon"></i>
                </div>
                <div className="input-wrapper">
                  <input type="password" required placeholder=" " value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} />
                  <label>Password</label>
                  <i className="fa-solid fa-lock input-icon"></i>
                </div>
                <button type="submit" className="auth-btn">Register Account <i className="fa-solid fa-user-plus"></i></button>
              </form>

              <div className="auth-divider">OR</div>
              <button type="button" className="auth-google-btn" onClick={handleGoogleSignIn}>
                <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Monthly Product Detail Modal */}
      {monthlyModalOpen && (
        <div className="auth-overlay open" onClick={(e) => e.target.classList.contains('auth-overlay') && setMonthlyModalOpen(false)}>
          <div className="product-modal card" style={{ maxWidth: '800px', padding: 0, width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="product-modal-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '500px' }}>
              {/* Left Visual Side */}
              <div className="product-modal-visual" style={{ background: 'linear-gradient(135deg, #ffcc80 0%, #ef9a9a 100%)', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <button className="close-auth-btn" onClick={() => setMonthlyModalOpen(false)} style={{ position: 'absolute', top: '15px', left: '15px', color: 'white' }}><i className="fa-solid fa-xmark"></i></button>

                <div className="calendar-preview-tabs" style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.15)', padding: '4px', borderRadius: '20px', marginBottom: '20px', zIndex: 1 }}>
                  <button onClick={() => setMonthlyPreview('cover')} className={`widget-btn ${monthlyPreview === 'cover' ? 'active' : ''}`} style={{ margin: 0, padding: '6px 14px', fontSize: '0.7rem' }}>Cover View</button>
                  <button onClick={() => setMonthlyPreview('sheet')} className={`widget-btn ${monthlyPreview === 'sheet' ? 'active' : ''}`} style={{ margin: 0, padding: '6px 14px', fontSize: '0.7rem' }}>Sheet View</button>
                </div>

                {/* Cover View Container */}
                {monthlyPreview === 'cover' && (
                  <div className="mini-sheet" style={{ width: '200px', height: '260px', background: 'linear-gradient(135deg, #3c0000 0%, #8b0000 100%)', borderRadius: '16px', padding: '20px', boxShadow: '0 15px 35px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', border: '2px solid var(--secondary)', transform: 'none' }}>
                    <div className="sheet-binder" style={{ width: '90%', height: '14px', background: '#334155', borderRadius: '4px' }}></div>
                    <div style={{ textAlign: 'center', color: 'var(--secondary)', marginTop: '10px' }}>
                      <i className="fa-solid fa-om" style={{ fontSize: '1.5rem', marginBottom: '5px' }}></i>
                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 900, letterSpacing: '1px' }}>கற்பகம்</div>
                      <div style={{ fontSize: '0.55rem', letterSpacing: '2px', textTransform: 'uppercase' }}>Traders</div>
                    </div>
                    <div style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px dashed rgba(212, 175, 55, 0.4)', padding: '8px 15px', borderRadius: '8px', textAlign: 'center', width: '100%' }}>
                      <div style={{ fontSize: '0.6rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>Tamil Daily Sheets</div>
                      <div style={{ fontSize: '1.1rem', color: 'var(--secondary)', fontFamily: 'var(--font-heading)', fontWeight: 800, lineHeight: 1.2 }}>2026</div>
                      <div style={{ fontSize: '0.55rem', color: '#fff' }}>WALL CALENDAR</div>
                    </div>
                    <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.7)', textAlign: 'center', fontWeight: 600 }}>Sn Puram Road, Thiruthangal, Sivakasi</div>
                  </div>
                )}

                {/* Sheet View Container */}
                {monthlyPreview === 'sheet' && (
                  <div className="mini-sheet" style={{ width: '200px', height: '260px', background: 'white', borderRadius: '16px', padding: '15px', transform: 'none', boxShadow: '0 15px 35px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', border: '1px solid rgba(0,0,0,0.05)' }}>
                    <div className="sheet-binder" style={{ width: '90%', height: '14px', background: '#334155', borderRadius: '4px', marginBottom: '12px' }}></div>
                    <div className="sheet-logo" style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 800, marginBottom: '4px' }}>Karpagam Traders</div>
                    <div className="sheet-month" style={{ fontSize: '0.75rem', borderBottom: '1px dashed #e2e8f0', width: '100%', textAlign: 'center', paddingBottom: '5px', marginBottom: '12px', fontWeight: 700, color: '#1e293b' }}>தை / JANUARY 2026</div>
                    <div className="sheet-grid-preview" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px', width: '100%', textAlign: 'center', fontSize: '0.6rem', color: 'var(--text-dark)' }}>
                      <span style={{ fontWeight: 700, color: 'var(--primary)' }}>S</span><span style={{ fontWeight: 700 }}>M</span><span style={{ fontWeight: 700 }}>T</span><span style={{ fontWeight: 700 }}>W</span><span style={{ fontWeight: 700 }}>T</span><span style={{ fontWeight: 700 }}>F</span><span style={{ fontWeight: 700 }}>S</span>
                      <span></span><span></span><span></span><span>1</span><span>2</span><span>3</span><span>4</span>
                      <span>5</span><span>6</span><span>7</span><span className="active" style={{ background: 'var(--primary)', color: 'white', borderRadius: '50%', width: '14px', height: '14px', display: 'inline-flex', alignItems: 'center', justifycontent: 'center', margin: '0 auto', fontWeight: 700 }}>8</span><span>9</span><span>10</span><span>11</span>
                      <span>12</span><span>13</span><span>14</span><span>15</span><span>16</span><span>17</span><span>18</span>
                    </div>
                    <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginTop: '15px', fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>
                      <i className="fa-solid fa-circle-info" style={{ color: 'var(--secondary-dark)' }}></i> Tamil Festivals & Auspicious days detailed list at bottom
                    </div>
                  </div>
                )}

                <div style={{ marginTop: '25px', textAlign: 'center', color: 'white' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, background: 'rgba(0,0,0,0.15)', padding: '6px 16px', borderRadius: '20px', display: 'inline-block' }}><i className="fa-solid fa-gift"></i> Custom Logo Seeding Available</div>
                </div>
              </div>

              {/* Right Info Side */}
              <div className="product-modal-info" style={{ padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
                <button className="close-auth-btn" onClick={() => setMonthlyModalOpen(false)} style={{ position: 'absolute', top: '20px', right: '20px', fontSize: '1.4rem', color: 'var(--text-muted)' }}><i className="fa-solid fa-xmark"></i></button>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(139, 0, 0, 0.08)', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 700, padding: '4px 12px', borderRadius: '30px', border: '1px solid rgba(139, 0, 0, 0.15)', marginBottom: '15px', width: 'fit-content', textTransform: 'uppercase' }}><i className="fa-solid fa-award"></i> Premium Format</div>
                <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary)', fontSize: '2.2rem', fontWeight: 900, marginBottom: '5px', lineHeight: 1.1 }}>Monthly Calendar</h2>
                <p style={{ fontSize: '1.0rem', color: 'var(--secondary-dark)', fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: '15px' }}>Traditional Tamil calendar designs with modern aesthetics and vibrant colors</p>

                <div style={{ height: '1px', background: '#e2e8f0', marginBottom: '15px', width: '100%' }}></div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '20px' }}>Beautiful traditional Tamil calendar with complete month view, featuring vibrant colors and clear date layouts. Designed to give your workspace or home a cultural yet professional look.</p>

                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Key Features</h4>
                  <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}><i className="fa-solid fa-circle-check" style={{ color: '#10b981' }}></i> Traditional Tamil calendar format</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}><i className="fa-solid fa-circle-check" style={{ color: '#10b981' }}></i> Vibrant color scheme</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}><i className="fa-solid fa-circle-check" style={{ color: '#10b981' }}></i> Clear date visibility</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}><i className="fa-solid fa-circle-check" style={{ color: '#10b981' }}></i> Festival and important dates</li>
                  </ul>
                </div>

                <div style={{ marginBottom: '25px' }}>
                  <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Available Sizes</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', background: '#fbfbfb', border: '1px solid #f2f2f2', padding: '8px 12px', borderRadius: '8px' }}><i className="fa-solid fa-maximize" style={{ color: 'var(--secondary-dark)' }}></i> Wall (A3 Size)</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', background: '#fbfbfb', border: '1px solid #f2f2f2', padding: '8px 12px', borderRadius: '8px' }}><i className="fa-solid fa-table" style={{ color: 'var(--secondary-dark)' }}></i> Desk (A4 Size)</div>
                  </div>
                </div>

                <button onClick={orderMonthlyCalendar} className="auth-btn" style={{ marginTop: 0, boxShadow: '0 4px 12px rgba(139, 0, 0, 0.15)', width: '100%', borderRadius: '30px', display: 'inline-flex', alignItems: 'center', justifycontent: 'center', gap: '10px' }}><i className="fa-solid fa-basket-shopping"></i> Order Monthly Calendar Now</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. Daily Product Detail Modal */}
      {dailyModalOpen && (
        <div className="auth-overlay open" onClick={(e) => e.target.classList.contains('auth-overlay') && setDailyModalOpen(false)}>
          <div className="product-modal card" style={{ maxWidth: '800px', padding: 0, width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="product-modal-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '500px' }}>
              {/* Left Visual Side */}
              <div className="product-modal-visual" style={{ background: 'linear-gradient(135deg, #b3e5fc 0%, #c8e6c9 100%)', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifycontent: 'center', position: 'relative' }}>
                <button className="close-auth-btn" onClick={() => setDailyModalOpen(false)} style={{ position: 'absolute', top: '15px', left: '15px', color: 'white' }}><i className="fa-solid fa-xmark"></i></button>

                <div className="calendar-preview-tabs" style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.15)', padding: '4px', borderRadius: '20px', marginBottom: '20px', zIndex: 1 }}>
                  <button onClick={() => setDailyPreview('board')} className={`widget-btn ${dailyPreview === 'board' ? 'active' : ''}`} style={{ margin: 0, padding: '6px 14px', fontSize: '0.7rem' }}>Header Board</button>
                  <button onClick={() => setDailyPreview('sheet')} className={`widget-btn ${dailyPreview === 'sheet' ? 'active' : ''}`} style={{ margin: 0, padding: '6px 14px', fontSize: '0.7rem' }}>Daily Sheet</button>
                </div>

                {/* Board View */}
                {dailyPreview === 'board' && (
                  <div className="mini-sheet" style={{ width: '200px', height: '260px', background: 'linear-gradient(135deg, #a1887f 0%, #5d4037 100%)', borderRadius: '16px', padding: '15px', boxShadow: '0 15px 35px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', border: '3px solid #d4af37', transform: 'none' }}>
                    <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '8px', padding: '6px', width: '100%', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.65rem', color: '#fff', fontWeight: 700, letterSpacing: '1px' }}>KARPAGAM TRADERS</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifycontent: 'center', margin: '10px 0' }}>
                      <i className="fa-solid fa-om" style={{ fontSize: '2.8rem', color: '#d4af37', filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.3))' }}></i>
                      <div style={{ color: '#fff', fontSize: '0.55rem', marginTop: '5px', fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>ஸ்ரீ மகா கணபதி துணை</div>
                    </div>
                    <div style={{ background: '#fff', borderRadius: '4px', padding: '4px', width: '80px', height: '50px', boxShadow: '0 4px 8px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifycontent: 'center', borderTop: '2px solid #8b0000' }}>
                      <div style={{ fontSize: '0.45rem', color: 'var(--primary)', fontWeight: 800 }}>JANUARY</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#334155', lineHeight: 1 }}>01</div>
                      <div style={{ fontSize: '0.35rem', color: 'var(--text-muted)' }}>WEDNESDAY</div>
                    </div>
                  </div>
                )}

                {/* Sheet View */}
                {dailyPreview === 'sheet' && (
                  <div className="mini-sheet daily-sheet" style={{ width: '200px', height: '260px', background: 'white', borderRadius: '16px', padding: '20px 15px', transform: 'none', boxShadow: '0 15px 35px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', border: '1px solid rgba(0,0,0,0.05)' }}>
                    <div className="sheet-binder-metal" style={{ width: '90%', height: '12px', background: 'linear-gradient(90deg, #64748b, #cbd5e1, #64748b)', borderRadius: '3px', marginBottom: '12px', position: 'relative' }}></div>
                    <div className="sheet-logo" style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 800, marginBottom: '2px' }}>Karpagam Traders</div>
                    <div className="sheet-day-num" style={{ fontFamily: 'var(--font-heading)', fontSize: '4rem', fontWeight: 900, color: 'var(--primary)', lineHeight: 1, marginTop: '10px' }}>09</div>
                    <div className="sheet-day-info" style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-dark)', marginTop: '5px' }}>வியாழன் | THURSDAY</div>
                    <div className="sheet-auspicious" style={{ marginTop: '15px', background: '#fef2f2', border: '1px solid #fee2e2', color: 'var(--primary-light)', fontSize: '0.6rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>சுப முகூர்த்தம்</div>
                  </div>
                )}

                <div style={{ marginTop: '25px', textAlign: 'center', color: '#1e293b' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(5px)', padding: '6px 16px', borderRadius: '20px', display: 'inline-block', border: '1px solid rgba(0,0,0,0.05)' }}><i className="fa-solid fa-star" style={{ color: 'var(--secondary-dark)' }}></i> Spiritual Insights Included</div>
                </div>
              </div>

              {/* Right Info Side */}
              <div className="product-modal-info" style={{ padding: '40px', display: 'flex', flexDirection: 'column', justifycontent: 'center', position: 'relative' }}>
                <button className="close-auth-btn" onClick={() => setDailyModalOpen(false)} style={{ position: 'absolute', top: '20px', right: '20px', fontSize: '1.4rem', color: 'var(--text-muted)' }}><i className="fa-solid fa-xmark"></i></button>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(212, 175, 55, 0.1)', color: 'var(--secondary-dark)', fontSize: '0.75rem', fontWeight: 700, padding: '4px 12px', borderRadius: '30px', border: '1px solid rgba(212, 175, 55, 0.2)', marginBottom: '15px', width: 'fit-content', textTransform: 'uppercase' }}><i className="fa-solid fa-gem"></i> Detailed Insight</div>
                <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary)', fontSize: '2.2rem', fontWeight: 900, marginBottom: '5px', lineHeight: 1.1 }}>Daily Calendar</h2>
                <p style={{ fontSize: '1.0rem', color: 'var(--secondary-dark)', fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: '15px' }}>Detailed daily information with auspicious timings, events, and traditional insights</p>

                <div style={{ height: '1px', background: '#e2e8f0', marginBottom: '15px', width: '100%' }}></div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '20px' }}>Comprehensive daily calendar with detailed Tamil information, auspicious timings, and important events. Perfect for daily guidance, home prayer halls, and prestigious corporate gifting.</p>

                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Daily Information</h4>
                  <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}><i className="fa-solid fa-circle-check" style={{ color: 'var(--primary-light)' }}></i> Auspicious timings (Rahu Kalam)</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}><i className="fa-solid fa-circle-check" style={{ color: 'var(--primary-light)' }}></i> Festival and special days</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}><i className="fa-solid fa-circle-check" style={{ color: 'var(--primary-light)' }}></i> Tamil date and month</li>
                  </ul>
                </div>

                <button onClick={orderDailyCalendar} className="auth-btn" style={{ marginTop: 0, boxShadow: '0 4px 12px rgba(139, 0, 0, 0.15)', width: '100%', borderRadius: '30px', display: 'inline-flex', alignItems: 'center', justifycontent: 'center', gap: '10px' }}><i className="fa-solid fa-basket-shopping"></i> Order Daily Calendar Now</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. Fullscreen Dashboard Overlay */}
      {dashboardOpen && (
        <div className="dashboard-overlay open" style={{ display: 'block' }}>
          <div className="dashboard-container">
            {/* Sidebar menu */}
            <aside className="dashboard-sidebar">
              <div className="sidebar-header">
                <i className="fa-solid fa-shield-halved" style={{ color: 'var(--secondary)', fontSize: '1.5rem' }}></i>
                <div className="sidebar-logo">Admin <span>Panel</span></div>
              </div>
              <ul className="sidebar-menu">
                <li className="sidebar-item">
                  <button className={dashboardTab === 'overview' ? 'active' : ''} onClick={() => setDashboardTab('overview')}>
                    <i className="fa-solid fa-chart-pie"></i> Overview
                  </button>
                </li>
                <li className="sidebar-item">
                  <button className={dashboardTab === 'users' ? 'active' : ''} onClick={() => setDashboardTab('users')}>
                    <i className="fa-solid fa-users"></i> User Accounts
                  </button>
                </li>
                <li className="sidebar-item">
                  <button className={dashboardTab === 'history' ? 'active' : ''} onClick={() => setDashboardTab('history')}>
                    <i className="fa-solid fa-clock-rotate-left"></i> Access Logs
                  </button>
                </li>
                <li className="sidebar-item">
                  <button className={dashboardTab === 'messages' ? 'active' : ''} onClick={() => setDashboardTab('messages')}>
                    <i className="fa-solid fa-envelope-open-text"></i> Customer Inquiries
                  </button>
                </li>
              </ul>
              <div className="sidebar-footer">
                <div className="sidebar-user-card">
                  <div className="sidebar-user-avatar">{user ? user.name.charAt(0).toUpperCase() : 'A'}</div>
                  <div>
                    <div className="sidebar-user-name">{user ? user.name : 'Admin Mohan'}</div>
                    <div className="sidebar-user-role">Administrator</div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main content workarea */}
            <main className="dashboard-main">
              <div className="dashboard-navbar">
                <div className="dashboard-title">
                  {dashboardTab === 'overview' && 'Overview Dashboard'}
                  {dashboardTab === 'users' && 'User Account Registry'}
                  {dashboardTab === 'history' && 'Audit Access Logs'}
                  {dashboardTab === 'messages' && 'Customer Inquiries Inbox'}
                </div>
                <button className="close-dashboard-btn" onClick={handleCloseDashboard}><i className="fa-solid fa-chevron-left"></i> Exit Dashboard</button>
              </div>

              <div className="dashboard-content-canvas">

                {/* 9.1 Pane Overview */}
                {dashboardTab === 'overview' && (
                  <div className="dashboard-pane active">
                    <div className="stats-summary-grid">
                      <div className="stat-summary-card">
                        <div className="stat-summary-info">
                          <h5>Registered Users</h5>
                          <h4>{stats.totalUsers}</h4>
                        </div>
                        <div className="stat-summary-icon"><i className="fa-solid fa-users"></i></div>
                      </div>
                      <div className="stat-summary-card">
                        <div className="stat-summary-info">
                          <h5>Inbound Messages</h5>
                          <h4>{stats.totalMessages}</h4>
                        </div>
                        <div className="stat-summary-icon"><i className="fa-solid fa-message"></i></div>
                      </div>
                      <div className="stat-summary-card">
                        <div className="stat-summary-info">
                          <h5>Access Logs</h5>
                          <h4>{stats.totalLogs}</h4>
                        </div>
                        <div className="stat-summary-icon"><i className="fa-solid fa-clock-rotate-left"></i></div>
                      </div>
                    </div>

                    <div className="table-container">
                      <div className="table-header-row">
                        <div className="table-title">Recent System Logs</div>
                        <button className="action-btn-primary" onClick={() => setDashboardTab('history')}>View All Logs</button>
                      </div>
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>User Email</th>
                            <th>Activity Event</th>
                            <th>Timestamp</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentLogs.map((log) => (
                            <tr key={log.id}>
                              <td><strong>{log.email}</strong></td>
                              <td><i className="fa-solid fa-fingerprint" style={{ color: 'var(--secondary-dark)', marginRight: '5px' }}></i> {log.event}</td>
                              <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{log.timestamp}</td>
                            </tr>
                          ))}
                          {recentLogs.length === 0 && (
                            <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No logs recorded.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 9.2 Pane Users registry */}
                {dashboardTab === 'users' && (
                  <div className="dashboard-pane active">
                    <div className="table-container">
                      <div className="table-header-row">
                        <div className="table-title">Registered Accounts Database</div>
                      </div>
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Email Address</th>
                            <th>Access Role</th>
                            <th>Registration Date</th>
                            <th>Operations</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dbUsers.map((item) => (
                            <tr key={item.id}>
                              <td><strong>{item.name}</strong></td>
                              <td>{item.email}</td>
                              <td><span className={`badge ${item.role}`}>{item.role}</span></td>
                              <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{item.joinedDate || '2026-07-01'}</td>
                              <td>
                                <button className="action-btn-danger" onClick={() => handleDeleteUser(item.id, item.email)} disabled={item.email === 'admin023@gmail.com'} style={{ opacity: item.email === 'admin023@gmail.com' ? 0.5 : 1, cursor: item.email === 'admin023@gmail.com' ? 'not-allowed' : 'pointer' }}><i className="fa-solid fa-trash-can"></i> Delete</button>
                              </td>
                            </tr>
                          ))}
                          {dbUsers.length === 0 && (
                            <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No registered users.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 9.3 Pane Logs */}
                {dashboardTab === 'history' && (
                  <div className="dashboard-pane active">
                    <div className="table-container">
                      <div className="table-header-row">
                        <div className="table-title">Login / Signup History Logs</div>
                        <button className="action-btn-danger" onClick={handleClearLogs}>Clear Logs</button>
                      </div>
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>User Email</th>
                            <th>Activity Event</th>
                            <th>Timestamp</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dbLogs.map((log) => (
                            <tr key={log.id}>
                              <td><strong>{log.email}</strong></td>
                              <td><i className="fa-solid fa-circle-check" style={{ color: '#10b981', marginRight: '5px' }}></i> {log.event}</td>
                              <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{log.timestamp}</td>
                            </tr>
                          ))}
                          {dbLogs.length === 0 && (
                            <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No records found.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 9.4 Pane Messages Inquiries */}
                {dashboardTab === 'messages' && (
                  <div className="dashboard-pane active">
                    <div className="table-container">
                      <div className="table-header-row">
                        <div className="table-title">Inbound Customer Inquiries</div>
                      </div>
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>Sender Name</th>
                            <th>Phone / Service</th>
                            <th>Message Details</th>
                            <th>Date Received</th>
                            <th>Status / Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dbMessages.map((msg) => (
                            <tr key={msg.id}>
                              <td><strong>{msg.name}</strong></td>
                              <td>
                                <div>{msg.phone}</div>
                                <small style={{ color: 'var(--secondary-dark)', fontWeight: 700 }}>{msg.service}</small>
                              </td>
                              <td><div style={{ maxWidth: '350px', fontSize: '0.85rem', lineHeight: '1.4' }}>{msg.message}</div></td>
                              <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{msg.timestamp}</td>
                              <td>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <span className={`badge ${msg.status.toLowerCase()}`}>{msg.status}</span>
                                  <button className="action-btn-danger" style={{ padding: '6px', fontSize: '0.75rem' }} onClick={() => handleDeleteMessage(msg.id)}><i className="fa-solid fa-trash-can"></i></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {dbMessages.length === 0 && (
                            <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No messages received.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>
            </main>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
