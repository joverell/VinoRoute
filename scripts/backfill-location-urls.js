require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
if (!GOOGLE_MAPS_API_KEY) {
  console.error('Error: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set in .env.local');
  process.exit(1);
}

// --- Inlined Firebase Admin Initialization ---
const initializeFirebaseAdmin = () => {
  if (admin.apps.length === 0) {
    try {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;

      if (!projectId || !clientEmail || !privateKey) {
        throw new Error('Firebase Admin SDK credentials are not set in the environment.');
      }

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
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
// --- End of Inlined Logic ---

async function backfillLocationUrls() {
  const { adminDb } = initializeFirebaseAdmin();
  if (!adminDb) {
    console.error('Failed to initialize Firebase Admin SDK.');
    return;
  }

  console.log('Fetching locations from Firestore...');
  const locationsSnapshot = await adminDb.collection('locations').get();
  const locations = locationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  console.log(`Found ${locations.length} locations to process.`);

  for (const location of locations) {
    if (location.url) {
      console.log(`Skipping ${location.name} (ID: ${location.id}) as it already has a URL.`);
      continue;
    }

    // The location ID is the Google Place ID
    const placeId = location.id;

    console.log(`Processing ${location.name} (ID: ${placeId})...`);

    const fields = 'website';
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_MAPS_API_KEY}`;

    try {
      const detailsResponse = await fetch(detailsUrl);
      const detailsData = await detailsResponse.json();

      if (detailsData.status === 'OK' && detailsData.result && detailsData.result.website) {
        const websiteUrl = detailsData.result.website;
        console.log(`Found website for ${location.name}: ${websiteUrl}`);

        await adminDb.collection('locations').doc(placeId).update({
          url: websiteUrl,
        });

        console.log(`Successfully updated ${location.name} with the new URL.`);
      } else {
        console.log(`No website found for ${location.name}. Status: ${detailsData.status}`);
      }
    } catch (error) {
      console.error(`Error processing ${location.name} (ID: ${placeId}):`, error);
    }

    // Add a small delay to avoid hitting API rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('Backfill process completed.');
}

backfillLocationUrls().catch(error => {
  console.error('Unhandled error during backfill process:', error);
  process.exit(1);
});
