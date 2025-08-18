const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function testFirestore() {
  try {
    const docId = 'loc_9304';
    const docRef = db.collection('locations').doc(docId);
    const doc = await docRef.get();

    if (doc.exists) {
      console.log('Document data:', doc.data());
    } else {
      console.log('No such document!');
    }
  } catch (error) {
    console.error('Error fetching document:', error);
  }
}

testFirestore();
