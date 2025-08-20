require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
const { FieldValue } = require('firebase-admin/firestore');

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

async function migrateLocationTypes() {
  const { adminDb } = initializeFirebaseAdmin();

  if (!adminDb) {
    console.error('Firebase admin initialization failed. Make sure your .env.local file is set up correctly.');
    process.exit(1);
  }

  console.log('Starting location types migration...');

  try {
    const locationTypesToMigrate = {
      'Winery': { singular: 'Winery', plural: 'Wineries' },
      'Restaurant': { singular: 'Restaurant', plural: 'Restaurants' },
      'Cellar Door': { singular: 'Cellar Door', plural: 'Cellar Doors' },
      'Accommodation': { singular: 'Accommodation', plural: 'Accommodation' },
      'Attraction': { singular: 'Attraction', plural: 'Attractions' },
    };

    const locationTypesCollection = adminDb.collection('location_types');
    const snapshot = await locationTypesCollection.get();
    const batch = adminDb.batch();
    let updatedCount = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.name && locationTypesToMigrate[data.name]) {
        const newFields = locationTypesToMigrate[data.name];
        const docRef = locationTypesCollection.doc(doc.id);
        batch.update(docRef, {
          ...newFields,
          name: FieldValue.delete(),
          mapImageUrl: FieldValue.delete(),
        });
        updatedCount++;
      }
    });

    await batch.commit();
    console.log(`Migration complete. Updated ${updatedCount} location types.`);

  } catch (error) {
    console.error('Error during migration:', error);
  }
}

migrateLocationTypes();
