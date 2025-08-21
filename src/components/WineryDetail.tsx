import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { Winery } from "@/types";
import { formatAddress } from '@/utils/formatAddress';

interface PopulatedRating {
  id: string;
  wineryId: string | number;
  userId: string;
  rating: number;
  comment?: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
  user: {
    uid: string;
    displayName: string;
  } | null;
  winery: {
    id: string;
    name: string;
  } | null;
}

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

interface WineryDetailProps {
  winery: Winery;
  onClearSelection: () => void;
  onAddToTrip: (winery: Winery) => void;
  onRemoveFromTrip: (wineryId: number | string) => void;
  isInTrip: boolean;
  user: User | null;
}

export default function WineryDetail({ winery, onClearSelection, onAddToTrip, onRemoveFromTrip, isInTrip, user }: WineryDetailProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ratings, setRatings] = useState<PopulatedRating[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [url, setUrl] = useState(winery.url || '');

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        const token = await user.getIdTokenResult();
        setIsAdmin(!!token.claims.admin);
      } else {
        setIsAdmin(false);
      }
    };
    checkAdminStatus();
  }, [user]);

  const fetchRatings = useCallback(async () => {
    try {
      const response = await fetch(`/api/wineries/${winery.id}/ratings`);
      if (response.ok) {
        const data = await response.json();
        setRatings(data);
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  }, [winery.id]);

  useEffect(() => {
    if (winery.id) {
      fetchRatings();
    }
  }, [winery.id, fetchRatings]);

  const handleUrlUpdate = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/locations/${winery.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ url }),
      });
      if (!response.ok) {
        throw new Error('Failed to update URL');
      }
      alert('URL updated successfully!');
    } catch (error) {
      console.error('Error updating URL:', error);
      alert('Failed to update URL.');
    }
  };

  const handleRatingSubmit = async () => {
    if (!user) {
      alert('Please log in to rate this location.');
      return;
    }
    if (rating === 0) {
      alert('Please select a rating.');
      return;
    }
    setIsSubmitting(true);
    try {
      const token = await user.getIdToken();
      await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          wineryId: winery.id,
          rating,
          comment,
        }),
      });
      // Optionally, refresh data or show a success message
      alert('Rating submitted!');
      setRating(0);
      setComment('');
      fetchRatings(); // Re-fetch ratings to show the new one
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Failed to submit rating.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative p-4 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xl font-bold text-gray-800 pr-2">{winery.name}</h3>
        <button
          onClick={onClearSelection}
          className="p-1 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {winery.tags && winery.tags.map((tag) => (
          <span key={tag} className="px-2 py-1 text-xs text-white bg-teal-500 rounded-full">
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="space-y-2 text-sm text-gray-600">
          {winery.address && <p className="flex items-start"><span className="w-20 font-bold shrink-0">Address</span><span className="text-gray-800">{formatAddress(winery.address)}</span></p>}
          {winery.state && <p className="flex items-center"><span className="w-20 font-bold shrink-0">State</span><span className="text-gray-800">{winery.state}</span></p>}
          <p className="flex items-center"><span className="w-20 font-bold shrink-0">Region</span><span className="text-gray-800">{winery.region}</span></p>
          <p className="flex items-center"><span className="w-20 font-bold shrink-0">Type</span><span className="capitalize text-gray-800">{winery.type}</span></p>
          {!isAdmin && winery.url && (
            <p className="flex items-start">
              <span className="w-20 font-bold shrink-0">Website</span>
              <a href={winery.url} target="_blank" rel="noopener noreferrer" className="text-rose-500 hover:underline break-all">
                {winery.url}
              </a>
            </p>
          )}
          {isAdmin && (
            <div className="flex items-center mt-2">
              <label htmlFor="winery-url" className="w-20 font-bold shrink-0">Website</label>
              <input
                id="winery-url"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="https://example.com"
              />
            </div>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="mt-4">
            <button
                onClick={handleUrlUpdate}
                className="w-full px-4 py-2 font-bold text-white bg-blue-500 rounded-lg hover:bg-blue-600"
            >
                Save Changes
            </button>
        </div>
      )}

      {winery.wines && winery.wines.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-lg font-bold text-gray-800 mb-2">Wines</h4>
          <ul>
            {winery.wines.map(wine => (
              <li key={wine.lwin}>
                {wine.name} ({wine.type})
              </li>
            ))}
          </ul>
        </div>
      )}

      {user && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-lg font-bold text-gray-800 mb-2">Rate this location</h4>
          <div className="flex items-center mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
              >
                &#9733;
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional comment"
            className="w-full p-2 border rounded-md"
          />
          <button
            onClick={handleRatingSubmit}
            disabled={isSubmitting}
            className="w-full px-4 py-2 mt-2 font-bold text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Rating'}
          </button>
        </div>
      )}

      <div className="mt-4">
        {isInTrip ? (
          <button
            onClick={() => onRemoveFromTrip(winery.id)}
            className="w-full px-4 py-2 font-bold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Remove from Tour
          </button>
        ) : (
          <button
            onClick={() => onAddToTrip(winery)}
            className="w-full px-4 py-2 font-bold text-white bg-rose-500 rounded-lg hover:bg-rose-600"
          >
            Add to My Tour
          </button>
        )}
      </div>

      {ratings.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-lg font-bold text-gray-800 mb-2">Comments and Ratings</h4>
          <div className="space-y-4">
            {ratings.map((r) => (
              <div key={r.id} className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center mb-1">
                  <p className="font-bold text-sm mr-2">{r.user?.displayName || 'Anonymous'}</p>
                  <StarRating rating={r.rating} />
                </div>
                {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
