// Firebase SDK loaded via CDN (compat mode) in HTML files:
//   <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
//   <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
//   <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>

const firebaseConfig = {
  apiKey: "AIzaSyAGthbd9d8-5c8HYDezMKdv8_0naQ2Jn1o",
  authDomain: "hospital-management-syst-f4b5f.firebaseapp.com",
  projectId: "hospital-management-syst-f4b5f",
  storageBucket: "hospital-management-syst-f4b5f.firebasestorage.app",
  messagingSenderId: "788930281401",
  appId: "1:788930281401:web:3a8e495696fee5c93d4068",
  measurementId: "G-NXJ07EZBWM"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Export instances for use in other modules
window.app = app;
window.auth = auth;
window.db = db;
