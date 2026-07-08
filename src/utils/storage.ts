import { TimeData } from "../types.js";

export async function getTimeData(): Promise<TimeData> {
    const result = await chrome.storage.local.get({ timeData: {} as TimeData });
    return result.timeData as TimeData;
}

export async function getMonitoredWebsites(): Promise<string[]> {
    const result = await chrome.storage.local.get(["TimeWastingDomains"]);
    return (result.TimeWastingDomains as string[]) || [];
}

export async function addWebsite(domain: string): Promise<{ success: boolean; message?: string }> {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: "addWebsite", domain }, (response) => {
            resolve(response);
        });
    });
}