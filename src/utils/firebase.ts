import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface FirebaseConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

let firebaseConfig: FirebaseConfig = {};
const firebaseConfigString = process.env.NEXT_PUBLIC_FIREBASE_CONFIG;

if (firebaseConfigString) {
  try {
    firebaseConfig = JSON.parse(firebaseConfigString);
  } catch (e) {
    console.error("Failed to parse NEXT_PUBLIC_FIREBASE_CONFIG:", e);
  }
} else {
  console.error("NEXT_PUBLIC_FIREBASE_CONFIG environment variable not set.");
}

if (!firebaseConfig.projectId) {
  console.error("Firebase config is invalid or missing a projectId.");
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };

// This function handles the file upload to storage and returns the public URL
export async function uploadFileAndGetUrl(file: File, path: string): Promise<string> {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}