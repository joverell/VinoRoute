const admin = require('firebase-admin');

// 1. Get Service Account Credentials
// IMPORTANT: Replace with the path to your service account key file, e.g., require('../serviceAccountKey.json');
// Make sure the service account key file is NOT publicly accessible.
try {
    const serviceAccount = require('../serviceAccountKey.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
} catch (error) {
    console.error('Error: Could not load service account key.');
    console.error('Please ensure you have a serviceAccountKey.json file in the root directory.');
    console.error(error.message);
    process.exit(1);
}


// 2. Get UID from command line arguments
const uid = process.argv[2];

if (!uid) {
  console.error('Error: Please provide a UID as a command-line argument.');
  console.error('Usage: node scripts/set-admin-claim.js <user-uid>');
  process.exit(1);
}

// 3. Set custom claims
admin.auth().setCustomUserClaims(uid, { isAdmin: true })
  .then(() => {
    console.log(`Successfully set { isAdmin: true } for user: ${uid}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('Error setting custom claims:', error);
    process.exit(1);
  });
