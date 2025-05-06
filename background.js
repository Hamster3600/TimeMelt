let activeDomain = null;
let startTime = null;
let intervalId = null;

// Function to save time for the current domain
function saveTimeForCurrentDomain() {
    if (activeDomain && startTime) {
        const now = Date.now();
        const timeSpent = now - startTime;

        if (timeSpent > 0) {
            chrome.storage.local.get({ timeData: {} }, (result) => {
                const timeData = result.timeData || {};
                const today = new Date().toISOString().split("T")[0]; // "2025-05-02"

                // Upewnij się, że domena istnieje
                if (!timeData[activeDomain]) {
                    timeData[activeDomain] = {};
                }

                // Upewnij się, że wpis dla dzisiejszej daty istnieje
                if (!timeData[activeDomain][today]) {
                    timeData[activeDomain][today] = { time: 0 };
                }

                // Dodaj czas
                timeData[activeDomain][today].time += timeSpent;

                chrome.storage.local.set({ timeData }, () => {
                    if (chrome.runtime.lastError) {
                        console.error("Error saving timeData:", chrome.runtime.lastError);
                    } else {
                        console.log(`Saved ${timeSpent}ms for ${activeDomain} on ${today}. Total: ${timeData[activeDomain][today].time}ms`);
                    }
                });
            });
        }
        startTime = now; // Reset start time
    }
}


// Function to handle tab updates and activation
function handleTabChange(tabId, changeInfo, tab) {
    // Save time for the previously active domain before changing
    saveTimeForCurrentDomain();

    if (tab && tab.url && tab.url.startsWith("http")) {
        try {
            const parsedUrl = new URL(tab.url);
            const newDomain = parsedUrl.hostname;

            if (activeDomain !== newDomain) {
                activeDomain = newDomain;
                startTime = Date.now();
                console.log(`Active domain changed to: ${activeDomain}`);

                // Clear previous interval and start a new one for the new domain
                if (intervalId) {
                    clearInterval(intervalId);
                }
                intervalId = setInterval(saveTimeForCurrentDomain, 5000); // Save every 5 seconds
            }
        } catch (error) {
            console.error("Error parsing URL:", error);
            // If URL is invalid, treat as leaving a valid domain
            activeDomain = null;
            startTime = null;
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
        }
    } else {
        // If the tab is not an http/https page, treat as leaving a valid domain
        activeDomain = null;
        startTime = null;
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }
}

// Listen for tab activation
chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        handleTabChange(activeInfo.tabId, null, tab);
    });
});

// Listen for tab updates (when a page finishes loading)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
         handleTabChange(tabId, changeInfo, tab);
    }
});

// Listen for tab removal
chrome.tabs.onRemoved.addListener((tabId) => {
    // Save time for the domain that was active before the tab was closed
    saveTimeForCurrentDomain();

    // If the removed tab was the active one, clear active domain info
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs.length === 0 || tabs[0].id !== tabId) {
             activeDomain = null;
             startTime = null;
             if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
        }
    });
});

// Initial setup when the extension starts
chrome.windows.getLastFocused({}, (window) => {
    if (window && window.tabs) {
        const activeTab = window.tabs.find(tab => tab.active);
        if (activeTab) {
            handleTabChange(activeTab.id, null, activeTab);
        }
    }
});