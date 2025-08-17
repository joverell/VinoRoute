'use client';

import { auth } from '@/utils/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, User } from 'firebase/auth';

interface AuthProps {
  user: User | null;
}

export default function Auth({ user }: AuthProps) {
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google: ", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <div className="p-4">
      {user ? (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Welcome, {user.displayName}</span>
          <button onClick={handleLogout} className="px-3 py-1 text-sm font-bold text-white bg-gray-500 rounded-lg hover:bg-gray-600">
            Logout
          </button>
        </div>
      ) : (
        <button onClick={handleLogin} className="w-full px-4 py-2 font-bold text-white bg-blue-500 rounded-lg hover:bg-blue-600">
          Login with Google to Save
        </button>
      )}
    </div>
  );
}