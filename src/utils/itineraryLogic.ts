import { Winery } from "@/types";
import { TripStop } from "@/components/HomePage";

export interface ItineraryStop {
  winery: Winery;
  arrivalTime: Date;
  departureTime: Date;
  travelTimeToNext?: { text: string; value: number };
  warning?: string;
}

export async function calculateRoute(
  directionsService: google.maps.DirectionsService,
  tripStops: TripStop[],
  startTime: string,
  optimize: boolean = false
): Promise<{ itinerary: ItineraryStop[], directions: google.maps.DirectionsResult | null }> {
  
  // --- THIS IS THE FIX ---
  // First, we create a clean, validated list of stops.
  // This filters out any items that might be malformed, missing a 'winery' property, or missing coordinates.
  const validTripStops = tripStops.filter(stop => stop && stop.winery && stop.winery.coords);

  // Now, we use this validated list for all subsequent logic.
  if (validTripStops.length === 0) {
    return { itinerary: [], directions: null };
  }
  if (validTripStops.length === 1) {
    const arrivalTime = new Date(startTime);
    const departureTime = new Date(arrivalTime.getTime() + validTripStops[0].duration * 60 * 1000);
    const itinerary = [{ winery: validTripStops[0].winery, arrivalTime, departureTime }];
    return { itinerary, directions: null };
  }

  let request: google.maps.DirectionsRequest;
  
  if (optimize) {
    const origin = validTripStops[0].winery.coords;
    const waypoints = validTripStops.slice(1).map(stop => ({
      location: stop.winery.coords,
      stopover: true,
    }));
    request = {
      origin: origin,
      destination: origin,
      waypoints: waypoints,
      travelMode: google.maps.TravelMode.DRIVING,
      optimizeWaypoints: true,
    };
  } else {
    const origin = validTripStops[0].winery.coords;
    const destination = validTripStops[validTripStops.length - 1].winery.coords;
    const waypoints = validTripStops.slice(1, -1).map(stop => ({
      location: stop.winery.coords,
      stopover: true,
    }));
    request = {
      origin,
      destination,
      waypoints,
      travelMode: google.maps.TravelMode.DRIVING,
      optimizeWaypoints: false,
    };
  }

  const response = await directionsService.route(request);
  const route = response.routes[0];
  
  let orderedStops: TripStop[];
  if (optimize) {
    const start = validTripStops[0];
    const waypoints = validTripStops.slice(1);
    orderedStops = [start, ...route.waypoint_order.map(i => waypoints[i])];
  } else {
    orderedStops = validTripStops;
  }

  const itinerary: ItineraryStop[] = [];
  let currentTime = new Date(startTime);

  for (let i = 0; i < orderedStops.length; i++) {
    const currentStop = orderedStops[i];
    
    if (i > 0) {
      const leg = route.legs[i - 1];
      const travelDurationSeconds = leg.duration?.value || 0;
      itinerary[i - 1].travelTimeToNext = {
        text: leg.duration?.text || '',
        value: travelDurationSeconds,
      };
      currentTime = new Date(itinerary[i - 1].departureTime.getTime() + travelDurationSeconds * 1000);
    }
    
    const arrivalTime = new Date(currentTime);
    const departureTime = new Date(arrivalTime.getTime() + currentStop.duration * 60 * 1000);
    
    const dayOfWeek = arrivalTime.getDay();
    const hours = arrivalTime.getHours() + arrivalTime.getMinutes() / 60;
    const openingHours = currentStop.winery.openingHours[dayOfWeek];
    let warning: string | undefined;

    if (currentStop.winery.type !== 'custom') {
      if (!openingHours) {
        warning = `Closed on this day.`;
      } else if (hours < openingHours.open) {
        warning = `Arriving before opening time (${openingHours.open}:00).`;
      } else if ((departureTime.getHours() + departureTime.getMinutes() / 60) > openingHours.close) {
        warning = `Departure is after closing time (${openingHours.close}:00).`;
      }
    }

    itinerary.push({
      winery: currentStop.winery,
      arrivalTime,
      departureTime,
      warning,
    });
  }

  return { itinerary, directions: response };
}