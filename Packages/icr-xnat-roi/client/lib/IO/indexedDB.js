/*
import localBackup from "./localBackup.js";

// Create an instance of a db object for us to store the open database in
let db;

export { db };

// TODO -> Ressurect this at some point.


window.onload = function() {
  // Open our database; it is created if it doesn't already exist
  // (see onupgradeneeded below)
  let request = window.indexedDB.open('XNAT_OHIF_BACKUP', );

  // onerror handler signifies that the database didn't open successfully
  request.onerror = function() {
    console.log('Database failed to open');
  };

  // onsuccess handler signifies that the database opened successfully
  request.onsuccess = function() {
    console.log('XNAT_OHIF_BACKUP database opened successfully');

    // Store the opened database object in the db variable. This is used a lot below
    db = request.result;

    console.log(db);

    localBackup.loadBackupData();
    //testDB();
  };

  // Setup the database tables if this has not already been done
  request.onupgradeneeded = function(e) {
    // Grab a reference to the opened database
    let db = e.target.result;

    // Create an objectStore to store our data in in (basically like a single table)
    // including a auto-incrementing key
    let objectStore = db.createObjectStore('XNAT_OHIF_BACKUP', { keyPath: 'seriesInstanceUid'});

    // Define what data items the objectStore will contain
    objectStore.createIndex('seriesInstanceUid', 'seriesInstanceUid', { unique: true });
    objectStore.createIndex('dataDump', 'dataDump', { unique: false });

    console.log('Database setup complete');
  };



};
*/
