import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebaseAdmin } from '@/utils/firebase-admin';
import { Winery, LocationType } from '@/types';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

interface GooglePlace {
    place_id: string;
    name: string;
    vicinity?: string;
    [key: string]: unknown;
}

interface AddressComponent {
    long_name: string;
    short_name: string;
    types: string[];
}

async function addLocation(db: FirebaseFirestore.Firestore, placeId: string, searchType: string): Promise<Winery | null> {
    if (!placeId) {
        console.error('Missing place_id for place');
        return null;
    }

    const fields = 'place_id,name,geometry,formatted_address,website,formatted_phone_number,opening_hours,types,business_status,vicinity';
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_MAPS_API_KEY}`;

    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();

    if (detailsData.status !== 'OK' || !detailsData.result) {
        console.error(`Error fetching details for ${placeId}:`, detailsData.status, detailsData.error_message);
        return null;
    }

    const details = detailsData.result;
    const place: GooglePlace = details;


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
        const addressComponents = reverseGeocodeData.results[0].address_components as AddressComponent[];
        const stateComponent = addressComponents.find((c: AddressComponent) => c.types.includes('administrative_area_level_1'));
        if (stateComponent) {
            state = stateComponent.long_name;
            stateAbbr = stateComponent.short_name;
        }
    }

    let region = place.vicinity || 'Unknown';
    if (reverseGeocodeData.status === 'OK' && reverseGeocodeData.results[0]) {
        const addressComponents = reverseGeocodeData.results[0].address_components as AddressComponent[];
        const localityComponent = addressComponents.find((c: AddressComponent) => c.types.includes('locality'));
        if (localityComponent) {
            region = `${localityComponent.long_name}, ${stateAbbr}`;
        }
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

    let locationType: LocationType | undefined;

    // First, try to find the location type based on the search query that found this place
    if (searchType) {
        locationType = locationTypes.find(lt => lt.singular.toLowerCase() === searchType.toLowerCase());
    }

    // If not found by search type, try to infer from Google's types (fallback)
    if (!locationType && details.types) {
        for (const type of locationTypes) {
            // Check if any of the Google-provided types match the singular name of our location types
            if (details.types.includes(type.singular.toLowerCase())) {
                locationType = type;
                break;
            }
        }
    }

    if (!locationType) {
        console.log(`Skipping ${details.name} as it does not match any known location types.`);
        return null;
    }

    const newLocationData: {
        id: string;
        name: string;
        coords: { lat: number; lng: number };
        address: string;
        url: string;
        phone: string;
        region: string;
        type: 'winery' | 'distillery' | 'custom';
        openingHours: { [key: number]: { open: number; close: number } | null };
        tags: string[];
        locationTypeId?: string;
    } = {
        id: placeId,
        name: details.name,
        coords: {
            lat: details.geometry.location.lat,
            lng: details.geometry.location.lng,
        },
        address: details.formatted_address,
        url: details.website || '',
        phone: details.formatted_phone_number || '',
        region: region,
        type: locationType.singular as 'winery' | 'distillery' | 'custom',
        openingHours: details.opening_hours || {},
        tags: details.types || [],
    };

    if (locationType.id) {
        newLocationData.locationTypeId = locationType.id;
    }

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
        const { adminDb: db } = initializeFirebaseAdmin();
        if (!db) {
            return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
        }

        const { placeId, searchType } = await req.json();

        if (!placeId || !searchType) {
            return NextResponse.json({ error: 'Missing placeId or searchType' }, { status: 400 });
        }

        const newLocation = await addLocation(db, placeId, searchType);

        if (newLocation) {
            return NextResponse.json(newLocation);
        } else {
            return NextResponse.json({ error: 'Failed to add location' }, { status: 500 });
        }
    } catch (error) {
        console.error('Error in add-location API:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
