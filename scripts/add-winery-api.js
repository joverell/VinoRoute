const admin = require('firebase-admin');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// This script adds a new winery to the database by calling the internal API.
// It requires Firebase Admin credentials and the Firebase Web API key to be set as environment variables.
//
// Required environment variables:
// - FIREBASE_PROJECT_ID
// - FIREBASE_CLIENT_EMAIL
// - FIREBASE_PRIVATE_KEY
// - FIREBASE_WEB_API_KEY
//
// Usage:
// node scripts/add-winery-api.js --name "My Winery" --lat -36.123 --lng 146.456 --region "Rutherglen, VIC" --type winery

// --- Argument Parsing ---
const args = process.argv.slice(2);
const wineryData = {};
const requiredArgs = ['name', 'lat', 'lng', 'region', 'type'];

for (let i = 0; i < args.length; i += 2) {
  const key = args[i].replace('--', '');
  const value = args[i + 1];
  wineryData[key] = value;
}

const missingArgs = requiredArgs.filter(arg => !wineryData[arg]);
if (missingArgs.length > 0) {
    console.error(`Missing required arguments: ${missingArgs.join(', ')}`);
    process.exit(1);
}

const { name, lat, lng, region, type, tags } = wineryData;
const coords = { lat: parseFloat(lat), lng: parseFloat(lng) };
const finalWineryData = {
    name,
    coords,
    region,
    type,
    tags: tags ? tags.split(',') : [],
    openingHours: { // Default opening hours
        "0": { open: 10, close: 17 }, "1": { open: 10, close: 17 }, "2": { open: 10, close: 17 },
        "3": { open: 10, close: 17 }, "4": { open: 10, close: 17 }, "5": { open: 10, close: 17 },
        "6": { open: 10, close: 17 },
    }
};

// --- Firebase Auth ---
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};

const FIREBASE_WEB_API_KEY = process.env.FIREBASE_WEB_API_KEY;

if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey || !FIREBASE_WEB_API_KEY) {
    console.error('Missing required Firebase environment variables.');
    process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uid = 'add-winery-api-script';

async function getAuthToken() {
    const customToken = await admin.auth().createCustomToken(uid);
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${FIREBASE_WEB_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: customToken, returnSecureToken: true })
    });
    const data = await res.json();
    if (data.error) {
        throw new Error(`Error getting auth token: ${data.error.message}`);
    }
    return data.idToken;
}


// --- API Call ---
async function addWinery() {
  try {
    const idToken = await getAuthToken();
    const res = await fetch('http://localhost:3000/api/locations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify(finalWineryData)
    });

    const data = await res.json();
    if (res.ok) {
        console.log('Winery added successfully:', data);
    } else {
        console.error('Error adding winery:', data);
    }
  } catch (error) {
    console.error('Error adding winery:', error);
  }
}

addWinery();
