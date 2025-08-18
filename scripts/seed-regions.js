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

const regions = [
  // --- SOUTH AUSTRALIA ---
  { name: "Barossa Valley, SA", state: "South Australia", center: { lat: -34.53, lng: 138.95 } },
  { name: "McLaren Vale, SA", state: "South Australia", center: { lat: -35.22, lng: 138.54 } },
  { name: "Adelaide Hills, SA", state: "South Australia", center: { lat: -34.95, lng: 138.75 } },
  { name: "Clare Valley, SA", state: "South Australia", center: { lat: -33.83, lng: 138.61 } },
  { name: "Coonawarra, SA", state: "South Australia", center: { lat: -37.29, lng: 140.83 } },
  { name: "Eden Valley, SA", state: "South Australia", center: { lat: -34.65, lng: 139.08 } },
  { name: "Langhorne Creek, SA", state: "South Australia", center: { lat: -35.30, lng: 139.04 } },
  { name: "Southern Flinders Ranges, SA", state: "South Australia", center: { lat: -33.0, lng: 138.0 } },
  { name: "Riverland, SA", state: "South Australia", center: { lat: -34.2, lng: 140.5 } },
  { name: "Adelaide Plains, SA", state: "South Australia", center: { lat: -34.7, lng: 138.5 } },
  { name: "Kangaroo Island, SA", state: "South Australia", center: { lat: -35.8, lng: 137.2 } },
  { name: "Mount Benson, SA", state: "South Australia", center: { lat: -37.0, lng: 139.8 } },
  { name: "Robe, SA", state: "South Australia", center: { lat: -37.2, lng: 139.8 } },
  { name: "Padthaway, SA", state: "South Australia", center: { lat: -36.6, lng: 140.5 } },
  { name: "Wrattonbully, SA", state: "South Australia", center: { lat: -36.9, lng: 140.8 } },
  { name: "Southern Fleurieu, SA", state: "South Australia", center: { lat: -35.5, lng: 138.5 } },
  { name: "Currency Creek, SA", state: "South Australia", center: { lat: -35.4, lng: 138.8 } },

  // --- VICTORIA ---
  { name: "Yarra Valley, VIC", state: "Victoria", center: { lat: -37.67, lng: 145.45 } },
  { name: "Mornington Peninsula, VIC", state: "Victoria", center: { lat: -38.38, lng: 145.05 } },
  { name: "Rutherglen, VIC", state: "Victoria", center: { lat: -36.05, lng: 146.46 } },
  { name: "Geelong, VIC", state: "Victoria", center: { lat: -38.15, lng: 144.36 } },
  { name: "King Valley, VIC", state: "Victoria", center: { lat: -36.85, lng: 146.37 } },
  { name: "Heathcote, VIC", state: "Victoria", center: { lat: -36.92, lng: 144.71 } },
  { name: "Macedon Ranges, VIC", state: "Victoria", center: { lat: -37.42, lng: 144.56 } },
  { name: "Pyrenees, VIC", state: "Victoria", center: { lat: -37.13, lng: 143.35 } },
  { name: "Swan Hill, VIC", state: "Victoria", center: { lat: -35.3, lng: 143.5 } },
  { name: "Murray Darling, VIC", state: "Victoria", center: { lat: -34.5, lng: 142.5 } },
  { name: "Gippsland, VIC", state: "Victoria", center: { lat: -38.0, lng: 147.0 } },
  { name: "Bendigo, VIC", state: "Victoria", center: { lat: -36.8, lng: 144.3 } },
  { name: "Goulburn Valley, VIC", state: "Victoria", center: { lat: -36.4, lng: 145.2 } },
  { name: "Strathbogie Ranges, VIC", state: "Victoria", center: { lat: -36.9, lng: 145.7 } },
  { name: "Alpine Valleys, VIC", state: "Victoria", center: { lat: -36.7, lng: 146.8 } },
  { name: "Beechworth, VIC", state: "Victoria", center: { lat: -36.4, lng: 146.7 } },
  { name: "Glenrowan, VIC", state: "Victoria", center: { lat: -36.5, lng: 146.2 } },
  { name: "Sunbury, VIC", state: "Victoria", center: { lat: -37.6, lng: 144.7 } },
  { name: "Grampians, VIC", state: "Victoria", center: { lat: -37.2, lng: 142.5 } },
  { name: "Henty, VIC", state: "Victoria", center: { lat: -37.9, lng: 141.8 } },

  // --- WESTERN AUSTRALIA ---
  { name: "Margaret River, WA", state: "Western Australia", center: { lat: -33.95, lng: 115.07 } },
  { name: "Swan Valley, WA", state: "Western Australia", center: { lat: -31.80, lng: 116.00 } },
  { name: "Great Southern, WA", state: "Western Australia", center: { lat: -34.60, lng: 117.80 } },
  { name: "Geographe, WA", state: "Western Australia", center: { lat: -33.64, lng: 115.70 } },
  { name: "Swan District, WA", state: "Western Australia", center: { lat: -31.7, lng: 116.0 } },
  { name: "Perth Hills, WA", state: "Western Australia", center: { lat: -31.9, lng: 116.1 } },
  { name: "Peel, WA", state: "Western Australia", center: { lat: -32.5, lng: 115.9 } },
  { name: "Blackwood Valley, WA", state: "Western Australia", center: { lat: -33.9, lng: 116.0 } },
  { name: "Manjimup, WA", state: "Western Australia", center: { lat: -34.2, lng: 116.1 } },
  { name: "Pemberton, WA", state: "Western Australia", center: { lat: -34.4, lng: 116.0 } },

  // --- NEW SOUTH WALES ---
  { name: "Hunter Valley, NSW", state: "New South Wales", center: { lat: -32.78, lng: 151.30 } },
  { name: "Orange, NSW", state: "New South Wales", center: { lat: -33.28, lng: 149.10 } },
  { name: "Mudgee, NSW", state: "New South Wales", center: { lat: -32.60, lng: 149.58 } },
  { name: "Canberra District, ACT", state: "New South Wales", center: { lat: -35.15, lng: 149.25 } },
  { name: "Riverina, NSW", state: "New South Wales", center: { lat: -34.28, lng: 146.05 } },
  { name: "Southern Highlands, NSW", state: "New South Wales", center: { lat: -34.47, lng: 150.42 } },
  { name: "New England Australia, NSW", state: "New South Wales", center: { lat: -29.5, lng: 151.5 } },
  { name: "Hastings River, NSW", state: "New South Wales", center: { lat: -31.4, lng: 152.7 } },
  { name: "Perricoota, NSW", state: "New South Wales", center: { lat: -35.8, lng: 144.8 } },
  { name: "Shoalhaven Coast, NSW", state: "New South Wales", center: { lat: -34.9, lng: 150.7 } },
  { name: "Tumbarumba, NSW", state: "New South Wales", center: { lat: -35.8, lng: 148.0 } },
  { name: "Gundagai, NSW", state: "New South Wales", center: { lat: -35.0, lng: 148.1 } },
  { name: "Hilltops, NSW", state: "New South Wales", center: { lat: -34.5, lng: 148.5 } },

  // --- TASMANIA ---
  { name: "Tamar Valley, TAS", state: "Tasmania", center: { lat: -41.25, lng: 146.95 } },
  { name: "Coal River Valley, TAS", state: "Tasmania", center: { lat: -42.77, lng: 147.42 } },
  { name: "Derwent Valley, TAS", state: "Tasmania", center: { lat: -42.78, lng: 147.06 } },
  { name: "East Coast, TAS", state: "Tasmania", center: { lat: -41.90, lng: 148.23 } },
  { name: "North West, TAS", state: "Tasmania", center: { lat: -41.2, lng: 145.8 } },
  { name: "Pipers River, TAS", state: "Tasmania", center: { lat: -41.0, lng: 147.4 } },
  { name: "Huon Valley, TAS", state: "Tasmania", center: { lat: -43.0, lng: 147.0 } },

  // --- QUEENSLAND ---
  { name: "Granite Belt, QLD", state: "Queensland", center: { lat: -28.65, lng: 151.93 } },
];

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedRegions() {
  const regionsCollection = collection(db, 'regions');
  const batch = writeBatch(db);

  const uniqueRegions = [...new Map(regions.map(item => [item.name, item])).values()];

  uniqueRegions.forEach((region) => {
    const docId = region.name.toLowerCase().replace(/, /g, '-').replace(/ /g, '-');
    const docRef = doc(regionsCollection, docId);
    batch.set(docRef, region);
  });

  console.log(`Preparing to seed ${uniqueRegions.length} regions...`);

  try {
    await batch.commit();
    console.log(`Successfully seeded ${uniqueRegions.length} regions!`);
    console.log("You can now close this script (Ctrl+C).");
  } catch (error) {
    console.error("Error seeding regions: ", error);
  }
}

seedRegions();
