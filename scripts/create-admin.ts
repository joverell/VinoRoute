import 'dotenv/config';
import { initializeFirebaseAdmin } from '../src/utils/firebase-admin';

async function makeAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.error('Usage: ts-node scripts/create-admin.ts <email>');
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

  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      console.error(`User with email ${email} not found.`);
    } else {
      console.error('Error setting custom claim:', error);
    }
    process.exit(1);
  }
}

makeAdmin();
