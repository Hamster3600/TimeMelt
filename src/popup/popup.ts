import { getTimeData, getMonitoredWebsites, addWebsite } from "../utils/storage.js";
import { processChartData, renderChart } from "./chart.js";
import { populateWebsiteList, renderCustomWebsiteTable } from "./websites.js";
import { processDetailedData, populateDetailedTable } from "./detailed.js";
import { setupModals, showMessage } from "./modals.js";
import { Period } from "../types.js";

document.addEventListener('DOMContentLoaded', async () => {
    const timeChartCanvas = document.getElementById('timeChart') as HTMLCanvasElement;

    // Kolory (były z CSS variables)
    const colors = ['#c98210', '#B0B0B0', '#384452', '#10233A', '#D5D5D5', '#ADA597'];

    // Dane
    const timeData = await getTimeData();
    const monitored = await getMonitoredWebsites();

    // Wykres początkowy
    const { data, labels } = processChartData(timeData, 'D');
    renderChart(timeChartCanvas, data, labels, colors);
    highlightToggle('.time-toggles button', document.getElementById('D')!, '#EBDAC5', '#c98210');

    // Lista top 3
    populateWebsiteList(document.getElementById('websiteList') as HTMLUListElement, timeData, monitored);

    // Event: period toggles (chart)
    document.querySelectorAll<HTMLButtonElement>('.time-toggles button').forEach(btn => {
        btn.addEventListener('click', () => {
            const period = btn.id as Period;
            const { data, labels } = processChartData(timeData, period);
            renderChart(timeChartCanvas, data, labels, colors);
            highlightToggle('.time-toggles button', btn, '#EBDAC5', '#c98210');
        });
    });

    // Event: Customize list
    document.getElementById('customizeList')!.addEventListener('click', async () => {
        toggleView('detailedViewWebsites');
        await renderCustomWebsiteTable(
            document.querySelector('#CustomizeWebsitesTable tbody') as HTMLTableSectionElement
        );
    });

    // Event: see more → detailed view
    document.getElementById('seeMoreChart')!.addEventListener('click', (e) => {
        e.preventDefault();
        toggleView('detailedView');
        const aggregated = processDetailedData(timeData, 'D');
        populateDetailedTable(
            document.querySelector('#detailedTimeTable tbody') as HTMLTableSectionElement,
            aggregated
        );
    });

    // Event: back buttons
    document.getElementById('backButton')!.addEventListener('click', () => toggleView('main'));
    document.getElementById('backButtonWebsites')!.addEventListener('click', () => toggleView('main'));

    // Event: detailed period toggles
    document.querySelectorAll<HTMLButtonElement>('.time-toggles-detailed button').forEach(btn => {
        btn.addEventListener('click', () => {
            const period = btn.id.replace('-detailed', '') as Period;
            const aggregated = processDetailedData(timeData, period);
            populateDetailedTable(
                document.querySelector('#detailedTimeTable tbody') as HTMLTableSectionElement,
                aggregated
            );
            highlightToggle('.time-toggles-detailed button', btn, '#EBDAC5', '#c98210');
        });
    });

    // Event: add website confirm
    document.getElementById('confirmAddWebsiteButton')!.addEventListener('click', async () => {
        const input = document.getElementById('newWebsiteInput') as HTMLInputElement;
        const newSite = input.value.trim();
        if (newSite) {
            const resp = await addWebsite(newSite);
            const msg = document.getElementById('modalMessage')!;
            if (resp.success) {
                showMessage(msg, "Website added successfully!", false);
                input.value = '';
                await renderCustomWebsiteTable(document.querySelector('#CustomizeWebsitesTable tbody') as HTMLTableSectionElement);
            } else {
                showMessage(msg, "Error: " + (resp.message || "N/A"), true);
            }
        } else {
            showMessage(document.getElementById('modalMessage')!, "Please enter a domain.", true);
        }
    });

    setupModals();
});

function highlightToggle(selector: string, active: HTMLElement, activeBg: string, normalBg: string): void {
    document.querySelectorAll<HTMLButtonElement>(selector).forEach(b => {
        b.style.backgroundColor = b === active ? activeBg : normalBg;
        b.style.color = b === active ? '#384452' : '#FFFFFF';
    });
}

function toggleView(view: 'main' | 'detailedView' | 'detailedViewWebsites'): void {
    document.querySelector<HTMLElement>('.chart-section')!.style.display = view === 'main' ? 'flex' : 'none';
    document.querySelector<HTMLElement>('.websites-section')!.style.display = view === 'main' ? 'flex' : 'none';
    document.getElementById('detailedView')!.style.display = view === 'detailedView' ? 'block' : 'none';
    document.getElementById('detailedViewWebsites')!.style.display = view === 'detailedViewWebsites' ? 'block' : 'none';
}