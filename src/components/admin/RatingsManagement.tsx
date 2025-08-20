'use client';

import { useState, useEffect } from 'react';
import { Rating } from '@/types';
import { User } from 'firebase/auth';

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
        >
          &#9733;
        </span>
      ))}
    </div>
  );
};

interface RatingsManagementProps {
  user: User | null;
}

const RatingsManagement = ({ user }: RatingsManagementProps) => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRatingId, setEditingRatingId] = useState<string | null>(null);
  const [editedComment, setEditedComment] = useState('');

  useEffect(() => {
    const fetchRatings = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const token = await user.getIdToken();
        const response = await fetch('/api/ratings', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch ratings');
        }
        const data = await response.json();
        setRatings(data);
        setError(null);
      } catch (err) {
        if (err instanceof Error) setError(err.message);
        else setError('An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!user || !confirm('Are you sure you want to delete this rating?')) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/ratings/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete rating');
      }

      setRatings(ratings.filter(r => r.id !== id));
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError('An unknown error occurred');
    }
  };

  if (loading) return <div>Loading ratings...</div>;
  if (error) return <div>Error: {error}</div>;

  const handleEdit = (rating: Rating) => {
    setEditingRatingId(rating.id);
    setEditedComment(rating.comment || '');
  };

  const handleUpdate = async (id: string) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/ratings/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ comment: editedComment })
      });

      if (!response.ok) {
        throw new Error('Failed to update rating');
      }

      setRatings(ratings.map(r => r.id === id ? { ...r, comment: editedComment } : r));
      setEditingRatingId(null);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError('An unknown error occurred');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Ratings & Comments ({ratings.length})</h2>
      <div className="space-y-4">
        {ratings.map(rating => (
          <div key={rating.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div>
                <p><strong>Winery:</strong> {rating.winery?.name || rating.wineryId}</p>
                <p><strong>User:</strong> {rating.user?.displayName || rating.userId}</p>
                <div className="flex items-center">
                  <strong className="mr-2">Rating:</strong>
                  <StarRating rating={rating.rating} />
                </div>
              </div>
              <p className="text-sm text-gray-500">{new Date(rating.createdAt).toLocaleDateString()}</p>
            </div>
            {editingRatingId === rating.id ? (
              <textarea
                value={editedComment}
                onChange={(e) => setEditedComment(e.target.value)}
                className="w-full mt-2 p-2 border rounded"
              />
            ) : (
              <p><strong>Comment:</strong> {rating.comment}</p>
            )}
            <div className="mt-2 space-x-2">
              {editingRatingId === rating.id ? (
                <>
                  <button onClick={() => handleUpdate(rating.id)} className="px-3 py-1 text-sm bg-green-500 text-white rounded-md hover:bg-green-600">Save</button>
                  <button onClick={() => setEditingRatingId(null)} className="px-3 py-1 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600">Cancel</button>
                </>
              ) : (
                <>
                  <button onClick={() => handleEdit(rating)} className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600">Edit</button>
                  <button onClick={() => handleDelete(rating.id)} className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600">Delete</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RatingsManagement;
