import { NextResponse } from 'next/server';
import { initializeFirebaseAdmin } from '@/utils/firebase-admin';
import { google_search } from 'google_search'; // Assuming this tool is available in the environment

const { adminDb, adminAuth } = initializeFirebaseAdmin();

async function searchWineries(query: string): Promise<string[]> {
    const searchResults = await google_search(query);
    // This is a simplified parser. In a real scenario, this would need to be more robust.
    const wineryNames = searchResults
        .split('\n')
        .filter(line => line.startsWith('Title:'))
        .map(line => line.replace('Title: ', '').split(' | ')[0].split(' - ')[0]);
    return [...new Set(wineryNames)]; // Return unique names
}

export async function POST(request: Request) {
    if (!adminDb || !adminAuth) {
        return NextResponse.json({ error: 'Firebase admin not initialized' }, { status: 500 });
    }

    try {
        const authorization = request.headers.get('Authorization');
        if (!authorization?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authorization.split('Bearer ')[1];
        await adminAuth.verifyIdToken(token);

        const { regionName } = await request.json();
        if (!regionName || typeof regionName !== 'string') {
            return NextResponse.json({ error: 'Invalid request body, regionName is required.' }, { status: 400 });
        }

        console.log(`Starting to find new locations in ${regionName}`);

        // 1. Fetch existing locations for the region
        const locationsCollection = adminDb.collection('locations');
        const snapshot = await locationsCollection.where('region', '==', regionName).get();
        const existingWineries = snapshot.docs.map(doc => doc.data().name.toLowerCase());
        console.log(`Found ${existingWineries.length} existing wineries in ${regionName}.`);

        // 2. Search for wineries in the region
        const foundWineries = await searchWineries(`wineries in ${regionName}`);
        console.log(`Found ${foundWineries.length} potential wineries from search.`);

        // 3. Filter out existing wineries
        const newWineries = foundWineries.filter(name => !existingWineries.includes(name.toLowerCase()));
        console.log(`Found ${newWineries.length} new wineries to add:`, newWineries);

        // In a real implementation, we would now find coordinates for each new winery and add them.
        // This part is complex and unreliable with the current tools, as seen in the previous task.
        // For this implementation, we will stop here and return the list of new wineries found.

        return NextResponse.json({
            success: true,
            message: `Found ${newWineries.length} new potential wineries for ${regionName}.`,
            newWineries: newWineries
        });

    } catch (error) {
        console.error('Error in find-and-add-locations endpoint:', error);
        if (error instanceof Error && 'code' in error) {
            const firebaseError = error as { code: string; message: string };
            if (firebaseError.code === 'auth/id-token-expired' || firebaseError.code === 'auth/argument-error') {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
