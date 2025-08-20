import { NextResponse } from 'next/server';
import { initializeFirebaseAdmin } from '@/utils/firebase-admin';
import { Wine } from '@/types';

export async function GET(request: Request) {
  try {
    const { adminDb, adminAuth } = initializeFirebaseAdmin();
    if (!adminDb || !adminAuth) {
      return NextResponse.json({ error: 'Firebase admin initialization failed.' }, { status: 500 });
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

    const locationsSnapshot = await adminDb.collection('locations').get();
    const allWines: any[] = [];

    for (const locationDoc of locationsSnapshot.docs) {
      const winesSnapshot = await locationDoc.ref.collection('wines').get();
      winesSnapshot.forEach(wineDoc => {
        allWines.push({
          ...wineDoc.data(),
          locationId: locationDoc.id,
          locationName: locationDoc.data().name,
        });
      });
    }

    return NextResponse.json(allWines);
  } catch (error) {
    console.error('Error fetching all wines:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
