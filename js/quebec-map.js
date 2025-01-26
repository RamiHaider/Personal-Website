// Constants for mineral types and their image overlays
const MINERALS = {
    AU: { 
        name: 'Gold', 
        symbol: 'AU',
        imagePath: '../assets/mineral_images/AU_heatmap.png',
        bounds: [
            [44.9930, -79.5720],  // Southwest corner
            [62.4910, -56.9430]   // Northeast corner
        ]
    },
    AG: { 
        name: 'Silver', 
        symbol: 'AG',
        imagePath: '../assets/mineral_images/AG_heatmap.png',
        bounds: [
            [44.9930, -79.5720],
            [62.4910, -56.9430]
        ]
    },
    CU: { 
        name: 'Copper', 
        symbol: 'CU',
        imagePath: '../assets/mineral_images/CU_heatmap.png',
        bounds: [
            [44.9930, -79.5720],
            [62.4910, -56.9430]
        ]
    },
    CO: { 
        name: 'Cobalt', 
        symbol: 'CO',
        imagePath: '../assets/mineral_images/CO_heatmap.png',
        bounds: [
            [44.9930, -79.5720],
            [62.4910, -56.9430]
        ]
    },
    NI: { 
        name: 'Nickel', 
        symbol: 'NI',
        imagePath: '../assets/mineral_images/NI_heatmap.png',
        bounds: [
            [44.9930, -79.5720],
            [62.4910, -56.9430]
        ]
    }
};

