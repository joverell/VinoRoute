import { Pin } from '@vis.gl/react-google-maps';

interface NumberedPinProps {
  number: number;
  color?: string;
  borderColor?: string;
  glyphColor?: string;
}

export default function NumberedPin({ number, color = '#FF5757', borderColor = 'white', glyphColor = 'white' }: NumberedPinProps) {
  return (
    <Pin
      background={color}
      borderColor={borderColor}
      glyphColor={glyphColor}
    >
      {number}
    </Pin>
  );
}
