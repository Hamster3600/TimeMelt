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
        for (const [domain, data] of Object.entries(timeData)) {
            if (data && domain !== "null") { // Ignoruj domeny "null"
                const time = data.time || 0; // Pobierz czas
                const date = data.date || "N/A"; // Pobierz datę
                console.log(`Adding row for domain: ${domain}, time: ${time}, date: ${date}`);
                const row = document.createElement('tr');
                row.innerHTML = `<td>${domain}</td><td>${(time / 1000).toFixed(2)}</td><td>${date}</td>`;
                tableBody.appendChild(row);
                hasData = true;
            }
        }

        if (!hasData) {
            console.warn("No valid data to display in the table");
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="3">No data available</td>`;
            tableBody.appendChild(row);
        }
    });
});