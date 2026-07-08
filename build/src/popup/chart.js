import { isInPeriod } from "../utils/time.js";
let chartInstance = null;
export function processChartData(timeData, period) {
    const now = new Date();
    const filtered = {};
    for (const [domain, dates] of Object.entries(timeData)) {
        if (domain === "null")
            continue;
        const cleaned = domain.replace(/^www\./, '');
        for (const [dateStr, { time }] of Object.entries(dates)) {
            if (isInPeriod(new Date(dateStr), now, period)) {
                filtered[cleaned] = (filtered[cleaned] || 0) + time;
            }
        }
    }
    const sorted = Object.entries(filtered).sort(([, a], [, b]) => b - a).slice(0, 5);
    return { labels: sorted.map(([d]) => d), data: sorted.map((([, t]) => t)) };
}
export function renderChart(canvas, data, labels, colors) {
    if (chartInstance)
        chartInstance.destroy();
    const ctx = canvas.getContext('2d');
    if (!ctx)
        return;
    chartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels,
            datasets: [{ data, backgroundColor: colors, borderColor: '#fff', borderWidth: 1 }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, position: 'right', labels: { font: { size: 13 } } },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const totalMin = Math.floor(ctx.parsed / 60000);
                            return `${ctx.label}: ${Math.floor(totalMin / 60)}h ${totalMin % 60}m`;
                        }
                    }
                }
            }
        }
    });
}
