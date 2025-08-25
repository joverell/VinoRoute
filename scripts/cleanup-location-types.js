require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

const initializeFirebaseAdmin = () => {
  if (admin.apps.length === 0) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        }),
        databaseURL: `https://vinoroute-e8d8d.firebaseio.com`,
      });
    } catch (error) {
      console.error('Firebase admin initialization error', error);
      return { adminDb: null };
    }
  }
  return {
    adminDb: admin.firestore(),
  };
};

async function cleanupLocationTypes() {
  const { adminDb } = initializeFirebaseAdmin();

  if (!adminDb) {
    console.error('Firebase admin initialization failed. Make sure your .env.local file is set up correctly.');
    process.exit(1);
  }

  console.log('Starting location types cleanup...');

  try {
    const locationTypesCollection = adminDb.collection('location_types');
    const snapshot = await locationTypesCollection.get();

    const groups = {};
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.singular) {
        if (!groups[data.singular]) {
          groups[data.singular] = [];
        }
        groups[data.singular].push({ id: doc.id, ...data });
      }
    });

    const batch = adminDb.batch();
    let deletedCount = 0;

    for (const singular in groups) {
      const group = groups[singular];
      if (group.length > 1) {
        // Keep the first one, delete the rest
        for (let i = 1; i < group.length; i++) {
          const docToDelete = locationTypesCollection.doc(group[i].id);
          batch.delete(docToDelete);
          deletedCount++;
        }
      }
    }

    await batch.commit();
    console.log(`Cleanup complete. Deleted ${deletedCount} duplicate location types.`);

  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

cleanupLocationTypes();
