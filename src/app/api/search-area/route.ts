import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebaseAdmin } from '@/utils/firebase-admin';
import { LocationType } from '@/types';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export interface PotentialLocation {
    placeId: string;
    name: string;
    address: string;
    searchType: string;
}

interface GooglePlace {
  id: string;
  displayName: {
    text: string;
  };
  formattedAddress: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

async function searchPlacesInBounds(bounds: google.maps.LatLngBoundsLiteral, type: string): Promise<GooglePlace[]> {
  const { north, south, east, west } = bounds;
  const textQuery = type;

  const url = 'https://places.googleapis.com/v1/places:searchText';

  const body = {
    textQuery,
    locationRestriction: {
      rectangle: {
        low: {
          latitude: south,
          longitude: west,
        },
        high: {
          latitude: north,
          longitude: east,
        },
      },
    },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY!,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.error) {
      console.error(`Error searching for ${type} in bounds:`, data.error);
      return [];
    }

    return data.places || [];
  } catch (error) {
    console.error(`Error searching for ${type} in bounds:`, error);
    return [];
  }
}

async function isLocationNew(db: FirebaseFirestore.Firestore, placeId: string): Promise<boolean> {
  const locationRef = db.collection('locations').doc(placeId);
  const doc = await locationRef.get();
  return !doc.exists;
}

export async function POST(req: NextRequest) {
  try {
    const { adminDb: db } = initializeFirebaseAdmin();
    if (!db) {
      return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
    }

    const { bounds } = await req.json();

    if (!bounds) {
      return NextResponse.json({ error: 'Missing bounds' }, { status: 400 });
    }

    const locationTypesSnapshot = await db.collection('location_types').get();
    const locationTypes: LocationType[] = locationTypesSnapshot.docs.map(doc => {
        const data = doc.data() as { singular: string; plural: string, icon?: string };
        return {
          id: doc.id,
          singular: data.singular,
          plural: data.plural,
          icon: data.icon
        };
    });

    const searchTasks = locationTypes.map(lt => searchPlacesInBounds(bounds, lt.singular.toLowerCase()));
    const searchResults = await Promise.all(searchTasks);

    const potentialLocations: PotentialLocation[] = [];
    const seenPlaceIds = new Set<string>();

    for (let i = 0; i < searchResults.length; i++) {
        const places = searchResults[i];
        const searchType = locationTypes[i].singular;

        for (const place of places) {
            if (place.id && !seenPlaceIds.has(place.id)) {
                seenPlaceIds.add(place.id);
                if (await isLocationNew(db, place.id)) {
                    potentialLocations.push({
                        placeId: place.id,
                        name: place.displayName.text,
                        address: place.formattedAddress,
                        searchType: searchType,
                    });
                }
            }
        }
    }

    return NextResponse.json(potentialLocations);
  } catch (error) {
    console.error('Error in search-area API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
