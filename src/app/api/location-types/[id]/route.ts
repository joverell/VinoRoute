import { NextResponse } from 'next/server';
import { initializeFirebaseAdmin } from '@/utils/firebase-admin';
import { LocationType } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { FirebaseAdminInitializationError } from '@/utils/firebase-admin';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { adminDb, adminAuth, adminStorage } = initializeFirebaseAdmin();
  const { id } = await params;
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

    const formData = await request.formData();
    const singular = formData.get('singular') as string;
    const plural = formData.get('plural') as string;
    const iconFile = formData.get('icon') as File | null;

    if (!singular || !plural) {
      return NextResponse.json(
        { error: "Invalid request body: singular and plural are required" },
        { status: 400 },
      );
    }

    const docRef = adminDb.collection("location_types").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
        return NextResponse.json({ error: 'Location type not found' }, { status: 404 });
    }
    const existingData = doc.data() as LocationType;

    const locationTypeData: Partial<Omit<LocationType, "id">> = {
        singular,
        plural,
    };

    if (iconFile) {
      if (existingData.icon) {
        try {
          const oldIconUrl = new URL(existingData.icon);
          const oldIconPath = decodeURIComponent(oldIconUrl.pathname).split('/o/')[1];
          if (oldIconPath) {
            await adminStorage.bucket(process.env.FIREBASE_STORAGE_BUCKET).file(oldIconPath).delete();
          }
        } catch (e) {
            console.error("Failed to delete old icon:", e);
        }
      }

      const bucket = adminStorage.bucket(process.env.FIREBASE_STORAGE_BUCKET);
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
      locationTypeData.icon = url;
    }

    await docRef.update(locationTypeData);

    return NextResponse.json({
      success: true,
      message: "Location type updated successfully",
    });
  } catch (error) {
    console.error(`Error updating location type ${id}:`, error);
    if (error instanceof FirebaseAdminInitializationError) {
      return NextResponse.json({ error: `Firebase Admin initialization failed: ${error.message}` }, { status: 500 });
    }
    if (error instanceof Error) {
        if ("code" in error) {
            const firebaseError = error as { code: string; message: string };
            if (
                firebaseError.code === "auth/id-token-expired" ||
                firebaseError.code === "auth/argument-error"
            ) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
        }
        if (error.message.includes("does not exist")) {
            return NextResponse.json({ error: "Storage bucket not found. Please check the FIREBASE_STORAGE_BUCKET environment variable in your .env.local file." }, { status: 500 });
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
  { params }: { params: Promise<{ id: string }> },
) {
  const { adminDb, adminAuth, adminStorage } = initializeFirebaseAdmin();
  const { id } = await params;
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

    const docRef = adminDb.collection("location_types").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
        return NextResponse.json({ error: 'Location type not found' }, { status: 404 });
    }
    const existingData = doc.data() as LocationType;

    if (existingData.icon) {
        try {
            // Extract the path from the storage URL
            const oldIconUrl = new URL(existingData.icon);
            const oldIconPath = decodeURIComponent(oldIconUrl.pathname).split('/o/')[1];
            if (oldIconPath) {
                const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
                if (!storageBucket) {
                    console.error("FIREBASE_STORAGE_BUCKET environment variable not set.");
                    // We can choose to not throw an error here and let the deletion of the DB record proceed
                } else {
                    await adminStorage.bucket(storageBucket).file(oldIconPath).delete();
                }
            }
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
    console.error(`Error deleting location type ${id}:`, error);
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
