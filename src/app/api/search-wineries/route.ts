import { NextResponse } from 'next/server';
import { initializeFirebaseAdmin } from '@/utils/firebase-admin';
import { Client, Place, TextSearchRequest } from '@googlemaps/google-maps-services-js';
import { Winery } from '@/types';

export async function GET(request: Request) {
  const { adminDb, adminAuth } = initializeFirebaseAdmin();

  try {
    if (!adminDb || !adminAuth) {
      throw new Error('Firebase admin not initialized');
    }

    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authorization.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);

    if (!decodedToken.admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const region = url.searchParams.get('region');
  const lat = url.searchParams.get('lat');
  const lng = url.searchParams.get('lng');

  if (!region || !lat || !lng) {
    return NextResponse.json({ error: 'Missing region, lat, or lng parameter' }, { status: 400 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: 'Firebase admin not initialized' }, { status: 500 });
  }

  try {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      console.error('Error: GOOGLE_MAPS_API_KEY environment variable is not set.');
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    // 1. Fetch existing wineries from Firestore
    const locationsCollection = adminDb.collection('locations');
    const snapshot = await locationsCollection.where('region', '==', region).get();
    const existingWineries = snapshot.docs.map(doc => doc.data() as Winery);
    const existingWineryNames = new Set(existingWineries.map(w => w.name.toLowerCase()));

    // 2. Search for wineries using Google Maps Places API
    const googleMapsClient = new Client({});
    const searchRequest: TextSearchRequest = {
      params: {
        query: `wineries in ${region}`,
        location: { lat: parseFloat(lat), lng: parseFloat(lng) },
        radius: 50000, // 50km radius, adjust as needed
        type: 'establishment',
        key: process.env.GOOGLE_MAPS_API_KEY as string,
      },
      timeout: 5000, // milliseconds
    };

    const searchResult = await googleMapsClient.textSearch(searchRequest);
    const potentialWineries = searchResult.data.results;

    // 3. Compare and filter
    const newWineries = potentialWineries.filter(place => {
      if (!place.name) return false;
      // Check if the winery name is already in our database (case-insensitive)
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
  } catch (error) {
    console.error('Error searching for wineries:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
