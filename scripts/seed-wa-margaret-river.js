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
  // Comprehensive Margaret River List
  { id: 3001, name: "Vasse Felix", coords: { lat: -33.8328, lng: 115.0384 }, tags: ["Restaurant", "Art", "Iconic"], type: 'winery', region: "Margaret River, WA", openingHours: ALL_WEEK_10_5, visitDuration: 75 },
  { id: 3002, name: "Leeuwin Estate", coords: { lat: -34.0286, lng: 115.0642 }, tags: ["Concerts", "Restaurant", "Chardonnay"], type: 'winery', region: "Margaret River, WA", openingHours: ALL_WEEK_10_5, visitDuration: 90 },
  { id: 3003, name: "Margaret River Distilling Co", coords: { lat: -33.9725, lng: 115.0750 }, tags: ["Whisky", "Gin", "Casual"], type: 'distillery', region: "Margaret River, WA", openingHours: { 0: { open: 10, close: 18 }, 1: { open: 10, close: 18 }, 2: { open: 10, close: 18 }, 3: { open: 10, close: 18 }, 4: { open: 10, close: 18 }, 5: { open: 10, close: 18 }, 6: { open: 10, close: 18 } }, visitDuration: 60 },
  { id: 3004, name: "Cullen Wines", coords: { lat: -33.8378, lng: 115.0353 }, tags: ["Biodynamic", "Restaurant", "Premium"], type: 'winery', region: "Margaret River, WA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 3005, name: "Voyager Estate", coords: { lat: -34.0158, lng: 115.0569 }, tags: ["Gardens", "Restaurant", "Architecture"], type: 'winery', region: "Margaret River, WA", openingHours: ALL_WEEK_10_5, visitDuration: 90 },
  { id: 3006, name: "Xanadu Wines", coords: { lat: -33.9886, lng: 115.0822 }, tags: ["Restaurant", "Cabernet", "Chardonnay"], type: 'winery', region: "Margaret River, WA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 3007, name: "The Grove Distillery", coords: { lat: -33.8294, lng: 115.0489 }, tags: ["Liqueurs", "Rum", "Casual"], type: 'distillery', region: "Margaret River, WA", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 3008, name: "Howard Park Wines", coords: { lat: -33.8444, lng: 115.0319 }, tags: ["Architecture", "Sparkling", "Cabernet"], type: 'winery', region: "Margaret River, WA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 3009, name: "Moss Wood", coords: { lat: -33.8208, lng: 115.0444 }, tags: ["Iconic", "Cabernet", "Premium"], type: 'winery', region: "Margaret River, WA", openingHours: { 0: null, 1: { open: 10, close: 16 }, 2: { open: 10, close: 16 }, 3: { open: 10, close: 16 }, 4: { open: 10, close: 16 }, 5: { open: 10, close: 16 }, 6: null }, visitDuration: 60 },
  { id: 3010, name: "Cape Mentelle", coords: { lat: -33.9833, lng: 115.0667 }, tags: ["History", "Cabernet", "Movie Nights"], type: 'winery', region: "Margaret River, WA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 3011, name: "Woody Nook Wines", coords: { lat: -33.8611, lng: 115.0472 }, tags: ["Restaurant", "Boutique", "Family-Owned"], type: 'winery', region: "Margaret River, WA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 3012, name: "Stella Bella Wines", coords: { lat: -33.9861, lng: 115.0833 }, tags: ["Chardonnay", "Boutique", "Modern"], type: 'winery', region: "Margaret River, WA", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 3013, name: "Pierro", coords: { lat: -33.8361, lng: 115.0389 }, tags: ["Premium", "Chardonnay", "Iconic"], type: 'winery', region: "Margaret River, WA", openingHours: { 0: { open: 10, close: 16 }, 1: { open: 10, close: 16 }, 2: { open: 10, close: 16 }, 3: { open: 10, close: 16 }, 4: { open: 10, close: 16 }, 5: { open: 10, close: 16 }, 6: { open: 10, close: 16 } }, visitDuration: 60 },
  { id: 3014, name: "Lenton Brae", coords: { lat: -33.8306, lng: 115.0417 }, tags: ["Family-Owned", "Semillon Sauvignon Blanc", "Boutique"], type: 'winery', region: "Margaret River, WA", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 3015, name: "Juniper Estate", coords: { lat: -33.8528, lng: 115.0444 }, tags: ["History", "Cabernet", "Boutique"], type: 'winery', region: "Margaret River, WA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 3016, name: "Fraser Gallop Estate", coords: { lat: -33.8639, lng: 115.0528 }, tags: ["Premium", "Chardonnay", "Cabernet"], type: 'winery', region: "Margaret River, WA", openingHours: { 0: { open: 11, close: 16 }, 1: { open: 11, close: 16 }, 2: { open: 11, close: 16 }, 3: { open: 11, close: 16 }, 4: { open: 11, close: 16 }, 5: { open: 11, close: 16 }, 6: { open: 11, close: 16 } }, visitDuration: 60 },
  { id: 3017, name: "Evans & Tate", coords: { lat: -33.8250, lng: 115.0472 }, tags: ["Popular", "Cabernet", "Chardonnay"], type: 'winery', region: "Margaret River, WA", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 3018, name: "Driftwood Estate", coords: { lat: -33.8750, lng: 115.0500 }, tags: ["Restaurant", "Views", "Chardonnay"], type: 'winery', region: "Margaret River, WA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 3019, name: "Deep Woods Estate", coords: { lat: -33.7333, lng: 115.1167 }, tags: ["Premium", "Cabernet", "Rosé"], type: 'winery', region: "Margaret River, WA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 3020, name: "Clairault Streicker", coords: { lat: -33.8833, lng: 115.0333 }, tags: ["Restaurant", "Family-Friendly", "Cabernet"], type: 'winery', region: "Margaret River, WA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 3021, name: "Cherubino", coords: { lat: -33.8500, lng: 115.0500 }, tags: ["Premium", "Chardonnay", "Boutique"], type: 'winery', region: "Margaret River, WA", openingHours: { 0: { open: 10, close: 17 }, 1: { open: 10, close: 17 }, 2: { open: 10, close: 17 }, 3: { open: 10, close: 17 }, 4: { open: 10, close: 17 }, 5: { open: 10, close: 17 }, 6: { open: 10, close: 17 } }, visitDuration: 60 },
  { id: 3022, name: "Cape Grace Wines", coords: { lat: -33.8167, lng: 115.0333 }, tags: ["Boutique", "Family-Owned", "Cabernet"], type: 'winery', region: "Margaret River, WA", openingHours: { 0: { open: 11, close: 17 }, 1: { open: 11, close: 17 }, 2: { open: 11, close: 17 }, 3: { open: 11, close: 17 }, 4: { open: 11, close: 17 }, 5: { open: 11, close: 17 }, 6: { open: 11, close: 17 } }, visitDuration: 45 },
  { id: 3023, name: "Brookland Valley", coords: { lat: -33.8500, lng: 115.0333 }, tags: ["Restaurant", "Views", "Chardonnay"], type: 'winery', region: "Margaret River, WA", openingHours: ALL_WEEK_10_5, visitDuration: 75 },
  { id: 3024, name: "Arimia Estate", coords: { lat: -33.7667, lng: 115.0167 }, tags: ["Restaurant", "Organic", "Boutique"], type: 'winery', region: "Margaret River, WA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 3025, name: "Amelia Park Wines", coords: { lat: -33.8, lng: 115.0667 }, tags: ["Restaurant", "Cabernet", "Modern"], type: 'winery', region: "Margaret River, WA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 3026, name: "Windows Estate", coords: { lat: -33.75, lng: 115.1 }, tags: ["Boutique", "Family-Owned", "Chardonnay"], type: 'winery', region: "Margaret River, WA", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 3027, name: "Swings & Roundabouts", coords: { lat: -33.8167, lng: 115.0833 }, tags: ["Restaurant", "Pizza", "Casual"], type: 'winery', region: "Margaret River, WA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 3028, name: "Stormflower Vineyard", coords: { lat: -33.8, lng: 115.05 }, tags: ["Organic", "Boutique", "Cabernet"], type: 'winery', region: "Margaret River, WA", openingHours: { 0: { open: 11, close: 17 }, 1: { open: 11, close: 17 }, 2: { open: 11, close: 17 }, 3: { open: 11, close: 17 }, 4: { open: 11, close: 17 }, 5: { open: 11, close: 17 }, 6: { open: 11, close: 17 } }, visitDuration: 45 },
  { id: 3029, name: "Robert Oatley Wines", coords: { lat: -33.85, lng: 115.0333 }, tags: ["Popular", "Chardonnay", "Cabernet"], type: 'winery', region: "Margaret River, WA", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 3030, name: "Ringbolt", coords: { lat: -33.95, lng: 115.0667 }, tags: ["Cabernet", "Popular", "Value"], type: 'winery', region: "Margaret River, WA", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 3031, name: "Redgate Wines", coords: { lat: -34.05, lng: 115.05 }, tags: ["Family-Owned", "Cabernet", "Casual"], type: 'winery', region: "Margaret River, WA", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 3032, name: "Passel Estate", coords: { lat: -33.8667, lng: 115.05 }, tags: ["Boutique", "Premium", "Cabernet"], type: 'winery', region: "Margaret River, WA", openingHours: { 0: { open: 11, close: 17 }, 1: { open: 11, close: 17 }, 2: { open: 11, close: 17 }, 3: { open: 11, close: 17 }, 4: { open: 11, close: 17 }, 5: { open: 11, close: 17 }, 6: { open: 11, close: 17 } }, visitDuration: 60 },
  { id: 3033, name: "Palmer Wines", coords: { lat: -33.6833, lng: 115.1333 }, tags: ["Restaurant", "Views", "Family-Friendly"], type: 'winery', region: "Margaret River, WA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 3034, name: "Montague Estate", coords: { lat: -33.9, lng: 115.05 }, tags: ["Boutique", "Cabernet", "Chardonnay"], type: 'winery', region: "Margaret River, WA", openingHours: { 0: { open: 11, close: 17 }, 1: { open: 11, close: 17 }, 2: { open: 11, close: 17 }, 3: { open: 11, close: 17 }, 4: { open: 11, close: 17 }, 5: { open: 11, close: 17 }, 6: { open: 11, close: 17 } }, visitDuration: 45 },
  { id: 3035, name: "McHenry Hohnen", coords: { lat: -33.9833, lng: 115.0833 }, tags: ["Biodynamic", "Boutique", "Chardonnay"], type: 'winery', region: "Margaret River, WA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 3036, name: "Marq Wines", coords: { lat: -33.7667, lng: 115.1167 }, tags: ["Boutique", "Alternative Varieties", "Modern"], type: 'winery', region: "Margaret River, WA", openingHours: { 0: { open: 11, close: 17 }, 1: { open: 11, close: 17 }, 2: { open: 11, close: 17 }, 3: { open: 11, close: 17 }, 4: { open: 11, close: 17 }, 5: { open: 11, close: 17 }, 6: { open: 11, close: 17 } }, visitDuration: 45 },
  { id: 3037, name: "Larry Cherubino Wines", coords: { lat: -33.85, lng: 115.05 }, tags: ["Premium", "Chardonnay", "Modern"], type: 'winery', region: "Margaret River, WA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 3038, name: "House of Cards", coords: { lat: -33.75, lng: 115.0833 }, tags: ["Boutique", "Family-Owned", "Cabernet"], type: 'winery', region: "Margaret River, WA", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 3039, name: "Happs", coords: { lat: -33.7, lng: 115.1333 }, tags: ["Family-Friendly", "Gardens", "Pottery"], type: 'winery', region: "Margaret River, WA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 3040, name: "Gralyn Estate", coords: { lat: -33.8167, lng: 115.0333 }, tags: ["History", "Fortified", "Premium"], type: 'winery', region: "Margaret River, WA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 3041, name: "Grace Farm", coords: { lat: -33.8333, lng: 115.0167 }, tags: ["Boutique", "Cabernet", "Chardonnay"], type: 'winery', region: "Margaret River, WA", openingHours: { 0: { open: 11, close: 17 }, 1: { open: 11, close: 17 }, 2: { open: 11, close: 17 }, 3: { open: 11, close: 17 }, 4: { open: 11, close: 17 }, 5: { open: 11, close: 17 }, 6: { open: 11, close: 17 } }, visitDuration: 45 },
  { id: 3042, name: "Fermoy Estate", coords: { lat: -33.8667, lng: 115.0333 }, tags: ["Premium", "Cabernet", "Chardonnay"], type: 'winery', region: "Margaret River, WA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 3043, name: "Domaine Naturaliste", coords: { lat: -33.7833, lng: 115.1 }, tags: ["Boutique", "Chardonnay", "Cabernet"], type: 'winery', region: "Margaret River, WA", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 3044, name: "Credaro Wines", coords: { lat: -33.7167, lng: 115.1333 }, tags: ["Family-Owned", "History", "Cabernet"], type: 'winery', region: "Margaret River, WA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 3045, name: "Cloudburst", coords: { lat: -33.8333, lng: 115.0 }, tags: ["Premium", "Iconic", "Cabernet"], type: 'winery', region: "Margaret River, WA", openingHours: { 0: null, 1: { open: 10, close: 16 }, 2: { open: 10, close: 16 }, 3: { open: 10, close: 16 }, 4: { open: 10, close: 16 }, 5: { open: 10, close: 16 }, 6: null }, visitDuration: 60 },
  { id: 3046, name: "Churchview Estate", coords: { lat: -33.9, lng: 115.2167 }, tags: ["Sustainable", "Family-Owned", "Boutique"], type: 'winery', region: "Margaret River, WA", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 3047, name: "Cape Naturaliste Vineyard", coords: { lat: -33.6, lng: 115.1 }, tags: ["Boutique", "Family-Owned", "Sauvignon Blanc"], type: 'winery', region: "Margaret River, WA", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 3048, name: "Brown Hill Estate", coords: { lat: -33.9667, lng: 115.1167 }, tags: ["Boutique", "Family-Owned", "Cabernet"], type: 'winery', region: "Margaret River, WA", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 3049, name: "Bettenay's", coords: { lat: -33.85, lng: 115.0667 }, tags: ["Nougat", "Liqueurs", "Family-Owned"], type: 'distillery', region: "Margaret River, WA", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 3050, name: "Ashbrook Estate", coords: { lat: -33.8167, lng: 115.05 }, tags: ["History", "Family-Owned", "Semillon"], type: 'winery', region: "Margaret River, WA", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
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
    console.log(`Successfully seeded ${locations.length} Margaret River locations!`);
  } catch (error) {
    console.error("Error seeding Margaret River database: ", error);
  }
}
seedDatabase();