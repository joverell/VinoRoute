import { NextResponse } from 'next/server';
import { initializeFirebaseAdmin } from '@/utils/firebase-admin';
import { Joke } from '@/types';

export async function GET(request: Request) {
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
    const decodedToken = await adminAuth.verifyIdToken(token);

    if (!decodedToken.admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const jokesCollection = adminDb.collection('jokes');
    const snapshot = await jokesCollection.orderBy('createdAt', 'desc').get();
    const jokes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Joke));

    return NextResponse.json(jokes);
  } catch (error) {
    console.error('Error fetching jokes:', error);
    if (error instanceof Error && 'code' in error) {
        const firebaseError = error as { code: string; message: string };
        if (firebaseError.code === 'auth/id-token-expired' || firebaseError.code === 'auth/argument-error') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

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
    const decodedToken = await adminAuth.verifyIdToken(token);

    if (!decodedToken.admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const jokesCollection = adminDb.collection('jokes');
    const newJoke = {
      text,
      createdAt: new Date().toISOString(),
    };

    const docRef = await jokesCollection.add(newJoke);

    return NextResponse.json({ id: docRef.id, ...newJoke }, { status: 201 });
  } catch (error) {
    console.error('Error creating joke:', error);
    if (error instanceof Error && 'code' in error) {
        const firebaseError = error as { code: string; message: string };
        if (firebaseError.code === 'auth/id-token-expired' || firebaseError.code === 'auth/argument-error') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
