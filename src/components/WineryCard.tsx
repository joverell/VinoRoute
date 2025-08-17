import { Winery } from "@/types";

interface WineryCardProps {
  winery: Winery;
  onAddToTrip: (winery: Winery) => void;
  onRemoveFromTrip: (wineryId: number | string) => void;
  isInTrip: boolean;
  onSelect: (winery: Winery) => void;
}

export default function WineryCard({ winery, onAddToTrip, onRemoveFromTrip, isInTrip, onSelect }: WineryCardProps) {
  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onSelect(winery);
  };

  return (
    <div
      className="p-4 bg-white rounded-lg shadow-md transition-colors cursor-pointer hover:bg-teal-50"
      onClick={handleCardClick}
    >
      <div>
        <h3 className="text-lg font-bold text-gray-800">{winery.name}</h3>
        <div className="flex flex-wrap gap-2 mt-2">
          {winery.tags.map((tag) => (
            <span key={tag} className="px-2 py-1 text-xs text-white bg-teal-500 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      </div>
      
      {isInTrip ? (
        <button 
          onClick={() => onRemoveFromTrip(winery.id)}
          className="w-full px-4 py-2 mt-4 text-sm font-bold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Remove from Tour
        </button>
      ) : (
        <button 
          onClick={() => onAddToTrip(winery)}
          className="w-full px-4 py-2 mt-4 text-sm font-bold text-white bg-rose-500 rounded-lg hover:bg-rose-600"
        >
          Add to My Tour
        </button>
      )}
    </div>
  );
}