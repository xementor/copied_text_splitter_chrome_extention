// document.addEventListener('copy', function(event) {
//   console.log("copy event ..3.")
//   const copiedText = window.getSelection().toString();
//   const words = copiedText.split(' ');
//   // chrome.extention.sendMessage({text: words});
// });

document.addEventListener('copy', function(event) {
  var copiedText = window.getSelection().toString();
  console.log("copy", copiedText)
  chrome.runtime.sendMessage({action: 'saveToStorage', data: copiedText});
});

// alert("hi")