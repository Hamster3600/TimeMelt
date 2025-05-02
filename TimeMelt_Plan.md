# TimeMelt Project Plan: Implementing Pie Chart and Website List

This plan outlines the steps to enhance the TimeMelt Chrome extension popup to include a pie chart visualizing time spent on websites and a customizable list of time-wasting websites, based on the provided screenshot description.

## Phase 1: Frontend Implementation (Pie Chart and Website List)

This phase focuses on modifying the existing `popup.html`, `style.css`, and `popup.js` files to achieve the desired visual layout and basic functionality.

### 1. Update `popup.html`

Modify `popup.html` to include the necessary HTML structure for the new sections:

*   Add a `div` element to contain the pie chart and its related controls.
*   Inside this `div`, add elements for the time period toggle buttons (D | W | M | Y). These can be simple buttons or links.
*   Include a `canvas` element where the pie chart will be rendered by a JavaScript charting library.
*   Add a "see more..." link below the chart section, which could potentially link to a more detailed data view in the future.
*   Add another `div` element for the "List of time-wasting websites" section.
*   Inside this `div`, add a heading (e.g., `<h2>`).
*   Include a list element (e.g., `<ul>` or a series of `<div>`s) to display the time-wasting websites.
*   Add a "Customize list" button.
*   Include another "see more..." link below the website list section.
*   Retain the existing table structure for displaying detailed time data, perhaps initially hidden or displayed based on user interaction (e.g., clicking a "see more..." link).

### 2. Update `style.css`

Add CSS rules to `style.css` to style the new elements and sections according to the minimalist and calming color scheme described:

*   Define styles for the main containers of the pie chart and website list sections, including layout properties (e.g., `display: flex`, `flex-direction`, `gap`) to arrange elements.
*   Style the time period toggle buttons, including their appearance, padding, margins, and hover effects.
*   Add styles for the canvas element to control the size and appearance of the pie chart.
*   Style the heading for the "List of time-wasting websites" section.
*   Style the list of websites, including the appearance of individual list items.
*   Style the "Customize list" button and the "see more..." links.
*   Ensure the overall styling is consistent with the existing theme and fits within the popup's dimensions.

### 3. Create/Update `popup.js`

Develop or modify `popup.js` to handle the data fetching, processing, and rendering:

*   Write JavaScript code to retrieve the time tracking data stored in `chrome.storage.local`.
*   Integrate a charting library (e.g., Chart.js, which can be included via a CDN link in `popup.html` or by adding the library files to the project) to create and render the pie chart.
*   Implement functions to process the raw time data, aggregating it by domain and calculating percentages for the pie chart.
*   Add logic to filter the data based on the selected time period (Day, Week, Month, Year).
*   Add event listeners to the time period toggle buttons to trigger data processing and chart updates when a different period is selected.
*   Write code to dynamically populate the "List of time-wasting websites" section with data (initially, this could be a predefined list or fetched from storage).
*   Add basic event handlers for the "Customize list" button and the "see more..." links. The functionality for these can be expanded in future phases.

## Phase 2: Data Processing and Advanced Features (Future Enhancements)

This phase outlines potential future work to implement the more advanced features mentioned in your project goals.

*   **Refine Data Storage:** Evaluate the suitability of `chrome.storage.local` for long-term storage and advanced querying. Consider alternatives if necessary.
*   **Implement Advanced Analysis:** Develop more sophisticated data processing and analysis capabilities to generate detailed statistics, trends, and reports on user habits.
*   **Integrate with Mobile Apps:** Design and implement a system for tracking time on mobile devices and synchronizing this data with the browser extension. This would likely involve developing a mobile application and a backend service.
*   **Develop AI Suggestions:** Research and implement an AI model to analyze user behavior, identify patterns, and provide personalized suggestions, motivations, or gamification elements to encourage healthier digital habits. This could potentially involve setting up an MCP server to handle AI processing.

## Conceptual Frontend Structure

```mermaid
graph TD
    A[popup.html] --> B(Header: TimeMelt)
    A --> C(Pie Chart Section)
    C --> D(Time Period Toggles: D|W|M|Y)
    C --> E(Pie Chart Canvas)
    C --> F("see more...")
    A --> G(Time-Wasting Websites Section)
    G --> H(List of Websites)
    G --> I(Customize List Button)
    G --> J("see more...")
    A --> K(popup.js)
    A --> L(style.css)
    K --> M(Data Fetching from chrome.storage)
    K --> N(Data Processing for Chart)
    K --> O(Chart Rendering with Library)
    K --> P(Event Listeners for Toggles)
    K --> Q(Populate Website List)
    K --> R(Customize List Logic)
    K --> S("see more..." Link Handlers)
    L --> T(Styling for all elements)