import {initializeApp} from 'firebase/app';
import {getDatabase} from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyB89sImKcslNRbbLq7miY8WYvp1hwUOPHw",
  authDomain: "placemarkerapp.firebaseapp.com",
  databaseURL: "https://placemarkerapp-default-rtdb.firebaseio.com",
  projectId: "placemarkerapp",
  storageBucket: "placemarkerapp.firebasestorage.app",
  messagingSenderId: "131335912241",
  appId: "1:131335912241:web:df65484ddd4659da54ce10"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);