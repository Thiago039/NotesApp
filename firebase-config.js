// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAmDMD1TT7e2_L9wUZ3Z28k_9q6Cs3dM-4",
  authDomain: "notesapp-a4a33.firebaseapp.com",
  projectId: "notesapp-a4a33",
  storageBucket: "notesapp-a4a33.firebasestorage.app",
  messagingSenderId: "110475550785",
  appId: "1:110475550785:web:148256bde3c03ddaa626c0",
  measurementId: "G-QS7JL5THFN"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Enable offline persistence
db.enablePersistence()
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time
      console.log('Persistence failed: Multiple tabs open');
    } else if (err.code == 'unimplemented') {
      // The current browser does not support all of the features required for persistence
      console.log('Persistence not supported by this browser');
    }
  });
