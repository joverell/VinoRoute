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

export async function POST(request: Request, { params }: { params: { id: string } }) {
    const authError = await auth(request);
    if (authError) return authError;

    const { adminDb } = initializeFirebaseAdmin();
    if (!adminDb) {
        return NextResponse.json({ error: 'Firebase admin not initialized' }, { status: 500 });
    }

    try {
        const wineData: Omit<Wine, 'lwin'> = await request.json();
        const wineWithLwin: Wine = { ...wineData, lwin: `new-${Date.now()}` };

        const locationRef = adminDb.collection('locations').doc(params.id);
        await locationRef.update({
            wines: FieldValue.arrayUnion(wineWithLwin)
        });

        return NextResponse.json({ success: true, message: 'Wine added successfully', wine: wineWithLwin });
    } catch (error) {
        console.error(`Error adding wine to location ${params.id}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
