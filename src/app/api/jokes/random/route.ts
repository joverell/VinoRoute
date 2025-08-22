import { NextResponse } from 'next/server';
import { initializeFirebaseAdmin } from '@/utils/firebase-admin';

export async function GET() {
  const { adminDb } = initializeFirebaseAdmin();
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase admin not initialized' }, { status: 500 });
    }
    const jokesCollection = adminDb.collection('jokes');
    const snapshot = await jokesCollection.get();
    if (snapshot.empty) {
      return NextResponse.json({ error: 'No jokes found' }, { status: 404 });
    }
    const jokes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];

    return NextResponse.json(randomJoke);
  } catch (error) {
    console.error('Error fetching random joke:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
