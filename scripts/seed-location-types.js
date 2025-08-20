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
      return { adminDb: null, adminAuth: null };
    }
  }
  return {
    adminDb: admin.firestore(),
    adminAuth: admin.auth(),
  };
};

// Simple pluralization function
const pluralize = (singular) => {
  if (singular.endsWith('y')) {
    return singular.slice(0, -1) + 'ies';
  }
  if (singular.endsWith('s')) {
      return singular + 'es';
  }
  return singular + 's';
}

async function seedLocationTypes() {
  const { adminDb } = initializeFirebaseAdmin();

  if (!adminDb) {
    console.error('Firebase admin initialization failed. Make sure your .env.local file is set up correctly.');
    process.exit(1);
  }

  const locationTypesCollection = adminDb.collection('location_types');
  const wineriesCollection = adminDb.collection('wineries');

  console.log('Seeding location types...');

  // 1. Get existing types from wineries collection
  const wineriesSnapshot = await wineriesCollection.get();
  const existingTypes = new Set(wineriesSnapshot.docs.map(doc => doc.data().type));
  console.log('Found types in wineries collection:', Array.from(existingTypes));

  // 2. Define base location types, ensuring they are in the desired format
  const locationTypes = [
    { singular: 'Winery', plural: 'Wineries' },
    { singular: 'Restaurant', plural: 'Restaurants' },
    { singular: 'Cellar Door', plural: 'Cellar Doors' },
    { singular: 'Accommodation', plural: 'Accommodation' },
    { singular: 'Attraction', plural: 'Attractions' },
    { singular: 'Distillery', plural: 'Distilleries' },
  ];

  // 3. Add new types found from wineries collection
  existingTypes.forEach(type => {
    if (type && type !== 'custom' && !locationTypes.some(lt => lt.singular.toLowerCase() === type.toLowerCase())) {
      const singular = type.charAt(0).toUpperCase() + type.slice(1);
      const plural = pluralize(singular);
      locationTypes.push({ singular, plural });
      console.log(`Discovered new location type to seed: ${singular}`);
    }
  });

  // 4. Seed the location_types collection
  for (const locationType of locationTypes) {
    try {
      const querySnapshot = await locationTypesCollection.where('singular', '==', locationType.singular).get();
      if (querySnapshot.empty) {
        await locationTypesCollection.add(locationType);
        console.log(`Added location type: ${locationType.singular}`);
      } else {
        // If it exists, update it to ensure it has the correct plural form.
        const docId = querySnapshot.docs[0].id;
        await locationTypesCollection.doc(docId).set(locationType, { merge: true });
        console.log(`Updated location type (ensured fields are correct): ${locationType.singular}`);
      }
    } catch (error) {
      console.error(`Error seeding location type ${locationType.singular}:`, error);
    }
  }

  console.log('Location types seeding complete.');
}

seedLocationTypes();
