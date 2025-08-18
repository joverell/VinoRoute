import * as admin from 'firebase-admin';

const initializeFirebaseAdmin = () => {
  if (admin.apps.length === 0) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
      console.warn('Firebase admin environment variables are not set. Skipping initialization.');
      // Return null or mock instances if you want to allow the app to run without firebase admin
      return { adminDb: null, adminAuth: null };
    }
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
      });
    } catch (error) {
      console.error('Firebase admin initialization error', error);
      return { adminDb: null, adminAuth: null };
    }
  }
  return {
    adminDb: admin.firestore(),
    adminAuth: admin.auth(),
  };
};

export { initializeFirebaseAdmin };
