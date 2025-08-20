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

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { adminDb, adminAuth } = initializeFirebaseAdmin();
    try {
        const { id } = await params;
        const user = await getAuthenticatedUser(request, adminAuth);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!adminDb) {
            return NextResponse.json({ error: 'Firebase admin not initialized' }, { status: 500 });
        }

        const ratingDoc = await adminDb.collection('ratings').doc(id).get();

        if (!ratingDoc.exists) {
            return NextResponse.json({ error: 'Rating not found' }, { status: 404 });
        }

        return NextResponse.json({ id: ratingDoc.id, ...ratingDoc.data() });
    } catch (error) {
        console.error(`Error fetching rating:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { adminDb, adminAuth } = initializeFirebaseAdmin();
    try {
        const { id } = await params;
        const user = await getAuthenticatedUser(request, adminAuth);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!adminDb) {
            return NextResponse.json({ error: 'Firebase admin not initialized' }, { status: 500 });
        }

        const { comment } = await request.json();

        await adminDb.collection('ratings').doc(id).update({
            comment: comment || '',
        });

        return NextResponse.json({ message: 'Rating updated successfully' });
    } catch (error) {
        console.error(`Error updating rating:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { adminDb, adminAuth } = initializeFirebaseAdmin();
    try {
        const { id } = await params;
        const user = await getAuthenticatedUser(request, adminAuth);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!adminDb) {
            return NextResponse.json({ error: 'Firebase admin not initialized' }, { status: 500 });
        }

        await adminDb.collection('ratings').doc(id).delete();

        return NextResponse.json({ message: 'Rating deleted successfully' });
    } catch (error) {
        console.error(`Error deleting rating:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
