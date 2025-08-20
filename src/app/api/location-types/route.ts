import { NextResponse } from 'next/server';
import { initializeFirebaseAdmin } from '@/utils/firebase-admin';
import { LocationType } from '@/types';
import formidable from 'formidable';
import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function parseFormData(request: Request) {
  const form = formidable({});
  const [fields, files] = await form.parse(request);

  const typedFields: { [key: string]: string } = {};
  for (const key in fields) {
    const value = fields[key];
    if (Array.isArray(value) && value.length > 0) {
      typedFields[key] = value[0];
    }
  }

  return { fields: typedFields, files };
}


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

    const { fields, files } = await parseFormData(request);
    const { singular, plural } = fields;

    if (!singular || !plural) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    let iconUrl = '';
    if (files.icon) {
      const iconFile = Array.isArray(files.icon) ? files.icon[0] : files.icon;
      if (iconFile) {
        const bucket = adminStorage.bucket();
        const fileContent = await fs.readFile(iconFile.filepath);
        const destination = `location-type-icons/${uuidv4()}-${iconFile.originalFilename}`;
        const file = bucket.file(destination);

        await file.save(fileContent, {
          metadata: {
            contentType: iconFile.mimetype,
          },
        });

        const [url] = await file.getSignedUrl({
          action: 'read',
          expires: '03-09-2491',
        });
        iconUrl = url;
      }
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
