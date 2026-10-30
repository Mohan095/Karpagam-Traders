import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import CalendarShowcase from './components/CalendarShowcase';
import ProductsSection from './components/ProductsSection';
import ContactForm from './components/ContactForm';
import CartDrawer from './components/CartDrawer';
import { auth, db, googleProvider } from './firebase';
import Dashboard from './pages/Dashboard';
import { NotificationTicker, NotificationSection } from './components/NotificationSection';
import apiService from './api';

// Default Products List using ONLY user assets images (Total 24 Products)
const defaultProductsList = [
  // Daily Products (8) - using assets/daily 1 to 8
  { id: 1, name: "Daily Calendar 1", price: 299, category: "daily", image: "/assets/daily 1.jpeg", description: "Standard daily tear-off sheet calendar with auspicious Nalla Neram." },
  { id: 2, name: "Daily Calendar 2", price: 399, category: "daily", image: "/assets/daily 2.webp", description: "Deluxe daily calendar board print with spiritual artwork." },
  { id: 3, name: "Daily Calendar 3", price: 249, category: "daily", image: "/assets/daily 3.webp", description: "Compact daily Tamil calendar with vibrant typography." },
  { id: 4, name: "Daily Calendar 4", price: 449, category: "daily", image: "/assets/daily 4.webp", description: "Executive daily calendar sheet with gold foil binder header." },
  { id: 5, name: "Daily Calendar 5", price: 199, category: "daily", image: "/assets/daily 5.jpg", description: "Traditional pocket size daily calendar for home & desk." },
  { id: 6, name: "Daily Calendar 6", price: 349, category: "daily", image: "/assets/daily 6.webp", description: "Religious temple daily tear-off calendar sheet." },
  { id: 7, name: "Daily Calendar 7", price: 599, category: "daily", image: "/assets/daily 7.webp", description: "Jumbo size daily calendar board with metal slider clip." },
  { id: 8, name: "Daily Calendar 8", price: 229, category: "daily", image: "/assets/daily 8.jpg", description: "Classic Sivakasi printed tear-off calendar." },

  // Monthly Products (8) - using assets/monthly 1 to 8
  { id: 9, name: "Monthly Calendar 1", price: 499, category: "monthly", image: "/assets/monthly 1.jpg", description: "12-Sheet Monthly wall calendar with high-gsm glossy paper." },
  { id: 10, name: "Monthly Calendar 2", price: 599, category: "monthly", image: "/assets/monthly 2.webp", description: "Landscape Monthly Tamil wall calendar with metallic tin rim." },
  { id: 11, name: "Monthly Calendar 3", price: 449, category: "monthly", image: "/assets/monthly 3.webp", description: "Corporate logo printed 12-page monthly wall sheet." },
  { id: 12, name: "Monthly Calendar 4", price: 549, category: "monthly", image: "/assets/monthly 4.jpg", description: "Double-sided monthly calendar with holiday highlighted list." },
  { id: 13, name: "Monthly Calendar 5", price: 699, category: "monthly", image: "/assets/monthly 5.jpg", description: "Royal Gold Edition monthly wall calendar 2027." },
  { id: 14, name: "Monthly Calendar 6", price: 799, category: "monthly", image: "/assets/monthly 6.jpg", description: "Custom photo monthly wall calendar with custom branding." },
  { id: 15, name: "Monthly Calendar 7", price: 349, category: "monthly", image: "/assets/monthly 7.webp", description: "Compact 6-sheet monthly wall hanging calendar." },
  { id: 16, name: "Monthly Calendar 8", price: 529, category: "monthly", image: "/assets/monthly 8.webp", description: "Traditional Tamil Panchangam monthly wall calendar." },

  // Cake & Specialty Products (8) - using assets/cake 1 to 8
  { id: 17, name: "Cake & Bakery Calendar 1", price: 650, category: "specialty", image: "/assets/cake 1.jpg", description: "Specialty desk calendar designed for bakeries & cake shops." },
  { id: 18, name: "Cake & Bakery Calendar 2", price: 750, category: "specialty", image: "/assets/cake 2.webp", description: "Triangular executive desk stand calendar with glossy varnish." },
  { id: 19, name: "Specialty Calendar 3", price: 899, category: "specialty", image: "/assets/cake 3.jpg", description: "Bespoke leatherette frame desk calendar with planner diary." },
  { id: 20, name: "Specialty Calendar 4", price: 450, category: "specialty", image: "/assets/cake 4.jpg", description: "Miniature acrylic desk calendar for study tables." },
  { id: 21, name: "Specialty Calendar 5", price: 950, category: "specialty", image: "/assets/cake 5.jpg", description: "Premium Gold embossed souvenir calendar & diary set." },
  { id: 22, name: "Specialty Calendar 6", price: 320, category: "specialty", image: "/assets/cake 6.jpg", description: "Eco-friendly recycled paper desk calendar." },
  { id: 23, name: "Specialty Calendar 7", price: 480, category: "specialty", image: "/assets/cake 7.jpg", description: "Magnetic fridge calendar sheet with tear-off memo pads." },
  { id: 24, name: "Specialty Calendar 8", price: 390, category: "specialty", image: "/assets/cake 8.jpg", description: "Pocket Tamil Panchangam calendar diary." }
];

