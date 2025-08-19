require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

// --- Firebase Admin SDK Initialization ---
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// --- Google Maps Configuration ---
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

async function getRegions() {
  const regionsCollection = db.collection('regions');
  const snapshot = await regionsCollection.get();
  if (snapshot.empty) {
    console.log('No regions found.');
    return [];
  }
  const regions = [];
  snapshot.forEach(doc => {
    regions.push(doc.data());
  });
  return regions;
}

async function searchForPlaces(region, type) {
  const query = `${type} in ${region.name}`;
  console.log(`Searching for: "${query}"`);
  try {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.status !== 'OK') {
        console.error(`Error searching for ${type} in ${region.name}:`, data.status, data.error_message);
        return [];
    }
    return data.results || [];
  } catch (error) {
    console.error(`Error searching for ${type} in ${region.name}:`, error);
    return [];
  }
}

async function isLocationNew(placeId) {
    const locationRef = db.collection('locations').doc(placeId);
    const doc = await locationRef.get();
    return !doc.exists;
}

async function addLocation(place, region, type) {
    const placeId = place.place_id;
    console.log(`Adding new location: ${place.name}`);
    const locationRef = db.collection('locations').doc(placeId);

    // Fetch place details for more info
    const fields = 'name,geometry,formatted_address,website,formatted_phone_number,opening_hours';
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
        console.error(`Error fetching details for ${place.name}:`, data.status, data.error_message);
        return;
    }

    const details = data.result;

    const newLocation = {
        id: placeId,
        name: details.name,
        coords: {
            lat: details.geometry.location.lat,
            lng: details.geometry.location.lng,
        },
        address: details.formatted_address,
        website: details.website || '',
        phone: details.formatted_phone_number || '',
        region: region.name,
        type: type,
        openingHours: details.opening_hours || {},
    };

    await locationRef.set(newLocation);
    console.log(`Added ${details.name} to the database.`);
}


const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 60 * 1000; // 1 minute
const SCRIPT_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours

async function findAndAddLocations() {
    const startTime = Date.now();
    let locationsAddedInBatch = 0;

    console.log('Starting to find and add new locations...');

    const regions = await getRegions();
    console.log(`Found ${regions.length} regions to search.`);

    for (const region of regions) {
        if (Date.now() - startTime > SCRIPT_DURATION_MS) {
            console.log('Script has been running for 12 hours. Exiting.');
            return;
        }

        const wineries = await searchForPlaces(region, 'winery');
        console.log(`Found ${wineries.length} potential wineries in ${region.name}.`);

        const distilleries = await searchForPlaces(region, 'distillery');
        console.log(`Found ${distilleries.length} potential distilleries in ${region.name}.`);

        const allPlaces = [...wineries, ...distilleries];

        for (const place of allPlaces) {
            if (Date.now() - startTime > SCRIPT_DURATION_MS) {
                console.log('Script has been running for 12 hours. Exiting.');
                return;
            }

            if (await isLocationNew(place.place_id)) {
                const type = place.types.includes('winery') ? 'winery' : 'distillery';
                await addLocation(place, region, type);
                locationsAddedInBatch++;

                if (locationsAddedInBatch >= BATCH_SIZE) {
                    console.log(`Added ${BATCH_SIZE} locations. Pausing for ${BATCH_DELAY_MS / 1000} seconds...`);
                    await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
                    locationsAddedInBatch = 0;
                }
            } else {
                console.log(`Location already exists: ${place.name}`);
            }
        }
    }
    console.log('Finished processing all regions.');
}

findAndAddLocations().catch(console.error);
