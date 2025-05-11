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
                        break;
                    case 'W':
                        const day = now.getDay();
                        const startOfWeek = new Date(now);
                        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                        startOfWeek.setDate(diff);
                        startOfWeek.setHours(0, 0, 0, 0);
                        include = entryDate >= startOfWeek;
                        break;
                    case 'M':
                        include = entryDate.getMonth() === now.getMonth() &&
                                  entryDate.getFullYear() === now.getFullYear();
                        break;
                    case 'Y':
                        include = entryDate.getFullYear() === now.getFullYear();
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
                        break;
                    case 'W':
                        const day = now.getDay();
                        const startOfWeek = new Date(now);
                        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                        startOfWeek.setDate(diff);
                        startOfWeek.setHours(0, 0, 0, 0);
                        include = entryDate >= startOfWeek;
                        break;
                    case 'M':
                        include = entryDate.getMonth() === now.getMonth() &&
                                  entryDate.getFullYear() === now.getFullYear();
                        break;
                    case 'Y':
                        include = entryDate.getFullYear() === now.getFullYear();
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

    // Function to show the main view
    function showMainView() {
        const chartSection = document.querySelector('.chart-section');
        const websitesSection = document.querySelector('.websites-section');
    
        if (chartSection) chartSection.style.display = 'flex';
        if (websitesSection) websitesSection.style.display = 'flex';
        if (detailedView) detailedView.style.display = 'none';
    }
    

    // Initial data load and rendering
    chrome.storage.local.get({ timeData: {} }, (result) => {
        currentTimeData = result.timeData;
        console.log("Loaded timeData in popup:", currentTimeData);

        // Render chart for the default period (Day)
        const { data, labels } = processTimeDataForChart(currentTimeData, 'D');
        renderChart(data, labels);

        // Populate the website list using monitored websites
        // getMonitoredWebsites((monitoredWebsites) => {
        //     populateWebsiteList(currentTimeData, monitoredWebsites);
        // });

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

    // // Add event listener for Customize List button
    // if (customizeListButton) {
    //     customizeListButton.addEventListener('click', () => {
    //         const website = prompt("Enter a website domain to monitor (e.g., youtube.com):");
    //         if (website) {
    //             getMonitoredWebsites((monitoredWebsites) => {
    //                 if (!monitoredWebsites.includes(website)) {
    //                     monitoredWebsites.push(website);
    //                     saveMonitoredWebsites(monitoredWebsites, () => {
    //                         populateWebsiteList(currentTimeData, monitoredWebsites);
    //                         alert(`${website} added to monitored list.`);
    //                     });
    //                 } else {
    //                     alert(`${website} is already in the monitored list.`);
    //                 }
    //             });
    //         }
    //     });
    // }

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
    
});
