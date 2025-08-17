import { ItineraryStop } from "@/utils/itineraryLogic";

interface ItineraryResultProps {
  itinerary: ItineraryStop[];
  onBack: () => void;
}

const formatTime = (date: Date) => date.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });

export default function ItineraryResult({ itinerary, onBack }: ItineraryResultProps) {
  return (
    <div className="p-4">
      <button onClick={onBack} className="mb-4 text-sm font-semibold text-teal-600 hover:text-teal-800">
        &larr; Back to Planner
      </button>
      <h2 className="text-2xl font-bold text-gray-800">Your Itinerary</h2>
      <div className="flex flex-col gap-4 mt-4">
        {itinerary.map((stop, index) => (
          <div key={stop.winery.id} className={`p-3 rounded-lg ${stop.warning ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
            <h3 className="font-bold">{index + 1}. {stop.winery.name}</h3>
            <p className="text-sm">Arrive: <span className="font-semibold">{formatTime(stop.arrivalTime)}</span></p>
            <p className="text-sm">Depart: <span className="font-semibold">{formatTime(stop.departureTime)}</span></p>
            {stop.warning && <p className="mt-1 text-xs font-bold text-red-600">Warning: {stop.warning}</p>}
            {stop.travelTimeToNext && <p className="mt-2 text-xs text-gray-500"><em>Travel to next: {stop.travelTimeToNext.text}</em></p>}
          </div>
        ))}
      </div>
    </div>
  );
}