// Initial Seed Notifications / Daily News
const defaultNotificationsList = [
  {
    id: "notif_1",
    title: "📢 2027 Tamil Daily & Monthly Calendar Bookings Now Open!",
    content: "Karpagam Traders Sivakasi has officially commenced advance bookings for 2027 Daily Tear-off Calendars and 12-Sheet Monthly Wall Calendars. Book early for exclusive bulk discounts and custom corporate logo printing with fast shipping across Tamil Nadu & India.",
    category: "Special Offer",
    image: "/assets/daily 1.jpeg",
    is_pinned: true,
    is_active: true,
    date: "2026-10-30"
  },
  {
    id: "notif_2",
    title: "✨ Royal Gold Edition 12-Sheet Wall Calendars Launched",
    content: "Crafted on high-GSM art paper with UV spot varnish and elegant gold borders. Featuring accurate Tamil Panchangam, Nalla Neram, and festival lists.",
    category: "New Arrival",
    image: "/assets/monthly 1.jpg",
    is_pinned: false,
    is_active: true,
    date: "2026-10-29"
  },
  {
    id: "notif_3",
    title: "🎂 Specialty Cake & Bakery Desk Stand Calendars Available",
    content: "Modern triangular desk calendars designed specifically for bakeries, retail outlets, and corporate offices with custom food-grade cardstock.",
    category: "Daily News",
    image: "/assets/cake 1.jpg",
    is_pinned: false,
    is_active: true,
    date: "2026-10-28"
  }
];

