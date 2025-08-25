'use client';

import { useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { useToast } from '@/context/ToastContext';

interface User {
  uid: string;
  email?: string;
  displayName?: string;
  disabled: boolean;
  customClaims?: {
    admin?: boolean;
  };
}

interface UserManagementProps {
  user: FirebaseUser | null;
}

const UserManagement = ({ user }: UserManagementProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editedUser, setEditedUser] = useState<Partial<User> | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const token = await user.getIdToken(true);
        const response = await fetch('/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An unknown error occurred';
        showToast(message, 'error', { operation: 'fetchUsers' });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user, showToast]);

  if (loading) return <div>Loading users...</div>;

  const handleDelete = async (uid: string) => {
    if (!user || !confirm('Are you sure you want to delete this user? This action is irreversible.')) return;

    if (uid === user.uid) {
      showToast("You cannot delete your own account.", 'error');
      return;
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/users/${uid}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }

      setUsers(users.filter(u => u.uid !== uid));
      showToast('User deleted successfully.', 'success', { operation: 'handleDelete', uid });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'An unknown error occurred';
        showToast(message, 'error', { operation: 'handleDelete', uid });
    }
  };

  const handleEdit = (userToEdit: User) => {
    setEditingUserId(userToEdit.uid);
    setEditedUser({
      disabled: userToEdit.disabled,
      customClaims: { admin: userToEdit.customClaims?.admin || false }
    });
  };

  const handleUpdate = async (uid: string) => {
    if (!user || !editedUser) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/users/${uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            disabled: editedUser.disabled,
            admin: editedUser.customClaims?.admin
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update user');
      }

      setUsers(users.map(u => u.uid === uid ? { ...u, ...editedUser } : u));
      setEditingUserId(null);
      setEditedUser(null);
      showToast('User updated successfully.', 'success', { operation: 'handleUpdate', uid });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      showToast(message, 'error', { operation: 'handleUpdate', uid });
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">User Management ({users.length})</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">UID</th>
              <th className="py-2 px-4 border-b">Email</th>
              <th className="py-2 px-4 border-b">Name</th>
              <th className="py-2 px-4 border-b">Admin</th>
              <th className="py-2 px-4 border-b">Disabled</th>
              <th className="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.uid}>
                <td className="py-2 px-4 border-b">{u.uid}</td>
                <td className="py-2 px-4 border-b">{u.email}</td>
                <td className="py-2 px-4 border-b">{u.displayName}</td>
                <td className="py-2 px-4 border-b">
                  {editingUserId === u.uid ? (
                    <input
                      type="checkbox"
                      checked={editedUser?.customClaims?.admin || false}
                      onChange={(e) => setEditedUser({ ...editedUser, customClaims: { admin: e.target.checked } })}
                    />
                  ) : (
                    u.customClaims?.admin ? 'Yes' : 'No'
                  )}
                </td>
                <td className="py-2 px-4 border-b">
                  {editingUserId === u.uid ? (
                    <input
                      type="checkbox"
                      checked={editedUser?.disabled || false}
                      onChange={(e) => setEditedUser({ ...editedUser, disabled: e.target.checked })}
                    />
                  ) : (
                    u.disabled ? 'Yes' : 'No'
                  )}
                </td>
                <td className="py-2 px-4 border-b">
                  {editingUserId === u.uid ? (
                    <>
                      <button onClick={() => handleUpdate(u.uid)} className="px-3 py-1 text-sm bg-green-500 text-white rounded-md hover:bg-green-600">Save</button>
                      <button onClick={() => { setEditingUserId(null); setEditedUser(null); }} className="px-3 py-1 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 ml-2">Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleEdit(u)} className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600">Edit</button>
                      <button onClick={() => handleDelete(u.uid)} className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 ml-2">Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
