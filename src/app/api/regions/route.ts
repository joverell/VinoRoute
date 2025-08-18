import { NextResponse } from 'next/server';
import { initializeFirebaseAdmin } from '@/utils/firebase-admin';
import { Region } from '@/types';

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

    const regionData: Region = await request.json();

    // Basic validation
    if (!regionData.name || !regionData.center || !regionData.state) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const regionsCollection = adminDb.collection('regions');

    // Use region name as document id, after some sanitization
    const docId = regionData.name.toLowerCase().replace(/, /g, '-').replace(/ /g, '-');
    const docRef = regionsCollection.doc(docId);

    const doc = await docRef.get();
    if (doc.exists) {
        return NextResponse.json({ error: 'Region already exists' }, { status: 409 });
    }

    await docRef.set(regionData);

    return NextResponse.json({ success: true, message: 'Region created successfully', id: docId }, { status: 201 });
  } catch (error) {
    console.error('Error creating region:', error);
    if (error instanceof Error && 'code' in error) {
        const firebaseError = error as { code: string; message: string };
        if (firebaseError.code === 'auth/id-token-expired' || firebaseError.code === 'auth/argument-error') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  const { adminDb } = initializeFirebaseAdmin();
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase admin not initialized' }, { status: 500 });
    }
    const regionsCollection = adminDb.collection('regions');
    const snapshot = await regionsCollection.get();
    const regions = snapshot.docs.map(doc => doc.data() as Region);

    return NextResponse.json(regions);
  } catch (error) {
    console.error('Error fetching regions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
