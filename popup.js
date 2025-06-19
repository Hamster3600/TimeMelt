function getMonitoredWebsites(callback) {
    chrome.storage.local.get(["TimeWastingDomains"], (result) => {
        if (chrome.runtime.lastError) {
            console.error("Storage error:", chrome.runtime.lastError);
            callback([]); // Return empty array on error
            return;
        }
        callback(result.TimeWastingDomains || []);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    var timeChartCanvas = document.getElementById('timeChart');
    var timePeriodToggles = document.querySelectorAll('.time-toggles button');
    var websiteListUl = document.getElementById('websiteList');
    var customizeListButton = document.getElementById('customizeList');
    var detailedView = document.getElementById('detailedView');
    var backButton = document.getElementById('backButton');
    var detailedTimeTableBody = detailedView.querySelector('tbody');
    var seeMoreChartLink = document.getElementById('seeMoreChart');
    var timeTable = document.getElementById('timeTable'); // Added timeTable variable

    var detailedViewWebsites = document.getElementById('detailedViewWebsites');
    var backButtonWebsites = document.getElementById('backButtonWebsites');
    var CustomizeWebsitesTable = document.getElementById('CustomizeWebsitesTable');

    var DDetailed = document.getElementById('D-detailed');
    var WDetailed = document.getElementById('W-detailed');
    var MDetailed = document.getElementById('M-detailed');
    var YDetailed = document.getElementById('Y-detailed');

    var D = document.getElementById('D');
    var W = document.getElementById('W');
    var M = document.getElementById('M');
    var Y = document.getElementById('Y');


    // Check if elements are found
    if (!timeChartCanvas) console.error("Error: timeChartCanvas element not found");
    if (!timePeriodToggles.length) console.error("Error: timePeriodToggles elements not found");
    if (!websiteListUl) console.error("Error: websiteListUl element not found");
    if (!customizeListButton) console.error("Error: customizeListButton element not found");
    if (!detailedView) console.error("Error: detailedView element not found");
    if (!backButton) console.error("Error: backButton element not found");
    if (!detailedTimeTableBody) console.error("Error: detailedTimeTableBody element not found");
    if (!seeMoreChartLink) console.error("Error: seeMoreChartLink element not found");
    if (!timeTable) console.error("Error: timeTable element not found");

    let timeChart = null;
    let currentTimeData = {}; // Store fetched time data

    // Function to save the list of monitored websites to storage
    function saveMonitoredWebsites(monitoredWebsites, callback) {
        chrome.storage.local.set({ TimeWastingDomains: monitoredWebsites }, () => {
            if (chrome.runtime.lastError) {
                console.error("Error saving monitored domains:", chrome.runtime.lastError);
            } else {
                console.log("Monitored domains saved:", monitoredWebsites);
                if (callback) callback();
            }
        });
    }

    // Function to populate the website list in the popup
    function populateWebsiteList(timeData, monitoredWebsites) {
        let countOfWebsites = monitoredWebsites.length;

        if (!websiteListUl) {
            console.error("Cannot populate website list: websiteListUl not found.");
            return;
        }

        websiteListUl.innerHTML = ""; // Clear existing list items

        if (monitoredWebsites.length === 0) {
            const listItem = document.createElement('li');
            listItem.textContent = "No websites being monitored.";
            websiteListUl.appendChild(listItem);
            return;
        }

        // Oblicz czas całkowity dla każdej domeny
        const websiteTimePairs = monitoredWebsites.map(website => {
            let totalTime = 0;
            if (timeData[website]) {
                for (const date in timeData[website]) {
                    totalTime += timeData[website][date].time;
                }
            }
            return { website, totalTime };
        });

        // Posortuj malejąco po czasie i wybierz top 4
        const topWebsites = websiteTimePairs
            .sort((a, b) => b.totalTime - a.totalTime)
            .slice(0, 3);

        // Renderuj tylko top 4 strony
        topWebsites.forEach(({ website, totalTime }) => {
            const totalMinutes = Math.floor(totalTime / (1000 * 60));
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            const formattedTime = `${hours}h ${minutes}m`;

            const listItem = document.createElement('li');
            listItem.innerHTML = `<strong>${website}</strong> ${formattedTime}`;
            websiteListUl.appendChild(listItem);
        });
    }


    // Function to render the pie chart
    function renderChart(data, labels) {
        if (!timeChartCanvas) {
            console.error("Cannot render chart: timeChartCanvas not found.");
            return;
        }
        if (timeChart) {
            timeChart.destroy(); // Destroy previous chart instance
        }

        const ctx = timeChartCanvas.getContext('2d');
        timeChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#F78154', // accent-main
                        '#F2C14E', // accent-secondary
                        '#604F2F', // text-dark
                        '#68534D', // text-soft
                        '#FDECEF', // bg-main
                        '#F2C14E', // bg-section (can reuse colors or add more)
                    ],
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'right',
                        labels: {
                            font: {
                                size: 13 // Increase font size for better readability
                            }
                        }
                    },
                    title: {
                        display: false,
                    }
                }
            }
        });
    }
    // Wymuś ponownie zastosowanie klas centrowania
    timeChartCanvas.parentElement.classList.add('chart-section'); 


    // Function to process time data for the chart based on period
    function processTimeDataForChart(timeData, period) {
        const now = new Date();
        let filteredData = {};
    
        for (const [domain, dates] of Object.entries(timeData)) {
            if (domain === "null") continue;
    
            for (const [dateStr, { time }] of Object.entries(dates)) {
                const entryDate = new Date(dateStr);
                let include = false;
    
                switch (period) {
                    case 'D':
                        include = entryDate.toDateString() === now.toDateString();
                        D.style.backgroundColor = '#ffc0a7';
                        W.style.backgroundColor = '#F78154';
                        M.style.backgroundColor = '#F78154';
                        Y.style.backgroundColor = '#F78154';
                        break;
                    case 'W':
                        const day = now.getDay();
                        const startOfWeek = new Date(now);
                        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                        startOfWeek.setDate(diff);
                        startOfWeek.setHours(0, 0, 0, 0);
                        include = entryDate >= startOfWeek;
                        D.style.backgroundColor = '#F78154';
                        W.style.backgroundColor = '#ffc0a7';
                        M.style.backgroundColor = '#F78154';
                        Y.style.backgroundColor = '#F78154';
                        break;
                    case 'M':
                        include = entryDate.getMonth() === now.getMonth() &&
                        entryDate.getFullYear() === now.getFullYear();
                        D.style.backgroundColor = '#F78154';
                        W.style.backgroundColor = '#F78154';
                        M.style.backgroundColor = '#ffc0a7';
                        Y.style.backgroundColor = '#F78154';
                        break;
                    case 'Y':
                        include = entryDate.getFullYear() === now.getFullYear();
                        D.style.backgroundColor = '#F78154';
                        W.style.backgroundColor = '#F78154';
                        M.style.backgroundColor = '#F78154';
                        Y.style.backgroundColor = '#ffc0a7';
                        break;
                }
    
                if (include) {
                    if (!filteredData[domain]) {
                        filteredData[domain] = 0;
                    }
                    filteredData[domain] += time;
                }
            }
        }
    
        const sortedDomains = Object.entries(filteredData).sort(([, a], [, b]) => b - a);
        const topDomains = sortedDomains.slice(0, 5);
        const labels = topDomains.map(([domain]) => domain);
        const data = topDomains.map(([, time]) => time);
    
        return { data, labels };
    }

    // Function to process time data for the detailed table based on period
    function processTimeDataForDetailedTable(timeData, period) {
        const now = new Date();
        let filteredData = {};

        for (const [domain, dates] of Object.entries(timeData)) {
            if (domain === "null") continue;

            for (const [dateStr, { time }] of Object.entries(dates)) {
                const entryDate = new Date(dateStr);
                let include = false;

                switch (period) {
                    case 'D':
                        include = entryDate.toDateString() === now.toDateString();
                        DDetailed.style.backgroundColor = '#ffc0a7';
                        WDetailed.style.backgroundColor = '#F78154';
                        MDetailed.style.backgroundColor = '#F78154';
                        YDetailed.style.backgroundColor = '#F78154';
                        break;
                    case 'W':
                        const day = now.getDay();
                        const startOfWeek = new Date(now);
                        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                        startOfWeek.setDate(diff);
                        startOfWeek.setHours(0, 0, 0, 0);
                        include = entryDate >= startOfWeek;
                        DDetailed.style.backgroundColor = '#F78154';
                        WDetailed.style.backgroundColor = '#ffc0a7';
                        MDetailed.style.backgroundColor = '#F78154';
                        YDetailed.style.backgroundColor = '#F78154';
                        break;
                    case 'M':
                        include = entryDate.getMonth() === now.getMonth() &&
                                  entryDate.getFullYear() === now.getFullYear();
                        DDetailed.style.backgroundColor = '#F78154';
                        WDetailed.style.backgroundColor = '#F78154';
                        MDetailed.style.backgroundColor = '#ffc0a7';
                        YDetailed.style.backgroundColor = '#F78154';
                        break;
                    case 'Y':
                        include = entryDate.getFullYear() === now.getFullYear();
                        DDetailed.style.backgroundColor = '#F78154';
                        WDetailed.style.backgroundColor = '#F78154';
                        MDetailed.style.backgroundColor = '#F78154';
                        YDetailed.style.backgroundColor = '#ffc0a7';
                        break;
                }

                if (include) {
                    if (!filteredData[domain]) {
                        filteredData[domain] = {};
                    }
                    filteredData[domain][dateStr] = { time: time };
                }
            }
        }
        return filteredData;
    }

    
    // Function to populate the detailed time table
    function populateDetailedTable(timeData) {
        if (!detailedTimeTableBody) {
            console.error("Cannot populate detailed table: detailedTimeTableBody not found.");
            return;
        }
    
        detailedTimeTableBody.innerHTML = "";
        let hasData = false;
    
        for (const [domain, dateEntries] of Object.entries(timeData)) {
            if (domain === "null") continue;
    
            for (const [date, { time }] of Object.entries(dateEntries)) {
                const totalMinutes = Math.floor(time / (1000 * 60));
                const hours = Math.floor(totalMinutes / 60);
                const minutes = totalMinutes % 60;
                const formattedTime = `${hours}h ${minutes}m`;
    
                const row = document.createElement('tr');
                row.innerHTML = `<td>${domain}</td><td>${formattedTime}</td><td>${date}</td>`;
                detailedTimeTableBody.appendChild(row);
                hasData = true;
            }
        }
    
        if (!hasData) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="3">No data available</td>`;
            detailedTimeTableBody.appendChild(row);
        }
    }

    // Function to show the detailed view
    function showDetailedView() {
        if (document.querySelector('.chart-section')) document.querySelector('.chart-section').style.display = 'none';
        if (document.querySelector('.websites-section')) document.querySelector('.websites-section').style.display = 'none';
        if (timeTable) timeTable.style.display = 'none'; // Hide the original table
        if (detailedView) detailedView.style.display = 'block';
        // Populate detailed table with default period (Day) data when showing
        const filteredDetailedData = processTimeDataForDetailedTable(currentTimeData, 'D');
        populateDetailedTable(filteredDetailedData);
    }

    function showDetailedViewWebsites(){
        if (document.querySelector('.chart-section')) document.querySelector('.chart-section').style.display = 'none';
        if (document.querySelector('.websites-section')) document.querySelector('.websites-section').style.display = 'none';
        if (timeTable) timeTable.style.display = 'none'; // Ukryj oryginalną tabelę
        if (detailedView) detailedView.style.display = 'none'; // Ukryj szczegółowy widok czasu
        if (detailedViewWebsites) detailedViewWebsites.style.display = 'block';

        getMonitoredWebsites((monitoredWebsites) => {
            // ZMIEŃ TĘ LINIĘ:
            // populateDetailedTableWebsites(monitoredWebsites);
            // NA TĘ:
            renderCustomWebsites(monitoredWebsites);
        });
    }

    // Function to show the main view
    function showMainView() {
        const chartSection = document.querySelector('.chart-section');
        const websitesSection = document.querySelector('.websites-section');
    
        if (chartSection) chartSection.style.display = 'flex';
        if (websitesSection) websitesSection.style.display = 'flex';
        if (detailedView) detailedView.style.display = 'none';
        if (detailedViewWebsites) detailedViewWebsites.style.display = 'none';
    }

    function renderCustomWebsites(websites) {
        const tableBody = document.querySelector("#CustomizeWebsitesTable tbody");
        tableBody.innerHTML = "";

        websites.forEach((website) => {
            const row = document.createElement("tr");

            const siteCell = document.createElement("td");
            siteCell.textContent = website;

            const actionCell = document.createElement("td");
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.addEventListener("click", () => {
                chrome.runtime.sendMessage({ action: "removeWebsite", domain: website }, (response) => {
                    if (response?.success) {
                        chrome.storage.local.get(["TimeWastingDomains"], (result) => {
                            renderCustomWebsites(result.TimeWastingDomains || []);
                        });
                    } else {
                        alert("Błąd przy usuwaniu: " + (response?.message || ""));
                    }
                });
            });

            actionCell.appendChild(deleteButton);
            row.appendChild(siteCell);
            row.appendChild(actionCell);
            tableBody.appendChild(row);
        });
    }


    document.getElementById("addWebsiteButton").addEventListener("click", () => {
        const newSite = prompt("Enter a new website domain:");
        if (newSite) {
            chrome.runtime.sendMessage({ action: "addWebsite", domain: newSite }, (response) => {
                if (response?.success) {
                    chrome.storage.local.get(["TimeWastingDomains"], (result) => {
                        renderCustomWebsites(result.TimeWastingDomains || []);
                    });
                } else {
                    alert("Błąd przy dodawaniu: " + (response?.message || ""));
                }
            });
        }
    });


    // Initial data load and rendering
    chrome.storage.local.get({ timeData: {} }, (result) => {
        currentTimeData = result.timeData;
        console.log("Loaded timeData in popup:", currentTimeData);

        // Render chart for the default period (Day)
        const { data, labels } = processTimeDataForChart(currentTimeData, 'D');
        renderChart(data, labels);

        // Populate the website list using monitored websites
        getMonitoredWebsites((monitoredWebsites) => {
            populateWebsiteList(currentTimeData, monitoredWebsites);
        });

        // Populate the detailed table (initially hidden) - This is now handled when showing the detailed view
        // populateDetailedTable(currentTimeData);
    });

    // Add event listeners to time period toggles
    if (timePeriodToggles) {
        timePeriodToggles.forEach(button => {
            button.addEventListener('click', (event) => {
                const period = event.target.id;
                console.log("Time period toggled:", period);
        
                const { data, labels } = processTimeDataForChart(currentTimeData, period);
                renderChart(data, labels);
        
                // 🛠 Przywróć widok główny jeśli był ukryty
                showMainView();
            });
        });
    }

    // Add event listener for Customize List button
    if (customizeListButton) {
        customizeListButton.addEventListener('click', () => {
            showDetailedViewWebsites();
        });
    }

    // Add event listener for "see more..." link in chart section
    if (seeMoreChartLink) {
        seeMoreChartLink.addEventListener('click', (event) => {
            event.preventDefault();
            showDetailedView();
        });
    }

    // Add event listener for the back button in detailed view
    if (backButton) {
        backButton.addEventListener('click', (event) => {
            event.preventDefault();
            showMainView();
        });
    }

    if(backButtonWebsites){
        backButtonWebsites.addEventListener('click', (event)=> {
            event.preventDefault();
            showMainView();
        });
    }

    // Add event listeners to detailed view time period toggles
    const detailedTimePeriodToggles = document.querySelectorAll('.time-toggles-detailed button');
    if (detailedTimePeriodToggles) {
        detailedTimePeriodToggles.forEach(button => {
            button.addEventListener('click', (event) => {
                const period = event.target.id.replace('-detailed', ''); // Get period (D, W, M, Y)
                console.log("Detailed view time period toggled:", period);

                const filteredDetailedData = processTimeDataForDetailedTable(currentTimeData, period);
                populateDetailedTable(filteredDetailedData);
            });
        });
    }
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && changes.TimeWastingDomains) {
            console.log("TimeWastingDomains changed in storage. Updating views.");
            const newMonitoredWebsites = changes.TimeWastingDomains.newValue || [];

            // 1. Zaktualizuj główną listę stron
            populateWebsiteList(currentTimeData, newMonitoredWebsites);

            // 2. Zaktualizuj listę w widoku dostosowywania, jeśli jest widoczna
            if (detailedViewWebsites && detailedViewWebsites.style.display !== 'none') {
                renderCustomWebsites(newMonitoredWebsites);
            }
        }
    });
});