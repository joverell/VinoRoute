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

async function migrateLocations() {
  const { adminDb } = initializeFirebaseAdmin();

  if (!adminDb) {
    console.error('Firebase admin initialization failed. Make sure your .env.local file is set up correctly.');
    process.exit(1);
  }

  console.log('Starting location migration...');

  try {
    // 1. Fetch all location types and create a map
    const locationTypesCollection = adminDb.collection('location_types');
    const locationTypesSnapshot = await locationTypesCollection.get();
    const locationTypesMap = new Map();
    locationTypesSnapshot.forEach(doc => {
      const data = doc.data();
      locationTypesMap.set(data.singular, doc.id);
    });
    console.log('Location types map created:', locationTypesMap);

    // 2. Fetch all wineries
    const wineriesCollection = adminDb.collection('wineries');
    const wineriesSnapshot = await wineriesCollection.get();
    console.log(`Found ${wineriesSnapshot.size} wineries to migrate.`);

    // 3. Create a batch write
    const batch = adminDb.batch();
    let updatedCount = 0;

    wineriesSnapshot.forEach(doc => {
      const winery = doc.data();
      const wineryType = winery.type;

      if (wineryType && typeof wineryType === 'string') {
        // Capitalize the first letter to match the singular name in locationTypesMap
        const singularType = wineryType.charAt(0).toUpperCase() + wineryType.slice(1);
        const locationTypeId = locationTypesMap.get(singularType);

        if (locationTypeId) {
          // If a matching location type is found, update the document
          const docRef = wineriesCollection.doc(doc.id);
          batch.update(docRef, { locationTypeId: locationTypeId });
          updatedCount++;
        } else {
          console.warn(`No location type found for winery type: "${wineryType}" (ID: ${doc.id})`);
        }
      }
    });

    // 4. Commit the batch
    await batch.commit();
    console.log(`Migration complete. Updated ${updatedCount} wineries.`);

  } catch (error) {
    console.error('Error during migration:', error);
  }
}

migrateLocations();
