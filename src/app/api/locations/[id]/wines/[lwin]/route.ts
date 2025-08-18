import { NextResponse } from 'next/server';
import { initializeFirebaseAdmin } from '@/utils/firebase-admin';
import { Wine } from '@/types';
import { FieldValue } from 'firebase-admin/firestore';

async function auth(request: Request) {
    const { adminAuth } = initializeFirebaseAdmin();
    if (!adminAuth) {
        return new Response(JSON.stringify({ error: 'Firebase admin not initialized' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    const token = authorization.split('Bearer ')[1];
    try {
        await adminAuth.verifyIdToken(token);
        return null;
    } catch {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string, lwin: string } }) {
    const authError = await auth(request);
    if (authError) return authError;

    const { adminDb } = initializeFirebaseAdmin();
    if (!adminDb) {
        return NextResponse.json({ error: 'Firebase admin not initialized' }, { status: 500 });
    }

    try {
        const locationRef = adminDb.collection('locations').doc(params.id);
        const locationDoc = await locationRef.get();

        if (!locationDoc.exists) {
            return NextResponse.json({ error: 'Location not found' }, { status: 404 });
        }

        const locationData = locationDoc.data();
        const wines: Wine[] = locationData?.wines || [];

        const wineToDelete = wines.find(wine => wine.lwin === params.lwin);

        if (!wineToDelete) {
            return NextResponse.json({ error: 'Wine not found' }, { status: 404 });
        }

        await locationRef.update({
            wines: FieldValue.arrayRemove(wineToDelete)
        });

        return NextResponse.json({ success: true, message: 'Wine deleted successfully' });
    } catch (error) {
        console.error(`Error deleting wine ${params.lwin} from location ${params.id}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
