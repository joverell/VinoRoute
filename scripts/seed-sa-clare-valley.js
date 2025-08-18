require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, writeBatch } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: "vinoroute-e8d8d.firebaseapp.com",
  projectId: "vinoroute-e8d8d",
  storageBucket: "vinoroute-e8d8d.appspot.com",
  messagingSenderId: "325683658873",
  appId: "1:325683658873:web:10724e01b115dc892b14a8"
};

const ALL_WEEK_10_5 = { 0: { open: 10, close: 17 }, 1: { open: 10, close: 17 }, 2: { open: 10, close: 17 }, 3: { open: 10, close: 17 }, 4: { open: 10, close: 17 }, 5: { open: 10, close: 17 }, 6: { open: 10, close: 17 } };

const locations = [
  // Comprehensive Clare Valley List
  { id: 2301, name: "Grosset Wines", coords: { lat: -33.8833, lng: 138.6 }, tags: ["Iconic", "Riesling", "Premium"], type: 'winery', region: "Clare Valley, SA", openingHours: { 0: { open: 10, close: 17 }, 1: null, 2: null, 3: null, 4: null, 5: { open: 10, close: 17 }, 6: { open: 10, close: 17 } }, visitDuration: 60 },
  { id: 2302, name: "Pikes Wines", coords: { lat: -33.8, lng: 138.6167 }, tags: ["Restaurant", "Beer", "Riesling"], type: 'winery', region: "Clare Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2303, name: "Sevenhill Cellars", coords: { lat: -33.9, lng: 138.6333 }, tags: ["History", "Jesuit", "Church"], type: 'winery', region: "Clare Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2304, name: "Skillogalee", coords: { lat: -33.8333, lng: 138.5833 }, tags: ["Restaurant", "Views", "Riesling"], type: 'winery', region: "Clare Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 75 },
  { id: 2305, name: "Jim Barry Wines", coords: { lat: -33.9167, lng: 138.6167 }, tags: ["Iconic", "Shiraz", "Riesling"], type: 'winery', region: "Clare Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2306, name: "Knappstein Wines", coords: { lat: -33.9333, lng: 138.6167 }, tags: ["History", "Brewery", "Riesling"], type: 'winery', region: "Clare Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2307, name: "Taylors Wines", coords: { lat: -33.85, lng: 138.5667 }, tags: ["Popular", "Cabernet", "Family-Owned"], type: 'winery', region: "Clare Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2308, name: "Shut the Gate Wines", coords: { lat: -33.8833, lng: 138.6167 }, tags: ["Boutique", "Riesling", "Modern"], type: 'winery', region: "Clare Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 2309, name: "Kilikanoon Wines", coords: { lat: -33.8167, lng: 138.6333 }, tags: ["Premium", "Shiraz", "Riesling"], type: 'winery', region: "Clare Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2310, name: "Paulett Wines", coords: { lat: -33.7833, lng: 138.6333 }, tags: ["Restaurant", "Views", "Riesling"], type: 'winery', region: "Clare Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 75 },
  { id: 2311, name: "Mad Bastard Wines", coords: { lat: -33.9167, lng: 138.6 }, tags: ["Boutique", "Riesling", "Small Producer"], type: 'winery', region: "Clare Valley, SA", openingHours: { 0: { open: 11, close: 17 }, 1: null, 2: null, 3: null, 4: null, 5: { open: 11, close: 17 }, 6: { open: 11, close: 17 } }, visitDuration: 45 },
  { id: 2312, name: "Claymore Wines", coords: { lat: -33.95, lng: 138.6167 }, tags: ["Music", "Riesling", "Boutique"], type: 'winery', region: "Clare Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 2313, name: "Tim Adams Wines", coords: { lat: -33.9333, lng: 138.6 }, tags: ["Pinot Gris", "Shiraz", "Popular"], type: 'winery', region: "Clare Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 2314, name: "Mr. Mick", coords: { lat: -33.9333, lng: 138.6167 }, tags: ["Restaurant", "Casual", "Vermentino"], type: 'winery', region: "Clare Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 75 },
  { id: 2315, name: "Mitchell Wines", coords: { lat: -33.8667, lng: 138.6167 }, tags: ["History", "Riesling", "Family-Owned"], type: 'winery', region: "Clare Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2316, name: "O'Leary Walker Wines", coords: { lat: -33.8, lng: 138.6333 }, tags: ["Riesling", "Shiraz", "Views"], type: 'winery', region: "Clare Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2317, name: "Mount Horrocks Wines", coords: { lat: -33.8833, lng: 138.6 }, tags: ["Organic", "Riesling", "Premium"], type: 'winery', region: "Clare Valley, SA", openingHours: { 0: { open: 10, close: 17 }, 1: { open: 10, close: 17 }, 2: { open: 10, close: 17 }, 3: { open: 10, close: 17 }, 4: { open: 10, close: 17 }, 5: { open: 10, close: 17 }, 6: { open: 10, close: 17 } }, visitDuration: 60 },
  { id: 2318, name: "Clare Valley Brewing Co.", coords: { lat: -33.8, lng: 138.6167 }, tags: ["Beer", "Brewery", "Casual"], type: 'distillery', region: "Clare Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 2319, name: "Jeanneret Wines", coords: { lat: -33.8, lng: 138.6167 }, tags: ["Riesling", "Shiraz", "Boutique"], type: 'winery', region: "Clare Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 2320, name: "Good Catholic Girl", coords: { lat: -33.9, lng: 138.6333 }, tags: ["Boutique", "Riesling", "Small Producer"], type: 'winery', region: "Clare Valley, SA", openingHours: { 0: { open: 11, close: 17 }, 1: null, 2: null, 3: null, 4: null, 5: { open: 11, close: 17 }, 6: { open: 11, close: 17 } }, visitDuration: 45 },
];

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedDatabase() {
  const locationsCollection = collection(db, 'locations');
  const batch = writeBatch(db);
  locations.forEach(location => {
    const docRef = doc(locationsCollection, `loc_${location.id}`);
    batch.set(docRef, location);
  });
  try {
    await batch.commit();
    console.log(`Successfully seeded ${locations.length} Clare Valley locations!`);
  } catch (error) {
    console.error("Error seeding Clare Valley database: ", error);
  }
}
seedDatabase();
