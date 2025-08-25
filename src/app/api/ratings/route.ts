import { NextResponse } from 'next/server';
import { initializeFirebaseAdmin } from '@/utils/firebase-admin';
import { Auth, DecodedIdToken } from 'firebase-admin/auth';

async function getAuthenticatedUser(request: Request, adminAuth: Auth | null): Promise<DecodedIdToken | null> {
    if (!adminAuth) return null;
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.substring(7);
    try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        return decodedToken;
    } catch (error) {
        console.error('Error verifying auth token:', error);
        return null;
    }
}

export async function GET(request: Request) {
    const { adminDb, adminAuth } = initializeFirebaseAdmin();
    try {
        const user = await getAuthenticatedUser(request, adminAuth);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Optional: Add admin check if needed
        // if (!user.admin) {
        //     return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        // }

        if (!adminDb) {
            return NextResponse.json({ error: 'Firebase admin not initialized' }, { status: 500 });
        }

        const ratingsSnapshot = await adminDb.collection('ratings').orderBy('createdAt', 'desc').get();

        const ratings = await Promise.all(ratingsSnapshot.docs.map(async (doc) => {
            const ratingData = doc.data();
            let user = null;
            let winery = null;

            if (ratingData.userId) {
                try {
                    const userRecord = await adminAuth.getUser(ratingData.userId);
                    user = { uid: userRecord.uid, displayName: userRecord.displayName || 'Anonymous' };
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (_e) {
                    console.warn(`Could not fetch user ${ratingData.userId}`);
                }
            }

            if (ratingData.wineryId) {
                try {
                    const wineryDoc = await adminDb.collection('locations').doc(ratingData.wineryId).get();
                    if (wineryDoc.exists) {
                        winery = { id: wineryDoc.id, name: wineryDoc.data()?.name || 'Unknown Winery' };
                    }
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (_e) {
                    console.warn(`Could not fetch winery ${ratingData.wineryId}`);
                }
            }

            const { createdAt, ...otherData } = ratingData;

            return {
                id: doc.id,
                ...otherData,
                createdAt: createdAt.toDate().toISOString(),
                user,
                winery,
            };
        }));

        return NextResponse.json(ratings);
    } catch (error) {
        console.error('Error fetching ratings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
  const { adminDb, adminAuth } = initializeFirebaseAdmin();
  try {
    const user = await getAuthenticatedUser(request, adminAuth);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { wineryId, rating, comment } = await request.json();

    if (!wineryId || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!adminDb) {
        return NextResponse.json({ error: 'Firebase admin not initialized' }, { status: 500 });
    }
    const ratingRef = await adminDb.collection('ratings').add({
      wineryId,
      userId: user.uid,
      rating,
      comment,
      createdAt: new Date(),
    });

    // Now, update the average rating for the winery
    const wineryRef = adminDb.collection('locations').doc(wineryId as string);
    const wineryDoc = await wineryRef.get();

    if (!wineryDoc.exists) {
      return NextResponse.json({ error: 'Winery not found' }, { status: 404 });
    }

    const wineryData = wineryDoc.data();
    const oldRating = wineryData?.averageRating || 0;
    const ratingCount = wineryData?.ratingCount || 0;

    const newRatingCount = ratingCount + 1;
    const newAverageRating = (oldRating * ratingCount + rating) / newRatingCount;

    await wineryRef.update({
      averageRating: newAverageRating,
      ratingCount: newRatingCount,
    });

    return NextResponse.json({ id: ratingRef.id }, { status: 201 });
  } catch (error) {
    console.error('Error adding rating:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
