// storage.js
const saveBatchButton = document.getElementById('saveBatch');
const radioOption1 = document.getElementById('option1');
const radioOption2 = document.getElementById('option2');
const emailInput = document.getElementById('field1');
const tagInput = document.getElementById('field2');

chrome.storage.local.get(['email', 'tag', 'tag_state'], function (data) {
    emailInput.value = data.email || '';
    tagInput.value = data.tag || '';

    if (data.tag_state === true) {
        radioOption1.checked = true;
    } else if (data.tag_state === false) {
        radioOption2.checked = true;
    }
});

saveBatchButton.addEventListener('click', function () {
    const email = emailInput.value;
    const tag_name = tagInput.value;

    let tag_state;
    if (radioOption1.checked) {
        tag_state = true;
    } else if (radioOption2.checked) {
        tag_state = false;
    } else {
        tag_state = null;
    }

    chrome.storage.local.set({ email, tag: tag_name, tag_state }, function () {
        console.log('Values stored in Chrome Storage');
    });
});
