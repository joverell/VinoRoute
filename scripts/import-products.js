const admin = require('firebase-admin');
const xlsx = require('xlsx');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Path to the XLSX file
const xlsxPath = path.resolve(__dirname, '../src/content/LWINdatabase.xlsx');

async function importProducts() {
  try {
    // Read the XLSX file
    const workbook = xlsx.readFile(xlsxPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const productsData = xlsx.utils.sheet_to_json(worksheet);

    console.log(`Found ${productsData.length} products in the XLSX file.`);

    const productsCollection = db.collection('products');
    let importedCount = 0;

    for (const product of productsData) {
      if (product.LWIN) {
        // Use LWIN as the document ID
        const docId = String(product.LWIN);
        const docRef = productsCollection.doc(docId);
        await docRef.set(product);
        importedCount++;
        console.log(`Imported product ${product.WINE} with LWIN ${docId}`);
      }
    }

    console.log(`Successfully imported ${importedCount} products.`);

  } catch (error) {
    console.error('Error importing products:', error);
  }
}

importProducts();
