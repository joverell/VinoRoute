'use client';

import { useState, useEffect, useCallback } from 'react';
import { Joke } from '@/types';
import { User } from 'firebase/auth';
import { useToast } from '@/context/ToastContext';

interface JokeManagementProps {
  user: User | null;
}

const JokeManagement = ({ user }: JokeManagementProps) => {
  const [jokes, setJokes] = useState<Joke[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const [isEditing, setIsEditing] = useState<Joke | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [jokeText, setJokeText] = useState('');

  const fetchJokes = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/jokes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch jokes');
      }
      const data = await response.json();
      setJokes(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      showToast(message, 'error', { operation: 'fetchJokes' });
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    fetchJokes();
  }, [fetchJokes]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const operation = isEditing ? 'update' : 'add';
    const successMessage = `Joke ${operation === 'update' ? 'updated' : 'added'} successfully`;

    try {
      const payload = { text: jokeText };
      const token = await user.getIdToken();
      const url = isEditing ? `/api/admin/jokes/${isEditing.id}` : '/api/admin/jokes';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Failed to ${operation} joke` }));
        throw new Error(errorData.error || `Failed to ${isEditing ? 'update' : 'add'} joke`);
      }

      await fetchJokes();
      cancelForm();
      showToast(successMessage, 'success', { operation: 'handleFormSubmit', isEditing });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      showToast(message, 'error', { operation: 'handleFormSubmit', isEditing });
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !confirm('Are you sure you want to delete this joke?')) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/jokes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete joke' }));
        throw new Error(errorData.error);
      }

      setJokes(jokes.filter(j => j.id !== id));
      showToast('Joke deleted successfully', 'success', { operation: 'handleDelete', id });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      showToast(message, 'error', { operation: 'handleDelete', id });
    }
  };

  const startEditing = (joke: Joke) => {
    setIsEditing(joke);
    setJokeText(joke.text);
    setIsAdding(false);
  };

  const startAdding = () => {
    setIsAdding(true);
    setIsEditing(null);
    setJokeText('');
  }

  const cancelForm = () => {
    setIsAdding(false);
    setIsEditing(null);
    setJokeText('');
  }

  if (loading) return <div>Loading jokes...</div>;

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Joke Management ({jokes.length})</h2>

      {isAdding || isEditing ? (
        <form onSubmit={handleFormSubmit} className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-2">{isEditing ? 'Edit' : 'Add'} Joke</h3>
          <div className="space-y-4">
            <textarea
              placeholder="Enter joke text"
              value={jokeText}
              onChange={(e) => setJokeText(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border rounded-md"
              rows={4}
            />
          </div>
          <div className="mt-4 space-x-2">
            <button type="submit" className="px-4 py-2 bg-[#FF5757] text-white font-bold rounded-md hover:bg-[#E04A4A]">
              {isEditing ? 'Update' : 'Add'}
            </button>
            <button type="button" onClick={cancelForm} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-4">
          <button onClick={startAdding} className="px-6 py-3 bg-green-500 text-white font-bold rounded-lg shadow-md hover:bg-green-600 text-lg">
            + Add New Joke
          </button>
        </div>
      )}

      <div className="space-y-4">
        {jokes.map(joke => (
          <div key={joke.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex justify-between items-center">
            <p className="text-sm">{joke.text}</p>
            <div className="space-x-2 flex-shrink-0">
              <button onClick={() => startEditing(joke)} className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600">Edit</button>
              <button onClick={() => handleDelete(joke.id)} className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JokeManagement;
