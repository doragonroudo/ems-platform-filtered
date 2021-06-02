import firebase from 'firebase';

const firebaseConfig = {
    apiKey: "__FILTERED__",
    authDomain: "__FILTERED__.firebaseapp.com",
    projectId: "__FILTERED__",
    storageBucket: "__FILTERED__.appspot.com",
    messagingSenderId: "__FILTERED__",
    appId: "__FILTERED__",
  };
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

export default db;
