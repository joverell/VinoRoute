import { NextResponse } from 'next/server';
import { initializeFirebaseAdmin } from '@/utils/firebase-admin';
import { headers } from 'next/headers';
import { Region } from '@/types';

async function handler(request: Request, { params }: { params: { id: string } }, method: 'PUT' | 'DELETE') {
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

    const { id } = params;
    const regionRef = adminDb.collection('regions').doc(id);

    if (method === 'PUT') {
        const regionData: Partial<Region> = await request.json();
        await regionRef.update(regionData);
        return NextResponse.json({ success: true, message: 'Region updated successfully' });
    }

    if (method === 'DELETE') {
        await regionRef.delete();
        return NextResponse.json({ success: true, message: 'Region deleted successfully' });
    }

  } catch (error) {
    console.error(`Error with region ${method}:`, error);
    if (error instanceof Error && 'code' in error) {
        const firebaseError = error as { code: string; message: string };
        if (firebaseError.code === 'auth/id-token-expired' || firebaseError.code === 'auth/argument-error') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


export async function PUT(request: Request, context: { params: { id: string } }) {
    return handler(request, context, 'PUT');
}

export async function DELETE(request: Request, context: { params: { id: string } }) {
    return handler(request, context, 'DELETE');
}
