import * as admin from 'firebase-admin';

class FirebaseAdminInitializationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FirebaseAdminInitializationError';
  }
}

const initializeFirebaseAdmin = () => {
  if (admin.apps.length === 0) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      throw new FirebaseAdminInitializationError(
        'Firebase Admin SDK credentials are not set in the environment. Please ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set.'
      );
    }

    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
        databaseURL: `https://vinoroute-e8d8d.firebaseio.com`,
        storageBucket: `${projectId}.appspot.com`,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new FirebaseAdminInitializationError(`Firebase admin initialization error: ${error.message}`);
      }
      throw new FirebaseAdminInitializationError('An unknown error occurred during Firebase admin initialization.');
    }
  }
  return {
    adminDb: admin.firestore(),
    adminAuth: admin.auth(),
    adminStorage: admin.storage(),
  };
};

export { initializeFirebaseAdmin, FirebaseAdminInitializationError };
