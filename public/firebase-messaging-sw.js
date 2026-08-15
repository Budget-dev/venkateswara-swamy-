importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDx6BT_mZwvqH3GxtWrX3MUxpwElWCTKno",
  authDomain: "gen-lang-client-0694904523.firebaseapp.com",
  projectId: "gen-lang-client-0694904523",
  storageBucket: "gen-lang-client-0694904523.firebasestorage.app",
  messagingSenderId: "344505212467",
  appId: "1:344505212467:web:558038816dd91e92688d46"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || 'Queue Alert';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/icon.png'
  };

  self.registration.showNotification(notificationTitle,
    notificationOptions);
});
