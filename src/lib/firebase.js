// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDut67p76S-dtZddcXrtjHA94F3VGtS4Og",
    authDomain: "ecovecino-d017f.firebaseapp.com",
    projectId: "ecovecino-d017f",
    storageBucket: "ecovecino-d017f.firebasestorage.app",
    messagingSenderId: "377006069148",
    appId: "1:377006069148:web:4d371b5c1333ae933e6459",
    measurementId: "G-08CFJXVHDF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Authentication and Firestore services
export const auth = getAuth(app);
export const db = getFirestore(app);
