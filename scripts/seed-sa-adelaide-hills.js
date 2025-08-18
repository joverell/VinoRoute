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
  // Comprehensive Adelaide Hills List
  { id: 2201, name: "The Lane Vineyard", coords: { lat: -34.9833, lng: 138.8000 }, tags: ["Restaurant", "Views", "Chardonnay"], type: 'winery', region: "Adelaide Hills, SA", openingHours: ALL_WEEK_10_5, visitDuration: 75 },
  { id: 2202, name: "Shaw + Smith", coords: { lat: -35.0094, lng: 138.7889 }, tags: ["Premium", "Sauvignon Blanc", "Architecture"], type: 'winery', region: "Adelaide Hills, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2203, name: "Ambleside Distillers", coords: { lat: -34.9333, lng: 138.8167 }, tags: ["Gin", "Tasting Flights", "Bar"], type: 'distillery', region: "Adelaide Hills, SA", openingHours: { 0: { open: 12, close: 18 }, 1: null, 2: null, 3: null, 4: { open: 12, close: 18 }, 5: { open: 12, close: 20 }, 6: { open: 12, close: 20 } }, visitDuration: 60 },
  { id: 2204, name: "Bird in Hand", coords: { lat: -35.0253, lng: 138.8025 }, tags: ["Restaurant", "Events", "Sparkling"], type: 'winery', region: "Adelaide Hills, SA", openingHours: ALL_WEEK_10_5, visitDuration: 75 },
  { id: 2205, name: "Nepenthe", coords: { lat: -35.0333, lng: 138.7833 }, tags: ["Views", "Sauvignon Blanc", "Family-Friendly"], type: 'winery', region: "Adelaide Hills, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2206, name: "Hahndorf Hill Winery", coords: { lat: -35.0333, lng: 138.8167 }, tags: ["Gruner Veltliner", "Boutique", "Chocolate Pairing"], type: 'winery', region: "Adelaide Hills, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2207, name: "Sidewood Estate", coords: { lat: -35.0167, lng: 138.8 }, tags: ["Restaurant", "Cider", "Family-Friendly"], type: 'winery', region: "Adelaide Hills, SA", openingHours: ALL_WEEK_10_5, visitDuration: 75 },
  { id: 2208, name: "Ashton Hills Vineyard", coords: { lat: -34.9167, lng: 138.75 }, tags: ["Premium", "Pinot Noir", "Boutique"], type: 'winery', region: "Adelaide Hills, SA", openingHours: { 0: { open: 11, close: 17 }, 1: { open: 11, close: 17 }, 2: null, 3: null, 4: null, 5: { open: 11, close: 17 }, 6: { open: 11, close: 17 } }, visitDuration: 60 },
  { id: 2209, name: "Deviation Road Winery", coords: { lat: -35.05, lng: 138.7667 }, tags: ["Sparkling", "Premium", "Boutique"], type: 'winery', region: "Adelaide Hills, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2210, name: "Golding Wines", coords: { lat: -34.8833, lng: 138.8167 }, tags: ["Restaurant", "Gardens", "Family-Owned"], type: 'winery', region: "Adelaide Hills, SA", openingHours: ALL_WEEK_10_5, visitDuration: 75 },
  { id: 2211, name: "Pike & Joyce Wines", coords: { lat: -34.8667, lng: 138.8333 }, tags: ["Restaurant", "Views", "Pinot Noir"], type: 'winery', region: "Adelaide Hills, SA", openingHours: { 0: { open: 11, close: 16 }, 1: null, 2: null, 3: { open: 11, close: 16 }, 4: { open: 11, close: 16 }, 5: { open: 11, close: 16 }, 6: { open: 11, close: 16 } }, visitDuration: 75 },
  { id: 2212, name: "Tapanappa Wines", coords: { lat: -35.0667, lng: 138.75 }, tags: ["Iconic", "Chardonnay", "Premium"], type: 'winery', region: "Adelaide Hills, SA", openingHours: { 0: { open: 11, close: 16 }, 1: { open: 11, close: 16 }, 2: { open: 11, close: 16 }, 3: { open: 11, close: 16 }, 4: { open: 11, close: 16 }, 5: { open: 11, close: 16 }, 6: { open: 11, close: 16 } }, visitDuration: 60 },
  { id: 2213, name: "Unico Zelo", coords: { lat: -34.85, lng: 138.8 }, tags: ["Alternative Varieties", "Modern", "Boutique"], type: 'winery', region: "Adelaide Hills, SA", openingHours: { 0: { open: 12, close: 18 }, 1: null, 2: null, 3: null, 4: { open: 12, close: 18 }, 5: { open: 12, close: 18 }, 6: { open: 12, close: 18 } }, visitDuration: 45 },
  { id: 2214, name: "Applewood Distillery", coords: { lat: -34.85, lng: 138.8 }, tags: ["Gin", "Liqueurs", "Boutique"], type: 'distillery', region: "Adelaide Hills, SA", openingHours: { 0: { open: 12, close: 17 }, 1: null, 2: null, 3: null, 4: null, 5: { open: 12, close: 17 }, 6: { open: 12, close: 17 } }, visitDuration: 45 },
  { id: 2215, name: "Artwine", coords: { lat: -34.9667, lng: 138.8167 }, tags: ["Alternative Varieties", "Views", "Boutique"], type: 'winery', region: "Adelaide Hills, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2216, name: "Barristers Block", coords: { lat: -34.9, lng: 138.8167 }, tags: ["Family-Friendly", "Restaurant", "Gardens"], type: 'winery', region: "Adelaide Hills, SA", openingHours: ALL_WEEK_10_5, visitDuration: 75 },
  { id: 2217, name: "Chain of Ponds", coords: { lat: -34.8333, lng: 138.8 }, tags: ["Sauvignon Blanc", "Pinot Grigio", "Popular"], type: 'winery', region: "Adelaide Hills, SA", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 2218, name: "Cobb's Hill Estate", coords: { lat: -35.0167, lng: 138.7667 }, tags: ["Accommodation", "Gardens", "Sparkling"], type: 'winery', region: "Adelaide Hills, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2219, name: "Howard Vineyard", coords: { lat: -35.05, lng: 138.8167 }, tags: ["Restaurant", "Asian Food", "Family-Owned"], type: 'winery', region: "Adelaide Hills, SA", openingHours: { 0: { open: 10, close: 17 }, 1: null, 2: null, 3: { open: 10, close: 17 }, 4: { open: 10, close: 17 }, 5: { open: 10, close: 17 }, 6: { open: 10, close: 17 } }, visitDuration: 75 },
  { id: 2220, name: "K1 by Geoff Hardy", coords: { lat: -35.15, lng: 138.7 }, tags: ["Views", "Architecture", "Premium"], type: 'winery', region: "Adelaide Hills, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2221, name: "Lobethal Road", coords: { lat: -34.9, lng: 138.8667 }, tags: ["Boutique", "Sustainable", "Chardonnay"], type: 'winery', region: "Adelaide Hills, SA", openingHours: { 0: { open: 11, close: 17 }, 1: { open: 11, close: 17 }, 2: null, 3: null, 4: null, 5: { open: 11, close: 17 }, 6: { open: 11, close: 17 } }, visitDuration: 45 },
  { id: 2222, name: "Longview Vineyard", coords: { lat: -35.2, lng: 138.85 }, tags: ["Accommodation", "Restaurant", "Views"], type: 'winery', region: "Adelaide Hills, SA", openingHours: ALL_WEEK_10_5, visitDuration: 75 },
  { id: 2223, name: "Mount Lofty Ranges Vineyard", coords: { lat: -34.9667, lng: 138.75 }, tags: ["Restaurant", "Views", "Premium"], type: 'winery', region: "Adelaide Hills, SA", openingHours: { 0: { open: 11, close: 17 }, 1: null, 2: null, 3: null, 4: { open: 11, close: 17 }, 5: { open: 11, close: 17 }, 6: { open: 11, close: 17 } }, visitDuration: 75 },
  { id: 2224, name: "O'Leary Walker Wines", coords: { lat: -34.9833, lng: 138.7833 }, tags: ["Riesling", "Shiraz", "Views"], type: 'winery', region: "Adelaide Hills, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2225, name: "Petaluma", coords: { lat: -35.0167, lng: 138.8 }, tags: ["Premium", "Chardonnay", "Architecture"], type: 'winery', region: "Adelaide Hills, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2226, name: "Sinclair's Gully", coords: { lat: -34.9333, lng: 138.7333 }, tags: ["Eco-tourism", "Sparkling", "Events"], type: 'winery', region: "Adelaide Hills, SA", openingHours: { 0: { open: 12, close: 16 }, 1: null, 2: null, 3: null, 4: null, 5: null, 6: { open: 12, close: 16 } }, visitDuration: 60 },
  { id: 2227, name: "The Summertown Aristologist", coords: { lat: -34.95, lng: 138.7167 }, tags: ["Restaurant", "Natural Wine", "Boutique"], type: 'winery', region: "Adelaide Hills, SA", openingHours: { 0: { open: 12, close: 17 }, 1: null, 2: null, 3: null, 4: { open: 18, close: 22 }, 5: { open: 18, close: 22 }, 6: { open: 12, close: 22 } }, visitDuration: 90 },
  { id: 2228, name: "Tilbrook Estate", coords: { lat: -34.9, lng: 138.85 }, tags: ["Sustainable", "Boutique", "Family-Owned"], type: 'winery', region: "Adelaide Hills, SA", openingHours: { 0: { open: 11, close: 17 }, 1: null, 2: null, 3: null, 4: null, 5: { open: 11, close: 17 }, 6: { open: 11, close: 17 } }, visitDuration: 45 },
  { id: 2229, name: "Wicks Estate Wines", coords: { lat: -34.8833, lng: 138.8333 }, tags: ["Sauvignon Blanc", "Sparkling", "Value"], type: 'winery', region: "Adelaide Hills, SA", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
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
    console.log(`Successfully seeded ${locations.length} Adelaide Hills locations!`);
  } catch (error) {
    console.error("Error seeding Adelaide Hills database: ", error);
  }
}
seedDatabase();