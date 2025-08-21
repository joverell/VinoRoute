import { NextResponse } from 'next/server';
import { initializeFirebaseAdmin, FirebaseAdminInitializationError } from '@/utils/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    const { adminDb, adminAuth } = initializeFirebaseAdmin();

    const authorization = request.headers.get('Authorization');
    let userId: string | undefined;

    if (authorization?.startsWith('Bearer ')) {
      const token = authorization.split('Bearer ')[1];
      try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        userId = decodedToken.uid;
      } catch (error) {
        console.warn('Warning: Could not verify user token for message logging.', error);
        // Do not return an error, as we still want to log the message
      }
    }

    const { text, type, metadata } = await request.json();

    if (!text || !type) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const messagesCollection = adminDb.collection('messages');
    await messagesCollection.add({
      text,
      type,
      timestamp: FieldValue.serverTimestamp(),
      userId,
      metadata,
    });

    return NextResponse.json({ success: true, message: 'Message logged successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error logging message:', error);
    if (error instanceof FirebaseAdminInitializationError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
