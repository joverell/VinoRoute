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
    <div className="w-full sm:w-96 bg-white shadow-lg p-4 overflow-y-auto z-20 flex-shrink-0 h-full">
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
