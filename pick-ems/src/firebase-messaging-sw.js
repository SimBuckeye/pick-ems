console.log("🔥 firebase-messaging-sw.js loaded");
self.addEventListener('install', () => console.log("🔥 SW installed"));
self.addEventListener('activate', () => console.log("🔥 SW activated"));

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyC8tLyIU5qbHDflEuhuyogmDIBz3PYn0bk",
  authDomain: "pick-ems-9704b.firebaseapp.com",
  // The value of `databaseURL` depends on the location of the database
  databaseURL: "https://pick-ems-9704b-default-rtdb.firebaseio.com/",
  projectId: "pick-ems-9704b",
  // The value of `storageBucket` depends on when you provisioned your default bucket
  storageBucket: "pick-ems-9704b.firebasestorage.app",
  messagingSenderId: "874445096448",
  appId: "1:874445096448:web:8b9a1bb6dcc1800183bae5",
  // For Firebase JavaScript SDK v7.20.0 and later, `measurementId` is an optional field
  measurementId: "G-L46NLPC81H",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();
