import { NextResponse } from 'next/server';
import { initializeFirebaseAdmin } from '@/utils/firebase-admin';
import { CollectionReference } from 'firebase-admin/firestore';
import { Winery } from '@/types';
import { headers } from 'next/headers';

export async function GET() {
  try {
    const { adminDb } = initializeFirebaseAdmin();
    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase not initialized' }, { status: 500 });
    }

    const locationsSnapshot = await adminDb.collection('locations').get();
    const locations = locationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { adminDb, adminAuth } = initializeFirebaseAdmin();
    if (!adminDb || !adminAuth) {
      return NextResponse.json({ error: 'Firebase admin not initialized' }, { status: 500 });
    }
    const authorization = headers().get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authorization.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userDoc = await adminDb.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    const userData = userDoc.data();
    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const wineryData: Omit<Winery, 'id'> = await request.json();

    // Basic validation
    if (!wineryData.name || !wineryData.coords || !wineryData.region) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const locationsCollection = adminDb.collection('locations');

    // Get the count of documents to generate a new ID
    const snapshot = await locationsCollection.get();
    let maxId = 0;
    snapshot.forEach(doc => {
        const docId = parseInt(doc.id, 10);
        if (!isNaN(docId) && docId > maxId) {
            maxId = docId;
        }
    });
    const newId = maxId + 1;

    const newWinery: Winery = {
        id: newId,
        ...wineryData
    }

    const docRef = locationsCollection.doc(newId.toString());
    await docRef.set(newWinery);

    return NextResponse.json({ success: true, message: 'Location created successfully', id: newId }, { status: 201 });
  } catch (error) {
    console.error('Error creating location:', error);
    if (error instanceof Error && 'code' in error) {
        const firebaseError = error as { code: string; message: string };
        if (firebaseError.code === 'auth/id-token-expired' || firebaseError.code === 'auth/argument-error') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
