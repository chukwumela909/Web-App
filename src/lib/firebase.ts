import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics } from 'firebase/analytics'

// Firebase configuration - Using local development project for both local and production
const firebaseConfig = {
  apiKey: "AIzaSyDpY3OgTpdlVR5dNIWw36ZOzTllPtOqNFk",
  authDomain: "fahampesa-8c514.firebaseapp.com",
  databaseURL: "https://fahampesa-8c514-default-rtdb.firebaseio.com",
  projectId: "fahampesa-8c514",
  storageBucket: "fahampesa-8c514.firebasestorage.app",
  messagingSenderId: "97127182300",
  appId: "1:97127182300:web:4e20292f842ef99229e919",
  measurementId: "G-HRMY0GPBR2"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)

// Initialize Analytics (only on client side)
let analytics = null
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app)
}

export { analytics }
export default app
