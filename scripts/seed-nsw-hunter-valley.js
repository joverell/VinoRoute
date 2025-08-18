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
  // Comprehensive Hunter Valley List
  { id: 4001, name: "Tyrrell's Wines", coords: { lat: -32.7669, lng: 151.2831 }, tags: ["History", "Iconic", "Semillon"], type: 'winery', region: "Hunter Valley, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 4002, name: "Brokenwood Wines", coords: { lat: -32.7883, lng: 151.3006 }, tags: ["Restaurant", "Shiraz", "Premium"], type: 'winery', region: "Hunter Valley, NSW", openingHours: { 0: { open: 11, close: 17 }, 1: { open: 11, close: 17 }, 2: { open: 11, close: 17 }, 3: { open: 11, close: 17 }, 4: { open: 11, close: 17 }, 5: { open: 11, close: 17 }, 6: { open: 11, close: 17 } }, visitDuration: 75 },
  { id: 4003, name: "Audrey Wilkinson", coords: { lat: -32.8083, lng: 151.3256 }, tags: ["Views", "History", "Semillon"], type: 'winery', region: "Hunter Valley, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 4004, name: "Hunter Valley Distillery", coords: { lat: -32.7889, lng: 151.2988 }, tags: ["Vodka", "Gin", "Liqueurs"], type: 'distillery', region: "Hunter Valley, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 4005, name: "Bimbadgen", coords: { lat: -32.7981, lng: 151.2917 }, tags: ["Restaurant", "Concerts", "Views"], type: 'winery', region: "Hunter Valley, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 75 },
  { id: 4006, name: "Tulloch Wines", coords: { lat: -32.7858, lng: 151.2981 }, tags: ["History", "Family-Friendly", "Verdelho"], type: 'winery', region: "Hunter Valley, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 4007, name: "Usher Tinkler Wines", coords: { lat: -32.7869, lng: 151.2958 }, tags: ["Boutique", "Salumi", "Modern"], type: 'winery', region: "Hunter Valley, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 4008, name: "Tamburlaine Organic Wines", coords: { lat: -32.7894, lng: 151.2953 }, tags: ["Organic", "Vegan", "Popular"], type: 'winery', region: "Hunter Valley, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 4009, name: "Scarborough Wine Co", coords: { lat: -32.7847, lng: 151.2931 }, tags: ["Chardonnay", "Family-Owned", "Views"], type: 'winery', region: "Hunter Valley, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 4010, name: "Pepper Tree Wines", coords: { lat: -32.7917, lng: 151.2969 }, tags: ["Restaurant", "Gardens", "Premium"], type: 'winery', region: "Hunter Valley, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 75 },
  { id: 4011, name: "Mount Pleasant Wines", coords: { lat: -32.7931, lng: 151.3069 }, tags: ["History", "Iconic", "Shiraz"], type: 'winery', region: "Hunter Valley, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 4012, name: "McGuigan Wines", coords: { lat: -32.7861, lng: 151.2939 }, tags: ["Popular", "Cheese", "Family-Friendly"], type: 'winery', region: "Hunter Valley, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 4013, name: "Margan Wines & Restaurant", coords: { lat: -32.7083, lng: 151.2167 }, tags: ["Restaurant", "Sustainable", "Premium"], type: 'winery', region: "Hunter Valley, NSW", openingHours: { 0: { open: 10, close: 17 }, 1: null, 2: null, 3: { open: 10, close: 17 }, 4: { open: 10, close: 17 }, 5: { open: 10, close: 17 }, 6: { open: 10, close: 17 } }, visitDuration: 90 },
  { id: 4014, name: "Leogate Estate Wines", coords: { lat: -32.7681, lng: 151.2819 }, tags: ["Restaurant", "Views", "Premium"], type: 'winery', region: "Hunter Valley, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 75 },
  { id: 4015, name: "Keith Tulloch Wine", coords: { lat: -32.7853, lng: 151.2969 }, tags: ["Restaurant", "Boutique", "Semillon"], type: 'winery', region: "Hunter Valley, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 4016, name: "Hope Estate", coords: { lat: -32.7953, lng: 151.2881 }, tags: ["Concerts", "Beer", "Restaurant"], type: 'winery', region: "Hunter Valley, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 4017, name: "Harkham Wines", coords: { lat: -32.7750, lng: 151.2833 }, tags: ["Natural Wine", "Kosher", "Boutique"], type: 'winery', region: "Hunter Valley, NSW", openingHours: { 0: { open: 10, close: 17 }, 1: null, 2: null, 3: null, 4: null, 5: { open: 10, close: 17 }, 6: { open: 10, close: 17 } }, visitDuration: 45 },
  { id: 4018, name: "Gundog Estate", coords: { lat: -32.7861, lng: 151.2944 }, tags: ["Boutique", "Semillon", "Shiraz"], type: 'winery', region: "Hunter Valley, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 4019, name: "First Creek Wines", coords: { lat: -32.7903, lng: 151.2958 }, tags: ["Chardonnay", "Semillon", "Modern"], type: 'winery', region: "Hunter Valley, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 4020, name: "De Iuliis Wines", coords: { lat: -32.7833, lng: 151.2917 }, tags: ["Shiraz", "Semillon", "Modern"], type: 'winery', region: "Hunter Valley, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 4021, name: "Constable Estate", coords: { lat: -32.7833, lng: 151.2833 }, tags: ["Art", "Gardens", "Boutique"], type: 'winery', region: "Hunter Valley, NSW", openingHours: { 0: { open: 10, close: 16 }, 1: null, 2: null, 3: null, 4: null, 5: { open: 10, close: 16 }, 6: { open: 10, close: 16 } }, visitDuration: 60 },
  { id: 4022, name: "Capercaillie Wines", coords: { lat: -32.7833, lng: 151.2667 }, tags: ["Boutique", "Chardonnay", "Scottish"], type: 'winery', region: "Hunter Valley, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 4023, name: "Tempus Two", coords: { lat: -32.7881, lng: 151.2961 }, tags: ["Modern", "Architecture", "Popular"], type: 'winery', region: "Hunter Valley, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 4024, name: "Pokolbin Estate Vineyard", coords: { lat: -32.7833, lng: 151.2833 }, tags: ["Boutique", "Riesling", "Shiraz"], type: 'winery', region: "Hunter Valley, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 4025, name: "Peterson House", coords: { lat: -32.8167, lng: 151.3 }, tags: ["Sparkling", "Restaurant", "Breakfast"], type: 'winery', region: "Hunter Valley, NSW", openingHours: { 0: { open: 9, close: 17 }, 1: { open: 9, close: 17 }, 2: { open: 9, close: 17 }, 3: { open: 9, close: 17 }, 4: { open: 9, close: 17 }, 5: { open: 9, close: 17 }, 6: { open: 9, close: 17 } }, visitDuration: 60 },
  { id: 4026, name: "Meerea Park", coords: { lat: -32.7833, lng: 151.2917 }, tags: ["Shiraz", "Semillon", "Premium"], type: 'winery', region: "Hunter Valley, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 4027, name: "Krinklewood Vineyard", coords: { lat: -32.6833, lng: 151.2 }, tags: ["Biodynamic", "French Style", "Gardens"], type: 'winery', region: "Hunter Valley, NSW", openingHours: { 0: { open: 10, close: 16 }, 1: null, 2: null, 3: null, 4: null, 5: { open: 10, close: 16 }, 6: { open: 10, close: 16 } }, visitDuration: 60 },
  { id: 4028, name: "Hungerford Hill", coords: { lat: -32.7917, lng: 151.2917 }, tags: ["Restaurant", "Architecture", "Premium"], type: 'winery', region: "Hunter Valley, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 75 },
  { id: 4029, name: "Gartelmann Wines", coords: { lat: -32.7667, lng: 151.25 }, tags: ["Restaurant", "Boutique", "Semillon"], type: 'winery', region: "Hunter Valley, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 4030, name: "Drayton's Family Wines", coords: { lat: -32.7833, lng: 151.3 }, tags: ["History", "Family-Owned", "Shiraz"], type: 'winery', region: "Hunter Valley, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 4031, name: "David Hook Wines", coords: { lat: -32.7833, lng: 151.2667 }, tags: ["Boutique", "Italian Varieties", "Pinot Grigio"], type: 'winery', region: "Hunter Valley, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 4032, name: "Comyns & Co.", coords: { lat: -32.7833, lng: 151.2917 }, tags: ["Boutique", "Modern", "Semillon"], type: 'winery', region: "Hunter Valley, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 4033, name: "Cockfighter's Ghost", coords: { lat: -32.75, lng: 151.2333 }, tags: ["History", "Semillon", "Shiraz"], type: 'winery', region: "Hunter Valley, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 4034, name: "Carillion Wines", coords: { lat: -32.7833, lng: 151.2833 }, tags: ["Views", "Boutique", "Shiraz"], type: 'winery', region: "Hunter Valley, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 4035, name: "Ben Ean", coords: { lat: -32.7833, lng: 151.3 }, tags: ["History", "Restaurant", "Views"], type: 'winery', region: "Hunter Valley, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 4036, name: "Broke Fordwich", coords: { lat: -32.7, lng: 151.15 }, tags: ["Boutique", "Scenic", "Semillon"], type: 'winery', region: "Hunter Valley, NSW", openingHours: { 0: { open: 10, close: 17 }, 1: null, 2: null, 3: null, 4: null, 5: { open: 10, close: 17 }, 6: { open: 10, close: 17 } }, visitDuration: 60 },
  { id: 4037, name: "Catherine Vale Vineyard", coords: { lat: -32.7167, lng: 151.1333 }, tags: ["Boutique", "Barbera", "Arneis"], type: 'winery', region: "Hunter Valley, NSW", openingHours: { 0: { open: 10, close: 17 }, 1: null, 2: null, 3: null, 4: null, 5: { open: 10, close: 17 }, 6: { open: 10, close: 17 } }, visitDuration: 45 },
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
    console.log(`Successfully seeded ${locations.length} Hunter Valley locations!`);
  } catch (error) {
    console.error("Error seeding Hunter Valley database: ", error);
  }
}
seedDatabase();