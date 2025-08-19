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
  // Comprehensive Yarra Valley List
  { id: 1, name: 'Domaine Chandon', coords: { lat: -37.6983, lng: 145.4182 }, tags: ['Sparkling', 'Restaurant', 'Views'], type: 'winery', region: "Yarra Valley, VIC", openingHours: { 0: { open: 10.5, close: 16.5 }, 1: { open: 10.5, close: 16.5 }, 2: { open: 10.5, close: 16.5 }, 3: { open: 10.5, close: 16.5 }, 4: { open: 10.5, close: 16.5 }, 5: { open: 10.5, close: 16.5 }, 6: { open: 10.5, close: 16.5 } } },
  { id: 2, name: 'Oakridge Wines', coords: { lat: -37.6961, lng: 145.4357 }, tags: ['Restaurant', 'Chardonnay'], type: 'winery', region: "Yarra Valley, VIC", openingHours: ALL_WEEK_10_5 },
  { id: 4, name: 'Four Pillars Gin', coords: { lat: -37.6625, lng: 145.5147 }, tags: ['Gin', 'Cocktails', 'Popular'], type: 'distillery', region: "Yarra Valley, VIC", openingHours: { 0: { open: 10.5, close: 17.5 }, 1: { open: 10.5, close: 17.5 }, 2: { open: 10.5, close: 17.5 }, 3: { open: 10.5, close: 17.5 }, 4: { open: 10.5, close: 17.5 }, 5: { open: 10.5, close: 21 }, 6: { open: 10.5, close: 21 } } },
  { id: 7, name: 'TarraWarra Estate', coords: { lat: -37.6534, lng: 145.4286 }, tags: ['Art', 'Restaurant', 'Pinot Noir'], type: 'winery', region: "Yarra Valley, VIC", openingHours: { 0: { open: 11, close: 17 }, 1: null, 2: { open: 11, close: 17 }, 3: { open: 11, close: 17 }, 4: { open: 11, close: 17 }, 5: { open: 11, close: 17 }, 6: { open: 11, close: 17 } } },
  { id: 11, name: 'De Bortoli Wines', coords: { lat: -37.6389, lng: 145.4417 }, tags: ['Cheese', 'Family-Friendly'], type: 'winery', region: "Yarra Valley, VIC", openingHours: ALL_WEEK_10_5 },
  { id: 16, name: 'Helen and Joey Estate', coords: { lat: -37.6622, lng: 145.4194 }, tags: ['Views', 'Unicorn', 'Casual'], type: 'winery', region: "Yarra Valley, VIC", openingHours: ALL_WEEK_10_5 },
  { id: 101, name: 'Yering Station', coords: { lat: -37.6918, lng: 145.3858 }, tags: ['Restaurant', 'History', 'Art'], type: 'winery', region: "Yarra Valley, VIC", openingHours: ALL_WEEK_10_5 },
  { id: 102, name: 'Coombe Yarra Valley', coords: { lat: -37.7001, lng: 145.4159 }, tags: ['Restaurant', 'Gardens', 'History'], type: 'winery', region: "Yarra Valley, VIC", openingHours: { 0: { open: 10, close: 17 }, 1: null, 2: null, 3: { open: 10, close: 17 }, 4: { open: 10, close: 17 }, 5: { open: 10, close: 17 }, 6: { open: 10, close: 17 } } },
  { id: 103, name: 'Rochford Wines', coords: { lat: -37.6934, lng: 145.4593 }, tags: ['Restaurant', 'Concerts', 'Events'], type: 'winery', region: "Yarra Valley, VIC", openingHours: ALL_WEEK_10_5 },
  { id: 104, name: 'Innocent Bystander', coords: { lat: -37.6620, lng: 145.5132 }, tags: ['Restaurant', 'Pizza', 'Casual'], type: 'winery', region: "Yarra Valley, VIC", openingHours: { 0: { open: 12, close: 21 }, 1: { open: 12, close: 21 }, 2: { open: 12, close: 21 }, 3: { open: 12, close: 21 }, 4: { open: 12, close: 21 }, 5: { open: 12, close: 21 }, 6: { open: 12, close: 21 } } },
  { id: 105, name: 'Levantine Hill', coords: { lat: -37.6964, lng: 145.4402 }, tags: ['Luxury', 'Restaurant', 'Architecture'], type: 'winery', region: "Yarra Valley, VIC", openingHours: ALL_WEEK_10_5 },
  { id: 106, name: 'Stones of the Yarra Valley', coords: { lat: -37.6908, lng: 145.4211 }, tags: ['Scenery', 'Weddings', 'Restaurant'], type: 'winery', region: "Yarra Valley, VIC", openingHours: { 0: { open: 11, close: 17 }, 1: null, 2: null, 3: { open: 11, close: 17 }, 4: { open: 11, close: 17 }, 5: { open: 11, close: 17 }, 6: { open: 11, close: 17 } } },
  { id: 107, name: 'Yarra Yering', coords: { lat: -37.7125, lng: 145.4381 }, tags: ['Iconic', 'Red Wine', 'Premium'], type: 'winery', region: "Yarra Valley, VIC", openingHours: ALL_WEEK_10_5 },
  { id: 108, name: 'Coldstream Hills', coords: { lat: -37.7186, lng: 145.4225 }, tags: ['Pinot Noir', 'Chardonnay', 'Iconic'], type: 'winery', region: "Yarra Valley, VIC", openingHours: { 0: { open: 11, close: 17 }, 1: null, 2: null, 3: { open: 11, close: 17 }, 4: { open: 11, close: 17 }, 5: { open: 11, close: 17 }, 6: { open: 11, close: 17 } } },
  { id: 109, name: 'Pimpernel Vineyards', coords: { lat: -37.6719, lng: 145.4958 }, tags: ['Boutique', 'Pinot Noir', 'Shiraz'], type: 'winery', region: "Yarra Valley, VIC", openingHours: WEEKEND_11_5 },
  { id: 110, name: 'Maddens Rise', coords: { lat: -37.6953, lng: 145.4452 }, tags: ['Boutique', 'Views', 'Small Producer'], type: 'winery', region: "Yarra Valley, VIC", openingHours: WEEKEND_11_5 },
  { id: 111, name: 'Yileena Park', coords: { lat: -37.6533, lng: 145.4055 }, tags: ['Boutique', 'Smoked Goods', 'Family-Run'], type: 'winery', region: "Yarra Valley, VIC", openingHours: WEEKEND_11_5 },
  { id: 112, name: 'Tokar Estate', coords: { lat: -37.6925, lng: 145.4525 }, tags: ['Restaurant', 'Views', 'Mediterranean'], type: 'winery', region: "Yarra Valley, VIC", openingHours: { 0: { open: 11, close: 17 }, 1: null, 2: null, 3: { open: 11, close: 17 }, 4: { open: 11, close: 17 }, 5: { open: 11, close: 17 }, 6: { open: 11, close: 17 } } },
  { id: 113, name: 'Dominique Portet', coords: { lat: -37.6916, lng: 145.4561 }, tags: ['French Style', 'Rosé', 'Bistro'], type: 'winery', region: "Yarra Valley, VIC", openingHours: ALL_WEEK_10_5 },
  { id: 114, name: 'Giant Steps', coords: { lat: -37.6623, lng: 145.5135 }, tags: ['In-Town', 'Restaurant', 'Chardonnay'], type: 'winery', region: "Yarra Valley, VIC", openingHours: ALL_WEEK_10_5 },
  { id: 115, name: 'Boat O\'Craigo', coords: { lat: -37.6492, lng: 145.5011 }, tags: ['Family-Owned', 'Pizza', 'Views'], type: 'winery', region: "Yarra Valley, VIC", openingHours: ALL_WEEK_10_5 },
  { id: 116, name: 'Rob Dolan Wines', coords: { lat: -37.8058, lng: 145.2442 }, tags: ['Boutique', 'Cheese', 'Courtyard'], type: 'winery', region: "Yarra Valley, VIC", openingHours: ALL_WEEK_10_5 },
  { id: 117, name: 'Payten & Jones', coords: { lat: -37.6603, lng: 145.5144 }, tags: ['In-Town', 'Boutique', 'Sangiovese'], type: 'winery', region: "Yarra Valley, VIC", openingHours: ALL_WEEK_10_5 },
  { id: 118, name: 'Watts River Brewing', coords: { lat: -37.6592, lng: 145.5153 }, tags: ['Beer', 'In-Town', 'Casual'], type: 'distillery', region: "Yarra Valley, VIC", openingHours: ALL_WEEK_10_5 },
  { id: 119, name: 'Jayden Ong Winery', coords: { lat: -37.6608, lng: 145.5142 }, tags: ['Restaurant', 'In-Town', 'Premium'], type: 'winery', region: "Yarra Valley, VIC", openingHours: ALL_WEEK_10_5 },
  { id: 120, name: 'Coombe Farm Wines', coords: { lat: -37.6989, lng: 145.3889 }, tags: ['History', 'Chardonnay', 'Pinot Noir'], type: 'winery', region: "Yarra Valley, VIC", openingHours: ALL_WEEK_10_5 },
  { id: 121, name: 'Soumah of Yarra Valley', coords: { lat: -37.6833, lng: 145.4667 }, tags: ['Italian Varieties', 'Restaurant', 'Views'], type: 'winery', region: "Yarra Valley, VIC", openingHours: ALL_WEEK_10_5 },
  { id: 122, name: 'Seville Estate', coords: { lat: -37.7833, lng: 145.5000 }, tags: ['Restaurant', 'Accommodation', 'Premium'], type: 'winery', region: "Yarra Valley, VIC", openingHours: ALL_WEEK_10_5 },
  { id: 123, name: 'Warramunda Estate', coords: { lat: -37.7000, lng: 145.4000 }, tags: ['Boutique', 'Cabernet', 'Family-Owned'], type: 'winery', region: "Yarra Valley, VIC", openingHours: WEEKEND_11_5 },
  { id: 124, name: 'Yarrawood Estate', coords: { lat: -37.6333, lng: 145.4333 }, tags: ['Cafe', 'Family-Friendly', 'Views'], type: 'winery', region: "Yarra Valley, VIC", openingHours: ALL_WEEK_10_5 },
  { id: 125, name: 'Greenstone Vineyards', coords: { lat: -37.6833, lng: 145.3833 }, tags: ['Views', 'Shiraz', 'Restaurant'], type: 'winery', region: "Yarra Valley, VIC", openingHours: ALL_WEEK_10_5 },
  { id: 126, name: 'Zonzo Estate', coords: { lat: -37.7167, lng: 145.4500 }, tags: ['Restaurant', 'Pizza', 'Weddings'], type: 'winery', region: "Yarra Valley, VIC", openingHours: ALL_WEEK_10_5 },
  { id: 127, name: 'Killara Estate', coords: { lat: -37.7333, lng: 145.3667 }, tags: ['Views', 'Italian Food', 'Family-Run'], type: 'winery', region: "Yarra Valley, VIC", openingHours: WEEKEND_11_5 },
  { id: 128, name: 'Sir Paz Estate', coords: { lat: -37.7500, lng: 145.4167 }, tags: ['Views', 'Boutique', 'Pinot Noir'], type: 'winery', region: "Yarra Valley, VIC", openingHours: WEEKEND_11_5 },
  { id: 129, name: 'Yarra Valley Dairy', coords: { lat: -37.6667, lng: 145.4167 }, tags: ['Cheese', 'Cafe', 'Local Produce'], type: 'winery', region: "Yarra Valley, VIC", openingHours: ALL_WEEK_10_5 },
  { id: 130, name: 'Badger Creek Weir', coords: { lat: -37.6833, lng: 145.5500 }, tags: ['Picnic', 'Nature', 'Family-Friendly'], type: 'winery', region: "Yarra Valley, VIC", openingHours: ALL_WEEK_10_5 },
  { id: 131, name: 'Healesville Sanctuary', coords: { lat: -37.6667, lng: 145.5333 }, tags: ['Wildlife', 'Family-Friendly', 'Nature'], type: 'winery', region: "Yarra Valley, VIC", openingHours: { 0: { open: 9, close: 17 }, 1: { open: 9, close: 17 }, 2: { open: 9, close: 17 }, 3: { open: 9, close: 17 }, 4: { open: 9, close: 17 }, 5: { open: 9, close: 17 }, 6: { open: 9, close: 17 } } },
  { id: 132, name: 'Alowyn Gardens', coords: { lat: -37.6167, lng: 145.4333 }, tags: ['Gardens', 'Cafe', 'Nursery'], type: 'winery', region: "Yarra Valley, VIC", openingHours: ALL_WEEK_10_5 },
  { id: 133, name: 'Yarra Valley Chocolaterie', coords: { lat: -37.6500, lng: 145.3833 }, tags: ['Chocolate', 'Cafe', 'Family-Friendly'], type: 'winery', region: "Yarra Valley, VIC", openingHours: { 0: { open: 9, close: 17 }, 1: { open: 9, close: 17 }, 2: { open: 9, close: 17 }, 3: { open: 9, close: 17 }, 4: { open: 9, close: 17 }, 5: { open: 9, close: 17 }, 6: { open: 9, close: 17 } } },
  { id: 134, name: 'Punt Road Wines', coords: { lat: -37.6944, lng: 145.4208 }, tags: ['Cider', 'Casual', 'Pinot Noir'], type: 'winery', region: "Yarra Valley, VIC", openingHours: ALL_WEEK_10_5 },
  { id: 135, name: 'St Hubert\'s', coords: { lat: -37.6903, lng: 145.4194 }, tags: ['Architecture', 'Restaurant', 'Cabernet'], type: 'winery', region: "Yarra Valley, VIC", openingHours: ALL_WEEK_10_5 },
  { id: 136, name: 'Maroondah Reservoir Park', coords: { lat: -37.6500, lng: 145.5667 }, tags: ['Picnic', 'Walks', 'Views'], type: 'winery', region: "Yarra Valley, VIC", openingHours: ALL_WEEK_10_5 },
  { id: 137, name: 'Healesville Glass Blowing Studio', coords: { lat: -37.6569, lng: 145.5153 }, tags: ['Art', 'Gallery', 'Unique'], type: 'winery', region: "Yarra Valley, VIC", openingHours: ALL_WEEK_10_5 },
  { id: 138, name: 'Acacia Ridge Vineyard', coords: { lat: -37.7000, lng: 145.3500 }, tags: ['Boutique', 'Restaurant', 'Views'], type: 'winery', region: "Yarra Valley, VIC", openingHours: WEEKEND_11_5 },
  { id: 139, name: 'Balgownie Estate', coords: { lat: -37.6333, lng: 145.4000 }, tags: ['Restaurant', 'Accommodation', 'Spa'], type: 'winery', region: "Yarra Valley, VIC", openingHours: ALL_WEEK_10_5 },
  { id: 140, name: 'Billanook Estate', coords: { lat: -37.7333, lng: 145.3500 }, tags: ['Family-Owned', 'Boutique', 'Views'], type: 'winery', region: "Yarra Valley, VIC", openingHours: WEEKEND_11_5 },
  { id: 141, name: 'Bulong Estate', coords: { lat: -37.7667, lng: 145.4833 }, tags: ['Views', 'Weddings', 'Boutique'], type: 'winery', region: "Yarra Valley, VIC", openingHours: WEEKEND_11_5 },
  { id: 142, name: 'Elmswood Estate', coords: { lat: -37.7833, lng: 145.4167 }, tags: ['Restaurant', 'Views', 'Weddings'], type: 'winery', region: "Yarra Valley, VIC", openingHours: WEEKEND_11_5 },
  { id: 143, name: 'Fin Wines', coords: { lat: -37.6833, lng: 145.4833 }, tags: ['Natural Wine', 'Boutique', 'Pet Nat'], type: 'winery', region: "Yarra Valley, VIC", openingHours: WEEKEND_11_5 },
  { id: 144, name: 'Five Oaks Vineyard', coords: { lat: -37.7167, lng: 145.3667 }, tags: ['Boutique', 'Family-Run', 'Cabernet'], type: 'winery', region: "Yarra Valley, VIC", openingHours: WEEKEND_11_5 },
  { id: 145, name: 'Handpicked Wines', coords: { lat: -37.7000, lng: 145.4333 }, tags: ['Cheese', 'Regional Wines', 'Modern'], type: 'winery', region: "Yarra Valley, VIC", openingHours: ALL_WEEK_10_5 },
  { id: 146, name: 'Helen\'s Hill Estate', coords: { lat: -37.7167, lng: 145.4000 }, tags: ['Family-Friendly', 'Casual', 'Pinot Noir'], type: 'winery', region: "Yarra Valley, VIC", openingHours: ALL_WEEK_10_5 },
  { id: 147, name: 'Kellybrook Winery', coords: { lat: -37.7333, lng: 145.3000 }, tags: ['Cider', 'History', 'Family-Owned'], type: 'winery', region: "Yarra Valley, VIC", openingHours: ALL_WEEK_10_5 },
  { id: 148, name: 'Mandala Wines', coords: { lat: -37.6500, lng: 145.4500 }, tags: ['Restaurant', 'Family-Owned', 'Pinot Noir'], type: 'winery', region: "Yarra Valley, VIC", openingHours: ALL_WEEK_10_5 },
  { id: 149, name: 'Medhurst Wines', coords: { lat: -37.6833, lng: 145.4333 }, tags: ['Architecture', 'Views', 'Premium'], type: 'winery', region: "Yarra Valley, VIC", openingHours: ALL_WEEK_10_5 },
  { id: 150, name: 'Morgan Vineyards', coords: { lat: -37.7667, lng: 145.3833 }, tags: ['Boutique', 'Shiraz', 'Appointment'], type: 'winery', region: "Yarra Valley, VIC", openingHours: WEEKEND_11_5 },
  { id: 151, name: 'Napoleone Cider & Orchard Bar', coords: { lat: -37.7000, lng: 145.4167 }, tags: ['Cider', 'Beer', 'Casual'], type: 'distillery', region: "Yarra Valley, VIC", openingHours: ALL_WEEK_10_5 },
  { id: 152, name: 'Nillumbik Estate', coords: { lat: -37.6500, lng: 145.2500 }, tags: ['Boutique', 'Views', 'Family-Run'], type: 'winery', region: "Yarra Valley, VIC", openingHours: WEEKEND_11_5 },
  { id: 153, name: 'Outlook Hill', coords: { lat: -37.6333, lng: 145.3833 }, tags: ['Accommodation', 'Views', 'Boutique'], type: 'winery', region: "Yarra Valley, VIC", openingHours: WEEKEND_11_5 },
  { id: 154, name: 'Panton Hill Vineyard', coords: { lat: -37.6667, lng: 145.2167 }, tags: ['Boutique', 'Pinot Noir', 'Family-Run'], type: 'winery', region: "Yarra Valley, VIC", openingHours: WEEKEND_11_5 },
  { id: 155, name: 'Passing Clouds', coords: { lat: -37.2667, lng: 143.8333 }, tags: ['Restaurant', 'Shiraz', 'Family-Owned'], type: 'winery', region: "Macedon Ranges, VIC", openingHours: ALL_WEEK_10_5 },
  { id: 156, name: 'Port Phillip Estate', coords: { lat: -38.3833, lng: 145.0167 }, tags: ['Architecture', 'Restaurant', 'Premium'], type: 'winery', region: "Mornington Peninsula, VIC", openingHours: ALL_WEEK_10_5 },
  { id: 157, name: 'Quealy Winemakers', coords: { lat: -38.3667, lng: 145.0500 }, tags: ['Boutique', 'Pinot Gris', 'Italian Varieties'], type: 'winery', region: "Mornington Peninsula, VIC", openingHours: ALL_WEEK_10_5 },
  { id: 158, name: 'Red Hill Estate', coords: { lat: -38.3833, lng: 145.0333 }, tags: ['Views', 'Restaurant', 'Pinot Noir'], type: 'winery', region: "Mornington Peninsula, VIC", openingHours: ALL_WEEK_10_5 },
  { id: 159, name: 'Stumpy Gully Vineyard', coords: { lat: -38.2833, lng: 145.1000 }, tags: ['Family-Owned', 'Casual', 'Pinot Noir'], type: 'winery', region: "Mornington Peninsula, VIC", openingHours: ALL_WEEK_10_5 },
  { id: 160, name: 'T\'Gallant', coords: { lat: -38.3667, lng: 145.0000 }, tags: ['Pizza', 'Casual', 'Pinot Grigio'], type: 'winery', region: "Mornington Peninsula, VIC", openingHours: ALL_WEEK_10_5 },
  { id: 161, name: 'Willow Creek Vineyard', coords: { lat: -38.3500, lng: 145.0333 }, tags: ['Luxury', 'Restaurant', 'Accommodation'], type: 'winery', region: "Mornington Peninsula, VIC", openingHours: ALL_WEEK_10_5 },
  { id: 162, name: 'Yabby Lake Vineyard', coords: { lat: -38.2833, lng: 145.1167 }, tags: ['Premium', 'Chardonnay', 'Pinot Noir'], type: 'winery', region: "Mornington Peninsula, VIC", openingHours: ALL_WEEK_10_5 },
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
    console.log(`Successfully seeded ${locations.length} Victorian locations!`);
  } catch (error) {
    console.error("Error seeding Victorian database: ", error);
  }
}
seedDatabase();
