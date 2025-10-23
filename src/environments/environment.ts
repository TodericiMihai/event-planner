import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

export const environment = {
  firebaseConfig: {
    apiKey: "AIzaSyCig5Vdoh3T57-u4jVRwH7KMTOB65s_uZs",
    authDomain: "event-planner-a61af.firebaseapp.com",
    databaseURL: "https://event-planner-a61af-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "event-planner-a61af",
    storageBucket: "event-planner-a61af.firebasestorage.app",
    messagingSenderId: "181736921822",
    appId: "1:181736921822:web:5f8082ab8f6178b68ac04f",
    measurementId: "G-ZBRP1LJQY7"
  },
  production: false
};

// Initialize Firebase
const app = initializeApp(environment.firebaseConfig);
const analytics = getAnalytics(app);
