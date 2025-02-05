mapboxgl.accessToken =
  "pk.eyJ1Ijoid2FsaTUyMSIsImEiOiJjbTZnemdqdHMwNjN6MnJyN2cyZGhtZHZuIn0.K2Pjz_pis0wgQBSCPSdM0g";
const map = new mapboxgl.Map({
  container: "map", // container ID
  style: "mapbox://styles/wali521/cm556y5qq00fl01sahk0c1im7",
  center: [-119.4179, 36.7783], // starting position [lng, lat]
  zoom: 5, // starting zoom
});

// Define hotspot layers
const hotspotLayers = [
  {
    id: "hotspots-arithmetic-mean-1000M",
    file: "Hotspots_Arithmetic_Mean_1000M.geojson",
    property: "GiZScore Fixed 1000", // Property to use for styling
    giBinProperty: "Gi_Bin Fixed 1000", // Property to use for color classification
  },
  {
    id: "hotspots-arithmetic-mean-2500M",
    file: "Hotspots_Arithmetic_Mean_2500M.geojson",
    property: "GiZScore Fixed 2500", // Property to use for styling
    giBinProperty: "Gi_Bin Fixed 2500", // Property to use for color classification
  },
  {
    id: "hotspots-arithmetic-mean-5000M",
    file: "Hotspots_Arithmetic_Mean_5000M.geojson",
    property: "GiZScore Fixed 5000", // Property to use for styling
    giBinProperty: "Gi_Bin Fixed 5000", // Property to use for color classification
  },
  {
    id: "hotspots-total-emissions-1000M",
    file: "Hotspots_Total_Emissions_1000M.geojson",
    property: "GiZScore Fixed 1000", // Property to use for styling
    giBinProperty: "Gi_Bin Fixed 1000", // Property to use for color classification
  },
  {
    id: "hotspots-total-emissions-2500M",
    file: "Hotspots_Total_Emissions_2500M.geojson",
    property: "GiZScore Fixed 2500", // Property to use for styling
    giBinProperty: "Gi_Bin Fixed 2500", // Property to use for color classification
  },
  {
    id: "hotspots-total-emissions-5000M",
    file: "Hotspots_Total_Emissions_5000M.geojson",
    property: "GiZScore Fixed 5000", // Property to use for styling
    giBinProperty: "Gi_Bin Fixed 5000", // Property to use for color classification
  },
];

map.on("load", function () {
  // Add the GeoJSON source
  map.addSource("counties", {
    type: "geojson",
    data: "counties/counties.geojson", // Replace with your actual GeoJSON file path
    promoteId: "GEOID", // Unique ID for each feature
  });

  // Layer for county boundaries
  map.addLayer({
    id: "county-boundaries",
    type: "line",
    source: "counties",
    filter: ["==", ["get", "STATEFP"], "06"],
    paint: {
      "line-color": "#e6550d", // Blue color for county boundaries
      "line-width": 3,
    },
  });

  // Fill layer for counties
  map.addLayer({
    id: "county-fill",
    type: "fill",
    source: "counties",
    filter: ["==", ["get", "STATEFP"], "06"], // Assuming "TYPE" differentiates states and counties
    paint: {
      "fill-color": "#f5f5f5", // Green fill color for counties
      "fill-opacity": 0.1,
    },
  });

  // Add hotspot sources and layers
  hotspotLayers.forEach((layer, index) => {
    const url = `wali/${layer.file}`;
    // Check if the GeoJSON file is fetched correctly
    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log(`GeoJSON file ${layer.file} fetched successfully.`);
        map.addSource(layer.id, {
          type: "geojson",
          data: url,
        });

        // Add the hotspot layer with dynamic styling
        map.addLayer({
          id: layer.id,
          type: "circle", // Use circles for points
          source: layer.id,
          paint: {
            // Dynamic circle radius based on the GiZScore Fixed value and zoom level
            "circle-radius": [
              "interpolate",
              ["exponential", 1.5], // Smooth scaling
              ["zoom"],
              5, // Zoom level 5
              [
                "interpolate",
                ["linear"],
                ["get", layer.property], // Use the specified property
                -5, // Minimum value of GiZScore
                3, // Minimum circle radius
                5, // Maximum value of GiZScore
                10, // Maximum circle radius
              ],
              15, // Zoom level 15
              [
                "interpolate",
                ["linear"],
                ["get", layer.property], // Use the specified property
                -5, // Minimum value of GiZScore
                10, // Minimum circle radius
                5, // Maximum value of GiZScore
                30, // Maximum circle radius
              ],
            ],
            // Dynamic circle color based on Gi_Bin value
            "circle-color": [
              "match",
              ["get", layer.giBinProperty], // Use the Gi_Bin property for color classification
              -3,
              "#ff0000", // Red for Gi_Bin = -3
              -2,
              "#ff7f00", // Orange for Gi_Bin = -2
              -1,
              "#ffff00", // Yellow for Gi_Bin = -1
              0,
              "#00ff00", // Green for Gi_Bin = 0
              1,
              "#0000ff", // Blue for Gi_Bin = 1
              2,
              "#4b0082", // Indigo for Gi_Bin = 2
              3,
              "#8b00ff", // Violet for Gi_Bin = 3
              "#cccccc", // Default color for other values
            ],
            "circle-opacity": 0.8,
            "circle-stroke-width": 1,
            "circle-stroke-color": "#000000",
          },
        });

        // Add event listener to toggle layer visibility
        document
          .getElementById(`layer${index + 1}`)
          .addEventListener("change", (e) => {
            const visibility = e.target.checked ? "visible" : "none";
            map.setLayoutProperty(layer.id, "visibility", visibility);
          });
      })
      .catch((error) => {
        console.error(`Error fetching GeoJSON file ${layer.file}:`, error);
      });
  });
});

// Log any map-related errors
map.on("error", (e) => {
  console.error("Map error:", e.error);
});

document.getElementById("fly").addEventListener("click", () => {
  // Fly to Los Angeles coordinates
  map.flyTo({
    center: [-118.2437, 34.0522], // Longitude, Latitude of Los Angeles
    zoom: 8, // Adjust the zoom level for a better view
    essential: true, // Ensures smooth animation
  });
});

// Get references to the buttons and modal
const chartButtons = document.getElementById("chart-buttons");
const chartModal = document.getElementById("chart-modal");
const closeModal = document.querySelector(".close");
const chartContainer = document.getElementById("chart-container");

// Function to open the modal and display a chart
function openModal(chartUrl) {
  // Load the chart (e.g., an image or an iframe)
  chartContainer.innerHTML = `<img src="${chartUrl}" alt="Chart" style="width:100%;">`;
  chartModal.style.display = "block";
}

// Add event listeners to the buttons
document.getElementById("chart1-btn").addEventListener("click", () => {
  openModal("Charts/Spatial_Correlation_1000M.png");
});

document.getElementById("chart2-btn").addEventListener("click", () => {
  openModal("Charts/Spatial_Correlation_2500M.png");
});

document.getElementById("chart3-btn").addEventListener("click", () => {
  openModal("Charts/Spatial_Correlation_5000M.png");
});

// Close the modal when the close button is clicked
closeModal.addEventListener("click", () => {
  chartModal.style.display = "none";
});

// Close the modal when clicking outside the modal content
window.addEventListener("click", (event) => {
  if (event.target === chartModal) {
    chartModal.style.display = "none";
  }
});
