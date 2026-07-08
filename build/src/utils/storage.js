export async function getTimeData() {
    const result = await chrome.storage.local.get({ timeData: {} });
    return result.timeData;
}
export async function getMonitoredWebsites() {
    const result = await chrome.storage.local.get(["TimeWastingDomains"]);
    return result.TimeWastingDomains || [];
}
export async function addWebsite(domain) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: "addWebsite", domain }, (response) => {
            resolve(response);
        });
    });
}
