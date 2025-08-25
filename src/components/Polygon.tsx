import { useEffect, useState } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

interface PolygonProps {
  paths: google.maps.LatLngLiteral[];
  options?: google.maps.PolygonOptions;
}

export default function Polygon({ paths, options }: PolygonProps) {
  const map = useMap();
  const mapsLibrary = useMapsLibrary('maps');
  const [polygon, setPolygon] = useState<google.maps.Polygon | null>(null);

  useEffect(() => {
    if (!mapsLibrary || !map) return;
    if (!polygon) {
      setPolygon(new mapsLibrary.Polygon({ ...options, paths, map }));
    }
  }, [mapsLibrary, map, options, paths, polygon]);

  return null;
}
