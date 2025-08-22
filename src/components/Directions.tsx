import { useEffect, useState } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

interface DirectionsProps {
  directions: google.maps.DirectionsResult;
  options?: google.maps.DirectionsRendererOptions;
}

export default function Directions({ directions, options }: DirectionsProps) {
  const map = useMap();
  const routesLibrary = useMapsLibrary('routes');
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);

  useEffect(() => {
    if (!routesLibrary || !map) return;
    if (!directionsRenderer) {
      setDirectionsRenderer(new routesLibrary.DirectionsRenderer({ ...options, map }));
    }
  }, [routesLibrary, map, options, directionsRenderer]);

  useEffect(() => {
    if (directionsRenderer) {
      directionsRenderer.setDirections(directions);
    }
  }, [directionsRenderer, directions]);

  return null;
}
