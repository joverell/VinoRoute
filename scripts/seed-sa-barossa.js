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
  // Comprehensive Barossa Valley List
  { id: 2001, name: "Penfolds Barossa Valley", coords: { lat: -34.5169, lng: 138.9333 }, tags: ["Iconic", "Shiraz", "Red Wine"], type: 'winery', region: "Barossa Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 75 },
  { id: 2002, name: "Seppeltsfield Road Distillers", coords: { lat: -34.4886, lng: 138.9083 }, tags: ["Gin", "Cocktails", "Boutique"], type: 'distillery', region: "Barossa Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2003, name: "Jacobs Creek", coords: { lat: -34.5950, lng: 138.8681 }, tags: ["Restaurant", "Popular", "Views"], type: 'winery', region: "Barossa Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 90 },
  { id: 2004, name: "St Hugo", coords: { lat: -34.5698, lng: 138.9958 }, tags: ["Restaurant", "Luxury", "Cabernet"], type: 'winery', region: "Barossa Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 75 },
  { id: 2005, name: "Henschke", coords: { lat: -34.4283, lng: 139.0881 }, tags: ["Iconic", "Hill of Grace", "Premium"], type: 'winery', region: "Barossa Valley, SA", openingHours: { 0: null, 1: { open: 9, close: 16.5 }, 2: { open: 9, close: 16.5 }, 3: { open: 9, close: 16.5 }, 4: { open: 9, close: 16.5 }, 5: { open: 9, close: 16.5 }, 6: { open: 9, close: 16.5 } }, visitDuration: 60 },
  { id: 2006, name: "Rockford Wines", coords: { lat: -34.5806, lng: 138.9839 }, tags: ["Iconic", "Basket Press", "Traditional"], type: 'winery', region: "Barossa Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2007, name: "Barossa Distilling Company", coords: { lat: -34.5292, lng: 138.9556 }, tags: ["Gin", "Spirits", "Bar"], type: 'distillery', region: "Barossa Valley, SA", openingHours: { 0: { open: 12, close: 19 }, 1: null, 2: null, 3: null, 4: { open: 12, close: 19 }, 5: { open: 12, close: 22 }, 6: { open: 12, close: 22 } }, visitDuration: 60 },
  { id: 2008, name: 'Torbreck', coords: { lat: -34.4925, lng: 138.9136 }, tags: ['Premium', 'Shiraz', 'Rhone Varieties'], type: 'winery', region: "Barossa Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2009, name: 'Wolf Blass', coords: { lat: -34.5425, lng: 138.9608 }, tags: ['Iconic', 'Popular', 'Red Wine'], type: 'winery', region: "Barossa Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2010, name: 'Yalumba', coords: { lat: -34.5381, lng: 139.0003 }, tags: ['History', 'Family-Owned', 'Viognier'], type: 'winery', region: "Barossa Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 75 },
  { id: 2011, name: 'Charles Melton Wines', coords: { lat: -34.5858, lng: 138.9853 }, tags: ['Boutique', 'Grenache', 'Shiraz'], type: 'winery', region: "Barossa Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2012, name: 'Peter Lehmann Wines', coords: { lat: -34.5122, lng: 138.9431 }, tags: ['Restaurant', 'Family-Friendly', 'Shiraz'], type: 'winery', region: "Barossa Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2013, name: 'Turkey Flat Vineyards', coords: { lat: -34.5294, lng: 138.9589 }, tags: ['History', 'Rosé', 'Shiraz'], type: 'winery', region: "Barossa Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2014, name: 'Grant Burge', coords: { lat: -34.5708, lng: 138.8958 }, tags: ['Popular', 'Sparkling', 'Shiraz'], type: 'winery', region: "Barossa Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2015, name: 'Chateau Tanunda', coords: { lat: -34.5258, lng: 138.9633 }, tags: ['History', 'Castle', 'Shiraz'], type: 'winery', region: "Barossa Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 75 },
  { id: 2016, name: 'Langmeil Winery', coords: { lat: -34.5058, lng: 138.9303 }, tags: ['History', 'Shiraz', 'Family-Owned'], type: 'winery', region: "Barossa Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2017, name: 'Bethany Wines', coords: { lat: -34.5458, lng: 139.0189 }, tags: ['Views', 'Family-Owned', 'Riesling'], type: 'winery', region: "Barossa Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2018, name: 'Kaesler Wines', coords: { lat: -34.4983, lng: 138.9281 }, tags: ['Restaurant', 'Shiraz', 'Old Vines'], type: 'winery', region: "Barossa Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2019, name: 'Two Hands Wines', coords: { lat: -34.4917, lng: 138.9103 }, tags: ['Premium', 'Shiraz', 'Modern'], type: 'winery', region: "Barossa Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2020, name: 'Whistler Wines', coords: { lat: -34.4833, lng: 138.9000 }, tags: ['Family-Friendly', 'Biodynamic', 'Grenache'], type: 'winery', region: "Barossa Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2021, name: 'Durand Distillery', coords: { lat: -34.5250, lng: 138.9500 }, tags: ['Gin', 'Brandy', 'Boutique'], type: 'distillery', region: "Barossa Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
  { id: 2022, name: 'Artisans of Barossa', coords: { lat: -34.5083, lng: 138.9350 }, tags: ['Restaurant', 'Views', 'Wine Bar'], type: 'winery', region: "Barossa Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 75 },
  { id: 2023, name: 'Elderton Wines', coords: { lat: -34.5200, lng: 138.9450 }, tags: ['Family-Owned', 'Shiraz', 'Cabernet'], type: 'winery', region: "Barossa Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2024, name: 'Greenock Creek Wines', coords: { lat: -34.4667, lng: 138.9167 }, tags: ['Premium', 'Shiraz', 'Iconic'], type: 'winery', region: "Barossa Valley, SA", openingHours: { 0: null, 1: { open: 11, close: 17 }, 2: { open: 11, close: 17 }, 3: { open: 11, close: 17 }, 4: { open: 11, close: 17 }, 5: { open: 11, close: 17 }, 6: null }, visitDuration: 60 },
  { id: 2025, name: 'Glaetzer Wines', coords: { lat: -34.5167, lng: 138.9500 }, tags: ['Premium', 'Shiraz', 'Boutique'], type: 'winery', region: "Barossa Valley, SA", openingHours: { 0: null, 1: { open: 10, close: 16.5 }, 2: { open: 10, close: 16.5 }, 3: { open: 10, close: 16.5 }, 4: { open: 10, close: 16.5 }, 5: { open: 10, close: 16.5 }, 6: null }, visitDuration: 60 },
  { id: 2026, name: 'Izway Wines', coords: { lat: -34.4833, lng: 138.9000 }, tags: ['Boutique', 'Shiraz', 'Small Producer'], type: 'winery', region: "Barossa Valley, SA", openingHours: { 0: { open: 11, close: 17 }, 1: null, 2: null, 3: null, 4: null, 5: { open: 11, close: 17 }, 6: { open: 11, close: 17 } }, visitDuration: 45 },
  { id: 2027, name: 'John Duval Wines', coords: { lat: -34.5000, lng: 138.9333 }, tags: ['Premium', 'Shiraz', 'Rhone Varieties'], type: 'winery', region: "Barossa Valley, SA", openingHours: { 0: null, 1: { open: 10, close: 16 }, 2: { open: 10, close: 16 }, 3: { open: 10, close: 16 }, 4: { open: 10, close: 16 }, 5: { open: 10, close: 16 }, 6: null }, visitDuration: 60 },
  { id: 2028, name: 'Kalleske Wines', coords: { lat: -34.4667, lng: 138.9333 }, tags: ['Biodynamic', 'Family-Owned', 'Shiraz'], type: 'winery', region: "Barossa Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2029, name: 'Lambert Estate', coords: { lat: -34.5500, lng: 138.9833 }, tags: ['Restaurant', 'Views', 'Chocolate'], type: 'winery', region: "Barossa Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 75 },
  { id: 2030, name: 'Lindsay Wine Estate', coords: { lat: -34.5167, lng: 138.9167 }, tags: ['Art', 'Music', 'Shiraz'], type: 'winery', region: "Barossa Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2031, name: 'Massena', coords: { lat: -34.5000, lng: 138.9167 }, tags: ['Boutique', 'Grenache', 'Mataro'], type: 'winery', region: "Barossa Valley, SA", openingHours: { 0: { open: 12, close: 17 }, 1: { open: 12, close: 17 }, 2: null, 3: null, 4: { open: 12, close: 17 }, 5: { open: 12, close: 17 }, 6: { open: 12, close: 17 } }, visitDuration: 45 },
  { id: 2032, name: 'Murray Street Vineyards', coords: { lat: -34.4833, lng: 138.9500 }, tags: ['Views', 'Shiraz', 'Premium'], type: 'winery', region: "Barossa Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2033, name: 'Pindarie', coords: { lat: -34.4500, lng: 138.8000 }, tags: ['Restaurant', 'Views', 'Family-Friendly'], type: 'winery', region: "Barossa Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 75 },
  { id: 2034, name: 'Rolf Binder', coords: { lat: -34.5167, lng: 138.9333 }, tags: ['Shiraz', 'Boutique', 'Family-Owned'], type: 'winery', region: "Barossa Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2035, name: 'Rusden Wines', coords: { lat: -34.4667, lng: 139.0167 }, tags: ['Boutique', 'Shiraz', 'Grenache'], type: 'winery', region: "Barossa Valley, SA", openingHours: { 0: { open: 11, close: 17 }, 1: { open: 11, close: 17 }, 2: { open: 11, close: 17 }, 3: { open: 11, close: 17 }, 4: { open: 11, close: 17 }, 5: { open: 11, close: 17 }, 6: { open: 11, close: 17 } }, visitDuration: 45 },
  { id: 2036, name: 'Saltram Wine Estate', coords: { lat: -34.5333, lng: 138.9833 }, tags: ['Restaurant', 'History', 'Shiraz'], type: 'winery', region: "Barossa Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2037, name: 'Schild Estate', coords: { lat: -34.5667, lng: 138.9000 }, tags: ['Shiraz', 'Family-Owned', 'Boutique'], type: 'winery', region: "Barossa Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2038, name: 'Standish Wine Company', coords: { lat: -34.5000, lng: 138.9000 }, tags: ['Premium', 'Shiraz', 'Iconic'], type: 'winery', region: "Barossa Valley, SA", openingHours: { 0: null, 1: { open: 10, close: 16 }, 2: { open: 10, close: 16 }, 3: { open: 10, close: 16 }, 4: { open: 10, close: 16 }, 5: { open: 10, close: 16 }, 6: null }, visitDuration: 60 },
  { id: 2039, name: 'Steinys Traditional Mettwurst', coords: { lat: -34.5167, lng: 138.9667 }, tags: ['Local Produce', 'Food', 'Family-Owned'], type: 'winery', region: "Barossa Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 30 },
  { id: 2040, name: 'Teusner', coords: { lat: -34.5000, lng: 138.9333 }, tags: ['Boutique', 'Grenache', 'Shiraz'], type: 'winery', region: "Barossa Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2041, name: 'Thorn-Clarke Wines', coords: { lat: -34.4333, lng: 139.0333 }, tags: ['Views', 'Family-Owned', 'Shiraz'], type: 'winery', region: "Barossa Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2042, name: 'Tscharke Wines', coords: { lat: -34.4833, lng: 138.9167 }, tags: ['Boutique', 'German Varieties', 'Sustainable'], type: 'winery', region: "Barossa Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 2043, name: 'Vintners Bar & Grill', coords: { lat: -34.5167, lng: 138.9500 }, tags: ['Restaurant', 'Fine Dining', 'Local Produce'], type: 'winery', region: "Barossa Valley, SA", openingHours: { 0: { open: 12, close: 15 }, 1: null, 2: { open: 12, close: 21 }, 3: { open: 12, close: 21 }, 4: { open: 12, close: 21 }, 5: { open: 12, close: 21 }, 6: { open: 12, close: 21 } }, visitDuration: 90 },
  { id: 2044, name: 'Z WINE', coords: { lat: -34.5000, lng: 138.9333 }, tags: ['Boutique', 'Grenache', 'Family-Owned'], type: 'winery', region: "Barossa Valley, SA", openingHours: ALL_WEEK_10_5, visitDuration: 45 },
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
    console.log(`Successfully seeded ${locations.length} South Australian locations!`);
  } catch (error) {
    console.error("Error seeding South Australian database: ", error);
  }
}
seedDatabase();
