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
const WEEKEND_11_5 = { 0: { open: 11, close: 17 }, 1: null, 2: null, 3: null, 4: null, 5: { open: 11, close: 17 }, 6: { open: 11, close: 17 } };

const locations = [
  // Comprehensive Mudgee List
  { id: 4201, name: "Lowe Family Wine Co", coords: { lat: -32.6, lng: 149.6 }, tags: ["Organic", "Restaurant", "Zinfandel"], type: 'winery', region: "Mudgee, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 75 },
  { id: 4202, name: "Robert Stein Winery", coords: { lat: -32.5833, lng: 149.6167 }, tags: ["Restaurant", "Riesling", "Motorcycle Museum"], type: 'winery', region: "Mudgee, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 4203, name: "Logan Wines", coords: { lat: -32.7, lng: 149.65 }, tags: ["Architecture", "Views", "Gewurztraminer"], type: 'winery', region: "Mudgee, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 4204, name: "Huntington Estate", coords: { lat: -32.6167, lng: 149.6333 }, tags: ["Shiraz", "Cabernet", "Music Festival"], type: 'winery', region: "Mudgee, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 4205, name: "Baker Williams Distillery", coords: { lat: -32.5667, lng: 149.6 }, tags: ["Gin", "Liqueurs", "Boutique"], type: 'distillery', region: "Mudgee, NSW", openingHours: WEEKEND_11_5, visitDuration: 45 },
  { id: 4206, name: "Moothi Estate", coords: { lat: -32.6167, lng: 149.5333 }, tags: ["Restaurant", "Views", "Cabernet"], type: 'winery', region: "Mudgee, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 75 },
  { id: 4207, name: "First Ridge", coords: { lat: -32.65, lng: 149.6667 }, tags: ["Italian Varieties", "Views", "Boutique"], type: 'winery', region: "Mudgee, NSW", openingHours: WEEKEND_11_5, visitDuration: 60 },
  { id: 4208, name: "Gilbert Family Wines", coords: { lat: -32.5833, lng: 149.5833 }, tags: ["Boutique", "Family-Owned", "Modern"], type: 'winery', region: "Mudgee, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 4209, name: "The Cellar by Gilbert", coords: { lat: -32.5833, lng: 149.5833 }, tags: ["Wine Bar", "Food", "In-Town"], type: 'winery', region: "Mudgee, NSW", openingHours: { 0: { open: 12, close: 17 }, 1: null, 2: null, 3: null, 4: { open: 12, close: 21 }, 5: { open: 12, close: 21 }, 6: { open: 12, close: 21 } }, visitDuration: 60 },
  { id: 4210, name: "Bunnamagoo Estate", coords: { lat: -32.6, lng: 149.6167 }, tags: ["History", "Cabernet", "Chardonnay"], type: 'winery', region: "Mudgee, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 4211, name: "di Lusso Estate", coords: { lat: -32.6, lng: 149.6333 }, tags: ["Italian Varieties", "Restaurant", "Bocce"], type: 'winery', region: "Mudgee, NSW", openingHours: { 0: { open: 10, close: 17 }, 1: null, 2: null, 3: { open: 10, close: 17 }, 4: { open: 10, close: 17 }, 5: { open: 10, close: 17 }, 6: { open: 10, close: 17 } }, visitDuration: 75 },
  { id: 4212, name: "Mudgee Brewing Company", coords: { lat: -32.5833, lng: 149.5833 }, tags: ["Beer", "Restaurant", "In-Town"], type: 'distillery', region: "Mudgee, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 4213, name: "Vinifera Wines", coords: { lat: -32.6333, lng: 149.65 }, tags: ["Boutique", "Spanish Varieties", "Tempranillo"], type: 'winery', region: "Mudgee, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 4214, name: "Robert Oatley Vineyards", coords: { lat: -32.6167, lng: 149.6 }, tags: ["Popular", "Chardonnay", "Cabernet"], type: 'winery', region: "Mudgee, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 4215, name: "Pieter van Gent Winery", coords: { lat: -32.5833, lng: 149.6 }, tags: ["History", "Pipe Organs", "Chardonnay"], type: 'winery', region: "Mudgee, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 4216, name: "Short Sheep Micro-Winery", coords: { lat: -32.5667, lng: 149.6 }, tags: ["Boutique", "Sustainable", "Small Producer"], type: 'winery', region: "Mudgee, NSW", openingHours: WEEKEND_11_5, visitDuration: 45 },
  { id: 4217, name: "Skimstone Wines", coords: { lat: -32.6667, lng: 149.6667 }, tags: ["Boutique", "Italian Varieties", "Views"], type: 'winery', region: "Mudgee, NSW", openingHours: WEEKEND_11_5, visitDuration: 45 },
  { id: 4218, name: "Thistle Hill Organic Wines", coords: { lat: -32.5333, lng: 149.5 }, tags: ["Organic", "History", "Riesling"], type: 'winery', region: "Mudgee, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 4219, name: "Walter Wines", coords: { lat: -32.6, lng: 149.5833 }, tags: ["Family-Owned", "Shiraz", "Cabernet"], type: 'winery', region: "Mudgee, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 4220, name: "Yeates Wines", coords: { lat: -32.6, lng: 149.6167 }, tags: ["Boutique", "Views", "Family-Owned"], type: 'winery', region: "Mudgee, NSW", openingHours: WEEKEND_11_5, visitDuration: 45 },
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
    console.log(`Successfully seeded ${locations.length} Mudgee locations!`);
  } catch (error) {
    console.error("Error seeding Mudgee database: ", error);
  }
}
seedDatabase();