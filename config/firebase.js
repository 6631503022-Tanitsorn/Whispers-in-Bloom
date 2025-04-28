import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBiqCulTkL_Yrrl7ohVW2OKyNronw_r_qw",
  authDomain: "whispers-in-bloom.firebaseapp.com",
  databaseURL: "https://whispers-in-bloom-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "whispers-in-bloom",
  storageBucket: "whispers-in-bloom.firebasestorage.app",
  messagingSenderId: "412522247335",
  appId: "1:412522247335:web:bb91a7c520f21e86c91782"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db }; 