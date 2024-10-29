import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, onMessage, getToken } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyCDuoGHrM9DLaWmtGeVn2BnBsC1BOLGGCo",
  authDomain: "spotwise-e1514.firebaseapp.com",
  projectId: "spotwise-e1514",
  storageBucket: "spotwise-e1514.appspot.com",
  messagingSenderId: "363637535625",
  appId: "1:363637535625:web:7827a5835ad7ff655de758",
  measurementId: "G-MEWCKKY1F0"
};

const app = initializeApp(firebaseConfig);
const googleProvider = new GoogleAuthProvider();
const storage = getStorage(app);
const messaging = getMessaging(app);

function initNotification() {
  Notification.requestPermission().then((permission) => {
    if (permission === 'granted') {
      console.log('Notification permission granted.');

      // Get the token and subscribe to the topic
      getToken(messaging, { vapidKey: 'edaA6uV3k9aoxC6VDDiSJBTZZ-nL4UmF8ODh3gp5rWE' }).then((currentToken) => {
        if (currentToken) {
          console.log('Token:', currentToken);
          // Subscribe the token to a topic for updates
          subscribeTokenToTopic(currentToken, 'reservation-updates');
        } else {
          console.log('No Instance ID token available. Request permission to generate one.');
        }
      }).catch((err) => {
        console.log('An error occurred while retrieving token. ', err);
      });
    } else {
      console.log('Unable to get permission to notify.');
    }
  });
}

// Call this function to initialize notification on page load or user action
initNotification();

// Handle incoming messages
onMessage(messaging, (payload) => {
  console.log('Message received. ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon
  };

  if (!("Notification" in window)) {
    console.log("This browser does not support system notifications");
  } else if (Notification.permission === "granted") {
    new Notification(notificationTitle, notificationOptions);
  }
});

// Utility function to subscribe token to topic
function subscribeTokenToTopic(token, topic) {
  fetch('https://iid.googleapis.com/iid/v1/' + token + '/rel/topics/' + topic, {
    method: 'POST',
    headers: new Headers({
      'Authorization': 'edaA6uV3k9aoxC6VDDiSJBTZZ-nL4UmF8ODh3gp5rWE'
    })
  }).then(response => {
    if (response.status < 200 || response.status >= 400) {
      throw 'Error subscribing to topic: ' + response.status + ' - ' + response.text();
    }
    console.log('Subscribed to "' + topic + '"');
  }).catch(error => {
    console.error(error);
  })
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export { googleProvider, storage };
export default app;
