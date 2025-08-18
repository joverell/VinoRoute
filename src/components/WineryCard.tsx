import { Winery } from "@/types";

interface WineryCardProps {
  winery: Winery;
  onAddToTrip: (winery: Winery) => void;
  onRemoveFromTrip: (wineryId: number | string) => void;
  isInTrip: boolean;
  isSelected: boolean;
  onSelect: (winery: Winery | null) => void;
  onTagClick: (tag: string) => void;
}

const StarRating = ({ rating, count }: { rating: number; count: number }) => {
  const fullStars = Math.round(rating);
  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => (
        <span key={i} className={`text-xl ${i < fullStars ? 'text-yellow-400' : 'text-gray-300'}`}>
          &#9733;
        </span>
      ))}
      <span className="ml-2 text-sm text-gray-600">({count} reviews)</span>
    </div>
  );
};

export default function WineryCard({ winery, onAddToTrip, onRemoveFromTrip, isInTrip, isSelected, onSelect, onTagClick }: WineryCardProps) {
  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent card click when clicking on a button (including tag buttons)
    if ((e.target as HTMLElement).closest('a, button')) {
      return;
    }
    onSelect(isSelected ? null : winery);
  };

  const handleTagClick = (e: React.MouseEvent<HTMLButtonElement>, tag: string) => {
    e.stopPropagation(); // Prevent card click from firing
    onTagClick(tag);
  };

  return (
    <div
      className={`p-4 bg-white rounded-lg shadow-md transition-all duration-300 cursor-pointer ${isSelected ? 'ring-2 ring-teal-500' : 'hover:bg-teal-50'}`}
      onClick={handleCardClick}
    >
      <div>
        <h3 className="text-lg font-bold text-gray-800">{winery.name}</h3>
        {winery.averageRating !== undefined && winery.ratingCount !== undefined && (
          <div className="mt-2">
            <StarRating rating={winery.averageRating} count={winery.ratingCount} />
          </div>
        )}
        <div className="flex flex-wrap gap-2 mt-2">
          {winery.tags.map((tag) => (
            <button
              key={tag}
              onClick={(e) => handleTagClick(e, tag)}
              className="px-2 py-1 text-xs text-white bg-teal-500 rounded-full hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        {isInTrip ? (
          <button
            onClick={() => onRemoveFromTrip(winery.id)}
            className="w-full px-4 py-2 text-sm font-bold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Remove from Tour
          </button>
        ) : (
          <button
            onClick={() => onAddToTrip(winery)}
            className="w-full px-4 py-2 text-sm font-bold text-white bg-rose-500 rounded-lg hover:bg-rose-600"
          >
            Add to My Tour
          </button>
        )}
      </div>
    </div>
  );
}