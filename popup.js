let fullData;
console.log('first full Data',fullData)

document.addEventListener('DOMContentLoaded', async function() {
  const copiedText = getContentFromClipboard()
  if (!hasMoreThan200Words(copiedText)) {
    fullData = await getPreviosData()
    if (fullData == "false") {
      return;
    }
    addTotable(fullData)
    return
  };

  const main_title = copiedText.split(' ').slice(0, 10).join(' ');

  chrome.storage.sync.get([main_title], (result) => {
    if (Object.keys(result).length === 0) {
      addTextToStorage(copiedText, main_title)
    }
    else {
      fullData = result[main_title]
      addTotable(fullData)
    }
  });

});


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

async function getPreviosData(){
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



async function addTextToStorage(text, main_title) {
  // text more than 200 word
  const chunks = splitText(text)
  await chrome.storage.sync.set({[main_title]: chunks, prev: main_title});
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

function addTotable(chunks) {
  const table = document.getElementById('table');
  
  chunks.forEach((chunk, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${index}</td> <td>${chunk.title}...</td><td><button> Copy </button></td>`;
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
  console.log('onlclick chunk',chunk)
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
