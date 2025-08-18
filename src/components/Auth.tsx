'use client';

import { auth } from '@/utils/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, User } from 'firebase/auth';
import { useAdmin } from '@/hooks/useAdmin';
import Link from 'next/link';

interface AuthProps {
  user: User | null;
}

export default function Auth({ user }: AuthProps) {
  const isAdmin = useAdmin(user);

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
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">Welcome, {user.displayName}</span>
          {isAdmin && (
            <Link href="/admin">
              <span className="px-3 py-1 text-sm font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 cursor-pointer">
                Admin
              </span>
            </Link>
          )}
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