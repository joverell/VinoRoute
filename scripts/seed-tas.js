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
  // Comprehensive Tasmania List
  // Tamar Valley & Pipers River
  { id: 5001, name: "Jansz Tasmania", coords: { lat: -41.0664, lng: 147.1661 }, tags: ["Sparkling", "Views", "Premium"], type: 'winery', region: "Tamar Valley, TAS", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 5002, name: "Turner Stillhouse", coords: { lat: -41.3164, lng: 147.0811 }, tags: ["Gin", "Whisky", "Boutique"], type: 'distillery', region: "Tamar Valley, TAS", openingHours: { 0: null, 1: null, 2: { open: 11, close: 17 }, 3: { open: 11, close: 17 }, 4: { open: 11, close: 17 }, 5: { open: 11, close: 17 }, 6: { open: 11, close: 17 } }, visitDuration: 60 },
  { id: 5003, name: "Tamar Ridge", coords: { lat: -41.3558, lng: 147.0917 }, tags: ["Pinot Noir", "Views", "Restaurant"], type: 'winery', region: "Tamar Valley, TAS", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 5004, name: "Pipers Brook Vineyard", coords: { lat: -41.0833, lng: 147.2833 }, tags: ["Sparkling", "Pinot Noir", "Cool Climate"], type: 'winery', region: "Tamar Valley, TAS", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 5005, name: "Josef Chromy Wines", coords: { lat: -41.5333, lng: 147.1333 }, tags: ["Restaurant", "Views", "Sparkling"], type: 'winery', region: "Tamar Valley, TAS", openingHours: ALL_WEEK_10_5, visitDuration: 75 },
  { id: 5006, name: "Holm Oak Vineyards", coords: { lat: -41.2583, lng: 146.9167 }, tags: ["Family-Owned", "Pinot Noir", "Riesling"], type: 'winery', region: "Tamar Valley, TAS", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 5007, name: "Goaty Hill Wines", coords: { lat: -41.2167, lng: 146.9 }, tags: ["Boutique", "Views", "Pinot Noir"], type: 'winery', region: "Tamar Valley, TAS", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 5008, name: "Clover Hill", coords: { lat: -41.05, lng: 147.4167 }, tags: ["Sparkling", "Premium", "Architecture"], type: 'winery', region: "Pipers River, TAS", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 5009, name: "Bay of Fires Wines", coords: { lat: -41.0667, lng: 147.4 }, tags: ["Premium", "Sparkling", "Pinot Noir"], type: 'winery', region: "Pipers River, TAS", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 5010, name: "Apogee Tasmania", coords: { lat: -41.0833, lng: 147.3833 }, tags: ["Sparkling", "Boutique", "Premium"], type: 'winery', region: "Pipers River, TAS", openingHours: { 0: null, 1: null, 2: null, 3: null, 4: { open: 11, close: 16 }, 5: { open: 11, close: 16 }, 6: { open: 11, close: 16 } }, visitDuration: 60 },
  { id: 5011, name: "Moores Hill Estate", coords: { lat: -41.25, lng: 146.8667 }, tags: ["Sustainable", "Riesling", "Pinot Noir"], type: 'winery', region: "Tamar Valley, TAS", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 5012, name: "Velo Wines", coords: { lat: -41.3, lng: 146.9667 }, tags: ["Boutique", "Pinot Noir", "Restaurant"], type: 'winery', region: "Tamar Valley, TAS", openingHours: { 0: { open: 11, close: 17 }, 1: null, 2: null, 3: null, 4: { open: 11, close: 17 }, 5: { open: 11, close: 17 }, 6: { open: 11, close: 17 } }, visitDuration: 60 },
  { id: 5013, name: "Swinging Gate Vineyard", coords: { lat: -41.2333, lng: 146.8833 }, tags: ["Boutique", "Pinot Noir", "Accommodation"], type: 'winery', region: "Tamar Valley, TAS", openingHours: ALL_WEEK_10_5, visitDuration: 45 },

  // Coal River Valley
  { id: 5101, name: "Pooley Wines", coords: { lat: -42.7667, lng: 147.4167 }, tags: ["History", "Riesling", "Pinot Noir"], type: 'winery', region: "Coal River Valley, TAS", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 5102, name: "Sullivans Cove Distillery", coords: { lat: -42.8464, lng: 147.3517 }, tags: ["Whisky", "Iconic", "Premium"], type: 'distillery', region: "Coal River Valley, TAS", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 5103, name: "Frogmore Creek", coords: { lat: -42.7833, lng: 147.4167 }, tags: ["Restaurant", "Views", "Cool Climate"], type: 'winery', region: "Coal River Valley, TAS", openingHours: ALL_WEEK_10_5, visitDuration: 75 },
  { id: 5104, name: "Puddleduck Vineyard", coords: { lat: -42.75, lng: 147.4167 }, tags: ["Family-Friendly", "Casual", "Sparkling"], type: 'winery', region: "Coal River Valley, TAS", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 5105, name: "Coal Valley Vineyard", coords: { lat: -42.7667, lng: 147.4 }, tags: ["Restaurant", "Views", "Pinot Noir"], type: 'winery', region: "Coal River Valley, TAS", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 5106, name: "Nocton Vineyard", coords: { lat: -42.7333, lng: 147.4333 }, tags: ["Boutique", "Pinot Noir", "Chardonnay"], type: 'winery', region: "Coal River Valley, TAS", openingHours: { 0: { open: 11, close: 17 }, 1: { open: 11, close: 17 }, 2: { open: 11, close: 17 }, 3: { open: 11, close: 17 }, 4: { open: 11, close: 17 }, 5: { open: 11, close: 17 }, 6: { open: 11, close: 17 } }, visitDuration: 45 },

  // Derwent Valley & Hobart
  { id: 5201, name: "Moorilla", coords: { lat: -42.7833, lng: 147.2667 }, tags: ["Art", "MONA", "Restaurant"], type: 'winery', region: "Derwent Valley, TAS", openingHours: { 0: { open: 10, close: 18 }, 1: null, 2: null, 3: { open: 10, close: 18 }, 4: { open: 10, close: 18 }, 5: { open: 10, close: 18 }, 6: { open: 10, close: 18 } }, visitDuration: 90 },
  { id: 5202, name: "Lark Distillery", coords: { lat: -42.8833, lng: 147.3333 }, tags: ["Whisky", "Iconic", "Bar"], type: 'distillery', region: "Hobart, TAS", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 5203, name: "Stefano Lubiana Wines", coords: { lat: -42.7667, lng: 147.2333 }, tags: ["Biodynamic", "Restaurant", "Views"], type: 'winery', region: "Derwent Valley, TAS", openingHours: ALL_WEEK_10_5, visitDuration: 75 },
  { id: 5204, name: "Derwent Estate", coords: { lat: -42.7, lng: 147.2167 }, tags: ["History", "Pinot Noir", "Riesling"], type: 'winery', region: "Derwent Valley, TAS", openingHours: ALL_WEEK_10_5, visitDuration: 60 },

  // East Coast
  { id: 5301, name: "Freycinet Vineyard", coords: { lat: -42.0667, lng: 148.2833 }, tags: ["Pinot Noir", "Views", "Boutique"], type: 'winery', region: "East Coast, TAS", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 5302, name: "Devil's Corner", coords: { lat: -42.05, lng: 148.2833 }, tags: ["Views", "Pizza", "Architecture"], type: 'winery', region: "East Coast, TAS", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 5303, name: "Spring Vale Vineyard", coords: { lat: -41.9833, lng: 148.2167 }, tags: ["History", "Restaurant", "Pinot Noir"], type: 'winery', region: "East Coast, TAS", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 5304, name: "Milton Vineyard", coords: { lat: -41.9333, lng: 148.2 }, tags: ["Restaurant", "Pinot Noir", "I-Shed"], type: 'winery', region: "East Coast, TAS", openingHours: ALL_WEEK_10_5, visitDuration: 60 },

  // Huon Valley
  { id: 5401, name: "Home Hill Winery", coords: { lat: -43.0667, lng: 147.0833 }, tags: ["Restaurant", "Pinot Noir", "Architecture"], type: 'winery', region: "Huon Valley, TAS", openingHours: ALL_WEEK_10_5, visitDuration: 75 },
  { id: 5402, name: "Kate Hill Wines", coords: { lat: -43.0833, lng: 147.1 }, tags: ["Boutique", "Pinot Noir", "Sparkling"], type: 'winery', region: "Huon Valley, TAS", openingHours: { 0: { open: 11, close: 17 }, 1: null, 2: null, 3: null, 4: null, 5: { open: 11, close: 17 }, 6: { open: 11, close: 17 } }, visitDuration: 45 },
  { id: 5403, name: "Willie Smith's Apple Shed", coords: { lat: -43.0167, lng: 147.05 }, tags: ["Cider", "Restaurant", "Family-Friendly"], type: 'distillery', region: "Huon Valley, TAS", openingHours: ALL_WEEK_10_5, visitDuration: 75 },
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
    console.log(`Successfully seeded ${locations.length} Tasmanian locations!`);
  } catch (error) {
    console.error("Error seeding Tasmanian database: ", error);
  }
}
seedDatabase();