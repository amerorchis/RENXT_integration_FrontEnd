// script.js

document.addEventListener('DOMContentLoaded', function () {
    const runScriptButton = document.getElementById('runScript');

    runScriptButton.addEventListener('click', function () {
        const emailInput = document.getElementById('field1');
        const tagInput = document.getElementById('field2');
        const radioOption1 = document.getElementById('option1');
        const radioOption2 = document.getElementById('option2');
        const serverAddress = document.getElementById('serverAddress')

        let url;
        if (serverAddress.value) {
            console.log("Server Address:", serverAddress.value);
            url = serverAddress.value; // Assign value to url
        } else {
            console.log("Server Address not found in storage.");
            url = "https://tag-constit.vercel.app"; // Assign default value to url
        }

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

        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                function: function (email, tag_name, tag_state, url) {

                    // Scraping code goes here
                    const nameElements = document.querySelectorAll('app-batch-gift-list-constituent-name');
                    const names = Array.from(nameElements).map(element => {
                        const lines = element.textContent.split('\n');
                        return lines[0].trim();
                    });

                    // Remove duplicate names
                    const uniqueNames = [...new Set(names)];

                    // Split names into batches of 25 names or less
                    const batchSize = 25;
                    const batches = [];
                    for (let i = 0; i < uniqueNames.length; i += batchSize) {
                        const batchNames = uniqueNames.slice(i, i + batchSize);
                        batches.push(batchNames);
                    }

                    // Get the batch number from the element with id "BatchNumber"
                    const batchElement = document.getElementById('BatchNumber');
                    const batchNumber = batchElement.textContent.trim();

                    function postBatch(index, response) {
                        if (index >= batches.length) {
                            return; // All batches processed
                        }                   

                        const jsonData = {
                            batch: `${batchNumber} (part ${index + 1}/${batches.length})`,
                            email: email,
                            tag: tag_name,
                            tag_state: tag_state,
                            names: batches[index], // Send the current batch
                        };

                        console.log(jsonData);

                        fetch(url, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(jsonData),
                        })
                        .then(response => {
                            if (response.ok) {
                                console.log(`Data successfully posted to ${url} (Batch ${batchNumber} part ${index + 1})`);
                            } else {
                                console.error(`Failed to post data to ${url} (Batch ${batchNumber} part ${index + 1})`);
                            }
                            return response.text(); // Get the response text
                        })
                        .then(responseText => {
                            // Log the response code and message
                            console.log(`Response Message: ${responseText}`);

                            // Access the value associated with the "message" key
                            const responseObject = JSON.parse(responseText);
                            const messageValue = responseObject.message;

                            let outcome;
                            if (responseText.includes("Confirmation")) {
                                outcome = 'Operation Successful!';
                            } else {
                                outcome = 'Operation Failed';
                            }
                                 
                            chrome.runtime.sendMessage({
                                type: 'notification',
                                options: {
                                    type: 'basic',
                                    title: outcome,
                                    iconUrl: "images/icon48.ico",
                                    message: messageValue,
                                }
                            });

                            postBatch(index + 1); // Post the next batch after the current batch has received a response
                        })
                        .catch(error => {
                            console.error('Error:', error);
                        });
                    }

                    // Start posting batches, beginning with index 0
                    postBatch(0);
                },
                args: [email, tag_name, tag_state, url],
            });
        });
    });
});