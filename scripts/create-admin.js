// Usage: node scripts/create-admin.js <email>
require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

// --- Inlined Firebase Admin Initialization ---
const initializeFirebaseAdmin = () => {
  if (admin.apps.length === 0) {
    try {
      console.log('Initializing Firebase Admin...');
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        }),
        databaseURL: `https://vinoroute-e8d8d.firebaseio.com`,
      });
      console.log('Firebase Admin initialized successfully.');
    } catch (error) {
      console.error('Firebase admin initialization error', error);
      return { adminAuth: null };
    }
  }
  return {
    adminAuth: admin.auth(),
  };
};
// --- End of Inlined Logic ---


async function makeAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.error('Please provide an email address as an argument.');
    process.exit(1);
  }

  const { adminAuth } = initializeFirebaseAdmin();

  if (!adminAuth) {
    console.error('Firebase admin initialization failed. Make sure your .env.local file is set up correctly.');
    process.exit(1);
  }

  try {
    console.log(`Looking up user: ${email}...`);
    const user = await adminAuth.getUserByEmail(email);

    if (user.customClaims && user.customClaims.admin === true) {
      console.log(`${email} is already an admin.`);
    } else {
      console.log(`Setting admin claim for ${email}...`);
      await adminAuth.setCustomUserClaims(user.uid, { admin: true });
      console.log(`Successfully set ${email} as an admin.`);
    }

    // Verify the custom claim
    const updatedUser = await adminAuth.getUser(user.uid);
    console.log('Current claims:', updatedUser.customClaims);

  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error(`User with email ${email} not found.`);
    } else {
      console.error('Error setting custom claim:', error);
    }
    process.exit(1);
  }
}

makeAdmin();
