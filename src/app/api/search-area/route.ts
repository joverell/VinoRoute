import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/utils/firebase-admin';
import { Winery } from '@/types';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

async function searchPlacesInBounds(bounds: google.maps.LatLngBoundsLiteral, type: string): Promise<any[]> {
  const { north, south, east, west } = bounds;
  const query = `${type}`;
  const locationBias = `rectangle:${south},${west}|${north},${east}`;

  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&locationbias=${encodeURIComponent(locationBias)}&key=${GOOGLE_MAPS_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.status !== 'OK') {
      console.error(`Error searching for ${type} in bounds:`, data.status, data.error_message);
      return [];
    }
    return data.results || [];
  } catch (error) {
    console.error(`Error searching for ${type} in bounds:`, error);
    return [];
  }
}

async function isLocationNew(placeId: string): Promise<boolean> {
  const locationRef = db.collection('locations').doc(placeId);
  const doc = await locationRef.get();
  return !doc.exists;
}

async function addLocation(place: any, locationTypes: any[]): Promise<Winery | null> {
  const placeId = place.place_id;
  if (!placeId) {
    console.error('Missing place_id for place:', place.name);
    return null;
  }

  const fields = 'name,geometry,formatted_address,website,formatted_phone_number,opening_hours,types,business_status';
  const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_MAPS_API_KEY}`;

  const detailsResponse = await fetch(detailsUrl);
  const detailsData = await detailsResponse.json();

  if (detailsData.status !== 'OK' || !detailsData.result) {
    console.error(`Error fetching details for ${place.name}:`, detailsData.status, detailsData.error_message);
    return null;
  }

  const details = detailsData.result;

  if (details.business_status !== 'OPERATIONAL') {
    console.log(`Skipping non-operational place: ${details.name}`);
    return null;
  }

  // Reverse geocode to get state and a better region
  const reverseGeocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${details.geometry.location.lat},${details.geometry.location.lng}&key=${GOOGLE_MAPS_API_KEY}`;
  const reverseGeocodeResponse = await fetch(reverseGeocodeUrl);
  const reverseGeocodeData = await reverseGeocodeResponse.json();

  let state = 'Unknown';
  let stateAbbr = 'Unknown';
  if (reverseGeocodeData.status === 'OK' && reverseGeocodeData.results[0]) {
    const addressComponents = reverseGeocodeData.results[0].address_components;
    const stateComponent = addressComponents.find((c: any) => c.types.includes('administrative_area_level_1'));
    if (stateComponent) {
      state = stateComponent.long_name;
      stateAbbr = stateComponent.short_name;
    }
  }

  let region = place.vicinity || 'Unknown';
  if (reverseGeocodeData.status === 'OK' && reverseGeocodeData.results[0]) {
      const localityComponent = reverseGeocodeData.results[0].address_components.find((c: any) => c.types.includes('locality'));
      if (localityComponent) {
          region = `${localityComponent.long_name}, ${stateAbbr}`;
      }
  }

  const type = details.types?.includes('winery') ? 'winery' : 'distillery';
  const locationType = locationTypes.find(lt => lt.name.toLowerCase() === type);

  const newLocationData = {
    id: placeId,
    name: details.name,
    coords: {
      lat: details.geometry.location.lat,
      lng: details.geometry.location.lng,
    },
    address: details.formatted_address,
    website: details.website || '',
    phone: details.formatted_phone_number || '',
    region: region,
    type: type,
    openingHours: details.opening_hours || {},
    tags: details.types || [],
    locationTypeId: locationType?.id || null,
  };

  await db.collection('locations').doc(placeId).set(newLocationData);
  console.log(`Added ${details.name} to the database.`);

  const stateMap: { [key: string]: string } = { VIC: "Victoria", SA: "South Australia", WA: "Western Australia", NSW: "New South Wales", TAS: "Tasmania", QLD: "Queensland", ACT: "ACT" };
  const fullStateName = stateMap[stateAbbr] || state;

  const finalWineryObject: Winery = {
      ...newLocationData,
      state: fullStateName,
      locationType: locationType || undefined,
  };

  return finalWineryObject;
}


export async function POST(req: NextRequest) {
  try {
    const { bounds } = await req.json();

    if (!bounds) {
      return NextResponse.json({ error: 'Missing bounds' }, { status: 400 });
    }

    const locationTypesSnapshot = await db.collection('location-types').get();
    const locationTypes = locationTypesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const [wineries, distilleries] = await Promise.all([
      searchPlacesInBounds(bounds, 'winery'),
      searchPlacesInBounds(bounds, 'distillery')
    ]);

    const allPlaces = [...wineries, ...distilleries];
    const newLocations: Winery[] = [];
    const seenPlaceIds = new Set<string>();

    for (const place of allPlaces) {
      if (place.place_id && !seenPlaceIds.has(place.place_id)) {
        seenPlaceIds.add(place.place_id);
        if (await isLocationNew(place.place_id)) {
          const newLocation = await addLocation(place, locationTypes);
          if (newLocation) {
            newLocations.push(newLocation);
          }
        }
      }
    }

    return NextResponse.json(newLocations);
  } catch (error) {
    console.error('Error in search-area API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
