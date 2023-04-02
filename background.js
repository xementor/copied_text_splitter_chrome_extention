let copiedTexts = [];

chrome.runtime.onInstalled.addListener(() => {
  console.log('CopyText installed.');
});

// chrome.action.onClicked.addListener((tab) => {
//   chrome.scripting.executeScript({
//     target: {tabId: tab.id},
//     function: () => {
//       navigator.clipboard.readText().then((text) => {
//         chrome.runtime.sendMessage(text);
//       });
//     }
//   });
// });

// chrome.extention.onMessage.addListener((message) => {
function getContentFromClipboard() {
    var result = '';
    var sandbox = document.getElementById('sandbox');
    sandbox.value = '';
    sandbox.select();
    if (document.execCommand('paste')) {
        result = sandbox.value;
        console.log('got value from sandbox: ' + result);
    }
    sandbox.value = '';
    return result;
}


