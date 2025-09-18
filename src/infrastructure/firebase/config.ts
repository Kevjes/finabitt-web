import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBW9xX-lAjI8PSeRwUKIlBQYiVzhier8EQ',
  appId: '1:992386793776:web:25f2c47f0d3fe201b208f5',
  messagingSenderId: '992386793776',
  projectId: 'finabitt05f45',
  authDomain: 'finabitt05f45.firebaseapp.com',
  storageBucket: 'finabitt05f45.firebasestorage.app',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;