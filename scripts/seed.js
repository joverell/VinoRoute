// This script is used to populate your Firestore database with the initial set of locations.
// To run it, navigate to your project's root directory in the terminal and run: node scripts/seed.js

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
const ALL_WEEK_10_5 = { 0: { open: 10, close: 17 }, 1: { open: 10, close: 17 }, 2: { open: 10, close: 17 }, 3: { open: 10, close: 17 }, 4: { open: 10, close: 17 }, 5: { open: 10, close: 17 }, 6: { open: 10, close: 17 } };
const WEEKEND_11_5 = { 0: { open: 11, close: 17 }, 1: null, 2: null, 3: null, 4: null, 5: { open: 11, close: 17 }, 6: { open: 11, close: 17 } };

const wineries = [
  // Yarra Valley, VIC
  { id: 1, name: 'Domaine Chandon', coords: { lat: -37.6983, lng: 145.4182 }, tags: ['Sparkling', 'Restaurant', 'Views'], type: 'winery', region: "Yarra Valley, VIC", openingHours: { 0: { open: 10.5, close: 16.5 }, 1: { open: 10.5, close: 16.5 }, 2: { open: 10.5, close: 16.5 }, 3: { open: 10.5, close: 16.5 }, 4: { open: 10.5, close: 16.5 }, 5: { open: 10.5, close: 16.5 }, 6: { open: 10.5, close: 16.5 } } },
  { id: 2, name: 'Oakridge Wines', coords: { lat: -37.6961, lng: 145.4357 }, tags: ['Restaurant', 'Chardonnay'], type: 'winery', region: "Yarra Valley, VIC", openingHours: ALL_WEEK_10_5 },
  { id: 4, name: 'Four Pillars Gin', coords: { lat: -37.6625, lng: 145.5147 }, tags: ['Gin', 'Cocktails', 'Popular'], type: 'distillery', region: "Yarra Valley, VIC", openingHours: { 0: { open: 10.5, close: 17.5 }, 1: { open: 10.5, close: 17.5 }, 2: { open: 10.5, close: 17.5 }, 3: { open: 10.5, close: 17.5 }, 4: { open: 10.5, close: 17.5 }, 5: { open: 10.5, close: 21 }, 6: { open: 10.5, close: 21 } } },
  { id: 7, name: 'TarraWarra Estate', coords: { lat: -37.6534, lng: 145.4286 }, tags: ['Art', 'Restaurant', 'Pinot Noir'], type: 'winery', region: "Yarra Valley, VIC", openingHours: { 0: { open: 11, close: 17 }, 1: null, 2: { open: 11, close: 17 }, 3: { open: 11, close: 17 }, 4: { open: 11, close: 17 }, 5: { open: 11, close: 17 }, 6: { open: 11, close: 17 } } },
  { id: 11, name: 'De Bortoli Wines', coords: { lat: -37.6389, lng: 145.4417 }, tags: ['Cheese', 'Family-Friendly'], type: 'winery', region: "Yarra Valley, VIC", openingHours: ALL_WEEK_10_5 },
  { id: 16, name: 'Helen and Joey Estate', coords: { lat: -37.6622, lng: 145.4194 }, tags: ['Views', 'Unicorn', 'Casual'], type: 'winery', region: "Yarra Valley, VIC", openingHours: ALL_WEEK_10_5 },

  // Barossa Valley, SA
  { id: 21, name: "Penfolds Barossa Valley", coords: { lat: -34.5169, lng: 138.9333 }, tags: ["Iconic", "Shiraz", "Red Wine"], type: 'winery', region: "Barossa Valley, SA", openingHours: ALL_WEEK_10_5 },
  { id: 22, name: "Seppeltsfield Road Distillers", coords: { lat: -34.4886, lng: 138.9083 }, tags: ["Gin", "Cocktails", "Boutique"], type: 'distillery', region: "Barossa Valley, SA", openingHours: { 0: { open: 11, close: 17 }, 1: { open: 11, close: 17 }, 2: { open: 11, close: 17 }, 3: { open: 11, close: 17 }, 4: { open: 11, close: 17 }, 5: { open: 11, close: 17 }, 6: { open: 11, close: 17 } } },
  { id: 23, name: "Jacobs Creek", coords: { lat: -34.5950, lng: 138.8681 }, tags: ["Restaurant", "Popular", "Views"], type: 'winery', region: "Barossa Valley, SA", openingHours: ALL_WEEK_10_5 },
  { id: 24, name: "St Hugo", coords: { lat: -34.5698, lng: 138.9958 }, tags: ["Restaurant", "Luxury", "Cabernet"], type: 'winery', region: "Barossa Valley, SA", openingHours: { 0: { open: 10.5, close: 16.5 }, 1: { open: 10.5, close: 16.5 }, 2: { open: 10.5, close: 16.5 }, 3: { open: 10.5, close: 16.5 }, 4: { open: 10.5, close: 16.5 }, 5: { open: 10.5, close: 16.5 }, 6: { open: 10.5, close: 16.5 } } },
  { id: 25, name: "Henschke", coords: { lat: -34.4283, lng: 139.0881 }, tags: ["Iconic", "Hill of Grace", "Premium"], type: 'winery', region: "Barossa Valley, SA", openingHours: { 0: null, 1: { open: 9, close: 16.5 }, 2: { open: 9, close: 16.5 }, 3: { open: 9, close: 16.5 }, 4: { open: 9, close: 16.5 }, 5: { open: 9, close: 16.5 }, 6: { open: 9, close: 16.5 } } },

  // Margaret River, WA
  { id: 31, name: "Vasse Felix", coords: { lat: -33.8328, lng: 115.0384 }, tags: ["Restaurant", "Art", "Iconic"], type: 'winery', region: "Margaret River, WA", openingHours: ALL_WEEK_10_5 },
  { id: 32, name: "Leeuwin Estate", coords: { lat: -34.0286, lng: 115.0642 }, tags: ["Concerts", "Restaurant", "Chardonnay"], type: 'winery', region: "Margaret River, WA", openingHours: ALL_WEEK_10_5 },
  { id: 33, name: "Margaret River Distilling Co", coords: { lat: -33.9725, lng: 115.0750 }, tags: ["Whisky", "Gin", "Casual"], type: 'distillery', region: "Margaret River, WA", openingHours: { 0: { open: 10, close: 18 }, 1: { open: 10, close: 18 }, 2: { open: 10, close: 18 }, 3: { open: 10, close: 18 }, 4: { open: 10, close: 18 }, 5: { open: 10, close: 18 }, 6: { open: 10, close: 18 } } },
  { id: 34, name: "Cullen Wines", coords: { lat: -33.8378, lng: 115.0353 }, tags: ["Biodynamic", "Restaurant", "Premium"], type: 'winery', region: "Margaret River, WA", openingHours: ALL_WEEK_10_5 },
  { id: 35, name: "Voyager Estate", coords: { lat: -34.0158, lng: 115.0569 }, tags: ["Gardens", "Restaurant", "Architecture"], type: 'winery', region: "Margaret River, WA", openingHours: ALL_WEEK_10_5 },

  // Hunter Valley, NSW
  { id: 41, name: "Tyrrell's Wines", coords: { lat: -32.7669, lng: 151.2831 }, tags: ["History", "Iconic", "Semillon"], type: 'winery', region: "Hunter Valley, NSW", openingHours: ALL_WEEK_10_5 },
  { id: 42, name: "Brokenwood Wines", coords: { lat: -32.7883, lng: 151.3006 }, tags: ["Restaurant", "Shiraz", "Premium"], type: 'winery', region: "Hunter Valley, NSW", openingHours: { 0: { open: 11, close: 17 }, 1: { open: 11, close: 17 }, 2: { open: 11, close: 17 }, 3: { open: 11, close: 17 }, 4: { open: 11, close: 17 }, 5: { open: 11, close: 17 }, 6: { open: 11, close: 17 } } },
  { id: 43, name: "Audrey Wilkinson", coords: { lat: -32.8083, lng: 151.3256 }, tags: ["Views", "History", "Semillon"], type: 'winery', region: "Hunter Valley, NSW", openingHours: ALL_WEEK_10_5 },
  { id: 44, name: "Hunter Valley Distillery", coords: { lat: -32.7889, lng: 151.2988 }, tags: ["Vodka", "Gin", "Liqueurs"], type: 'distillery', region: "Hunter Valley, NSW", openingHours: ALL_WEEK_10_5 },

  // Tamar Valley, TAS
  { id: 51, name: "Jansz Tasmania", coords: { lat: -41.0664, lng: 147.1661 }, tags: ["Sparkling", "Views", "Premium"], type: 'winery', region: "Tamar Valley, TAS", openingHours: ALL_WEEK_10_5 },
  { id: 52, name: "Turner Stillhouse", coords: { lat: -41.3164, lng: 147.0811 }, tags: ["Gin", "Whisky", "Boutique"], type: 'distillery', region: "Tamar Valley, TAS", openingHours: { 0: null, 1: null, 2: { open: 11, close: 17 }, 3: { open: 11, close: 17 }, 4: { open: 11, close: 17 }, 5: { open: 11, close: 17 }, 6: { open: 11, close: 17 } } },
  { id: 53, name: "Tamar Ridge", coords: { lat: -41.3558, lng: 147.0917 }, tags: ["Pinot Noir", "Views", "Restaurant"], type: 'winery', region: "Tamar Valley, TAS", openingHours: ALL_WEEK_10_5 },
];
// --- END OF DATA ---


// --- SCRIPT LOGIC ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedDatabase() {
  const locationsCollection = collection(db, 'locations');
  const batch = writeBatch(db);

  wineries.forEach((location) => {
    // We use the numeric ID from our data as the document ID in Firestore for consistency
    const docRef = doc(locationsCollection, location.id.toString());
    batch.set(docRef, location);
  });

  console.log(`Preparing to seed ${wineries.length} locations...`);

  try {
    await batch.commit();
    console.log(`Successfully seeded ${wineries.length} locations!`);
    console.log("You can now close this script (Ctrl+C).");
  } catch (error) {
    console.error("Error seeding database: ", error);
  }
}

seedDatabase();