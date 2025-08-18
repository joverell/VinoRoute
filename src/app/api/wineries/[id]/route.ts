import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/utils/firebase-admin';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authorization.split('Bearer ')[1];
    await adminAuth.verifyIdToken(token);

    const { id } = await params;
    const { url } = await request.json();

    if (!id || typeof url !== 'string') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const docId = `loc_${id}`;
    const wineryRef = adminDb.collection('locations').doc(docId);

    const doc = await wineryRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Winery not found' }, { status: 404 });
    }

    await wineryRef.update({ url });

    return NextResponse.json({ success: true, message: 'Winery updated successfully' });
  } catch (error) {
    console.error('Error updating winery:', error);
    if (error instanceof Error && 'code' in error) {
      const firebaseError = error as { code: string; message: string };
      if (firebaseError.code === 'auth/id-token-expired' || firebaseError.code === 'auth/argument-error') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