class QuebecMap {
    constructor(mapId) {
        this.mapId = mapId;
        this.currentMineralLayer = null;
        this.selectionBox = null;
        this.isSelectionMode = false;
        this.searchCount = 0;
        this.lastSearchTime = 0;
        
        this.samplePoints = L.layerGroup();
        
        // Initialize map with bounds restriction
        this.map = L.map(this.mapId, {
            maxBounds: [
                [43.0, -82.0],  // Southwest
                [64.0, -54.0]   // Northeast
            ],
            maxBoundsViscosity: 1.0,
            minZoom: 4,
            maxZoom: 12
        }).setView([53.7, -68.2], 5);
        
        // Add base layers
        this.baseLayers = {
            satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri'
            }),
            streets: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }),
            terrain: L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.png', {
                attribution: 'Map tiles by Stamen Design'
            })
        };
        
        // Add default satellite layer
        this.baseLayers.satellite.addTo(this.map);
        
        // Add scale control
        L.control.scale().addTo(this.map);

        // Add sample points control
        this.addSamplePointsControl();
        
        // Load the rock samples data
        this.loadData();
        
        // Bind event listeners
        this.bindEvents();

        // Add results container below the map
        this.createResultsContainer();
    }

    async loadData() {
        try {
            const response = await fetch('../assets/rock_samples.json');
            const points = await response.json();
            
            points.forEach(point => {
                const marker = L.circleMarker([point.lat, point.lng], {
                    radius: 2,
                    color: '#444',
                    fillColor: '#666',
                    fillOpacity: 0.7,
                    weight: 1
                });
                
                // Attach the mineral data to the marker
                marker.data = point;
                marker.addTo(this.samplePoints);
            });
            
            console.log(`Loaded ${points.length} sample points`);
        } catch (error) {
            console.error('Error loading sample points:', error);
        }
    }

    bindEvents() {
        // Base layer changes
        document.getElementById('baseLayerSelect')?.addEventListener('change', (e) => {
            Object.values(this.baseLayers).forEach(layer => this.map.removeLayer(layer));
            this.baseLayers[e.target.value].addTo(this.map);
        });

        // Mineral layer changes
        document.getElementById('mineralLayerSelect')?.addEventListener('change', (e) => {
            this.showMineralLayer(e.target.value);
        });

        // Opacity control
        document.getElementById('opacityControl')?.addEventListener('input', (e) => {
            this.setMineralLayerOpacity(e.target.value);
        });

        // Add selection mode toggle button handler
        document.getElementById('selectionModeToggle')?.addEventListener('click', () => {
            this.isSelectionMode = !this.isSelectionMode;
            this.map.getContainer().style.cursor = this.isSelectionMode ? 'crosshair' : 'grab';
            const button = document.getElementById('selectionModeToggle');
            button.textContent = this.isSelectionMode ? 'Disable Selection' : 'Enable 5km × 5km Selection';
            button.classList.toggle('active', this.isSelectionMode);
        });

        // Map click handler
        this.map.on('click', this.handleMapClick.bind(this));
    }

    createResultsContainer() {
        const container = document.createElement('div');
        container.id = 'selection-results';
        container.className = 'selection-results';
        container.style.display = 'none';
        container.innerHTML = `
            <h3>Selected Area Statistics</h3>
            <table class="results-table">
                <thead>
                    <tr>
                        <th>Mineral</th>
                        <th>Anomalous Samples</th>
                        <th>Average Probability</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        `;
        document.getElementById('quebec-map').parentNode.appendChild(container);
    }

    // Convert km to degrees (approximate)
    kmToDegrees(km) {
        return km / 111.32; // at the equator, more precise calculation can be added if needed
    }

    enableSelectionMode() {
        this.isSelectionMode = true;
        this.map.getContainer().style.cursor = 'crosshair';
    }

    handleMapClick(e) {
        if (!this.isSelectionMode) return;

        // Show loading overlay
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = '<div class="spinner"></div><p>Analyzing selection...</p>';
        document.getElementById('quebec-map').appendChild(loadingOverlay);

        // Calculate 5km × 5km box coordinates
        const kmSize = 5;
        const degreeSize = this.kmToDegrees(kmSize);
        
        const bounds = [
            [e.latlng.lat - degreeSize/2, e.latlng.lng - degreeSize/2], // SW
            [e.latlng.lat + degreeSize/2, e.latlng.lng + degreeSize/2]  // NE
        ];

        // Remove existing selection box
        if (this.selectionBox) {
            this.map.removeLayer(this.selectionBox);
        }

        // Draw new selection box
        this.selectionBox = L.rectangle(bounds, {
            color: '#ff7800',
            weight: 1,
            fillOpacity: 0.2
        }).addTo(this.map);

        // Calculate statistics for points within the box
        this.calculateStatistics(bounds);
    }

    calculateStatistics(bounds) {
        const [[minLat, minLng], [maxLat, maxLng]] = bounds;
        
        // Filter points within bounds
        const pointsInBounds = this.samplePoints.getLayers()
            .filter(layer => {
                const latLng = layer.getLatLng();
                return latLng.lat >= minLat && 
                       latLng.lat <= maxLat && 
                       latLng.lng >= minLng && 
                       latLng.lng <= maxLng;
            });

        // Calculate statistics
        const stats = {
            AU: { anomalous: 0, totalProb: 0 },
            AG: { anomalous: 0, totalProb: 0 },
            CU: { anomalous: 0, totalProb: 0 },
            CO: { anomalous: 0, totalProb: 0 },
            NI: { anomalous: 0, totalProb: 0 }
        };

        pointsInBounds.forEach(point => {
            const data = point.data.minerals;
            Object.keys(stats).forEach(mineral => {
                if (data[mineral].pred === 1) stats[mineral].anomalous++;
                stats[mineral].totalProb += data[mineral].prob;
            });
        });

        // Display results
        this.displayResults(stats, pointsInBounds.length);

        // Remove loading overlay
        document.querySelector('.loading-overlay').remove();
    }

    displayResults(stats, totalPoints) {
        const resultsContainer = document.getElementById('selection-results');
        const tbody = resultsContainer.querySelector('tbody');
        tbody.innerHTML = '';

        Object.entries(stats).forEach(([mineral, data]) => {
            const avgProb = totalPoints > 0 ? (data.totalProb / totalPoints) : 0;
            tbody.innerHTML += `
                <tr>
                    <td>${mineral}</td>
                    <td>${data.anomalous} / ${totalPoints}</td>
                    <td>${(avgProb * 100).toFixed(1)}%</td>
                </tr>
            `;
        });

        resultsContainer.style.display = 'block';
    }

    showMineralLayer(mineralType) {
        // Remove existing layer if any
        if (this.currentMineralLayer) {
            this.map.removeLayer(this.currentMineralLayer);
            this.currentMineralLayer = null;
        }

        // If 'none' selected, just return
        if (mineralType === 'none') return;

        // Create new image overlay
        const mineral = MINERALS[mineralType];
        if (!mineral) return;

        this.currentMineralLayer = L.imageOverlay(
            mineral.imagePath,
            mineral.bounds,
            {
                opacity: 0.7,
                interactive: false
            }
        ).addTo(this.map);
    }

    setMineralLayerOpacity(opacity) {
        if (this.currentMineralLayer) {
            this.currentMineralLayer.setOpacity(opacity / 100);
        }
    }

    toggleSelectionMode(enable) {
        this.isSelectionMode = enable;
        this.map.getContainer().style.cursor = enable ? 'crosshair' : 'grab';
        
        if (!enable && this.selectionBox) {
            this.map.removeLayer(this.selectionBox);
            this.selectionBox = null;
        }
    }

    addSamplePointsControl() {
        const control = L.control({position: 'topright'});
        
        control.onAdd = () => {
            const div = L.DomUtil.create('div', 'leaflet-control leaflet-bar sample-control');
            div.innerHTML = `
                <div class="sample-toggle">
                    <label>
                        <input type="checkbox" id="showSamples"> Show Rock Samples
                    </label>
                </div>
            `;
            return div;
        };
        
        control.addTo(this.map);

        document.getElementById('showSamples').addEventListener('change', (e) => {
            if (e.target.checked) {
                this.samplePoints.addTo(this.map);
            } else {
                this.map.removeLayer(this.samplePoints);
            }
        });
    }
}

// Initialize map when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.quebecMap = new QuebecMap('quebec-map');
});