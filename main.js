class IndexDB {
  constructor(dbName, storeName) {
    this.dbName = dbName;
    this.storeName = storeName;
    this.db = null;
  }

  open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 3);

      request.onerror = () => {
        reject(Error('Failed to open database.'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = event => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { autoIncrement: true });
        }
      };
    });
  }

  add(item) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const request = store.add(item);

      request.onerror = () => {
        reject(Error('Failed to add item.'));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  }

  getById(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);

      const request = store.get(id);

      request.onerror = () => {
        reject(Error('Failed to get item.'));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  }

  getAll() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);

      const items = [];

      store.openCursor().onsuccess = event => {
        const cursor = event.target.result;

        if (cursor) {
          items.push(cursor.value);
          cursor.continue();
        } else {
          resolve(items);
        }
      };
    });
  }

  update(item) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(Error('Database connection is closed.'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const request = store.put(item);

      request.onerror = () => {
        reject(Error('Failed to update item.'));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  }


  delete(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const request = store.delete(id);

      request.onerror = () => {
        reject(Error('Failed to delete item.'));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  close() {
    this.db.close();
  }
}

// Example usage:

const indexDB = new IndexDB('my-database', 'my-store');

indexDB.open()
  .then(() => {
    // Add an item
    indexDB.add({ name: 'John', email: 'john@example.com' })
      .then(id => console.log(`Added item with ID ${id}.`));

    // Get all
    indexDB.getAll()
      .then(items => console.log('All items:', items));

    // Update an item
    // indexDB.getById(1)
    //   .then(item => {
    //     item.email = 'jane@example.com';
    //     indexDB.update(item)
    //       .then(() => console.log(`Updated item with ID ${item.id}.`));
    //   });

    // Delete an item
    indexDB.delete(1)
      .then(() => console.log('Deleted item with ID 1.'));

    // Close the database connection
    indexDB.close();
  })
  .catch(error => console.error(error));
