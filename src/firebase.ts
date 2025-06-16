// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBQ67Rrgyux0yaHNF93ATtMtpgT_qOGJyw",
  authDomain: "melfa-oto.firebaseapp.com",
  projectId: "melfa-oto",
  storageBucket: "melfa-oto.firebasestorage.app",
  messagingSenderId: "745045494453",
  appId: "1:745045494453:web:18c8cb54628de622508cfc",
  measurementId: "G-5T3KLN1YWP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export default app;