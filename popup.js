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
                        position: 'right', // <- to będzie działać teraz
                    },
                    title: {
                        display: false,
                    }
                }
            }
            
        });
    }

    // Function to process time data for the chart based on period
    function processTimeDataForChart(timeData, period) {
        const now = Date.now();
        let filteredData = {};

        for (const [domain, data] of Object.entries(timeData)) {
            if (data && domain !== "null" && data.date) {
                const itemDate = new Date(data.date);
                let include = false;

                switch (period) {
                    case 'D': // Day
                        include = itemDate.toDateString() === new Date(now).toDateString();
                        break;
                    case 'W': // Week
                        const startOfWeek = new Date(now);
                        startOfWeek.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
                        include = itemDate >= startOfWeek;
                        break;
                    case 'M': // Month
                        include = itemDate.getMonth() === new Date(now).getMonth() && itemDate.getFullYear() === new Date(now).getFullYear();
                        break;
                    case 'Y': // Year
                        include = itemDate.getFullYear() === new Date(now).getFullYear();
                        break;
                    default: // Default to Day
                        include = itemDate.toDateString() === new Date(now).toDateString();
                }

                if (include) {
                    if (filteredData[domain]) {
                        filteredData[domain] += data.time;
                    } else {
                        filteredData[domain] = data.time;
                    }
                }
            }
        }

        // Sort and get top domains (e.g., top 5)
        const sortedDomains = Object.entries(filteredData).sort(([, a], [, b]) => b - a);
        const topDomains = sortedDomains.slice(0, 5); // Get top 5

        const labels = topDomains.map(([domain,]) => domain);
        const data = topDomains.map(([, time]) => time);

        // Add "Other" category for remaining time
        const otherTime = sortedDomains.slice(5).reduce((sum, [, time]) => sum + time, 0);
        if (otherTime > 0) {
            labels.push('Other');
            data.push(otherTime);
        }

        return { data, labels };
    }

    // Function to populate the detailed time table
    function populateDetailedTable(timeData) {
        if (!detailedTimeTableBody) {
            console.error("Cannot populate detailed table: detailedTimeTableBody not found.");
            return;
        }
        detailedTimeTableBody.innerHTML = ""; // Clear table before adding data
        let hasData = false;
        for (const [domain, data] of Object.entries(timeData)) {
             if (data && domain !== "null") {
                const timeInMs = data.time || 0;
                const date = data.date || "N/A";

                const totalMinutes = Math.floor(timeInMs / (1000 * 60));
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
        populateDetailedTable(currentTimeData); // Populate detailed table when showing
    }

    // Function to show the main view
    function showMainView() {
        if (document.querySelector('.chart-section')) document.querySelector('.chart-section').style.display = 'block';
        if (document.querySelector('.websites-section')) document.querySelector('.websites-section').style.display = 'block';
        if (detailedView) detailedView.style.display = 'none';
    }


    // Initial data load and rendering
    chrome.storage.local.get({ timeData: {} }, (result) => {
        currentTimeData = result.timeData;
        console.log("Loaded timeData in popup:", currentTimeData);

        // Render chart for the default period (Day)
        const { data, labels } = processTimeDataForChart(currentTimeData, 'D');
        renderChart(data, labels);

        // // Populate the website list using monitored websites
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
                const period = event.target.id.replace('toggle', '');
                console.log("Time period toggled:", period);
                const { data, labels } = processTimeDataForChart(currentTimeData, period);
                renderChart(data, labels);
            });
        });
    }


    // Add event listener for Customize List button
    if (customizeListButton) {
        customizeListButton.addEventListener('click', () => {
            const website = prompt("Enter a website domain to monitor (e.g., youtube.com):");
            if (website) {
                getMonitoredWebsites((monitoredWebsites) => {
                    if (!monitoredWebsites.includes(website)) {
                        monitoredWebsites.push(website);
                        saveMonitoredWebsites(monitoredWebsites, () => {
                            populateWebsiteList(currentTimeData, monitoredWebsites);
                            alert(`${website} added to monitored list.`);
                        });
                    } else {
                        alert(`${website} is already in the monitored list.`);
                    }
                });
            }
        });
    }


    // Add event listener for "see more..." link in chart section
    if (seeMoreChartLink) {
        seeMoreChartLink.addEventListener('click', (event) => {
            event.preventDefault();
            showDetailedView();
        });
    }


//      // Add event listener for "see more..." link in websites section (still toggles original table)
//      if (seeMoreWebsitesLink) {
//         seeMoreWebsitesLink.addEventListener('click', (event) => {
//             event.preventDefault();
//             // Toggle visibility of the original detailed table
//             if (timeTable && timeTable.style.display === 'none') {
//                 timeTable.style.display = 'table';
//                 seeMoreWebsitesLink.textContent = 'see less...';
//             } else if (timeTable) {
//                 timeTable.style.display = 'none';
//                 seeMoreWebsitesLink.textContent = 'see more...';
//             }
//         });
//     }


    // Add event listener for the back button in detailed view
    if (backButton) {
        backButton.addEventListener('click', (event) => {
            event.preventDefault();
            showMainView();
        });
    }
});
