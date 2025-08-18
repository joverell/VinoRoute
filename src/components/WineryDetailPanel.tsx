import { Winery } from '@/types';
import { User } from 'firebase/auth';
import WineryDetail from './WineryDetail';

interface WineryDetailPanelProps {
  winery: Winery;
  onClearSelection: () => void;
  onAddToTrip: (winery: Winery) => void;
  onRemoveFromTrip: (wineryId: number | string) => void;
  isInTrip: boolean;
  user: User | null;
}

export default function WineryDetailPanel({ winery, onClearSelection, onAddToTrip, onRemoveFromTrip, isInTrip, user }: WineryDetailPanelProps) {
  return (
    <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-lg p-4 overflow-y-auto z-20">
      <div className="flex justify-end sm:hidden">
        <button
          onClick={onClearSelection}
          className="p-2 text-gray-500 hover:text-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <WineryDetail
        winery={winery}
        onClearSelection={onClearSelection}
        onAddToTrip={onAddToTrip}
        onRemoveFromTrip={onRemoveFromTrip}
        isInTrip={isInTrip}
        user={user}
      />
    </div>
  );
}
