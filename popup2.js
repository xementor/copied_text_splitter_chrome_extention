// open the IndexedDB database
const dbPromise = window.indexedDB.open('myDB', 1);

// define the object store schema
dbPromise.onupgradeneeded = function(event) {
  const db = event.target.result;
  const objectStore = db.createObjectStore('myObjectStore', { keyPath: 'id' });
  objectStore.createIndex('title', 'title', { unique: false });
};

// add event listener for DOMContentLoaded
document.addEventListener('DOMContentLoaded', async function() {
  const copiedText = getContentFromClipboard()
  if (!hasMoreThan200Words(copiedText)) {
    const fullData = await getPreviousData()
    if (!fullData) {
      return;
    }
    addToTable(fullData)
    return
  };

  const main_title = copiedText.split(' ').slice(0, 10).join(' ');

  // search for the main_title in the object store
  const db = await dbPromise;
  const transaction = db.transaction('myObjectStore', 'readonly');
  const objectStore = transaction.objectStore('myObjectStore');
  const index = objectStore.index('title');
  const request = index.get(main_title);
  request.onerror = function(event) {
    console.error('Error', event.target.errorCode);
  };
  request.onsuccess = async function(event) {
    const result = event.target.result;
    if (!result) {
      // add the text to the object store
      const chunks = splitText(copiedText);
      const data = { id: Date.now(), title: main_title, chunks: chunks };
      const transaction = db.transaction('myObjectStore', 'readwrite');
      const objectStore = transaction.objectStore('myObjectStore');
      objectStore.add(data);
      transaction.oncomplete = function() {
        addToTable(chunks);
      };
    } else {
      addToTable(result.chunks);
    }
  };
});

async function getPreviousData() {
  const db = await dbPromise;
  const transaction = db.transaction('myObjectStore', 'readonly');
  const objectStore = transaction.objectStore('myObjectStore');
  const request = objectStore.getAll();
  return new Promise((resolve, reject) => {
    request.onerror = function(event) {
      console.error('Error', event.target.errorCode);
      reject(event.target.errorCode);
    };
    request.onsuccess = function(event) {
      const result = event.target.result;
      if (result.length > 0) {
        const latest = result.sort((a, b) => b.id - a.id)[0];
        resolve(latest.chunks);
      } else {
        console.log('no previous data');
        resolve(null);
      }
    };
  });
}

function addToTable(chunks) {
  // add the chunks to a table
}

function hasMoreThan200Words(str) {
  const words = str.match(/\b\w+\b/g);
  return words && words.length > 200;
}

function splitText(text) {
  const words = text.split(' ');
  const chunks = [];
  for (let i = 0; i < words.length; i += 200) {
    const chunk = words.slice(i, i + 200).join(' ');
    const title = chunk.split(' ').slice(0, 10).join(' ');
    chunks.push({title, chunk});
  }
  return chunks
}


document.addEventListener('click', async function(){
  // Get a reference to the table element
  var table = document.getElementById('table');

  // Get an array of all the buttons in the table rows
  var buttons = table.getElementsByTagName('button');

  // Loop through the buttons and attach a click event listener to each one
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener('click', function (event) {
      // Get a reference to the button that was clicked
      var button = event.target;

      // Get a reference to the row that contains the clicked button
      var row = button.closest('tr');

      // Do something with the row, such as get the values of its cells
      var cells = row.getElementsByTagName('td');
      var id = cells[0].textContent;
      const text = fullData[id].chunk
      navigator.clipboard.writeText(text)
        .then(() => {
          // Code to execute if the copy command was successful
        })
        .catch((error) => {
          // Code to execute if the copy command was not successful
          console.error("Failed to copy text: ", error);
        })
    });
  }
})


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
