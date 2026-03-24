import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCpRcrmy7QtAWSmupe1rCJUwXeBZAuTKjI",
  authDomain: "smartbus-36119.firebaseapp.com",
  projectId: "smartbus-36119",
  storageBucket: "smartbus-36119.firebasestorage.app",
  messagingSenderId: "345366583409",
  appId: "1:345366583409:web:f12eb27ba50ac66ea8e3d0",
  measurementId: "G-6X1WYWNXMW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const microsoftProvider = new OAuthProvider('microsoft.com');
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export { auth, googleProvider, microsoftProvider, analytics };
