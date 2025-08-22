import { NextResponse } from 'next/server';
import { initializeFirebaseAdmin } from '@/utils/firebase-admin';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { adminDb, adminAuth } = initializeFirebaseAdmin();
  let id: string | undefined;
  try {
    if (!adminDb || !adminAuth) {
      return NextResponse.json({ error: 'Firebase admin not initialized' }, { status: 500 });
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

    const { id: jokeId } = await params;
    id = jokeId;
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const jokeRef = adminDb.collection('jokes').doc(id);
    const doc = await jokeRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Joke not found' }, { status: 404 });
    }

    await jokeRef.update({ text });

    return NextResponse.json({ id, text });
  } catch (error) {
    console.error(`Error updating joke ${id}:`, error);
    if (error instanceof Error && 'code' in error) {
        const firebaseError = error as { code: string; message: string };
        if (firebaseError.code === 'auth/id-token-expired' || firebaseError.code === 'auth/argument-error') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { adminDb, adminAuth } = initializeFirebaseAdmin();
  let id: string | undefined;
  try {
    if (!adminDb || !adminAuth) {
      return NextResponse.json({ error: 'Firebase admin not initialized' }, { status: 500 });
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

    const { id: jokeId } = await params;
    id = jokeId;
    const jokeRef = adminDb.collection('jokes').doc(id);
    const doc = await jokeRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Joke not found' }, { status: 404 });
    }

    await jokeRef.delete();

    return NextResponse.json({ message: 'Joke deleted successfully' });
  } catch (error) {
    console.error(`Error deleting joke ${id}:`, error);
    if (error instanceof Error && 'code' in error) {
        const firebaseError = error as { code: string; message: string };
        if (firebaseError.code === 'auth/id-token-expired' || firebaseError.code === 'auth/argument-error') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
