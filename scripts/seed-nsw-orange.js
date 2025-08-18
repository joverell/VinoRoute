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
  // Comprehensive Orange List
  { id: 4101, name: "Philip Shaw Wines", coords: { lat: -33.3508, lng: 149.0881 }, tags: ["Cool Climate", "Chardonnay", "Views"], type: 'winery', region: "Orange, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 4102, name: "Borrodell Estate", coords: { lat: -33.2667, lng: 149.0833 }, tags: ["Restaurant", "Views", "Accommodation"], type: 'winery', region: "Orange, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 75 },
  { id: 4103, name: "Swinging Bridge Wines", coords: { lat: -33.3, lng: 149.0667 }, tags: ["Pinot Noir", "Chardonnay", "Boutique"], type: 'winery', region: "Orange, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 4104, name: "Ross Hill Wines", coords: { lat: -33.25, lng: 149.1167 }, tags: ["Sustainable", "Cabernet Franc", "Family-Owned"], type: 'winery', region: "Orange, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 4105, name: "Heifer Station Wines", coords: { lat: -33.2333, lng: 149.05 }, tags: ["Family-Friendly", "Petting Zoo", "Chardonnay"], type: 'winery', region: "Orange, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 4106, name: "Nashdale Lane Wines", coords: { lat: -33.3, lng: 149.0167 }, tags: ["Accommodation", "Boutique", "Views"], type: 'winery', region: "Orange, NSW", openingHours: { 0: { open: 11, close: 17 }, 1: null, 2: null, 3: null, 4: null, 5: { open: 11, close: 17 }, 6: { open: 11, close: 17 } }, visitDuration: 60 },
  { id: 4107, name: "De Salis Wines", coords: { lat: -33.3167, lng: 149.0333 }, tags: ["Sparkling", "Pinot Noir", "Premium"], type: 'winery', region: "Orange, NSW", openingHours: { 0: { open: 11, close: 17 }, 1: { open: 11, close: 17 }, 2: { open: 11, close: 17 }, 3: { open: 11, close: 17 }, 4: { open: 11, close: 17 }, 5: { open: 11, close: 17 }, 6: { open: 11, close: 17 } }, visitDuration: 60 },
  { id: 4108, name: "Colmar Estate", coords: { lat: -33.3333, lng: 149.05 }, tags: ["Boutique", "Pinot Noir", "Riesling"], type: 'winery', region: "Orange, NSW", openingHours: { 0: { open: 10.5, close: 17 }, 1: { open: 10.5, close: 17 }, 2: null, 3: null, 4: null, 5: { open: 10.5, close: 17 }, 6: { open: 10.5, close: 17 } }, visitDuration: 45 },
  { id: 4109, name: "Rowlee Wines", coords: { lat: -33.3167, lng: 149.05 }, tags: ["Boutique", "Gardens", "Chardonnay"], type: 'winery', region: "Orange, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 4110, name: "Ferment, The Orange Wine Centre", coords: { lat: -33.2833, lng: 149.1 }, tags: ["Wine Bar", "Local Produce", "In-Town"], type: 'winery', region: "Orange, NSW", openingHours: { 0: { open: 12, close: 18 }, 1: null, 2: null, 3: { open: 14, close: 18 }, 4: { open: 14, close: 18 }, 5: { open: 12, close: 19 }, 6: { open: 12, close: 19 } }, visitDuration: 60 },
  { id: 4111, name: "Parrot Distilling Co", coords: { lat: -33.2833, lng: 149.1 }, tags: ["Gin", "Bar", "In-Town"], type: 'distillery', region: "Orange, NSW", openingHours: { 0: { open: 12, close: 18 }, 1: null, 2: null, 3: null, 4: { open: 16, close: 21 }, 5: { open: 12, close: 22 }, 6: { open: 12, close: 22 } }, visitDuration: 45 },
  { id: 4112, name: "Mortimers Wines", coords: { lat: -33.3, lng: 149.0833 }, tags: ["History", "Cabernet", "Family-Owned"], type: 'winery', region: "Orange, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 4113, name: "Angullong Vineyard", coords: { lat: -33.5333, lng: 148.8333 }, tags: ["Italian Varieties", "Boutique", "Family-Owned"], type: 'winery', region: "Orange, NSW", openingHours: { 0: { open: 11, close: 17 }, 1: { open: 11, close: 17 }, 2: { open: 11, close: 17 }, 3: { open: 11, close: 17 }, 4: { open: 11, close: 17 }, 5: { open: 11, close: 17 }, 6: { open: 11, close: 17 } }, visitDuration: 45 },
  { id: 4114, name: "Cargo Road Wines", coords: { lat: -33.2667, lng: 148.9667 }, tags: ["Boutique", "Views", "Zinfandel"], type: 'winery', region: "Orange, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 4115, name: "Cooks Lot", coords: { lat: -33.2833, lng: 149.1 }, tags: ["Boutique", "In-Town", "Shiraz"], type: 'winery', region: "Orange, NSW", openingHours: { 0: { open: 12, close: 17 }, 1: null, 2: null, 3: null, 4: { open: 12, close: 17 }, 5: { open: 12, close: 17 }, 6: { open: 12, close: 17 } }, visitDuration: 45 },
  { id: 4116, name: "Highland Heritage Estate", coords: { lat: -33.3333, lng: 149.1167 }, tags: ["Restaurant", "Views", "Sparkling"], type: 'winery', region: "Orange, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 4117, name: "Patina Wines", coords: { lat: -33.3667, lng: 149.1 }, tags: ["Boutique", "Chardonnay", "Premium"], type: 'winery', region: "Orange, NSW", openingHours: { 0: { open: 11, close: 17 }, 1: null, 2: null, 3: null, 4: null, 5: { open: 11, close: 17 }, 6: { open: 11, close: 17 } }, visitDuration: 45 },
  { id: 4118, name: "Printhie Wines", coords: { lat: -33.3, lng: 149.0 }, tags: ["Sparkling", "Premium", "Chardonnay"], type: 'winery', region: "Orange, NSW", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 4119, name: "See Saw Wine", coords: { lat: -33.2833, lng: 149.1 }, tags: ["Organic", "Prosecco", "In-Town"], type: 'winery', region: "Orange, NSW", openingHours: { 0: { open: 11, close: 17 }, 1: null, 2: null, 3: null, 4: { open: 11, close: 17 }, 5: { open: 11, close: 17 }, 6: { open: 11, close: 17 } }, visitDuration: 45 },
  { id: 4120, name: "Stockman's Ridge Wines", coords: { lat: -33.3833, lng: 149.05 }, tags: ["Boutique", "Views", "Family-Friendly"], type: 'winery', region: "Orange, NSW", openingHours: { 0: { open: 11, close: 17 }, 1: null, 2: null, 3: null, 4: null, 5: { open: 11, close: 17 }, 6: { open: 11, close: 17 } }, visitDuration: 60 },
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
    console.log(`Successfully seeded ${locations.length} Orange locations!`);
  } catch (error) {
    console.error("Error seeding Orange database: ", error);
  }
}
seedDatabase();
