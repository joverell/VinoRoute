// This script is used to populate your Firestore database with new locations.
// To run it, navigate to your project's root directory in the terminal and run: node scripts/add-new-locations.js

require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, writeBatch } = require('firebase/firestore');

// Your specific Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: "vinoroute-e8d8d.firebaseapp.com",
  projectId: "vinoroute-e8d8d",
  storageBucket: "vinoroute-e8d8d.appspot.com",
  messagingSenderId: "325683658873",
  appId: "1:325683658873:web:10724e01b115dc892b14a8"
};

// --- DATA TO BE SEEDED ---
const newLocations = [
  // Yarra Valley, VIC
  { id: 9301, name: 'Buttermans Track Wines', coords: { lat: -37.5949916, lng: 145.2963888 }, tags: ['Boutique', 'Family-Owned', 'Organic'], type: 'winery', region: "Yarra Valley, VIC", openingHours: { 0: null, 1: null, 2: null, 3: null, 4: null, 5: { open: 12, close: 17 }, 6: { open: 12, close: 17 } }, visitDuration: 60 },

  // Barossa Valley, SA
  { id: 9302, name: 'Seppeltsfield Winery', coords: { lat: -34.490791, lng: 138.913946 }, tags: ['Iconic', 'History', 'Tawny'], type: 'winery', region: "Barossa Valley, SA", openingHours: { 0: { open: 10.5, close: 17 }, 1: { open: 10.5, close: 17 }, 2: { open: 10.5, close: 17 }, 3: { open: 10.5, close: 17 }, 4: { open: 10.5, close: 17 }, 5: { open: 10.5, close: 17 }, 6: { open: 10.5, close: 17 } }, visitDuration: 75 },
  { id: 9303, name: 'Alkina Wine Estate', coords: { lat: -34.4488927307, lng: 138.93735950001 }, tags: ['Organic', 'Biodynamic', 'Luxury Accommodation'], type: 'winery', region: "Barossa Valley, SA", openingHours: { 0: null, 1: { open: 11, close: 17 }, 2: { open: 11, close: 17 }, 3: { open: 11, close: 17 }, 4: { open: 11, close: 17 }, 5: { open: 11, close: 17 }, 6: { open: 11, close: 16 } }, visitDuration: 75 },
];
// --- END OF DATA ---


// --- SCRIPT LOGIC ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedDatabase() {
  const locationsCollection = collection(db, 'locations');
  const batch = writeBatch(db);

  newLocations.forEach((location) => {
    // We use the numeric ID from our data as the document ID in Firestore for consistency
    const docRef = doc(locationsCollection, location.id.toString());
    batch.set(docRef, location);
  });

  console.log(`Preparing to seed ${newLocations.length} new locations...`);

  try {
    await batch.commit();
    console.log(`Successfully seeded ${newLocations.length} new locations!`);
    console.log("You can now close this script (Ctrl+C).");
  } catch (error) {
    console.error("Error seeding database: ", error);
  }
}

seedDatabase();
