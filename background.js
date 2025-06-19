let activeDomain = null;
let startTime = null;
let intervalId = null;
let cachedDomainList = null;

// Function to make a list of time-wasting domains
function getDomainList() {
    chrome.storage.local.get(["TimeWastingDomains"], (result) => {
        if (chrome.runtime.lastError) {
            console.error("Storage error:", chrome.runtime.lastError);
            return;
        }

        if (!result.TimeWastingDomains) {
            // Jeśli nie istnieje — ustaw domyślną listę
            const defaultDomains = ["youtube.com", "instagram.com", "facebook.com", "x.com", "reddit.com", "tiktok.com"];
            chrome.storage.local.set({ TimeWastingDomains: defaultDomains }, () => {
                if (chrome.runtime.lastError) {
                    console.error("Error setting default domains:", chrome.runtime.lastError);
                } else {
                    console.log("Default domain list saved:", defaultDomains);
                    cachedDomainList = defaultDomains; // Zapisz w pamięci
                }
            });
        } else {
            // Lista już istnieje — zapisz ją w pamięci
            console.log("Domain list found:", result.TimeWastingDomains);
            cachedDomainList = result.TimeWastingDomains;
        }
    });
}

function addWebsite(domain, sendResponse) {
    chrome.storage.local.get(["TimeWastingDomains"], (result) => {
        const currentList = result.TimeWastingDomains || [];
        if (!currentList.includes(domain)) {
            currentList.push(domain);
            chrome.storage.local.set({ TimeWastingDomains: currentList }, () => {
                cachedDomainList = currentList; // Zaktualizuj cache
                console.log(`Dodano domenę do TimeWastingDomains: ${domain}`);
                sendResponse({ success: true });
            });
        } else {
            sendResponse({ success: false, message: "Domena już istnieje" });
        }
    });

    return true; // konieczne dla asynchronicznego sendResponse
}

function removeWebsite(domain, sendResponse) {
    chrome.storage.local.get(["TimeWastingDomains"], (result) => {
        let currentList = result.TimeWastingDomains || [];
        const index = currentList.indexOf(domain);
        if (index > -1) {
            currentList.splice(index, 1);
            chrome.storage.local.set({ TimeWastingDomains: currentList }, () => {
                cachedDomainList = currentList;
                console.log(`Usunięto domenę z TimeWastingDomains: ${domain}`);
                sendResponse({ success: true });
            });
        } else {
            sendResponse({ success: false, message: "Domena nie znaleziona" });
        }
    });

    return true;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "addWebsite") {
        return addWebsite(message.domain, sendResponse);
    }
    if (message.action === "removeWebsite") {
        return removeWebsite(message.domain, sendResponse);
    }
}); 


// Checks if the domain is on the list (using cached list)
function isDomainBlocked(domain, callback) {
    // Usuwamy "www." z początku domeny, jeśli jest
    const domainWithoutWWW = domain.replace(/^www\./, '');

    if (cachedDomainList) {
        // Usuwamy "www." również z domen na liście, aby porównanie było poprawne
        const isBlocked = cachedDomainList.some(d => d.replace(/^www\./, '') === domainWithoutWWW);
        callback(isBlocked);
    } else {
        // Jeżeli lista jest pusta, ładujemy ją z storage
        getDomainList((loadedDomainList) => {
            // Usuwamy "www." z domen na liście i porównujemy
            const isBlocked = loadedDomainList.some(d => d.replace(/^www\./, '') === domainWithoutWWW);
            callback(isBlocked);
        });
    }
}


// Add a new domain to the list and update both storage and memory
function addDomainToBlockedList(newDomain) {
    if (cachedDomainList && !cachedDomainList.includes(newDomain)) {
        cachedDomainList.push(newDomain); // Add to cached list

        // Update storage
        chrome.storage.local.set({ TimeWastingDomains: cachedDomainList }, () => {
            if (chrome.runtime.lastError) {
                console.error("Error saving domain to storage:", chrome.runtime.lastError);
            } else {
                console.log(`Added ${newDomain} to TimeWastingDomains`);
            }
        });
    }
}


// Function to save time for the current domain
function saveTimeForCurrentDomain() {
    let nowTab = activeDomain;
    if (nowTab && startTime) {
        // Sprawdzamy, czy domena jest na liście zablokowanych
        isDomainBlocked(nowTab, (blocked) => {
            if (blocked) { // Zapisujemy czas tylko, jeśli domena jest zablokowana
                const now = Date.now();
                const timeSpent = now - startTime;

                if (timeSpent > 0) {
                    chrome.storage.local.get({ timeData: {} }, (result) => {
                        const timeData = result.timeData || {};
                        const today = new Date().toISOString().split("T")[0]; // "2025-05-02"

                        // Upewnij się, że domena istnieje
                        if (!timeData[nowTab]) {
                            timeData[nowTab] = {};
                        }

                        // Upewnij się, że wpis dla dzisiejszej daty istnieje
                        if (!timeData[nowTab][today]) {
                            timeData[nowTab][today] = { time: 0 };
                        }

                        // Dodaj czas
                        timeData[nowTab][today].time += timeSpent;

                        chrome.storage.local.set({ timeData }, () => {
                            if (chrome.runtime.lastError) {
                                console.error("Error saving timeData:", chrome.runtime.lastError);
                            } else {
                                console.log(`Saved ${timeSpent}ms for ${nowTab} on ${today}. Total: ${timeData[nowTab][today].time}ms`);
                            }
                        });
                    });
                }
                startTime = now; // Reset start time
            } else {
                console.log(`Domain ${nowTab} is not on the blocked list. Skipping time save.`);
                console.log("Cached domain list:", cachedDomainList);
            }
        });
    }
}



// Function to handle tab updates and activation
function handleTabChange(tabId, changeInfo, tab) {
    // Save time for the previously active domain before changing
    let nowTab = tab;
    saveTimeForCurrentDomain();

    if (nowTab && nowTab.url && nowTab.url.startsWith("http")) {
        try {
            const parsedUrl = new URL(nowTab.url);
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

getDomainList();