'use client';

import { ItineraryStop } from '@/utils/itineraryLogic';

interface PrintableItineraryProps {
  itinerary: ItineraryStop[] | null;
  startTime: string;
}

const formatTime = (date: Date) => date.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });
const formatDate = (date: Date) => date.toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

export default function PrintableItinerary({ itinerary, startTime }: PrintableItineraryProps) {
  if (!itinerary || itinerary.length === 0) return null;

  return (
    // This component is hidden on screen and only visible when printing
    <div className="hidden print:block p-8">
      <h1 className="text-3xl font-bold mb-2">Your Winery Tour Itinerary</h1>
      <p className="mb-6 text-lg">Tour starting on {formatDate(new Date(startTime))}</p>
      
      <div className="space-y-4">
        {itinerary.map((stop, index) => (
          // This class helps prevent page breaks inside an itinerary item
          <div key={stop.winery.id} className="p-4 border rounded-lg break-inside-avoid">
            <h2 className="text-xl font-bold">{index + 1}. {stop.winery.name}</h2>
            <p><strong>Arrive:</strong> {formatTime(stop.arrivalTime)}</p>
            <p><strong>Depart:</strong> {formatTime(stop.departureTime)}</p>
            {stop.travelTimeToNext && <p className="mt-2 text-sm italic">Travel to next stop: {stop.travelTimeToNext.text}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}