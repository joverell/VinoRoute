import { NextResponse } from 'next/server';
import { initializeFirebaseAdmin } from '@/utils/firebase-admin';
import { Region } from '@/types';
import { headers } from 'next/headers';

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
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
  try {
    const { adminDb } = initializeFirebaseAdmin();
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
