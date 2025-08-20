import { NextResponse } from 'next/server';
import { initializeFirebaseAdmin } from '@/utils/firebase-admin';
import { LocationType } from '@/types';
import { v4 as uuidv4 } from 'uuid';

async function parseFormData(request: Request): Promise<{ fields: { [key: string]: string }; files: { [key: string]: File } }> {
  const formData = await request.formData();
  const fields: { [key: string]: string } = {};
  const files: { [key: string]: File } = {};

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      files[key] = value;
    } else {
      fields[key] = value;
    }
  }

  return { fields, files };
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
      const iconFile = files.icon;
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
        const fileContent = Buffer.from(await iconFile.arrayBuffer());
        const destination = `location-type-icons/${uuidv4()}-${iconFile.name}`;
        const file = bucket.file(destination);

        await file.save(fileContent, {
          metadata: {
            contentType: iconFile.type,
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
