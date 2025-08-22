import { Pin } from '@vis.gl/react-google-maps';
import { Winery } from '@/types';

interface WineryPinProps {
  winery: Winery;
  isSelected: boolean;
}

export default function WineryPin({ winery, isSelected }: WineryPinProps) {
  if (winery.locationType && winery.locationType.mapImageUrl) {
    return (
      <img
        src={winery.locationType.mapImageUrl}
        alt={winery.name}
        style={{
          width: isSelected ? '48px' : '32px',
          height: isSelected ? '48px' : '32px',
          transform: 'translate(-50%, -50%)',
        }}
      />
    );
  }

  return (
    <Pin
      background={isSelected ? '#000000' : '#FF5757'}
      borderColor="white"
      glyphColor="white"
    />
  );
}
