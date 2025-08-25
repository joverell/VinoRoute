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
    const { adminAuth } = initializeFirebaseAdmin();
    try {
        const user = await getAuthenticatedUser(request, adminAuth);
        if (!user || !user.admin) { // Check for admin claim
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!adminAuth) {
            return NextResponse.json({ error: 'Firebase admin not initialized' }, { status: 500 });
        }

        const listUsersResult = await adminAuth.listUsers();
        const users = listUsersResult.users.map(userRecord => ({
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName,
            disabled: userRecord.disabled,
            customClaims: userRecord.customClaims,
        }));

        return NextResponse.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
