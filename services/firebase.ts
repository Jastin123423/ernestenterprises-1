
import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAPT_yNsYSptTnFXNdulSWiOQrI5m924c8",
  authDomain: "ernestenterprises-12fa3.firebaseapp.com",
  projectId: "ernestenterprises-12fa3",
  storageBucket: "ernestenterprises-12fa3.firebasestorage.app",
  messagingSenderId: "978759792840",
  appId: "1:978759792840:web:73dd71f89aa2b6510ecdfd"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with experimentalForceLongPolling to resolve "Backend didn't respond within 10 seconds"
// errors common in certain network environments or web containers where WebSockets are restricted.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

// Export storage instance
export const storageBucket = getStorage(app);
// Increase max upload retry time to 5 minutes (default is 2 min) to help with "Max retry time exceeded"
storageBucket.maxUploadRetryTime = 300000; 
// Increase max operation retry time to 2 minutes
storageBucket.maxOperationRetryTime = 120000;
