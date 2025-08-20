import { NextResponse } from 'next/server';
import { initializeFirebaseAdmin } from '@/utils/firebase-admin';
import { LocationType } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  const { adminDb, adminAuth, adminStorage } = initializeFirebaseAdmin();
  try {
    if (!adminDb || !adminAuth || !adminStorage) {
      return NextResponse.json({ error: 'Firebase admin not initialized' }, { status: 500 });
    }
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authorization.split('Bearer ')[1];
    await adminAuth.verifyIdToken(token);

    const formData = await request.formData();
    const singular = formData.get('singular') as string;
    const plural = formData.get('plural') as string;
    const iconFile = formData.get('icon') as File | null;

    if (!singular || !plural) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    let iconUrl = '';
    if (iconFile) {
      const bucket = adminStorage.bucket();
      const buffer = Buffer.from(await iconFile.arrayBuffer());
      const destination = `location-type-icons/${uuidv4()}-${iconFile.name}`;
      const file = bucket.file(destination);

      await file.save(buffer, {
        metadata: {
          contentType: iconFile.type,
        },
      });

      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: '03-09-2491',
      });
      iconUrl = url;
    }

    const locationTypeData: Omit<LocationType, 'id'> = {
      singular,
      plural,
      icon: iconUrl,
    };

    const locationTypesCollection = adminDb.collection('location_types');
    const docRef = await locationTypesCollection.add(locationTypeData);

    return NextResponse.json({ success: true, message: 'Location type created successfully', id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error('Error creating location type:', error);
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
    const locationTypesCollection = adminDb.collection('location_types');
    const snapshot = await locationTypesCollection.get();
    const locationTypes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LocationType));

    return NextResponse.json(locationTypes);
  } catch (error) {
    console.error('Error fetching location types:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
