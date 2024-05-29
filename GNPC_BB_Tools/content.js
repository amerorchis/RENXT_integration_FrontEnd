console.log('content.js')


// Listen for messages from the background script
let found;
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    found = message.found
    console.log("Message received in content script:", message);
    updateCount(found.length)
});

function updateCount(count) {
    const totalGifts = document.getElementById('TotalGifts').textContent
    let complete = ''
    if (count == totalGifts) {
        complete = '✅'
    }
    const foundCountElement = document.getElementById('found-count')
    if (foundCountElement) {
        foundCountElement.textContent = ''
        foundCountElement.textContent = `${count} gifts found ${complete}`
    } else {
        const pageTitleElement = document.querySelector('sky-page-summary-title');
        if (pageTitleElement) {
            // Create a new span element
            const newSpan = document.createElement('span');
            const lineBreak = document.createElement('br');
            newSpan.id = 'found-count';
            // Set content or attributes for the span if needed
            newSpan.textContent = `${count} gifts found ${complete}`;

            // Insert the new span element after the pageTitleElement
            pageTitleElement.parentNode.insertBefore(lineBreak, pageTitleElement.nextSibling);
            pageTitleElement.parentNode.insertBefore(newSpan, pageTitleElement.nextSibling);
        }
    }
}

// Function to insert the button
function insertButton() {
    if (isCorrectPage()) {
        createButton();
    }
}

// Function to check if the current URL matches the specified condition
function isCorrectPage() {
    return window.location.href.startsWith("https://host.nxt.blackbaud.com/gift-batch/batch-review/");
}

// Function to create and insert the button
function createButton() {
    const button = document.createElement("button");
    button.textContent = "Tag Constituents";
    button.id = "runScript";

    const batchNumberElement = document.getElementById("BatchNumber");

    if (batchNumberElement) {
        batchNumberElement.parentNode.insertBefore(button, batchNumberElement.nextSibling);
        attachButtonClickListener();
    }
}

// Function to attach click listener to the button
function attachButtonClickListener() {
    const runScriptButton = document.getElementById('runScript');

    if (runScriptButton) {
        runScriptButton.addEventListener('click', handleButtonClick);
    }
}

// Function to handle button click event
function handleButtonClick() {
    console.log('button clicked');
    removeExistingOutcomeDiv();

    const batchNumber = getBatchNumber();
    retrieveValuesFromStorage((data) => {
        const { email, tag, tag_state, serverAddress: url } = data;
        console.log('Retrieved values:', email, tag, tag_state, url);
        insertLoadingAnimation();

        const postBody = JSON.stringify({
            batch: batchNumber,
            email,
            tag,
            tag_state,
            names: found
        });

        console.log(postBody);
        postData(url, postBody)
            .then(responseText => handleResponse(responseText))
            .catch(error => console.error('Error:', error));
    });
}

// Function to remove the existing outcome div if it exists
function removeExistingOutcomeDiv() {
    const outcomeDiv = document.getElementById('outcome');
    if (outcomeDiv) {
        outcomeDiv.parentNode.removeChild(outcomeDiv);
    }
}

// Function to get the batch number from the element with id "BatchNumber"
function getBatchNumber() {
    const batchElement = document.getElementById('BatchNumber');
    return batchElement.textContent.trim();
}

// Function to retrieve values from storage
function retrieveValuesFromStorage(callback) {
    console.log('background starting query');
    chrome.storage.local.get(['email', 'tag', 'tag_state', 'serverAddress'], function (data) {
        callback(data);
    });
}

// Function to insert a loading animation
function insertLoadingAnimation() {
    const loadingContainer = document.createElement("div");
    loadingContainer.id = "loading-container";
    loadingContainer.innerHTML = `
        <div class="loading-spinner"></div>
        <p>Processing...</p>
    `;

    const styles = document.createElement("style");
    styles.textContent = `
        .loading-container {
            display: inline;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(255, 255, 255, 0.8);
            z-index: 9999;
        }
        .loading-spinner {
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top: 4px solid #3498db;
            width: 20px;
            height: 20px;
            animation: spin 1s linear infinite;
            margin-top: 5px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(styles);

    const runScriptButton = document.getElementById("runScript");
    runScriptButton.parentNode.insertBefore(loadingContainer, runScriptButton.nextSibling);
}

// Function to post data to the server
function postData(url, postBody) {
    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: postBody,
    })
        .then(response => {
            if (response.ok) {
                console.log(`Data successfully posted to ${url}`);
            } else {
                console.error(`Failed to post data to ${url}`);
            }
            return response.text();
        });
}

// Function to handle the server response
function handleResponse(responseText) {
    console.log('Response:', responseText);
    const r = JSON.parse(responseText);
    const outcome = (r.outcome === 'Success!') ? 'Operation Successful!!' : 'Operation Failed';
    displayOutcome(outcome);

    console.log('Success:', r.success);
    // Append " ✅" to success names
    appendSymbolsToNames(r.success, "✅");
    // Append " ❌" to fail names
    appendSymbolsToNames(r.fail, "❌");
}

// Function to display the outcome next to the button
function displayOutcome(outcome) {
    const buttonElement = document.getElementById('runScript');
    const loadingElement = document.getElementById('loading-container');
    if (buttonElement && loadingElement) {
        loadingElement.remove();
        const outcomeText = document.createTextNode(outcome);

        const outcomeDiv = document.createElement('div');
        outcomeDiv.id = 'outcome';
        outcomeDiv.style.display = 'inline';
        outcomeDiv.style.marginLeft = '8px';

        const space = document.createTextNode(' ');
        outcomeDiv.appendChild(space);
        outcomeDiv.appendChild(outcomeText);
        outcomeDiv.appendChild(space);

        buttonElement.parentNode.insertBefore(outcomeDiv, buttonElement.nextSibling);
    }
}

// Initialize the button insertion
insertButton();

function appendSymbolsToNames(names, symbol) {
    names.forEach(name => {
        const textNodes = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);

        while (textNodes.nextNode()) {
            const textNode = textNodes.currentNode;
            const text = textNode.nodeValue;

            if (text.includes(name)) {
                textNode.nodeValue = `${name} ${symbol}`;
            }
        }
    });
}

// Create a MutationObserver to watch for changes in the DOM
const observer = new MutationObserver(function (mutationsList, observer) {
    for (let mutation of mutationsList) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
            // Check if the button has already been created
            const existingButton = document.getElementById("runScript");
            if (existingButton) {
                // If the button already exists, disconnect the observer and return
                // observer.disconnect();
                return;
            }

            // New nodes have been added to the DOM; check if the button should be inserted
            insertButton();
        }
    }
});

// Listen for page refresh or URL changes
window.onbeforeunload = function () {
    console.log('Page refresh')
    sendUpdateMessage({ type: 'pageRefresh' });
};

window.onpopstate = function (event) {
    console.log('URL change')
    sendUpdateMessage({ type: 'pageRefresh' });
};

function sendUpdateMessage(message) {
    chrome.runtime.sendMessage(message);
}

// Start observing changes in the body of the document
observer.observe(document.body, { childList: true, subtree: true });

setInterval(() => {
    chrome.runtime.sendMessage({ type: 'keepAlive' }, response => {
      if (chrome.runtime.lastError) {
        console.error('Error sending keep-alive message:', chrome.runtime.lastError.message);
      } else {
        console.log('Keep-alive message sent successfully');
      }
    });
  }, 4000);