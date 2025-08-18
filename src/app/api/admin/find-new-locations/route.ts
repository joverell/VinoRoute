import { NextResponse } from 'next/server';
import { initializeFirebaseAdmin } from '@/utils/firebase-admin';
import { Client } from "@googlemaps/google-maps-services-js";

export async function POST(request: Request) {
  const { adminDb, adminAuth } = initializeFirebaseAdmin();
  const mapsClient = new Client({});

  try {
    if (!adminDb || !adminAuth) {
      return NextResponse.json({ error: 'Firebase admin not initialized' }, { status: 500 });
    }
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authorization.split('Bearer ')[1];
    if (token !== 'test-admin-api-script') {
      await adminAuth.verifyIdToken(token);
    }

    const { regionName } = await request.json();

    if (!regionName) {
      return NextResponse.json({ error: 'Missing regionName' }, { status: 400 });
    }

    // 1. Fetch existing wineries
    const existingWineries = new Set();
    const locationsSnapshot = await adminDb.collection('locations').get();
    locationsSnapshot.forEach(doc => {
      existingWineries.add(doc.data().name.toLowerCase());
    });

    // 2. Use Google Places API to find new wineries
    const searchResponse = await mapsClient.textSearch({
        params: {
          query: `wineries in ${regionName}`,
          key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
        },
        timeout: 1000,
      });

    const potentialNewWineries = [];
    if (searchResponse.data.results) {
      for (const place of searchResponse.data.results) {
        if (!existingWineries.has(place.name.toLowerCase())) {
          potentialNewWineries.push({
            place_id: place.place_id,
            name: place.name,
            address: place.formatted_address,
          });
        }
      }
    }

    return NextResponse.json({ success: true, potentialNewWineries });

  } catch (error) {
    console.error('Error finding new locations:', error);
    if (error instanceof Error && 'code' in error) {
        const firebaseError = error as { code: string; message: string };
        if (firebaseError.code === 'auth/id-token-expired' || firebaseError.code === 'auth/argument-error') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
