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

export async function PUT(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ id: string }> },
) {
  const { adminDb, adminAuth, adminStorage } = initializeFirebaseAdmin();
  try {
    if (!adminDb || !adminAuth || !adminStorage) {
      return NextResponse.json(
        { error: "Firebase admin not initialized" },
        { status: 500 },
      );
    }
    const authorization = request.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authorization.split("Bearer ")[1];
    await adminAuth.verifyIdToken(token);

    const { fields, files } = await parseFormData(request);
    const { singular, plural } = fields;

    if (!singular && !plural) {
      return NextResponse.json(
        { error: "Invalid request body: at least one of 'singular' or 'plural' must be provided" },
        { status: 400 },
      );
    }

    const params = await paramsPromise;
    const docRef = adminDb.collection("location_types").doc(params.id);
    const doc = await docRef.get();
    const existingData = doc.data() as LocationType;

    const locationTypeData: Partial<Omit<LocationType, "id">> = {
        singular,
        plural,
    };

    if (files.icon) {
      const iconFile = Array.isArray(files.icon) ? files.icon[0] : files.icon;
      if (iconFile) {
        if (existingData.icon) {
          try {
            const oldIconPath = decodeURIComponent(new URL(existingData.icon).pathname.split('/').slice(3).join('/'));
            await adminStorage.bucket().file(oldIconPath).delete();
          } catch (e) {
            console.error("Failed to delete old icon:", e);
          }
        }

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
        locationTypeData.icon = url;
      }
    }

    await docRef.update(locationTypeData);

    return NextResponse.json({
      success: true,
      message: "Location type updated successfully",
    });
  } catch (error) {
    const params = await paramsPromise;
    console.error(`Error updating location type ${params.id}:`, error);
    if (error instanceof Error && "code" in error) {
      const firebaseError = error as { code: string; message: string };
      if (
        firebaseError.code === "auth/id-token-expired" ||
        firebaseError.code === "auth/argument-error"
      ) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ id: string }> },
) {
  const { adminDb, adminAuth } = initializeFirebaseAdmin();
  try {
    if (!adminDb || !adminAuth) {
      return NextResponse.json(
        { error: "Firebase admin not initialized" },
        { status: 500 },
      );
    }
    const authorization = request.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authorization.split("Bearer ")[1];
    await adminAuth.verifyIdToken(token);

    const params = await paramsPromise;
    const docRef = adminDb.collection("location_types").doc(params.id);
    const doc = await docRef.get();
    const existingData = doc.data() as LocationType;

    if (existingData.icon) {
        try {
            const oldIconPath = decodeURIComponent(new URL(existingData.icon).pathname.split('/').slice(3).join('/'));
            await initializeFirebaseAdmin().adminStorage?.bucket().file(oldIconPath).delete();
        } catch (e) {
            console.error("Failed to delete icon:", e);
        }
    }

    await docRef.delete();

    return NextResponse.json({
      success: true,
      message: "Location type deleted successfully",
    });
  } catch (error) {
    const params = await paramsPromise;
    console.error(`Error deleting location type ${params.id}:`, error);
    if (error instanceof Error && "code" in error) {
      const firebaseError = error as { code: string; message: string };
      if (
        firebaseError.code === "auth/id-token-expired" ||
        firebaseError.code === "auth/argument-error"
      ) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
