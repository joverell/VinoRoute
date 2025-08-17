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
const WEEKEND_11_5 = { 0: { open: 11, close: 17 }, 1: null, 2: null, 3: null, 4: null, 5: { open: 11, close: 17 }, 6: { open: 11, close: 17 } };

const locations = [
  // Comprehensive Canberra District List
  { id: 8001, name: "Clonakilla", coords: { lat: -35.1667, lng: 149.0000 }, tags: ["Iconic", "Shiraz Viognier", "Premium"], type: 'winery', region: "Canberra District, ACT", openingHours: { 0: { open: 12, close: 16 }, 1: null, 2: null, 3: { open: 12, close: 16 }, 4: { open: 12, close: 16 }, 5: { open: 12, close: 16 }, 6: { open: 12, close: 16 } }, visitDuration: 60 },
  { id: 8002, name: "Big River Distilling Co", coords: { lat: -35.3183, lng: 149.1650 }, tags: ["Gin", "Vodka", "Boutique"], type: 'distillery', region: "Canberra District, ACT", openingHours: { 0: { open: 12, close: 17 }, 1: null, 2: null, 3: null, 4: { open: 14, close: 19 }, 5: { open: 12, close: 19 }, 6: { open: 12, close: 19 } }, visitDuration: 45 },
  { id: 8003, name: "Lark Hill Winery", coords: { lat: -35.2167, lng: 149.4167 }, tags: ["Biodynamic", "Restaurant", "Cool Climate"], type: 'winery', region: "Canberra District, ACT", openingHours: { 0: { open: 11, close: 16 }, 1: null, 2: null, 3: { open: 11, close: 16 }, 4: { open: 11, close: 16 }, 5: { open: 11, close: 16 }, 6: { open: 11, close: 16 } }, visitDuration: 60 },
  { id: 8004, name: "Helm Wines", coords: { lat: -35.1500, lng: 149.0000 }, tags: ["History", "Riesling", "Cabernet"], type: 'winery', region: "Canberra District, ACT", openingHours: { 0: { open: 10, close: 17 }, 1: null, 2: null, 3: null, 4: { open: 10, close: 17 }, 5: { open: 10, close: 17 }, 6: { open: 10, close: 17 } }, visitDuration: 60 },
  { id: 8005, name: "Four Winds Vineyard", coords: { lat: -35.1333, lng: 149.0167 }, tags: ["Pizza", "Family-Friendly", "Shiraz"], type: 'winery', region: "Canberra District, ACT", openingHours: ALL_WEEK_10_5, visitDuration: 75 },
  { id: 8006, name: "Mount Majura Vineyard", coords: { lat: -35.2333, lng: 149.2000 }, tags: ["Tempranillo", "Boutique", "Views"], type: 'winery', region: "Canberra District, ACT", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 8007, name: "The Canberra Distillery", coords: { lat: -35.3000, lng: 149.1333 }, tags: ["Gin", "Boutique", "Local"], type: 'distillery', region: "Canberra District, ACT", openingHours: { 0: null, 1: null, 2: null, 3: null, 4: { open: 12, close: 17 }, 5: { open: 12, close: 17 }, 6: { open: 12, close: 17 } }, visitDuration: 45 },
  { id: 8008, name: "Shaw Wines", coords: { lat: -35.1167, lng: 149.0333 }, tags: ["Restaurant", "Architecture", "Cabernet"], type: 'winery', region: "Canberra District, ACT", openingHours: ALL_WEEK_10_5, visitDuration: 75 },
  { id: 8009, name: "Eden Road Wines", coords: { lat: -35.1667, lng: 149.0167 }, tags: ["Premium", "Chardonnay", "Syrah"], type: 'winery', region: "Canberra District, ACT", openingHours: { 0: { open: 11, close: 17 }, 1: null, 2: null, 3: null, 4: { open: 11, close: 17 }, 5: { open: 11, close: 17 }, 6: { open: 11, close: 17 } }, visitDuration: 60 },
  { id: 8010, name: "Murrumbateman Winery", coords: { lat: -35.0000, lng: 149.0333 }, tags: ["Family-Friendly", "Dogs Welcome", "Fume Blanc"], type: 'winery', region: "Canberra District, ACT", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 8011, name: "Collector Wines", coords: { lat: -35.0833, lng: 149.4167 }, tags: ["Boutique", "Shiraz", "Riesling"], type: 'winery', region: "Canberra District, ACT", openingHours: WEEKEND_11_5, visitDuration: 45 },
  { id: 8012, name: "Contentious Character", coords: { lat: -35.3833, lng: 149.4333 }, tags: ["Restaurant", "Views", "Events"], type: 'winery', region: "Canberra District, ACT", openingHours: { 0: { open: 10, close: 17 }, 1: null, 2: null, 3: { open: 10, close: 17 }, 4: { open: 10, close: 17 }, 5: { open: 10, close: 21 }, 6: { open: 10, close: 21 } }, visitDuration: 75 },
  { id: 8013, name: "Gallagher Wines", coords: { lat: -35.1, lng: 149.05 }, tags: ["Sparkling", "Shiraz", "Family-Owned"], type: 'winery', region: "Canberra District, ACT", openingHours: { 0: { open: 10, close: 17 }, 1: null, 2: null, 3: { open: 10, close: 17 }, 4: { open: 10, close: 17 }, 5: { open: 10, close: 17 }, 6: { open: 10, close: 17 } }, visitDuration: 45 },
  { id: 8014, name: "Jeir Creek Wines", coords: { lat: -35.1333, lng: 149.0333 }, tags: ["Boutique", "Riesling", "Family-Run"], type: 'winery', region: "Canberra District, ACT", openingHours: WEEKEND_11_5, visitDuration: 45 },
  { id: 8015, name: "Lake George Winery", coords: { lat: -35.0667, lng: 149.3833 }, tags: ["History", "Restaurant", "Views"], type: 'winery', region: "Canberra District, ACT", openingHours: ALL_WEEK_10_5, visitDuration: 60 },
  { id: 8016, name: "Brindabella Hills Winery", coords: { lat: -35.1833, lng: 148.9667 }, tags: ["Views", "Restaurant", "Boutique"], type: 'winery', region: "Canberra District, ACT", openingHours: WEEKEND_11_5, visitDuration: 60 },
  { id: 8017, name: "Capital Wines", coords: { lat: -35.0167, lng: 149.0667 }, tags: ["Boutique", "Shiraz", "Riesling"], type: 'winery', region: "Canberra District, ACT", openingHours: { 0: { open: 10.5, close: 17 }, 1: null, 2: null, 3: null, 4: { open: 10.5, close: 17 }, 5: { open: 10.5, close: 17 }, 6: { open: 10.5, close: 17 } }, visitDuration: 45 },
  { id: 8018, name: "Dionysus Winery", coords: { lat: -35.1, lng: 149.0667 }, tags: ["Boutique", "Family-Owned", "Views"], type: 'winery', region: "Canberra District, ACT", openingHours: WEEKEND_11_5, visitDuration: 45 },
  { id: 8019, name: "McKellar Ridge Wines", coords: { lat: -35.15, lng: 149.0167 }, tags: ["Boutique", "Shiraz", "Riesling"], type: 'winery', region: "Canberra District, ACT", openingHours: WEEKEND_11_5, visitDuration: 45 },
  { id: 8020, name: "Surveyor's Hill Vineyards", coords: { lat: -35.0667, lng: 149.0167 }, tags: ["Restaurant", "Boutique", "Views"], type: 'winery', region: "Canberra District, ACT", openingHours: { 0: { open: 11, close: 17 }, 1: null, 2: null, 3: null, 4: null, 5: { open: 11, close: 17 }, 6: { open: 11, close: 17 } }, visitDuration: 60 },
  { id: 8021, name: "Underground Spirits", coords: { lat: -35.3, lng: 149.1167 }, tags: ["Gin", "Vodka", "Boutique"], type: 'distillery', region: "Canberra District, ACT", openingHours: { 0: null, 1: null, 2: null, 3: { open: 10, close: 16 }, 4: { open: 10, close: 16 }, 5: { open: 10, close: 16 }, 6: null }, visitDuration: 45 },
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
    console.log(`Successfully seeded ${locations.length} Canberra District locations!`);
  } catch (error) {
    console.error("Error seeding Canberra District database: ", error);
  }
}
seedDatabase();
