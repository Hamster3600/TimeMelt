let activeDomain = null;
let startTime = null;

// Funkcja do aktualizacji domeny
function updateActiveDomain(tabId, url) {
    if (url && url.startsWith("http")) {
        try {
            const parsedUrl = new URL(url);

            if (activeDomain !== parsedUrl.hostname) {
                console.log(`Updating domain. Previous domain: ${activeDomain}`);

                // Zapisz poprzednią domenę przed zmianą
                saveTimeForCurrentDomain();

                activeDomain = parsedUrl.hostname;
                startTime = Date.now();

                console.log(`Updated active domain to: ${activeDomain}`);
                console.log("New startTime set:", startTime);
            } else {
                console.log(`Domain has not changed. Current domain: ${activeDomain}`);
            }
        } catch (error) {
            console.error("Error parsing URL:", error);
        }
    } else {
        console.warn("Invalid or unsupported URL:", url);

        // Zapisz czas przed wyzerowaniem danych
        const previousDomain = activeDomain;
        saveTimeForCurrentDomain(previousDomain);

        activeDomain = null;
        startTime = null;
    }
}

// Funkcja do zapisywania czasu dla bieżącej domeny
function saveTimeForCurrentDomain(domainOverride = null) {
    const domain = domainOverride || activeDomain;
    console.log("Checking saveTimeForCurrentDomain:");
    console.log("domain:", domain);
    console.log("startTime:", startTime);

    if (domain && startTime) {
        const now = Date.now();
        const timeSpent = now - startTime;

        if (timeSpent < 3000) {
            console.warn(`Skipping short session (${timeSpent} ms) for domain: ${domain}`);
            return;
        }

        console.log(`Time spent on domain '${domain}': ${timeSpent} ms`);

        chrome.storage.local.get({ timeData: {} }, (result) => {
            const timeData = result.timeData || {};
            console.log("Current timeData from storage:", timeData);

            if (domain !== "null") {
                if (timeData.hasOwnProperty(domain)) {
                    console.log(`Domain '${domain}' already exists in timeData.`);
                    timeData[domain] += timeSpent;
                } else {
                    console.log(`Domain '${domain}' does not exist in timeData. Initializing.`);
                    timeData[domain] = timeSpent;
                }

                console.log(`Updated time for domain '${domain}': ${timeData[domain]} ms`);

                chrome.storage.local.set({ timeData }, () => {
                    if (chrome.runtime.lastError) {
                        console.error("Error saving timeData:", chrome.runtime.lastError);
                    } else {
                        console.log("Time data saved successfully:", timeData);
                    }
                });
            } else {
                console.warn("Skipping save for invalid domain:", domain);
            }
        });

        startTime = null; // Reset startTime po zapisaniu czasu
    } else {
        console.warn("No active domain or startTime to save");
    }
}

// Nasłuchiwanie aktywacji zakładek
chrome.tabs.onActivated.addListener((activeInfo) => {
    console.log("Tab activated:", activeInfo.tabId);

    chrome.tabs.get(activeInfo.tabId, (tab) => {
        console.log("Tab details:", tab);
        if (tab && tab.url) {
            updateActiveDomain(tab.id, tab.url);
        } else {
            console.warn("Tab has no valid URL or is not an HTTP/HTTPS page");
            saveTimeForCurrentDomain();
            activeDomain = null;
            startTime = null;
        }
    });
});

// Nasłuchiwanie aktualizacji zakładek — tylko po załadowaniu strony
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url && tab.url.startsWith("http")) {
        console.log("Tab fully loaded:", tabId, "URL:", tab.url);
        updateActiveDomain(tabId, tab.url);
    }
});

// Nasłuchiwanie zamykania zakładek
chrome.tabs.onRemoved.addListener((tabId) => {
    console.log("Tab removed:", tabId);

    if (activeDomain && startTime) {
        saveTimeForCurrentDomain();
    }

    activeDomain = null;
    startTime = null;
});
