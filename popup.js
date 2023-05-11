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

  lastKey() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      let countRequest = store.count();

      countRequest.onsuccess = () => {
        let lastKeyI = countRequest.result;
        resolve(lastKeyI)
      };

      countRequest.onerror = function (event) {
        reject(Error('Failed to delete item.'));
      };
    });
  }

  close() {
    this.db.close();
  }
}



const indexDB = new IndexDB('clipboard-database', 'clips');
const wordCount = 2000;
let fullData;

document.addEventListener('DOMContentLoaded', async function () {
  const copiedText = getContentFromClipboard()
  if (hasMoreThanWords(copiedText, wordCount)){
    await addClip(copiedText, wordCount)
  };
  resData = await getPrevClip()
  if (resData == "false") {
    return;
  }

  fullData = resData
  addTotable(fullData)
});





function addClip(text, count) {
  const chunks = splitText(text,count)
  indexDB.open()
    .then(() =>
      indexDB.add(chunks).then(id => console.log(`${id} added to the database`))
    )
    .catch(error => console.error(error));
}

async function addTextToStorage(text, main_title) {
  // text more than 200 word
  const chunks = splitText(text)
  await chrome.storage.sync.set({ [main_title]: chunks, prev: main_title });
}

function getPrevClip() {
  return indexDB.open()
    .then(() => {
      return indexDB.lastKey().then((index) => {
        return indexDB.getById(index).then((data) => {
          if (data == undefined) return "false"
          return data
        })
      })
    })
    .catch(error => {
      console.log('get error',error)
      return "false"
    });
}


document.addEventListener('click', async function () {
  if (fullData === undefined) return;
  // Get a reference to the table element
  var table = document.getElementById('table');

  // Get an array of all the buttons in the table rows
  var buttons = table.getElementsByTagName('button');

  // Loop through the buttons and attach a click event listener to each one
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener('click', async function (event) {
      // Get a reference to the button that was clicked
      var button = event.target;

      // Get a reference to the row that contains the clicked button
      var row = button.closest('tr');

      // Do something with the row, such as get the values of its cells
      var cells = row.getElementsByTagName('td');
      var id = cells[0].textContent;
      const text = fullData[id].chunk
      try {
          await navigator.clipboard.writeText(text)
        }
        catch( error ) {
          console.error("Failed to copy text: ", error);
        }
    }
  )}
})
  




async function getPreviosData() {
  let res = "false";
  const result = await chrome.storage.sync.get(['prev']);

  if (Object.keys(result).length === 0) {
    console.log('nov prev data');
  }
  else {
    prevKey = result['prev']
    console.log('prevKey', prevKey)
    res = await chrome.storage.sync.get([prevKey])
    res = res[prevKey]
  }
  return res;

}





function hasMoreThanWords(str,count=200) {
  const words = str.match(/\b\w+\b/g);
  return words && words.length > (count + 600);
}

function splitText(text, count=200) {
  const words = text.split(' ');
  const chunks = [];
  for (let i = 0; i < words.length; i += count) {
    const chunk = words.slice(i, i + count).join(' ');

    const last = chunk.split(' ').slice(-3).join(' ')
    const title = chunk.split(' ').slice(0, 4).join(' ') + "..." + last;
    chunks.push({ title, chunk });
  }
  return chunks
}

function addTotable(chunks) {
  const table = document.getElementById('table');

  chunks.forEach((chunk, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${index}</td> <td>${chunk.title}</td><td><button> Copy </button></td>`;
    table.appendChild(tr);
  });
}


function selectChunk(event) {
  console.log('hi from click');
  event.preventDefault();
  const index = event.target.getAttribute('data-index');
  const chunk = document.getElementById('table').childNodes[index].textContent.trim();
  document.execCommand('copy', false, chunk);
  const copyButton = document.getElementById('copy-button');
  copyButton.removeAttribute('disabled');
  copyButton.setAttribute('data-clipboard-text', chunk);
}

function copyToClipboard() {
  const chunk = document.getElementById('copy-button').getAttribute('data-clipboard-text');
  console.log('onlclick chunk', chunk)
  navigator.clipboard.writeText(chunk);
}

function getContentFromClipboard() {
  var result = '';
  var sandbox = document.getElementById('sandbox');
  sandbox.value = '';
  sandbox.select();
  if (document.execCommand('paste')) {
    result = sandbox.value;
  }
  sandbox.value = '';
  sandbox.style.display = 'none';

  return result;
}

