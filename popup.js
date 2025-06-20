// caling function to get time wasting webistes
function getMonitoredWebsites(callback) {
    chrome.storage.local.get(["TimeWastingDomains"], (result) => {
        if (chrome.runtime.lastError) {
            console.error("Storage error:", chrome.runtime.lastError);
            callback([]);
            return;
        }
        callback(result.TimeWastingDomains || []);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Variables
    var timeChartCanvas = document.getElementById('timeChart');
    var timePeriodToggles = document.querySelectorAll('.time-toggles button');
    var websiteListUl = document.getElementById('websiteList');
    var customizeListButton = document.getElementById('customizeList');
    var detailedView = document.getElementById('detailedView');
    var backButton = document.getElementById('backButton');
    var detailedTimeTableBody = detailedView.querySelector('tbody');
    var seeMoreChartLink = document.getElementById('seeMoreChart');
    var timeTable = document.getElementById('timeTable');

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

    var addWebsiteModal = document.getElementById('addWebsiteModal');
    var newWebsiteInput = document.getElementById('newWebsiteInput');
    var confirmAddWebsiteButton = document.getElementById('confirmAddWebsiteButton');
    var modalMessage = document.getElementById('modalMessage');
    var closeAddWebsiteModalButton = document.getElementById('closeAddWebsiteModalButton'); 

    var alertModal = document.getElementById('alertModal');
    var alertTitle = document.getElementById('alertTitle');
    var alertMessageContent = document.getElementById('alertMessageContent');
    var confirmAlertButton = document.getElementById('confirmAlertButton'); 
    var closeAlertModalButton = document.getElementById('closeAlertModalButton'); 


    // Ensuring elements are found
    if (!timeChartCanvas) console.error("Error: timeChartCanvas element not found");
    if (!timePeriodToggles.length) console.error("Error: timePeriodToggles elements not found");
    if (!websiteListUl) console.error("Error: websiteListUl element not found");
    if (!customizeListButton) console.error("Error: customizeListButton element not found");
    if (!detailedView) console.error("Error: detailedView element not found");
    if (!backButton) console.error("Error: backButton element not found");
    if (!detailedTimeTableBody) console.error("Error: detailedTimeTableBody element not found");
    if (!seeMoreChartLink) console.error("Error: seeMoreChartLink element not found");
    if (!timeTable) console.error("Error: timeTable element not found");

    if (!detailedViewWebsites) console.log("Error: detailedViewWebsites element no found");
    if (!backButtonWebsites) console.log("Error: backButtonWebsites element no found");
    if (!CustomizeWebsitesTable) console.log("Error: CustomizeWebsitesTable element no found");

    if (!DDetailed) console.log("Error: DDetailed element no found");
    if (!WDetailed) console.log("Error: WDetailed element no found");
    if (!MDetailed) console.log("Error: MDetailed element no found");
    if (!YDetailed) console.log("Error: YDetailed element no found");

    if (!D) console.log("Error: D element no found");
    if (!W) console.log("Error: W element no found");
    if (!M) console.log("Error: M element no found");
    if (!Y) console.log("Error: Y element no found");

    if (!addWebsiteModal) console.log("Error: addWebsiteModal element no found");
    if (!newWebsiteInput) console.log("Error: newWebsiteInput element no found");
    if (!confirmAddWebsiteButton) console.log("Error: confirmAddWebsiteButton element no found");
    if (!modalMessage) console.log("Error: modalMessage element no found");
    if (!closeAddWebsiteModalButton) console.log("Error: closeAddWebsiteModalButton element no found");

    if (!alertModal) console.log("Error: alertModal element no found");
    if (!alertTitle) console.log("Error: alertTitle element no found");
    if (!alertMessageContent) console.log("Error: alertMessageContent element no found");
    if (!confirmAlertButton) console.log("Error: confirmAlertButton element no found");
    if (!closeAlertModalButton) console.log("Error: closeAlertModalButton element no found");

    let timeChart = null;
    let currentTimeData = {};

    // Get computed styles for CSS variables
    const styles = getComputedStyle(document.documentElement);
    const accentMain = styles.getPropertyValue('--accent-main').trim();
    const accentThird = styles.getPropertyValue('--accent-third').trim();
    const accentSecondary = styles.getPropertyValue('--accent-secondary').trim();
    const textDark = styles.getPropertyValue('--text-dark').trim();
    const cardBg = styles.getPropertyValue('--card-bg').trim();


    // populating second section
    function populateWebsiteList(timeData, monitoredWebsites) {
        if (!websiteListUl) {
            console.error("Cannot populate website list: websiteListUl not found.");
            return;
        }

        websiteListUl.innerHTML = "";

        if (monitoredWebsites.length === 0) {
            const listItem = document.createElement('li');
            listItem.textContent = "No websites being monitored.";
            websiteListUl.appendChild(listItem);
            return;
        }

        const websiteTimePairs = monitoredWebsites.map(website => {
            let totalTime = 0;
            if (timeData[website]) {
                for (const date in timeData[website]) { 
                    totalTime += timeData[website][date].time; 
                }
            }
            return { website: website, totalTime: totalTime };
        });

        const topWebsites = websiteTimePairs
            .sort((a, b) => b.totalTime - a.totalTime)
            .slice(0, 3);

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


    // Rendering pie chart
    function renderChart(data, labels) {
        if (!timeChartCanvas) {
            console.error("Cannot render chart: timeChartCanvas not found.");
            return;
        }
        if (timeChart) {
            timeChart.destroy();
        }

        const ctx = timeChartCanvas.getContext('2d');
        timeChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        accentMain,   
                        accentSecondary, 
                        textDark,       
                        styles.getPropertyValue('--text-soft').trim(), 
                        styles.getPropertyValue('--bg-main').trim(),
                        styles.getPropertyValue('--bg-section').trim(), 
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
                                size: 13
                            }
                        }
                    },
                    title: {
                        display: false,
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const totalMs = context.parsed;

                                const totalMinutes = Math.floor(totalMs / (1000 * 60));
                                const hours = Math.floor(totalMinutes / 60);
                                const minutes = totalMinutes % 60;

                                return `${context.label}: ${hours}h ${minutes}m`;
                            }
                        }
                    }
                }
            }
        });
    }
    timeChartCanvas.parentElement.classList.add('chart-section'); 


    // Procesing time data for chart
    function processTimeDataForChart(timeData, period) {
        const now = new Date();
        let filteredData = {};

        for (const [domain, dates] of Object.entries(timeData)) {
            if (domain === "null") continue;

            let cleanedDomain = domain.replace(/^www\./, '');

            for (const [dateStr, { time }] of Object.entries(dates)) {
                const entryDate = new Date(dateStr);
                let include = false;

                D.style.backgroundColor = accentMain;
                W.style.backgroundColor = accentMain;
                M.style.backgroundColor = accentMain;
                Y.style.backgroundColor = accentMain;

                D.style.color = cardBg;
                W.style.color = cardBg;
                M.style.color = cardBg;
                Y.style.color = cardBg;

                switch (period) {
                    case 'D':
                        include = entryDate.toDateString() === now.toDateString();
                        D.style.backgroundColor = accentThird;
                        D.style.color = textDark; 
                        break;
                    case 'W':
                        const day = now.getDay();
                        const startOfWeek = new Date(now);
                        const diff = now.getDate() - day + (day === 0 ? -6 : 1); 
                        startOfWeek.setDate(diff);
                        startOfWeek.setHours(0, 0, 0, 0);
                        include = entryDate >= startOfWeek;
                        W.style.backgroundColor = accentThird;
                        W.style.color = textDark;
                        break;
                    case 'M':
                        include = entryDate.getMonth() === now.getMonth() &&
                        entryDate.getFullYear() === now.getFullYear();
                        M.style.backgroundColor = accentThird;
                        M.style.color = textDark;
                        break;
                    case 'Y':
                        include = entryDate.getFullYear() === now.getFullYear();
                        Y.style.backgroundColor = accentThird;
                        Y.style.color = textDark;
                        break;
                }

                if (include) {
                    if (!filteredData[cleanedDomain]) {
                        filteredData[cleanedDomain] = 0;
                    }
                    filteredData[cleanedDomain] += time;
                }
            }
        }

        const sortedDomains = Object.entries(filteredData).sort(([, a], [, b]) => b - a);
        const topDomains = sortedDomains.slice(0, 5); 
        const labels = topDomains.map(([domain]) => domain);
        const data = topDomains.map(([, time]) => time);

        return { data, labels };
    }

    // Procesing time data for detailed view
    function processTimeDataForDetailedTable(timeData, period) {
        const now = new Date();
        let filteredData = {};

        for (const [domain, dates] of Object.entries(timeData)) {
            if (domain === "null") continue;

            let cleanedDomain = domain.replace(/^www\./, '');

            for (const [dateStr, { time }] of Object.entries(dates)) {
                const entryDate = new Date(dateStr);
                let include = false;

                DDetailed.style.backgroundColor = accentMain;
                WDetailed.style.backgroundColor = accentMain;
                MDetailed.style.backgroundColor = accentMain;
                YDetailed.style.backgroundColor = accentMain;

                DDetailed.style.color = cardBg;
                WDetailed.style.color = cardBg;
                MDetailed.style.color = cardBg;
                YDetailed.style.color = cardBg;

                switch (period) {
                    case 'D':
                        include = entryDate.toDateString() === now.toDateString();
                        DDetailed.style.backgroundColor = accentThird;
                        DDetailed.style.color = textDark;
                        break;
                    case 'W':
                        const day = now.getDay();
                        const startOfWeek = new Date(now);
                        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                        startOfWeek.setDate(diff);
                        startOfWeek.setHours(0, 0, 0, 0);
                        include = entryDate >= startOfWeek;
                        WDetailed.style.backgroundColor = accentThird;
                        WDetailed.style.color = textDark;
                        break;
                    case 'M':
                        include = entryDate.getMonth() === now.getMonth() &&
                                  entryDate.getFullYear() === now.getFullYear();
                        MDetailed.style.backgroundColor = accentThird;
                        MDetailed.style.color = textDark;
                        break;
                    case 'Y':
                        include = entryDate.getFullYear() === now.getFullYear();
                        YDetailed.style.backgroundColor = accentThird;
                        YDetailed.style.color = textDark;
                        break;
                }

                if (include) {
                    if (!filteredData[cleanedDomain]) {
                        filteredData[cleanedDomain] = {};
                    }
                    filteredData[cleanedDomain][dateStr] = { time: time };
                }
            }
        }
        return filteredData;
    }

    
    // Populating detailed view table
    function populateDetailedTable(timeData) {
        if (!detailedTimeTableBody) {
            console.error("Cannot populate detailed table: detailedTimeTableBody not found.");
            return;
        }

        detailedTimeTableBody.innerHTML = "";
        let hasData = false;
        let aggregatedData = {};

        for (const [domain, dateEntries] of Object.entries(timeData)) {
            if (domain === "null") continue;

            let cleanedDomain = domain.replace(/^www\./, '');
            if (!aggregatedData[cleanedDomain]) {
                aggregatedData[cleanedDomain] = 0;
            }

            for (const [date, { time }] of Object.entries(dateEntries)) {
                aggregatedData[cleanedDomain] += time;
            }
        }

        for (const [domain, totalTime] of Object.entries(aggregatedData)) {
            const totalMinutes = Math.floor(totalTime / (1000 * 60));
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            const formattedTime = `${hours}h ${minutes}m`;

            const row = document.createElement('tr');
            row.innerHTML = `<td>${domain}</td><td>${formattedTime}</td>`;
            detailedTimeTableBody.appendChild(row);
            hasData = true;
        }

        if (!hasData) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="2">No data available</td>`;
            detailedTimeTableBody.appendChild(row);
        }
    }

    // Showing detailed view
    function showDetailedView() {
        if (document.querySelector('.chart-section')) document.querySelector('.chart-section').style.display = 'none';
        if (document.querySelector('.websites-section')) document.querySelector('.websites-section').style.display = 'none';
        if (timeTable) timeTable.style.display = 'none';
        if (detailedView) detailedView.style.display = 'block';
        const filteredDetailedData = processTimeDataForDetailedTable(currentTimeData, 'D');
        populateDetailedTable(filteredDetailedData);
    }

    // Showing list of blocked domaines
    function showDetailedViewWebsites(){
        if (document.querySelector('.chart-section')) document.querySelector('.chart-section').style.display = 'none';
        if (document.querySelector('.websites-section')) document.querySelector('.websites-section').style.display = 'none';
        if (timeTable) timeTable.style.display = 'none';
        if (detailedView) detailedView.style.display = 'none';
        if (detailedViewWebsites) detailedViewWebsites.style.display = 'block';

        getMonitoredWebsites((monitoredWebsites) => {
            renderCustomWebsites(monitoredWebsites);
        });
    }

    // Showing main menu
    function showMainView() {
        const chartSection = document.querySelector('.chart-section');
        const websitesSection = document.querySelector('.websites-section');
    
        if (chartSection) chartSection.style.display = 'flex';
        if (websitesSection) websitesSection.style.display = 'flex';
        if (detailedView) detailedView.style.display = 'none';
        if (detailedViewWebsites) detailedViewWebsites.style.display = 'none';
    }

    // rendering list of blocked websites
    function renderCustomWebsites(websites) {
        const tableBody = document.querySelector("#CustomizeWebsitesTable tbody");
        tableBody.innerHTML = "";

        websites.forEach((website) => {
            let cleanedWebsite = website.replace(/^www\./, '');
            const row = document.createElement("tr");

            const siteCell = document.createElement("td");
            siteCell.textContent = cleanedWebsite;

            const actionCell = document.createElement("td");
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.classList.add("delete-button");
            deleteButton.addEventListener("click", () => {
                chrome.runtime.sendMessage({ action: "removeWebsite", domain: website }, (response) => {
                    if (response?.success) {
                        chrome.storage.local.get(["TimeWastingDomains"], (result) => {
                            renderCustomWebsites(result.TimeWastingDomains || []);
                        });
                    } else {
                        showAlertModal("Error", "Błąd przy usuwaniu: " + (response?.message || ""), true);
                    }
                });
            });

            actionCell.appendChild(deleteButton);
            row.appendChild(siteCell);
            row.appendChild(actionCell);
            tableBody.appendChild(row);
        });
    }

    // clicking Add button
    document.getElementById("addWebsiteButton").addEventListener("click", () => {
        showAddWebsiteModal();
    });

    // managing button "Add Website"
    confirmAddWebsiteButton.addEventListener("click", () => {
        const newSite = newWebsiteInput.value.trim();
        if (newSite) {
            chrome.runtime.sendMessage({ action: "addWebsite", domain: newSite }, (response) => {
                if (response?.success) {
                    displayModalMessage("Website added successfully!", false);
                    newWebsiteInput.value = '';
                    chrome.storage.local.get(["TimeWastingDomains"], (result) => {
                        renderCustomWebsites(result.TimeWastingDomains || []);
                    });
                } else {
                    displayModalMessage("Error adding website: " + (response?.message || "Domain might already exist or is invalid."), true);
                }
            });
        } else {
            displayModalMessage("Please enter a domain.", true); 
        }
    });

    // closing pop-up
    closeAddWebsiteModalButton.addEventListener('click', hideAddWebsiteModal);

    // adding website after closing
    window.addEventListener('click', (event) => {
        if (event.target === addWebsiteModal) {
            hideAddWebsiteModal();
        }
    });

    // managing buttons "OK" and "x" in pop-up
    confirmAlertButton.addEventListener('click', hideAlertModal);
    closeAlertModalButton.addEventListener('click', hideAlertModal);

    // closing pop-up after clicking outside it
    window.addEventListener('click', (event) => {
        if (event.target === alertModal) {
            hideAlertModal();
        }
    });

    // models for adding website
    function showAddWebsiteModal() {
        addWebsiteModal.style.display = 'block';
        newWebsiteInput.value = '';
        modalMessage.textContent = '';
        modalMessage.className = 'message';
        newWebsiteInput.focus();
    }

    function hideAddWebsiteModal() {
        addWebsiteModal.style.display = 'none';
    }

    function displayModalMessage(message, isError = false) {
        modalMessage.textContent = message;
        modalMessage.className = isError ? 'message error' : 'message success';
    }

    // managing models for adding websites
    function showAlertModal(title, message, isError = false) {
        alertTitle.textContent = title;
        alertMessageContent.textContent = message;
        alertMessageContent.className = isError ? 'message error' : 'message success';
        alertModal.style.display = 'block';
    }

    function hideAlertModal() {
        alertModal.style.display = 'none';
    }

    // Initial data load and rendering
    chrome.storage.local.get({ timeData: {} }, (result) => {
        currentTimeData = result.timeData;
        console.log("Loaded timeData in popup:", currentTimeData);

        const { data, labels } = processTimeDataForChart(currentTimeData, 'D');
        renderChart(data, labels);

        getMonitoredWebsites((monitoredWebsites) => {
            populateWebsiteList(currentTimeData, monitoredWebsites);
        });
    });

    // event listeners to time period toggles
    if (timePeriodToggles) {
        timePeriodToggles.forEach(button => {
            button.addEventListener('click', (event) => {
                const period = event.target.id;
                console.log("Time period toggled:", period);
        
                const { data, labels } = processTimeDataForChart(currentTimeData, period);
                renderChart(data, labels);
        
                showMainView();
            });
        });
    }

    // event listener for Customize List button
    if (customizeListButton) {
        customizeListButton.addEventListener('click', () => {
            showDetailedViewWebsites();
        });
    }

    // event listener for "see more..." link in chart section
    if (seeMoreChartLink) {
        seeMoreChartLink.addEventListener('click', (event) => {
            event.preventDefault();
            showDetailedView();
        });
    }

    // event listener for the back button in detailed view
    if (backButton) {
        backButton.addEventListener('click', (event) => {
            event.preventDefault();
            showMainView();
        });
    }

    // event listener for back button
    if(backButtonWebsites){
        backButtonWebsites.addEventListener('click', (event)=> {
            event.preventDefault();
            showMainView();
        });
    }

    // event listeners to detailed view time period toggles
    const detailedTimePeriodToggles = document.querySelectorAll('.time-toggles-detailed button');
    if (detailedTimePeriodToggles) {
        detailedTimePeriodToggles.forEach(button => {
            button.addEventListener('click', (event) => {
                const period = event.target.id.replace('-detailed', ''); 
                console.log("Detailed view time period toggled:", period);

                const filteredDetailedData = processTimeDataForDetailedTable(currentTimeData, period);
                populateDetailedTable(filteredDetailedData);
            });
        });
    }

    // updating list of blocked websites
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && changes.TimeWastingDomains) {
            console.log("TimeWastingDomains changed in storage. Updating views.");
            const newMonitoredWebsites = changes.TimeWastingDomains.newValue || [];

            populateWebsiteList(currentTimeData, newMonitoredWebsites);

            if (detailedViewWebsites && detailedViewWebsites.style.display !== 'none') {
                renderCustomWebsites(newMonitoredWebsites);
            }
        }
    });
});