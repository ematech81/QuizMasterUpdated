import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import {
  initializeAuth,
  getReactNativePersistence,
  getAuth,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: 'AIzaSyBV6XzZ4-w_TgT-fZiFPfVk5cggPc8Jj24',
  authDomain: 'game-app-3980e.firebaseapp.com',
  projectId: 'game-app-3980e',
  storageBucket: 'game-app-3980e.appspot.com',
  messagingSenderId: '234946486699',
  appId: '1:234946486699:web:3d299c5912bd827427b2ee',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const auth =
  Platform.OS === 'web'
    ? getAuth(app)
    : initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });

console.log('Firebase Auth:', auth); // Debug log
console.log('Firestore:', db); // Debug log

export { db, auth };

// import { initializeApp } from 'firebase/app';
// import { getFirestore } from 'firebase/firestore';
// import {
//   initializeAuth,
//   getReactNativePersistence,
//   getAuth,
// } from 'firebase/auth'; // Import for custom auth initialization with AsyncStorage
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { Platform } from 'react-native';

// const firebaseConfig = {
//   apiKey: 'AIzaSyBV6XzZ4-w_TgT-fZiFPfVk5cggPc8Jj24',
//   authDomain: 'game-app-3980e.firebaseapp.com',
//   projectId: 'game-app-3980e',
//   storageBucket: 'game-app-3980e.appspot.com',
//   messagingSenderId: '234946486699',
//   appId: '1:234946486699:web:3d299c5912bd827427b2ee',
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);

// // Initialize Firestore
// const db = getFirestore(app);

// const auth =
//   Platform.OS === 'web'
//     ? getAuth(app)
//     : initializeAuth(app, {
//         persistence: getReactNativePersistence(AsyncStorage),
//       });

// export { db, auth };
