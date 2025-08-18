// This script is used to populate your Firestore database with initial admin data.
// To run it, navigate to your project's root directory in the terminal and run: node scripts/seed-admin.js

require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, writeBatch } = require('firebase/firestore');

// Your specific Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: "vinoroute-e8d8d.firebaseapp.com",
  projectId: "vinoroute-e8d8d",
  storageBucket: "vinoroute-e8d8d.appspot.com",
  messagingSenderId: "325683658873",
  appId: "1:325683658873:web:10724e01b115dc892b14a8"
};

// --- DATA TO BE SEEDED ---
const roles = ['admin', 'user'];
const adminUser = {
  uid: 'VfBOgCQa6hdXUWXqE5KPm5lYuSz1',
  email: 'jaoverell@gmail.com',
  role: 'admin'
};
// --- END OF DATA ---


// --- SCRIPT LOGIC ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedDatabase() {
  const batch = writeBatch(db);

  // Seed roles
  const rolesCollection = collection(db, 'roles');
  roles.forEach(role => {
    const docRef = doc(rolesCollection, role);
    batch.set(docRef, {});
  });
  console.log(`Preparing to seed ${roles.length} roles...`);

  // Seed admin user
  const usersCollection = collection(db, 'users');
  const userDocRef = doc(usersCollection, adminUser.uid);
  batch.set(userDocRef, { email: adminUser.email, role: adminUser.role });
  console.log(`Preparing to seed admin user: ${adminUser.email}`);


  try {
    await batch.commit();
    console.log(`Successfully seeded roles and admin user!`);
    console.log("You can now close this script (Ctrl+C).");
  } catch (error) {
    console.error("Error seeding database: ", error);
  }
}

seedDatabase();
