document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get({ timeData: {} }, (result) => {
        const timeData = result.timeData;
        console.log("Loaded timeData in popup:", timeData);

        const tableBody = document.querySelector('#timeTable tbody');
        if (!tableBody) {
            console.error("Table body element not found in popup.html");
            return;
        }

        tableBody.innerHTML = ""; // Wyczyść tabelę przed dodaniem danych

        let hasData = false; // Flaga, aby sprawdzić, czy są dane do wyświetlenia
        for (const [domain, time] of Object.entries(timeData)) {
            if (domain && domain !== "null") { // Ignoruj domeny "null"
                console.log(`Adding row for domain: ${domain}, time: ${time}`);
                const row = document.createElement('tr');
                row.innerHTML = `<td>${domain}</td><td>${(time / 1000).toFixed(2)}</td>`;
                tableBody.appendChild(row);
                hasData = true;
            }
        }

        if (!hasData) {
            console.warn("No valid data to display in the table");
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="2">No data available</td>`;
            tableBody.appendChild(row);
        }
    });
});