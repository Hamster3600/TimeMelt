import { formatTime } from "../utils/time.js";
export function populateWebsiteList(ul, timeData, monitored) {
    ul.innerHTML = "";
    if (monitored.length === 0) {
        const li = document.createElement('li');
        li.textContent = "No websites being monitored.";
        ul.appendChild(li);
        return;
    }
    const pairs = monitored.map(site => {
        let total = 0;
        if (timeData[site]) {
            for (const date in timeData[site])
                total += timeData[site][date].time;
        }
        return { site: site.replace(/^www\./, ''), total };
    });
    pairs.sort((a, b) => b.total - a.total).slice(0, 3).forEach(({ site, total }) => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${site}</strong> ${formatTime(total)}`;
        ul.appendChild(li);
    });
}
export async function renderCustomWebsiteTable(tbody) {
    tbody.innerHTML = "";
    const result = await chrome.storage.local.get(["TimeWastingDomains"]);
    const websites = result.TimeWastingDomains || [];
    websites.forEach(site => {
        const cleaned = site.replace(/^www\./, '');
        const row = document.createElement('tr');
        const siteCell = document.createElement('td');
        siteCell.textContent = cleaned;
        const actionCell = document.createElement('td');
        const delBtn = document.createElement('button');
        delBtn.textContent = 'Delete';
        delBtn.className = 'bg-[#c98210] text-white border-none py-[5px] px-2.5 rounded-[3px] cursor-pointer hover:bg-[#384452] tranition-colors';
        delBtn.addEventListener('click', async () => {
            await chrome.runtime.sendMessage({ action: "removeWebsite", domain: site });
            await renderCustomWebsiteTable(tbody);
        });
        actionCell.appendChild(delBtn);
        row.appendChild(siteCell);
        row.appendChild(actionCell);
        tbody.appendChild(row);
    });
}
