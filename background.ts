let activeDomain: string | null = null;
let startTime: number | null = null;
let intervalId: ReturnType<typeof setInterval> | null = null; 
let cachedDomainList: string[] | null = null;

// Function to make a list of time-wasting domains
function getDomainList(): Promise<string[]> {
    return new Promise((resolve) => {
        chrome.storage.local.get(["TimeWastingDomains"], (result) => {
            if (chrome.runtime.lastError) {
                console.error("Storage retrieval error: ", chrome.runtime.lastError);
                resolve([]);
                return;
            }
            const list = (result.TimeWastingDomains as string[]) || [];
            cachedDomainList = list;
            resolve(list);
        });
    });
}

// adding website to time wasting domains
function addWebsite(domain: string, sendResponse: (response: {success: boolean; message?: string}) => void): boolean {
    chrome.storage.local.get(["TimeWastingDomains"], (result) => {
        const currentList = (result.TimeWastingDomains as string[]) || [];
        if (!currentList.includes(domain)){
            currentList.push(domain);
            chrome.storage.local.set({ TimeWastingDomains: currentList}, () => {
                cachedDomainList = currentList
                sendResponse({success: true});
            });
        } else {
            sendResponse({ success: false, message: "Domain already exists"});
        }
    });

    return true;
}

// removing webites from time wasting domains
function removeWebsite(domain: string, sendResponse: (response: {success: boolean; message?: string}) => void): boolean {
    chrome.storage.local.get(["TimeWastingDomains"], (result) => {
        const currentList = (result.TimeWastingDomains as string[]) || [];
        const index = currentList.indexOf(domain);
        if (index > -1) {
            currentList.splice(index, 1);
            chrome.storage.local.set({ TimeWastingDomains: currentList }, () => {
                cachedDomainList = currentList;
                console.log(`Domain was removed from time wasting domains: ${domain}`);
                sendResponse({ success: true });
            });
        } else {
            sendResponse({ success: false, message: "Domain wasn't found" });
        }
    });

    return true;
}

// listening for editing the websites
chrome.runtime.onMessage.addListener((message: {action: string; domain: string},_sender: chrome.runtime.MessageSender, sendResponse: (response: {success: boolean; message?: string}) => void) => {
    if (message.action === "addWebsite") {
        return addWebsite(message.domain, sendResponse);
    }
    if (message.action === "removeWebsite") {
        return removeWebsite(message.domain, sendResponse);
    }
}); 


// Checks if the domain is on the list
function isDomainBlocked(domain: string): boolean {
    const domainWithoutWWW = domain.replace(/^www\./, '');
    return cachedDomainList?.some(d => d.replace(/^www\./, '') === domainWithoutWWW) ?? false;
}


// Add a new domain to the list and update both storage and memory
function addDomainToBlockedList(newDomain: string):void {
    if (cachedDomainList && !cachedDomainList.includes(newDomain)) {
        cachedDomainList.push(newDomain);

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
    let nowTab = activeDomain?.replace(/^www\./, '');
    if (!nowTab || !startTime) return;

    if (!isDomainBlocked(nowTab)) {
        console.log(`Domain ${nowTab} is not on the blocked list. Skippind time save`)
        return;
    }

    const now = Date.now();
    const timeSpent = now - startTime;
    if (timeSpent <= 0) return;

    type TimeStorage = Record<string, Record<string, { time: number }>>;

    chrome.storage.local.get({ timeData: {} as TimeStorage }, (result) => {
        const timeData: TimeStorage = (result.timeData as TimeStorage) || {};
        const today = new Date().toISOString().split("T")[0];

        if (!timeData[nowTab]) timeData[nowTab] = {};
        if (!timeData[nowTab][today]) timeData[nowTab][today] = { time: 0 };

        timeData[nowTab][today].time += timeSpent;

        chrome.storage.local.set({ timeData }, () => {
            console.log(`Saved ${timeSpent}ms for ${nowTab} on ${today}. Total: ${timeData[nowTab][today].time}ms`);
        });
    });
    startTime = now;
}



// Function to handle tab updates and activation
function handleTabChange(tabId: number, _changeInfo: {status?: string; url?: string} | null, tab?: chrome.tabs.Tab): void {
    saveTimeForCurrentDomain();

    if (tab?.url?.startsWith("http")) {
        try {
            const parsedUrl = new URL(tab.url);
            const newDomain = parsedUrl.hostname;

            if (activeDomain !== newDomain) {
                activeDomain = newDomain;
                startTime = Date.now();
                console.log(`Active domain changed to: ${activeDomain}`);

                if (intervalId) {
                    clearInterval(intervalId);
                }
                intervalId = setInterval(saveTimeForCurrentDomain, 5000);
            }
        } catch (error) {
            console.error("Error parsing URL:", error);
            activeDomain = null;
            startTime = null;
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
        }
    } else {
        activeDomain = null;
        startTime = null;
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }
}

// Listen for tab activation
chrome.tabs.onActivated.addListener((activeInfo: { tabId: number; windowId: number }) => {    
    chrome.tabs.get(activeInfo.tabId, (tab: chrome.tabs.Tab) => {
        handleTabChange(activeInfo.tabId, null, tab);
    });
});

// Listen for tab updates (when a page finishes loading)
chrome.tabs.onUpdated.addListener((tabId: number, changeInfo: {status?: string; url?: string}, tab: chrome.tabs.Tab) => {
    if (changeInfo.status === 'complete') {
         handleTabChange(tabId, changeInfo, tab);
    }
});

// Listen for tab removal
chrome.tabs.onRemoved.addListener((tabId: number) => {
    saveTimeForCurrentDomain();

    chrome.tabs.query({active: true, currentWindow: true}, (tabs: chrome.tabs.Tab[]) => {
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
chrome.windows.getLastFocused({}, (win) => {
    if (win && win.tabs) {
        const activeTab = win.tabs.find(tab => tab.active);
        if (activeTab) {
            handleTabChange(activeTab.id!, null, activeTab);
        }
    }
});

getDomainList();