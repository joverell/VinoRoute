const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, writeBatch } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBfSjTtaQtAmLTJNdqW0TfTy9FwT0iSlo4",
  authDomain: "vinoroute-e8d8d.firebaseapp.com",
  projectId: "vinoroute-e8d8d",
  storageBucket: "vinoroute-e8d8d.appspot.com",
  messagingSenderId: "325683658873",
  appId: "1:325683658873:web:10724e01b115dc892b14a8"
};

const ALL_WEEK_10_5 = { 0: { open: 10, close: 17 }, 1: { open: 10, close: 17 }, 2: { open: 10, close: 17 }, 3: { open: 10, close: 17 }, 4: { open: 10, close: 17 }, 5: { open: 10, close: 17 }, 6: { open: 10, close: 17 } };

const locations = [
  // Comprehensive Queensland List
  // Granite Belt
  { id: 9001, name: "Sirromet Wines", coords: { lat: -27.5833, lng: 153.2500 }, tags: ["Restaurant", "Concerts", "Views"], type: 'winery', region: "Granite Belt, QLD", openingHours: ALL_WEEK_10_5, visitDuration: 75 },
  { id: 9002, name: "Castle Glen Distillery", coords: { lat: -28.6500, lng: 151.9333 }, tags: ["Liqueurs", "Castle", "Unique"], type: 'distillery', region: "Granite Belt, QLD", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 9003, name: "Ballandean Estate Wines", coords: { lat: -28.7833, lng: 151.8500 }, tags: ["History", "Family-Owned", "Shiraz"], type: 'winery', region: "Granite Belt, QLD", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 9004, name: "Golden Grove Estate", coords: { lat: -28.7667, lng: 151.8333 }, tags: ["Boutique", "Alternative Varieties", "Family-Run"], type: 'winery', region: "Granite Belt, QLD", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 9005, name: "Robert Channon Wines", coords: { lat: -28.6, lng: 151.9167 }, tags: ["Verdelho", "Restaurant", "Boutique"], type: 'winery', region: "Granite Belt, QLD", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 9006, name: "Symphony Hill Wines", coords: { lat: -28.6167, lng: 151.8833 }, tags: ["Premium", "Alternative Varieties", "Boutique"], type: 'winery', region: "Granite Belt, QLD", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 9007, name: "Tobin Wines", coords: { lat: -28.7833, lng: 151.8667 }, tags: ["Boutique", "Premium", "Shiraz"], type: 'winery', region: "Granite Belt, QLD", openingHours: { 0: { open: 10, close: 17 }, 1: null, 2: null, 3: null, 4: null, 5: { open: 10, close: 17 }, 6: { open: 10, close: 17 } }, visitDuration: 60 },
  { id: 9008, name: "Hidden Creek Winery Cafe", coords: { lat: -28.8, lng: 151.8167 }, tags: ["Restaurant", "Views", "Family-Friendly"], type: 'winery', region: "Granite Belt, QLD", openingHours: { 0: { open: 10, close: 16 }, 1: null, 2: null, 3: null, 4: { open: 10, close: 16 }, 5: { open: 10, close: 16 }, 6: { open: 10, close: 16 } }, visitDuration: 75 },
  { id: 9009, name: "Granite Belt Brewery", coords: { lat: -28.6333, lng: 151.9 }, tags: ["Beer", "Restaurant", "Accommodation"], type: 'distillery', region: "Granite Belt, QLD", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 9010, name: "Ridgemill Estate", coords: { lat: -28.6667, lng: 151.8833 }, tags: ["Accommodation", "Boutique", "Saperavi"], type: 'winery', region: "Granite Belt, QLD", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 9011, name: "Summit Estate Wines", coords: { lat: -28.5833, lng: 151.8667 }, tags: ["Boutique", "Alternative Varieties", "Views"], type: 'winery', region: "Granite Belt, QLD", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 9012, name: "Boireann Winery", coords: { lat: -28.7, lng: 151.8167 }, tags: ["Boutique", "Red Wine", "Shiraz"], type: 'winery', region: "Granite Belt, QLD", openingHours: { 0: { open: 10, close: 16 }, 1: null, 2: null, 3: null, 4: null, 5: { open: 10, close: 16 }, 6: { open: 10, close: 16 } }, visitDuration: 45 },
  
  // South Burnett
  { id: 9101, name: "Clovely Estate", coords: { lat: -26.6, lng: 151.8333 }, tags: ["Restaurant", "Verdelho", "Shiraz"], type: 'winery', region: "South Burnett, QLD", openingHours: { 0: { open: 10, close: 16 }, 1: null, 2: null, 3: null, 4: null, 5: { open: 10, close: 16 }, 6: { open: 10, close: 16 } }, visitDuration: 60 },
  { id: 9102, name: "Moffatdale Ridge", coords: { lat: -26.3, lng: 152.0167 }, tags: ["Restaurant", "Views", "Family-Owned"], type: 'winery', region: "South Burnett, QLD", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 9103, name: "Dusty Hill Vineyard", coords: { lat: -26.3167, lng: 151.9833 }, tags: ["Restaurant", "Accommodation", "Boutique"], type: 'winery', region: "South Burnett, QLD", openingHours: ALL_WEEK_10_5, visitDuration: 75 },
  
  // Tamborine Mountain
  { id: 9201, name: "Witches Falls Winery", coords: { lat: -27.9667, lng: 153.1833 }, tags: ["Boutique", "Cheese", "Chardonnay"], type: 'winery', region: "Tamborine Mountain, QLD", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 9202, name: "Tamborine Mountain Distillery", coords: { lat: -27.9167, lng: 153.2 }, tags: ["Liqueurs", "Schnapps", "Unique"], type: 'distillery', region: "Tamborine Mountain, QLD", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 9203, name: "Cedar Creek Estate", coords: { lat: -27.95, lng: 153.2167 }, tags: ["Restaurant", "Glow Worm Caves", "Family-Friendly"], type: 'winery', region: "Tamborine Mountain, QLD", openingHours: ALL_WEEK_10_5, visitDuration: 75 },
  { id: 9204, name: "Hampton Estate Wines", coords: { lat: -27.9333, lng: 153.2 }, tags: ["Restaurant", "Weddings", "Views"], type: 'winery', region: "Tamborine Mountain, QLD", openingHours: { 0: { open: 11, close: 16 }, 1: null, 2: null, 3: { open: 11, close: 16 }, 4: { open: 11, close: 16 }, 5: { open: 11, close: 16 }, 6: { open: 11, close: 16 } }, visitDuration: 60 },
  { id: 9205, name: "Cauldron Distillery", coords: { lat: -27.95, lng: 153.1833 }, tags: ["Gin", "Bar", "Modern"], type: 'distillery', region: "Tamborine Mountain, QLD", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
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
    console.log(`Successfully seeded ${locations.length} Queensland locations!`);
  } catch (error) {
    console.error("Error seeding Queensland database: ", error);
  }
}
seedDatabase();
