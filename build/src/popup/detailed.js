import { isInPeriod, formatTime } from "../utils/time.js";
export function processDetailedData(timeData, period) {
    const now = new Date();
    const aggregated = {};
    for (const [domain, dates] of Object.entries(timeData)) {
        if (domain === "null")
            continue;
        const cleaned = domain.replace(/^www\./, '');
        for (const [dateStr, { time }] of Object.entries(dates)) {
            if (isInPeriod(new Date(dateStr), now, period)) {
                aggregated[cleaned] = (aggregated[cleaned] || 0) + time;
            }
        }
    }
    return aggregated;
}
export function populateDetailedTable(tbody, data) {
    tbody.innerHTML = "";
    const entries = Object.entries(data);
    if (entries.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="2">No data available</td>';
        tbody.appendChild(row);
        return;
    }
    entries.forEach(([domain, total]) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="font-bold text-[#384452] bg-[#F5F5DC] p-3 text-[13px] text-center">${domain}</td>
            <td class="text-[#6B778D] italic bg-[#F5F5DC] p-3 text-[13px] text-center">${formatTime(total)}</td>
        `;
        tbody.appendChild(row);
    });
}
