import { NextResponse } from 'next/server';
import { initializeFirebaseAdmin } from '@/utils/firebase-admin';
import { Winery } from '@/types';

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
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
    const { adminDb } = initializeFirebaseAdmin();
    if (!adminDb) {
        return NextResponse.json({ error: 'Firebase admin not initialized' }, { status: 500 });
    }

    try {
        const doc = await adminDb.collection('locations').doc(params.id).get();
        if (!doc.exists) {
            return NextResponse.json({ error: 'Location not found' }, { status: 404 });
        }
        return NextResponse.json(doc.data() as Winery);
    } catch (error) {
        console.error(`Error fetching location ${params.id}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    const authError = await auth(request);
    if (authError) return authError;

    const { adminDb } = initializeFirebaseAdmin();
    if (!adminDb) {
        return NextResponse.json({ error: 'Firebase admin not initialized' }, { status: 500 });
    }

    try {
        const locationData: Partial<Winery> = await request.json();
        const docRef = adminDb.collection('locations').doc(params.id);
        await docRef.update(locationData);
        return NextResponse.json({ success: true, message: `Location ${params.id} updated successfully` });
    } catch (error) {
        console.error(`Error updating location ${params.id}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const authError = await auth(request);
    if (authError) return authError;

    const { adminDb } = initializeFirebaseAdmin();
    if (!adminDb) {
        return NextResponse.json({ error: 'Firebase admin not initialized' }, { status: 500 });
    }

    try {
        await adminDb.collection('locations').doc(params.id).delete();
        return NextResponse.json({ success: true, message: `Location ${params.id} deleted successfully` });
    } catch (error) {
        console.error(`Error deleting location ${params.id}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
