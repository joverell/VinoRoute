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

async function checkAdmin(request: Request, adminAuth: Auth | null) {
    const user = await getAuthenticatedUser(request, adminAuth);
    if (!user || !user.admin) {
        return false;
    }
    return true;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { adminAuth } = initializeFirebaseAdmin();
    if (!await checkAdmin(request, adminAuth)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        if (!adminAuth) {
            return NextResponse.json({ error: 'Firebase admin not initialized' }, { status: 500 });
        }
        const userRecord = await adminAuth.getUser(id);
        return NextResponse.json(userRecord.toJSON());
    } catch (error) {
        console.error(`Error fetching user:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { adminAuth } = initializeFirebaseAdmin();
    if (!await checkAdmin(request, adminAuth)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        if (!adminAuth) {
            return NextResponse.json({ error: 'Firebase admin not initialized' }, { status: 500 });
        }
        const { disabled, admin } = await request.json();

        await adminAuth.updateUser(id, {
            disabled,
        });

        if (typeof admin !== 'undefined') {
            await adminAuth.setCustomUserClaims(id, { admin });
        }

        return NextResponse.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error(`Error updating user:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { adminAuth } = initializeFirebaseAdmin();
    if (!await checkAdmin(request, adminAuth)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        if (!adminAuth) {
            return NextResponse.json({ error: 'Firebase admin not initialized' }, { status: 500 });
        }
        await adminAuth.deleteUser(id);
        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(`Error deleting user:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
