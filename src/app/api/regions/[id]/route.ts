import { NextResponse } from 'next/server';
import { initializeFirebaseAdmin } from '@/utils/firebase-admin';
import { Region } from '@/types';

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

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { adminDb } = initializeFirebaseAdmin();
    if (!adminDb) {
        return NextResponse.json({ error: 'Firebase admin not initialized' }, { status: 500 });
    }

    const { id } = await params;
    try {
        const doc = await adminDb.collection('regions').doc(id).get();
        if (!doc.exists) {
            return NextResponse.json({ error: 'Region not found' }, { status: 404 });
        }
        return NextResponse.json(doc.data() as Region);
    } catch (error) {
        console.error(`Error fetching region ${id}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const authError = await auth(request);
    if (authError) return authError;

    const { adminDb } = initializeFirebaseAdmin();
    if (!adminDb) {
        return NextResponse.json({ error: 'Firebase admin not initialized' }, { status: 500 });
    }

    const { id } = await params;
    try {
        const regionData: Partial<Region> = await request.json();
        const docRef = adminDb.collection('regions').doc(id);
        await docRef.update(regionData);
        return NextResponse.json({ success: true, message: `Region ${id} updated successfully` });
    } catch (error) {
        console.error(`Error updating region ${id}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const authError = await auth(request);
    if (authError) return authError;

    const { adminDb } = initializeFirebaseAdmin();
    if (!adminDb) {
        return NextResponse.json({ error: 'Firebase admin not initialized' }, { status: 500 });
    }

    const { id } = await params;
    try {
        await adminDb.collection('regions').doc(id).delete();
        return NextResponse.json({ success: true, message: `Region ${id} deleted successfully` });
    } catch (error) {
        console.error(`Error deleting region ${id}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
