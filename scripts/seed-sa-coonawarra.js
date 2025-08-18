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
  // Comprehensive Coonawarra List
  { id: 2401, name: "Wynns Coonawarra Estate", coords: { lat: -37.2833, lng: 140.85 }, tags: ["Iconic", "Cabernet Sauvignon", "History"], type: 'winery', region: "Coonawarra, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2402, name: "Penley Estate", coords: { lat: -37.25, lng: 140.8333 }, tags: ["Cabernet Sauvignon", "Shiraz", "Modern"], type: 'winery', region: "Coonawarra, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2403, name: "Majella Wines", coords: { lat: -37.2667, lng: 140.8333 }, tags: ["Shiraz", "Cabernet", "Premium"], type: 'winery', region: "Coonawarra, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2404, name: "Katnook Estate", coords: { lat: -37.2833, lng: 140.8333 }, tags: ["History", "Cabernet Sauvignon", "Restaurant"], type: 'winery', region: "Coonawarra, SA", openingHours: ALL_WEEK_10_5, visitDuration: 75 },
  { id: 2405, name: "Rymill Coonawarra", coords: { lat: -37.3, lng: 140.85 }, tags: ["Cabernet Sauvignon", "Architecture", "Family-Owned"], type: 'winery', region: "Coonawarra, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2406, name: "Bowen Estate", coords: { lat: -37.2333, lng: 140.8167 }, tags: ["Shiraz", "Cabernet", "Family-Owned"], type: 'winery', region: "Coonawarra, SA", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 2407, name: "Parker Coonawarra Estate", coords: { lat: -37.25, lng: 140.8167 }, tags: ["Cabernet Sauvignon", "Premium", "Iconic"], type: 'winery', region: "Coonawarra, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2408, name: "Zema Estate", coords: { lat: -37.3, lng: 140.8333 }, tags: ["Family-Owned", "Cabernet", "Shiraz"], type: 'winery', region: "Coonawarra, SA", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 2409, name: "Balnaves of Coonawarra", coords: { lat: -37.3167, lng: 140.8333 }, tags: ["Cabernet Sauvignon", "Gardens", "Family-Owned"], type: 'winery', region: "Coonawarra, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2410, name: "Coonawarra Railway Siding", coords: { lat: -37.2833, lng: 140.8333 }, tags: ["History", "Photo Op", "Landmark"], type: 'winery', region: "Coonawarra, SA", openingHours: ALL_WEEK_10_5, visitDuration: 15 },
  { id: 2411, name: "Hollick Estates", coords: { lat: -37.25, lng: 140.8 }, tags: ["Restaurant", "Views", "Cabernet"], type: 'winery', region: "Coonawarra, SA", openingHours: ALL_WEEK_10_5, visitDuration: 75 },
  { id: 2412, name: "Koonara Wines", coords: { lat: -37.2833, lng: 140.8333 }, tags: ["Boutique", "Shiraz", "Modern"], type: 'winery', region: "Coonawarra, SA", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 2413, name: "Leconfield Coonawarra", coords: { lat: -37.2333, lng: 140.8 }, tags: ["Cabernet", "Riesling", "History"], type: 'winery', region: "Coonawarra, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2414, name: "Lindeman's Coonawarra", coords: { lat: -37.2667, lng: 140.8333 }, tags: ["History", "Popular", "Cabernet"], type: 'winery', region: "Coonawarra, SA", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 2415, name: "Redman Wines", coords: { lat: -37.2833, lng: 140.8333 }, tags: ["History", "Family-Owned", "Shiraz"], type: 'winery', region: "Coonawarra, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2416, name: "Brand's Laira Coonawarra", coords: { lat: -37.2667, lng: 140.8167 }, tags: ["History", "Cabernet", "Shiraz"], type: 'winery', region: "Coonawarra, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2417, name: "Di Giorgio Family Wines", coords: { lat: -37.3333, lng: 140.85 }, tags: ["Family-Owned", "Cabernet", "Italian Varieties"], type: 'winery', region: "Coonawarra, SA", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 2418, name: "Jack Estate", coords: { lat: -37.25, lng: 140.8167 }, tags: ["Cabernet", "Shiraz", "Boutique"], type: 'winery', region: "Coonawarra, SA", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 2419, name: "Ottelia + Fodder", coords: { lat: -37.2833, lng: 140.8333 }, tags: ["Restaurant", "Riesling", "Casual"], type: 'winery', region: "Coonawarra, SA", openingHours: { 0: { open: 12, close: 15 }, 1: null, 2: null, 3: { open: 12, close: 20 }, 4: { open: 12, close: 20 }, 5: { open: 12, close: 20 }, 6: { open: 12, close: 20 } }, visitDuration: 75 },
  { id: 2420, name: "Patrick of Coonawarra", coords: { lat: -37.3, lng: 140.8333 }, tags: ["Cabernet", "Riesling", "Family-Owned"], type: 'winery', region: "Coonawarra, SA", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
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
    console.log(`Successfully seeded ${locations.length} Coonawarra locations!`);
  } catch (error) {
    console.error("Error seeding Coonawarra database: ", error);
  }
}
seedDatabase();
