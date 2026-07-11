const firebaseConfig = {
  apiKey: "AIzaSyA4rNPM2CBHIFCwv5_gdgJYlUluIzTWCLI",
  authDomain: "user-9bc76.firebaseapp.com",
  projectId: "user-9bc76",
  storageBucket: "user-9bc76.firebasestorage.app",
  messagingSenderId: "838539209579",
  appId: "1:838539209579:web:c5f1d7a1d6ee2ca59efa2e"
};

// Check if window.firebase exists
if (!window.firebase) {
  console.error("Firebase SDK not loaded from CDN.");
}

let app;
if (window.firebase && !window.firebase.apps.length) {
  app = window.firebase.initializeApp(firebaseConfig);
} else if (window.firebase) {
  app = window.firebase.app();
}

export const auth = window.firebase ? window.firebase.auth() : null;
export const db = window.firebase ? window.firebase.firestore() : null;
export const googleProvider = window.firebase ? new window.firebase.auth.GoogleAuthProvider() : null;
export default window.firebase;
