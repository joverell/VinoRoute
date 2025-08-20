import { NextResponse } from 'next/server';
import { initializeFirebaseAdmin } from '@/utils/firebase-admin';
import { UserRecord } from 'firebase-admin/auth';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    const { adminDb, adminAuth } = initializeFirebaseAdmin();
    if (!adminDb || !adminAuth) {
        return NextResponse.json({ error: 'Firebase admin not initialized' }, { status: 500 });
    }

    try {
        const { id: wineryId } = params;

        // Fetch ratings for the given winery
        const ratingsSnapshot = await adminDb.collection('ratings')
            .where('wineryId', '==', wineryId)
            .orderBy('createdAt', 'desc')
            .get();

        if (ratingsSnapshot.empty) {
            return NextResponse.json([]);
        }

        const ratings = await Promise.all(ratingsSnapshot.docs.map(async (doc) => {
            const ratingData = doc.data();
            let user: UserRecord | null = null;
            let winery: { id: string, name: string } | null = null;

            // Fetch user data
            if (ratingData.userId) {
                try {
                    user = await adminAuth.getUser(ratingData.userId);
                } catch (error) {
                    console.warn(`Could not fetch user ${ratingData.userId}`, error);
                }
            }

            // Fetch winery data
            const wineryRef = adminDb.collection('locations').doc(wineryId);
            const wineryDoc = await wineryRef.get();
            if (wineryDoc.exists) {
                winery = wineryDoc.data();
            }

            return {
                id: doc.id,
                ...ratingData,
                user: user ? { uid: user.uid, displayName: user.displayName || 'Anonymous' } : null,
                winery: winery ? { id: wineryDoc.id, name: winery.name } : null,
            };
        }));

        return NextResponse.json(ratings);
    } catch (error) {
        console.error(`Error fetching ratings for winery ${params.id}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
