const admin = require('firebase-admin');
const xlsx = require('xlsx');
const path = require('path');

// Initialize Firebase Admin SDK
// Make sure to set up your service account key in your environment
const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Path to the XLSX file
const xlsxPath = path.resolve(__dirname, '../src/content/LWINdatabase.xlsx');

async function importWines() {
  try {
    // Read the XLSX file
    const workbook = xlsx.readFile(xlsxPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const winesData = xlsx.utils.sheet_to_json(worksheet);

    console.log(`Found ${winesData.length} wines in the XLSX file.`);

    // Get all wineries from Firestore
    const wineriesSnapshot = await db.collection('locations').get();
    const wineries = wineriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log(`Found ${wineries.length} wineries in the database.`);

    let updatedCount = 0;

    for (const wine of winesData) {
      const producerName = wine.PRODUCER_NAME;
      if (producerName) {
        const winery = wineries.find(w => w.name.toLowerCase() === producerName.toLowerCase());
        if (winery) {
          const wineData = {
            lwin: wine.LWIN,
            name: wine.WINE,
            type: wine.TYPE,
            producer: wine.PRODUCER_NAME,
            region: wine.REGION,
            country: wine.COUNTRY,
          };

          let docId = winery.id;
          if (typeof docId === 'number') {
            docId = `loc_${docId}`;
          }

          const wineryRef = db.collection('locations').doc(docId);
          try {
            await wineryRef.update({
              wines: admin.firestore.FieldValue.arrayUnion(wineData)
            });
            updatedCount++;
            console.log(`Added wine to winery ${winery.name}`);
          } catch (error) {
            if (error.code === 5) { // NOT_FOUND error
              console.warn(`Winery document not found: ${docId}. Skipping.`);
            } else {
              throw error;
            }
          }
        }
      }
    }

    console.log(`Successfully updated ${updatedCount} wineries.`);

  } catch (error) {
    console.error('Error importing wines:', error);
  }
}

importWines();
