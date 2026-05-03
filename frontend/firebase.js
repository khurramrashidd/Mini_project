import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCrK5ymItcTCr0PI255cF2Vvtof5hGtsjo",
  authDomain: "cryptominiproject.firebaseapp.com",
  projectId: "cryptominiproject",
  storageBucket: "cryptominiproject.firebasestorage.app",
  messagingSenderId: "499838752678",
  appId: "1:499838752678:web:9302206461aff5e66d2167",
  measurementId: "G-9S52XSJFT2"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();