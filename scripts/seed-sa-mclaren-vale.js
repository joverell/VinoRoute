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
  // Comprehensive McLaren Vale List
  { id: 2101, name: "d'Arenberg Cube", coords: { lat: -35.1983, lng: 138.5258 }, tags: ["Architecture", "Art", "Restaurant"], type: 'winery', region: "McLaren Vale, SA", openingHours: { 0: { open: 10.5, close: 16.5 }, 1: { open: 10.5, close: 16.5 }, 2: { open: 10.5, close: 16.5 }, 3: { open: 10.5, close: 16.5 }, 4: { open: 10.5, close: 16.5 }, 5: { open: 10.5, close: 16.5 }, 6: { open: 10.5, close: 16.5 } }, visitDuration: 90 },
  { id: 2102, name: "Wirra Wirra Vineyards", coords: { lat: -35.2153, lng: 138.5306 }, tags: ["History", "Shiraz", "Family-Friendly"], type: 'winery', region: "McLaren Vale, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2103, name: "Never Never Distilling Co.", coords: { lat: -35.1975, lng: 138.5250 }, tags: ["Gin", "Views", "Cocktails"], type: 'distillery', region: "McLaren Vale, SA", openingHours: { 0: { open: 11, close: 18 }, 1: null, 2: null, 3: { open: 11, close: 18 }, 4: { open: 11, close: 18 }, 5: { open: 11, close: 18 }, 6: { open: 11, close: 18 } }, visitDuration: 60 },
  { id: 2104, name: "Coriole Vineyards", coords: { lat: -35.2108, lng: 138.5411 }, tags: ["Restaurant", "Gardens", "Sangiovese"], type: 'winery', region: "McLaren Vale, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2105, name: "Oliver's Taranga", coords: { lat: -35.1953, lng: 138.5439 }, tags: ["Family-Owned", "Shiraz", "Grenache"], type: 'winery', region: "McLaren Vale, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2106, name: "Maxwell Wines", coords: { lat: -35.2236, lng: 138.5361 }, tags: ["Restaurant", "Mead", "Maze"], type: 'winery', region: "McLaren Vale, SA", openingHours: ALL_WEEK_10_5, visitDuration: 75 },
  { id: 2107, name: "SC Pannell", coords: { lat: -35.2092, lng: 138.5139 }, tags: ["Modern", "Views", "Grenache"], type: 'winery', region: "McLaren Vale, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2108, name: "Yangarra Estate Vineyard", coords: { lat: -35.1583, lng: 138.5833 }, tags: ["Biodynamic", "Grenache", "Premium"], type: 'winery', region: "McLaren Vale, SA", openingHours: { 0: { open: 11, close: 17 }, 1: { open: 11, close: 17 }, 2: { open: 11, close: 17 }, 3: { open: 11, close: 17 }, 4: { open: 11, close: 17 }, 5: { open: 11, close: 17 }, 6: { open: 11, close: 17 } }, visitDuration: 60 },
  { id: 2109, name: "Mitolo Wines", coords: { lat: -35.2083, lng: 138.4833 }, tags: ["Restaurant", "Architecture", "Shiraz"], type: 'winery', region: "McLaren Vale, SA", openingHours: ALL_WEEK_10_5, visitDuration: 75 },
  { id: 2110, name: "Settlers Spirits", coords: { lat: -35.2250, lng: 138.5333 }, tags: ["Gin", "Boutique", "Tasting Flights"], type: 'distillery', region: "McLaren Vale, SA", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 2111, name: "Hugh Hamilton Wines", coords: { lat: -35.2167, lng: 138.5167 }, tags: ["Views", "Boutique", "Shiraz"], type: 'winery', region: "McLaren Vale, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2112, name: "Kay Brothers Amery Vineyards", coords: { lat: -35.2333, lng: 138.5500 }, tags: ["History", "Shiraz", "Fortified"], type: 'winery', region: "McLaren Vale, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2113, name: "Samuel's Gorge", coords: { lat: -35.2167, lng: 138.5500 }, tags: ["Boutique", "Views", "Grenache"], type: 'winery', region: "McLaren Vale, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2114, name: "Alpha Box & Dice", coords: { lat: -35.2500, lng: 138.5167 }, tags: ["Boutique", "Alternative Varieties", "Modern"], type: 'winery', region: "McLaren Vale, SA", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 2115, name: "Down The Rabbit Hole", coords: { lat: -35.2333, lng: 138.5000 }, tags: ["Restaurant", "Bus", "Instagrammable"], type: 'winery', region: "McLaren Vale, SA", openingHours: { 0: { open: 11, close: 18 }, 1: null, 2: null, 3: { open: 11, close: 18 }, 4: { open: 11, close: 18 }, 5: { open: 11, close: 18 }, 6: { open: 11, close: 18 } }, visitDuration: 75 },
  { id: 2116, name: "Gemtree Wines", coords: { lat: -35.1833, lng: 138.5000 }, tags: ["Biodynamic", "Family-Friendly", "Shiraz"], type: 'winery', region: "McLaren Vale, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2117, name: "Paxton Wines", coords: { lat: -35.2000, lng: 138.5167 }, tags: ["Organic", "Biodynamic", "Grenache"], type: 'winery', region: "McLaren Vale, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2118, name: "Hardy's Tintara", coords: { lat: -35.2167, lng: 138.5333 }, tags: ["History", "Iconic", "Shiraz"], type: 'winery', region: "McLaren Vale, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2119, name: "Chapel Hill Winery", coords: { lat: -35.2000, lng: 138.5500 }, tags: ["Views", "History", "Grenache"], type: 'winery', region: "McLaren Vale, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2120, name: "Angove Family Winemakers", coords: { lat: -35.2333, lng: 138.5833 }, tags: ["Organic", "Family-Owned", "Warboys"], type: 'winery', region: "McLaren Vale, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2121, name: "Fox Creek Wines", coords: { lat: -35.2833, lng: 138.5000 }, tags: ["Restaurant", "Family-Friendly", "Shiraz"], type: 'winery', region: "McLaren Vale, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2122, name: "Pirramimma Wines", coords: { lat: -35.2167, lng: 138.5667 }, tags: ["History", "Family-Owned", "Petit Verdot"], type: 'winery', region: "McLaren Vale, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2123, name: "Inkwell Wines", coords: { lat: -35.2333, lng: 138.5167 }, tags: ["Boutique", "Sustainable", "Accommodation"], type: 'winery', region: "McLaren Vale, SA", openingHours: { 0: { open: 11, close: 17 }, 1: { open: 11, close: 17 }, 2: null, 3: null, 4: null, 5: { open: 11, close: 17 }, 6: { open: 11, close: 17 } }, visitDuration: 60 },
  { id: 2124, name: "Beach Road Wines", coords: { lat: -35.2, lng: 138.5167 }, tags: ["Restaurant", "Pizza", "Views"], type: 'winery', region: "McLaren Vale, SA", openingHours: { 0: { open: 11, close: 17 }, 1: null, 2: null, 3: { open: 11, close: 17 }, 4: { open: 11, close: 17 }, 5: { open: 11, close: 17 }, 6: { open: 11, close: 17 } }, visitDuration: 75 },
  { id: 2125, name: "Goodieson Brewery", coords: { lat: -35.2167, lng: 138.5 }, tags: ["Beer", "Casual", "Brewery"], type: 'distillery', region: "McLaren Vale, SA", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
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
    console.log(`Successfully seeded ${locations.length} McLaren Vale locations!`);
  } catch (error) {
    console.error("Error seeding McLaren Vale database: ", error);
  }
}
seedDatabase();