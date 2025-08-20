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

const locationTypes = [
  { name: 'Winery', mapImageUrl: 'default_winery.png' },
  { name: 'Restaurant', mapImageUrl: 'default_restaurant.png' },
  { name: 'Cellar Door', mapImageUrl: 'default_cellar_door.png' },
  { name: 'Accommodation', mapImageUrl: 'default_accommodation.png' },
  { name: 'Attraction', mapImageUrl: 'default_attraction.png' },
];

async function seedLocationTypes() {
  const { adminDb } = initializeFirebaseAdmin();

  if (!adminDb) {
    console.error('Firebase admin initialization failed. Make sure your .env.local file is set up correctly.');
    process.exit(1);
  }

  const locationTypesCollection = adminDb.collection('location_types');

  console.log('Seeding location types...');

  for (const locationType of locationTypes) {
    try {
      const querySnapshot = await locationTypesCollection.where('name', '==', locationType.name).get();
      if (querySnapshot.empty) {
        await locationTypesCollection.add(locationType);
        console.log(`Added location type: ${locationType.name}`);
      } else {
        console.log(`Location type already exists: ${locationType.name}`);
      }
    } catch (error) {
      console.error(`Error seeding location type ${locationType.name}:`, error);
    }
  }

  console.log('Location types seeding complete.');
}

seedLocationTypes();
