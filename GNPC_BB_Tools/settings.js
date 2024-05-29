// settings.js
document.addEventListener('DOMContentLoaded', function () {
    const serverAddressInput = document.getElementById('serverAddress');
    const saveButton = document.getElementById('saveSettings');

    if (serverAddressInput && saveButton) {
        // Load the saved server address from local storage (if available)
        chrome.storage.local.get(['serverAddress'], function (data) {
            const savedServerAddress = data.serverAddress;
            // Set the default value if savedServerAddress is falsy
            serverAddressInput.value = savedServerAddress || 'https://tag-constit.vercel.app';
        });

        // Save the server address to local storage when the Save button is clicked
        saveButton.addEventListener('click', function () {
            const serverAddress = serverAddressInput.value || 'https://tag-constit.vercel.app';
            chrome.storage.local.set({ serverAddress }, function () {
                console.log('Server address saved in Chrome Storage');
            });
        });
    }
});
