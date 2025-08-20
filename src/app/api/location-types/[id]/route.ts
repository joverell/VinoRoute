import { NextResponse } from 'next/server';
import { initializeFirebaseAdmin } from '@/utils/firebase-admin';
import { LocationType } from '@/types';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
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

    const locationTypeData: Partial<Omit<LocationType, 'id'>> = await request.json();

    if (!locationTypeData.name && !locationTypeData.mapImageUrl) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const docRef = adminDb.collection('location_types').doc(params.id);
    await docRef.update(locationTypeData);

    return NextResponse.json({ success: true, message: 'Location type updated successfully' });
  } catch (error) {
    console.error(`Error updating location type ${params.id}:`, error);
    if (error instanceof Error && 'code' in error) {
        const firebaseError = error as { code: string; message: string };
        if (firebaseError.code === 'auth/id-token-expired' || firebaseError.code === 'auth/argument-error') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
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

    const docRef = adminDb.collection('location_types').doc(params.id);
    await docRef.delete();

    return NextResponse.json({ success: true, message: 'Location type deleted successfully' });
  } catch (error) {
    console.error(`Error deleting location type ${params.id}:`, error);
    if (error instanceof Error && 'code' in error) {
        const firebaseError = error as { code: string; message: string };
        if (firebaseError.code === 'auth/id-token-expired' || firebaseError.code === 'auth/argument-error') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
