import { NextResponse } from 'next/server';
import { initializeFirebaseAdmin } from '@/utils/firebase-admin';
import { LocationType } from '@/types';
import { FirebaseAdminInitializationError } from '@/utils/firebase-admin';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { adminDb, adminAuth } = initializeFirebaseAdmin();
  const { id } = await params;
  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authorization.split("Bearer ")[1];
    await adminAuth.verifyIdToken(token);

    const { singular, plural, icon, mapImageUrl } = await request.json();

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

    const locationTypeData: Partial<Omit<LocationType, "id">> = {
        singular,
        plural,
        icon,
        mapImageUrl,
    };

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
  const { adminDb, adminAuth } = initializeFirebaseAdmin();
  const { id } = await params;
  try {
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

    // Note: The icon file in storage is now deleted on the client-side
    // See LocationTypeManagement.tsx handleDelete function
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
