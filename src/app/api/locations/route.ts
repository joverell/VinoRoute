import { NextResponse } from 'next/server';
import { initializeFirebaseAdmin } from '@/utils/firebase-admin';
import { Winery } from '@/types';

export async function POST(request: Request) {
  const { adminDb, adminAuth } = initializeFirebaseAdmin();
  try {
    if (!adminDb || !adminAuth) {
      return NextResponse.json({ error: 'Firebase admin not initialized' }, { status: 500 });
    }
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authorization.split('Bearer ')[1];
    await adminAuth.verifyIdToken(token);

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