function App() {
  const [preloaderActive, setPreloaderActive] = useState(true);
  const [user, setUser] = useState(null);

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
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

  const [products, setProducts] = useState(defaultProductsList);
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('karpagam_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Sync cart with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('karpagam_cart', JSON.stringify(cart));
    } catch (e) {
      console.warn("localStorage cart sync notice:", e);
    }
  }, [cart]);

  // Notifications State synced with localStorage
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('karpagam_notifications');
      return saved ? JSON.parse(saved) : defaultNotificationsList;
    } catch (e) {
      return defaultNotificationsList;
    }
  });

  // Sync notifications with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('karpagam_notifications', JSON.stringify(notifications));
    } catch (e) {
      console.warn("localStorage notifications sync notice:", e);
    }
  }, [notifications]);

  const handleAddNotification = async (newNotif) => {
    setNotifications(prev => [newNotif, ...prev]);
    if (db) {
      try {
        await db.collection("notifications").add(newNotif);
      } catch (e) {
        console.warn("Firestore notification add warning:", e);
      }
    }
    try {
      await apiService.createNotification(newNotif);
    } catch (e) {}
  };

  const handleDeleteNotification = async (notifId) => {
    setNotifications(prev => prev.filter(n => n.id !== notifId));
    if (db) {
      try {
        await db.collection("notifications").doc(notifId).delete();
      } catch (e) {}
    }
    try {
      await apiService.deleteNotification(notifId);
    } catch (e) {}
  };

  const handleTogglePinNotification = (notifId) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_pinned: !n.is_pinned } : n));
  };

  const handleToggleActiveNotification = (notifId) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_active: !n.is_active } : n));
  };

  // Product actions synced with Firebase Firestore
  const handleAddProduct = async (newProd) => {
    setProducts(prev => [newProd, ...prev]);
    if (db) {
      try {
        await db.collection("products").doc(String(newProd.id)).set(newProd);
        await addAuditLog(user?.email || 'admin', `Added product ${newProd.name}`);
      } catch (err) {
        console.warn("Firestore product add warning:", err);
      }
    }
  };

  const handleDeleteProduct = async (id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    if (db) {
      try {
        await db.collection("products").doc(String(id)).delete();
        await addAuditLog(user?.email || 'admin', `Deleted product ID ${id}`);
      } catch (err) {
        console.warn("Firestore product delete warning:", err);
      }
    }
  };

  const handleUpdateProductPrice = async (id, newPrice) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, price: newPrice } : p));
    if (db) {
      try {
        await db.collection("products").doc(String(id)).update({ price: newPrice });
      } catch (err) {
        console.warn("Firestore product price update warning:", err);
      }
    }
  };

  const handleUpdateProductName = async (id, newName) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
    if (db) {
      try {
        await db.collection("products").doc(String(id)).update({ name: newName });
      } catch (err) {
        console.warn("Firestore product name update warning:", err);
      }
    }
  };

  const handleUpdateProductImage = async (id, newImage) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, image: newImage } : p));
    if (db) {
      try {
        await db.collection("products").doc(String(id)).update({ image: newImage });
      } catch (err) {
        console.warn("Firestore product image update warning:", err);
      }
    }
  };

  const handleAddToCart = (item) => {
    setCart(prev => {
      const existingIdx = prev.findIndex(
        p => p.productId === item.productId && p.quality === item.quality && p.size === item.size
      );
      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: (updated[existingIdx].quantity || 1) + (item.quantity || 1)
        };
        return updated;
      }
      return [...prev, { ...item, quantity: item.quantity || 1 }];
    });
  };

  const handleRemoveFromCart = (index) => {
    setCart(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateQuantity = (index, delta) => {
    setCart(prev => {
      const updated = [...prev];
      const current = updated[index];
      if (!current) return prev;
      const newQty = (current.quantity || 1) + delta;
      if (newQty <= 0) {
        return prev.filter((_, idx) => idx !== index);
      }
      updated[index] = { ...current, quantity: newQty };
      return updated;
    });
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Watch for /admin pathname to trigger overlays
  useEffect(() => {
    if (location.pathname === '/admin') {
      if (user) {
        if (user.email?.toLowerCase() !== 'mohantn617@gmail.com' && user.role !== 'admin') {
          showAlert('Restricted Access: Only mohantn617@gmail.com can access the Administrator Dashboard.', 'warning');
          navigate('/');
        }
      } else {
        setAuthModalOpen(true);
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
  };

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
      // 1. Database Seeder & Firestore Data Sync
      if (db && auth) {
        try {
          // A. Seed & Load Products Collection
          const prodSnap = await db.collection("products").get();
          if (prodSnap.empty) {
            console.log("React: Seeding all 24 products to Firebase Firestore...");
            for (const p of defaultProductsList) {
              await db.collection("products").doc(String(p.id)).set(p);
            }
          } else {
            const firestoreProds = [];
            prodSnap.forEach(doc => {
              firestoreProds.push(doc.data());
            });
            if (firestoreProds.length > 0) {
              // Ensure ONLY user asset images are used, never Unsplash
              const sanitizedProds = firestoreProds.map(p => {
                if (!p.image || p.image.includes('unsplash.com')) {
                  const match = defaultProductsList.find(dp => dp.id === p.id);
                  return match ? { ...p, image: match.image } : { ...p, image: '/assets/daily 1.jpeg' };
                }
                return p;
              });
              setProducts(sanitizedProds);
            }
          }

          // A2. Seed & Load Notifications Collection
          try {
            const notifSnap = await db.collection("notifications").get();
            if (notifSnap.empty) {
              console.log("React: Seeding default notifications to Firebase Firestore...");
              for (const n of defaultNotificationsList) {
                await db.collection("notifications").doc(n.id).set(n);
              }
            } else {
              const loadedNotifs = [];
              notifSnap.forEach(doc => {
                loadedNotifs.push({ id: doc.id, ...doc.data() });
              });
              if (loadedNotifs.length > 0) {
                setNotifications(loadedNotifs);
              }
            }
          } catch (nErr) {
            console.warn("Notifications Firestore sync warning:", nErr.message);
          }

          // B. Seed Customer Inquiries Collection if empty
          try {
            const inqSnap = await db.collection("customer_inquiries").get();
            if (inqSnap.empty) {
              console.log("React: Seeding customer inquiries to Firebase Firestore...");
              await db.collection("customer_inquiries").add({ name: "Siva Kumar", phone: "+91 9443210987", service: "Calendar Printing", message: "Inquire quote for 500 copies of 2027 Monthly Tamil Calendar sheets.", timestamp: "2026-07-08 10:20:00", date: "2026-07-08 10:20:00", status: "Pending" });
              await db.collection("customer_inquiries").add({ name: "Ramesh K", phone: "+91 9876543210", service: "Business Cards", message: "Need urgent delivery of premium business cards with gold foil borders.", timestamp: "2026-07-09 11:32:00", date: "2026-07-09 11:32:00", status: "Replied" });
            }
          } catch (eInq) {
            console.warn("Inquiries check warning:", eInq.message);
          }

          // C. Seed History Collection if empty
          try {
            const histSnap = await db.collection("history").get();
            if (histSnap.empty) {
              console.log("React: Seeding system history to Firebase Firestore...");
              await db.collection("history").add({ email: "mohantn617@gmail.com", event: "Sign Up", timestamp: "2026-07-01 09:00:23" });
              await db.collection("history").add({ email: "customer@example.com", event: "Sign Up", timestamp: "2026-07-05 14:12:05" });
              await db.collection("history").add({ email: "customer@example.com", event: "Sign In", timestamp: "2026-07-05 14:13:55" });
              await db.collection("history").add({ email: "siva@example.com", event: "Sign Up", timestamp: "2026-07-08 10:15:30" });
            }
          } catch (eHist) {
            console.warn("History check warning:", eHist.message);
          }

          // D. Seed Admin User Doc
          try {
            await db.collection("users").doc("admin_mohantn617").set({
              name: "Mohan K",
              email: "mohantn617@gmail.com",
              role: "admin",
              joinedDate: "2026-08-07"
            }, { merge: true });
          } catch (eUser) {
            console.warn("Admin user seed warning:", eUser.message);
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
        try {
          const userDocRef = db.collection("users").doc(firebaseUser.uid);
          const userSnap = await userDocRef.get();

          let role = (firebaseUser.email && firebaseUser.email.toLowerCase() === 'mohantn617@gmail.com') ? 'admin' : 'customer';
          let name = firebaseUser.displayName || firebaseUser.email.split('@')[0];

          if (userSnap.exists) {
            role = userSnap.data().role || role;
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
            photoURL: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=8b0000&color=ffffff`,
            role
          };
          setUser(loggedInUser);
        } catch (err) {
          console.error("Auth state fetch failed: ", err.message);
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
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
  const handleGoogleSignIn = async () => {
    if (!auth || !db || !googleProvider) return;
    try {
      const result = await auth.signInWithPopup(googleProvider);
      const u = result.user;

      const userDocRef = db.collection("users").doc(u.uid);
      const userSnap = await userDocRef.get();
      
      let role = (u.email && u.email.toLowerCase() === 'mohantn617@gmail.com') ? 'admin' : 'customer';
      let name = u.displayName || u.email.split('@')[0];
      
      if (userSnap.exists) {
        role = userSnap.data().role || role;
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
        photoURL: u.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=8b0000&color=ffffff`,
        role
      };

      setUser(loggedInUser);

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
      if (typeof window !== 'undefined') {
        window.localStorage.clear();
        window.sessionStorage.clear();
      }
      showAlert("Successfully logged out.", 'info');
      setDashboardOpen(false);
    } catch (err) {
      showAlert("Logout Failed: " + err.message, 'error');
    }
  };

  // Admin Dashboard Actions
  const handleDeleteUser = async (uid, email) => {
    if (email?.toLowerCase() === 'mohantn617@gmail.com') return;
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

  const Footer = () => (
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
              <li><button onClick={() => navigate('/shop')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}><i className="fa-solid fa-chevron-right"></i> Daily & Monthly Shop</button></li>
              <li><button onClick={() => navigate('/showcase')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}><i className="fa-solid fa-chevron-right"></i> Calendar Showcase</button></li>
              <li><button onClick={() => navigate('/contact')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}><i className="fa-solid fa-chevron-right"></i> About Company</button></li>
              <li><button onClick={() => navigate('/contact')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}><i className="fa-solid fa-chevron-right"></i> Contact Support</button></li>
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
  );

  const isAdminPage = location.pathname === '/admin';
  const isHomePage = location.pathname === '/';

  return (
    <div>
      {/* 1. Preloader */}
      {!isAdminPage && (
        <div id="preloader" className={preloaderActive ? '' : 'fade-out'}>
          <div className="preloader-content">
            <div className="preloader-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img 
                src="/logo.png" 
                alt="Karpagam Traders Goddess Emblem" 
                style={{ width: '52px', height: '52px', objectFit: 'contain', borderRadius: '50%', boxShadow: '0 4px 15px rgba(212, 175, 55, 0.4)' }} 
                onError={(e) => { e.target.style.display = 'none'; }}
              />
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

      {/* 2.5 Top Live Announcement Ticker */}
      {!isAdminPage && (
        <NotificationTicker 
          notifications={notifications}
          onSelectNotification={() => {
            const el = document.getElementById('notifications-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      )}

      {/* 3. Navigation Header */}
      {!isAdminPage && (
        <Navbar
          user={user}
          cartCount={cart.length}
          notifications={notifications}
          onOpenCart={() => setIsCartOpen(true)}
          onLogout={handleLogout}
          onOpenAuth={() => {
            setAuthModalOpen(true);
          }}
          onOpenDashboard={() => {
            navigate('/admin');
          }}
          showAlert={showAlert}
        />
      )}

      {/* 4. Dedicated Page Views (Routes) */}
      <Routes>
        {/* HOME PAGE VIEW ONLY */}
        <Route path="/" element={
          <>
            <Hero />
            
            {/* Dedicated Daily News & Notifications Feed on Home Page */}
            <NotificationSection notifications={notifications} />

            {/* Quick Banner Callout */}
            <section style={{ padding: '60px 5%', textAlign: 'center', background: 'rgba(255,255,255,0.6)' }}>
              <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary)', fontSize: '2rem', marginBottom: '12px', fontWeight: 800 }}>
                  Welcome to Karpagam Traders Sivakasi
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '24px' }}>
                  Sivakasi's premier offset printing press specializing in Tear-off Daily Tamil Calendars, 12-Sheet Monthly Wall Calendars, customized business cards, and diaries.
                </p>
                <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
                  <button 
                    onClick={() => navigate('/shop')} 
                    style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '12px 28px', borderRadius: '30px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 15px rgba(139,0,0,0.2)' }}
                  >
                    <i className="fa-solid fa-store" style={{ marginRight: '8px' }}></i> Browse Shop & Products
                  </button>
                  <button 
                    onClick={() => navigate('/contact')} 
                    style={{ background: 'white', color: 'var(--primary)', border: '1.5px solid var(--primary)', padding: '12px 24px', borderRadius: '30px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Learn About Us
                  </button>
                </div>
              </div>
            </section>

            {/* Common Footer */}
            <Footer />
          </>
        } />

        {/* ABOUT PAGE VIEW ONLY */}
        <Route path="/about" element={
          <>
            <ContactForm
              selectedService={selectedService}
              onClearService={() => setSelectedService('')}
              showAlert={showAlert}
            />
            <Footer />
          </>
        } />

        {/* SHOWCASE PAGE VIEW ONLY */}
        <Route path="/showcase" element={
          <>
            <div style={{ paddingTop: '40px' }}>
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
            </div>
            <Footer />
          </>
        } />

        {/* SHOP PAGE VIEW ONLY */}
        <Route path="/shop" element={
          <>
            <ProductsSection 
              products={products}
              cart={cart}
              onAddToCart={handleAddToCart}
              onRemoveFromCart={handleRemoveFromCart}
              onClearCart={handleClearCart}
              isCartOpen={isCartOpen}
              onOpenCart={() => setIsCartOpen(true)}
              onCloseCart={() => setIsCartOpen(false)}
              showAlert={showAlert}
            />
            <Footer />
          </>
        } />

        {/* CONTACT PAGE VIEW ONLY */}
        <Route path="/contact" element={
          <>
            <ContactForm
              selectedService={selectedService}
              onClearService={() => setSelectedService('')}
              showAlert={showAlert}
            />
            <Footer />
          </>
        } />

        {/* Dedicated Admin Dashboard Route */}
        <Route path="/admin" element={
          user && (user.email?.toLowerCase() === 'mohantn617@gmail.com' || user.role === 'admin') ? (
            <Dashboard 
              products={products}
              notifications={notifications}
              onAddNotification={handleAddNotification}
              onDeleteNotification={handleDeleteNotification}
              onTogglePinNotification={handleTogglePinNotification}
              onToggleActiveNotification={handleToggleActiveNotification}
              onAddProduct={handleAddProduct}
              onDeleteProduct={handleDeleteProduct}
              onUpdateProductPrice={handleUpdateProductPrice}
              onUpdateProductName={handleUpdateProductName}
              onUpdateProductImage={handleUpdateProductImage}
              onLogout={handleLogout} 
            />
          ) : (
            <div style={{ padding: '80px 24px', textAlign: 'center', minHeight: '80vh', backgroundColor: 'var(--secondary-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa-solid fa-lock" style={{ fontSize: '3.5rem', color: 'var(--primary)', marginBottom: '20px' }}></i>
              <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary)', marginBottom: '10px', fontSize: '2rem', fontWeight: 800 }}>Restricted Access</h2>
              <p style={{ color: 'var(--text-muted)', maxWidth: '450px', margin: '0 auto 20px', fontSize: '1rem', lineHeight: 1.5 }}>Administrator credentials required to access this dashboard.</p>
              <button className="auth-btn" onClick={() => setAuthModalOpen(true)} style={{ marginTop: '20px', borderRadius: '30px', padding: '12px 30px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(139, 0, 0, 0.15)' }}>Log In as Admin</button>
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

      {/* 6. Animated Premium Auth Modal Overlay */}
      {authModalOpen && (
        <div className="auth-overlay open animated-backdrop" onClick={(e) => e.target.classList.contains('auth-overlay') && handleCloseAuth()}>
          <div className="auth-modal luxury-modal-card" style={{ maxWidth: '440px', padding: '0', borderRadius: '28px', overflow: 'hidden' }}>
            {/* Modal Header */}
            <div className="auth-modal-header" style={{
              background: 'linear-gradient(135deg, #8b0000 0%, #dc2626 100%)',
              color: 'white',
              padding: '24px 28px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'relative'
            }}>
              <div>
                <span style={{ background: 'rgba(255,255,255,0.2)', color: '#ffd700', fontSize: '0.72rem', fontWeight: 800, padding: '3px 10px', borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <i className="fa-solid fa-bolt" style={{ marginRight: '4px' }}></i> Fast Access
                </span>
                <h3 className="auth-title" id="auth-modal-title" style={{ fontSize: '1.45rem', fontWeight: 800, color: 'white', marginTop: '6px', margin: 0 }}>
                  Welcome to Karpagam Traders
                </h3>
              </div>
              <button className="close-auth-btn" onClick={handleCloseAuth} style={{ color: 'white', opacity: 0.85, background: 'rgba(255,255,255,0.15)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Modal Body Content */}
            <div className="auth-forms-container" style={{ textAlign: 'center', padding: '28px 24px 32px', background: '#ffffff' }}>
              <p style={{ color: '#475569', fontSize: '0.96rem', marginBottom: '22px', lineHeight: 1.6, fontWeight: 500 }}>
                Sign in with your Google account for 1-click access to calendar pricing, quick checkout, and direct inquiries.
              </p>

              {/* Feature Highlights Badges */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '26px' }}>
                <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', fontSize: '0.75rem', fontWeight: 700, padding: '6px 12px', borderRadius: '20px' }}>
                  <i className="fa-solid fa-shield-halved" style={{ color: '#16a34a', marginRight: '5px' }}></i> 100% Secure
                </span>
                <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', fontSize: '0.75rem', fontWeight: 700, padding: '6px 12px', borderRadius: '20px' }}>
                  <i className="fa-solid fa-cart-shopping" style={{ color: '#8b0000', marginRight: '5px' }}></i> Saved Cart
                </span>
                <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', fontSize: '0.75rem', fontWeight: 700, padding: '6px 12px', borderRadius: '20px' }}>
                  <i className="fa-solid fa-truck-fast" style={{ color: '#2563eb', marginRight: '5px' }}></i> Order Tracking
                </span>
              </div>

              {/* Enhanced Google Sign-In Action Button */}
              <button type="button" className="auth-google-btn pulse-google-btn" onClick={handleGoogleSignIn} style={{
                width: '100%',
                justifyContent: 'center',
                padding: '14px 22px',
                borderRadius: '50px',
                border: '2px solid #e2e8f0',
                boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                background: '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }}>
                <svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '12px' }}>
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                <span style={{ fontWeight: 800, fontSize: '1rem', color: '#1e293b' }}>Continue with Google</span>
              </button>

              <div style={{ margin: '18px 0 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Administrator</span>
                <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
              </div>

              {/* Direct Administrator Access Button */}
              <button 
                type="button" 
                onClick={() => {
                  const adminUser = {
                    id: 'admin_mohantn617',
                    name: 'Mohan K',
                    email: 'mohantn617@gmail.com',
                    photoURL: '/logo.png',
                    role: 'admin'
                  };
                  setUser(adminUser);
                  setAuthModalOpen(false);
                  showAlert('Logged in as Administrator (Mohan K). Welcome back!', 'success');
                  navigate('/admin');
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  borderRadius: '50px',
                  border: '1.5px solid #8b0000',
                  background: 'rgba(139, 0, 0, 0.04)',
                  color: '#8b0000',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#8b0000'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(139, 0, 0, 0.04)'; e.currentTarget.style.color = '#8b0000'; }}
              >
                <i className="fa-solid fa-user-shield"></i> Direct Admin Access (Mohan K)
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
                                <button className="action-btn-danger" onClick={() => handleDeleteUser(item.id, item.email)} disabled={item.email?.toLowerCase() === 'mohantn617@gmail.com'} style={{ opacity: item.email?.toLowerCase() === 'mohantn617@gmail.com' ? 0.5 : 1, cursor: item.email?.toLowerCase() === 'mohantn617@gmail.com' ? 'not-allowed' : 'pointer' }}><i className="fa-solid fa-trash-can"></i> Delete</button>
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

      {/* Global Shopping Cart Drawer & WhatsApp Checkout */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onRemoveFromCart={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onUpdateQuantity={handleUpdateQuantity}
        showAlert={showAlert}
        user={user}
      />

      {/* Global Floating Cart Pill Button (accessible on shop/showcase/contact when cart has items, HIDDEN on Home page) */}
      {!isAdminPage && !isHomePage && cart.length > 0 && !isCartOpen && (
        <button
          className="global-floating-cart-pill"
          onClick={() => setIsCartOpen(true)}
          title="Open Shopping Cart"
          style={{
            position: 'fixed',
            bottom: '28px',
            right: '28px',
            zIndex: 9999,
            background: 'linear-gradient(135deg, #8b0000 0%, #b22222 100%)',
            color: 'white',
            border: '2px solid rgba(212, 175, 55, 0.7)',
            borderRadius: '50px',
            padding: '12px 22px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            boxShadow: '0 8px 30px rgba(139, 0, 0, 0.45)',
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <i className="fa-solid fa-cart-shopping" style={{ fontSize: '1.25rem', color: '#ffd700' }}></i>
            <span style={{
              position: 'absolute',
              top: '-8px',
              right: '-10px',
              background: '#ffffff',
              color: '#8b0000',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.72rem',
              fontWeight: 900,
              boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
            }}>
              {cart.reduce((s, i) => s + (i.quantity || 1), 0)}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9 }}>Cart ({cart.reduce((s, i) => s + (i.quantity || 1), 0)})</span>
            <strong style={{ fontSize: '1rem', fontWeight: 800 }}>₹{cart.reduce((s, i) => s + (i.price * (i.quantity || 1)), 0)}</strong>
          </div>
        </button>
      )}

    </div>
  );
}

export default App;
