const { initializeFirebaseAdmin } = require('../src/utils/firebase-admin');

async function migrateLocationTypeIcons() {
  try {
    const { adminDb, adminStorage } = initializeFirebaseAdmin();
    const locationTypesRef = adminDb.collection('location_types');
    const snapshot = await locationTypesRef.get();

    if (snapshot.empty) {
      console.log('No location types found.');
      return;
    }

    const bucket = adminStorage.bucket();
    const migrationPromises = [];

    snapshot.forEach(doc => {
      const locationType = doc.data();
      const iconUrl = locationType.icon;

      if (iconUrl && typeof iconUrl === 'string' && iconUrl.includes('/o/')) {
        console.log(`Migrating icon for ${locationType.singular} (${doc.id})`);

        try {
          const url = new URL(iconUrl);
          const pathname = decodeURIComponent(url.pathname);
          const filePath = pathname.substring(pathname.indexOf('/o/') + 3);

          if (filePath) {
            const file = bucket.file(filePath);
            const promise = file.exists()
              .then(([exists]) => {
                if (exists) {
                  return file.makePublic()
                    .then(() => {
                      const publicUrl = file.publicUrl();
                      console.log(`  Public URL: ${publicUrl}`);
                      return doc.ref.update({ icon: publicUrl });
                    })
                    .then(() => console.log(`  Successfully migrated ${doc.id}`))
                    .catch(err => console.error(`  Error making file public or updating doc for ${doc.id}:`, err));
                } else {
                  console.log(`  File not found for ${doc.id} at path: ${filePath}`);
                }
              })
              .catch(err => console.error(`  Error checking file existence for ${doc.id}:`, err));

            migrationPromises.push(promise);
          }
        } catch (error) {
          console.error(`  Error processing URL for ${doc.id}:`, error);
        }
      } else {
        console.log(`Skipping ${locationType.singular} (${doc.id}), no signed icon URL found.`);
      }
    });

    await Promise.all(migrationPromises);
    console.log('Migration script finished.');

  } catch (error) {
    console.error('Error running migration script:', error);
  }
}

migrateLocationTypeIcons();
