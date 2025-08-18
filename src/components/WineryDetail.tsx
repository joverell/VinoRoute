import { useState } from 'react';
import { User } from 'firebase/auth';
import { Winery } from "@/types";

interface WineryDetailProps {
  winery: Winery;
  onClearSelection: () => void;
  onAddToTrip: (winery: Winery) => void;
  onRemoveFromTrip: (wineryId: number | string) => void;
  isInTrip: boolean;
  user: User | null;
  onWineryRated: () => void;
}

export default function WineryDetail({ winery, onClearSelection, onAddToTrip, onRemoveFromTrip, isInTrip, user, onWineryRated }: WineryDetailProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      onWineryRated();
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Failed to submit rating.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <button
        onClick={onClearSelection}
        className="text-sm text-teal-500 hover:underline mb-4"
      >
        &larr; Back to list
      </button>
      <h3 className="text-xl font-bold text-gray-800 mb-2">{winery.name}</h3>
      <div className="flex flex-wrap gap-2 mt-2">
        {winery.tags.map((tag) => (
          <span key={tag} className="px-2 py-1 text-xs text-white bg-teal-500 rounded-full">
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="space-y-2 text-sm text-gray-600">
          {winery.address && <p className="flex items-start"><span className="w-20 font-bold shrink-0">Address</span><span className="text-gray-800">{winery.address}</span></p>}
          {winery.state && <p className="flex items-center"><span className="w-20 font-bold shrink-0">State</span><span className="text-gray-800">{winery.state}</span></p>}
          <p className="flex items-center"><span className="w-20 font-bold shrink-0">Region</span><span className="text-gray-800">{winery.region}</span></p>
          <p className="flex items-center"><span className="w-20 font-bold shrink-0">Type</span><span className="capitalize text-gray-800">{winery.type}</span></p>
        </div>
      </div>

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
    </div>
  );
}
