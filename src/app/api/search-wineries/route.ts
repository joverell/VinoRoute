import { NextResponse } from 'next/server';
import { initializeFirebaseAdmin } from '@/utils/firebase-admin';
import { Client, Place, TextSearchRequest } from '@googlemaps/google-maps-services-js';
import { Winery } from '@/types';

export async function GET(request: Request) {
  try {
    // --- Initialization and Authentication ---
    const { adminDb, adminAuth } = initializeFirebaseAdmin();

    if (!adminDb || !adminAuth) {
      console.error('Firebase admin initialization failed.');
      return NextResponse.json({ error: 'Firebase admin initialization failed.' }, { status: 500 });
    }

    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid Authorization header.' }, { status: 401 });
    }

    const token = authorization.split('Bearer ')[1];
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      if (!decodedToken.admin) {
        return NextResponse.json({ error: 'Forbidden: User is not an admin.' }, { status: 403 });
      }
    } catch (error) {
      console.error('Auth error:', error);
      return NextResponse.json({ error: 'Unauthorized: Invalid token.' }, { status: 401 });
    }

    // --- Parameter Validation ---
    const url = new URL(request.url);
    const region = url.searchParams.get('region');
    const lat = url.searchParams.get('lat');
    const lng = url.searchParams.get('lng');

    if (!region || !lat || !lng) {
      return NextResponse.json({ error: 'Missing required query parameters: region, lat, or lng.' }, { status: 400 });
    }

    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      const errorMessage = 'The NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable is not set on the server.';
      console.error(`Error: ${errorMessage}`);
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    // --- Main Logic ---

    // 1. Fetch all existing winery names from Firestore to prevent duplicates
    const allLocationsSnapshot = await adminDb.collection('locations').get();
    const existingWineryNames = new Set(allLocationsSnapshot.docs.map(doc => doc.data().name.toLowerCase()));

    // 2. Search for wineries using Google Maps Places API
    const googleMapsClient = new Client({});
    const searchRequest: TextSearchRequest = {
      params: {
        query: `wineries in ${region}`,
        location: { lat: parseFloat(lat), lng: parseFloat(lng) },
        radius: 50000, // 50km radius
        type: 'establishment',
        key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
      timeout: 5000,
    };

    let searchResult;
    try {
      searchResult = await googleMapsClient.textSearch(searchRequest);
    } catch (error: unknown) {
      console.error('Google Maps API error:', error);
      let errorMessage = 'An unknown error occurred while calling Google Maps API.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    const potentialWineries = searchResult.data.results;

    // 3. Compare and filter
    const newWineries = potentialWineries.filter(place => {
      if (!place.name) return false;
      return !existingWineryNames.has(place.name.toLowerCase());
    });

    // 4. Format the results
    const formattedNewWineries = newWineries.map((place: Place) => ({
      name: place.name,
      address: place.formatted_address,
      coords: {
        lat: place.geometry?.location.lat,
        lng: place.geometry?.location.lng,
      },
      region: region,
    }));

    return NextResponse.json(formattedNewWineries);

  } catch (error: unknown) {
    console.error('[search-wineries] A critical, unhandled error occurred:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    const stack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json(
      {
        error: 'A critical server error occurred.',
        details: errorMessage,
        stack: stack
      },
      { status: 500 }
    );
  }
}
