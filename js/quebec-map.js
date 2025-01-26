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

        // Initialize Supabase client
        this.supabase = supabase.createClient(
            'https://cnbpmepdmtpgrbllufcb.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuYnBtZXBkbXRwZ3JibGx1ZmNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc5MjM4MjEsImV4cCI6MjA1MzQ5OTgyMX0.UqDleR4ucntrg9x6FNgJigKZjKiATFYiMiLiZZj3B2w'
        );
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
        
        // Add thresholds info
        const thresholds = {
            AU: '100 ppb',
            AG: '1 ppm',
            CU: '100 ppm',
            CO: '20 ppm',
            NI: '100 ppm'
        };
        
        container.innerHTML = `
            <div class="thresholds-info" style="margin-bottom: 15px; font-size: 0.9em;">
                <h4>Anomaly Thresholds:</h4>
                ${Object.entries(thresholds).map(([mineral, threshold]) => 
                    `<span style="margin-right: 15px;">${mineral}: ${threshold}</span>`
                ).join('')}
            </div>
            <h3>Selected Area Statistics</h3>
            <table class="results-table">
                <thead>
                    <tr>
                        <th>Mineral</th>
                        <th>Anomalous Probability</th>
                        <th>Sample Count</th>
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

    async calculateStatistics(bounds) {
        const [[minLat, minLng], [maxLat, maxLng]] = bounds;
        
        try {
            // Fetch points within bounds from Supabase
            const { data: points, error } = await this.supabase
                .rpc('get_points_in_bounds', {
                    min_lat: minLat,
                    min_lng: minLng,
                    max_lat: maxLat,
                    max_lng: maxLng
                });

            if (error) throw error;

            // Calculate statistics
            const stats = {
                AU: { anomalous: 0, totalProb: 0 },
                AG: { anomalous: 0, totalProb: 0 },
                CU: { anomalous: 0, totalProb: 0 },
                CO: { anomalous: 0, totalProb: 0 },
                NI: { anomalous: 0, totalProb: 0 }
            };

            points.forEach(point => {
                Object.keys(stats).forEach(mineral => {
                    const mineral_lower = mineral.toLowerCase();
                    if (point[`${mineral_lower}_pred`] === 1) {
                        stats[mineral].anomalous++;
                    }
                    stats[mineral].totalProb += point[`${mineral_lower}_prob`];
                });
            });

            // Display results
            this.displayResults(stats, points.length);
        } catch (error) {
            console.error('Error fetching points:', error);
        } finally {
            document.querySelector('.loading-overlay').remove();
        }
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
                    <td>${avgProb.toFixed(4)}</td>
                    <td>${data.anomalous} / ${totalPoints}</td>
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
        const MIN_ZOOM = 8;
        
        control.onAdd = () => {
            const div = L.DomUtil.create('div', 'leaflet-control leaflet-bar sample-control');
            div.innerHTML = `
                <div class="sample-toggle">
                    <label>
                        <input type="checkbox" id="showSamples" disabled> 
                        Show Rock Samples
                    </label>
                    <div class="zoom-warning" style="display: block; color: #666; font-size: 0.8em;">
                        Zoom in further to view samples
                    </div>
                </div>
            `;
            return div;
        };
        
        control.addTo(this.map);

        // Add zoom handler
        this.map.on('zoomend', () => {
            const checkbox = document.getElementById('showSamples');
            const warning = document.querySelector('.zoom-warning');
            const currentZoom = this.map.getZoom();
            
            if (currentZoom < MIN_ZOOM) {
                checkbox.disabled = true;
                checkbox.checked = false;
                warning.style.display = 'block';
                this.map.removeLayer(this.samplePoints);
            } else {
                checkbox.disabled = false;
                warning.style.display = 'none';
            }
        });

        // Handle sample toggle
        document.getElementById('showSamples').addEventListener('change', (e) => {
            if (e.target.checked) {
                this.loadVisibleSamples();
                this.samplePoints.addTo(this.map);
            } else {
                this.map.removeLayer(this.samplePoints);
            }
        });

        // Update samples on map move when enabled
        this.map.on('moveend', () => {
            const checkbox = document.getElementById('showSamples');
            if (checkbox.checked && !checkbox.disabled) {
                this.loadVisibleSamples();
            }
        });
    }

    async loadVisibleSamples() {
        const bounds = this.map.getBounds();
        const zoom = this.map.getZoom();
        
        if (zoom < 8) {
            alert("Please zoom in further to view rock samples");
            return;
        }
        
        try {
            const loadingOverlay = document.createElement('div');
            loadingOverlay.className = 'loading-overlay';
            loadingOverlay.style.display = 'flex';
            loadingOverlay.innerHTML = '<div class="spinner"></div><p>Loading rock samples...</p>';
            document.getElementById('quebec-map').appendChild(loadingOverlay);
            
            const { data: points, error } = await this.supabase
                .rpc('get_points_in_bounds', {
                    min_lat: bounds.getSouth(),
                    min_lng: bounds.getWest(),
                    max_lat: bounds.getNorth(),
                    max_lng: bounds.getEast()
                });

            if (error) throw error;

            console.log("First point from database:", points[0]); // Debug line

            // Clear existing points
            this.samplePoints.clearLayers();

            // Add new points with proper coordinate parsing
            points.forEach(point => {
                // Parse the location string to get coordinates
                const locationStr = point.location;
                console.log("Location string:", locationStr); // Debug line
                
                // Extract coordinates using regex
                const match = locationStr.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
                if (match) {
                    const lng = parseFloat(match[1]);
                    const lat = parseFloat(match[2]);
                    
                    const marker = L.circleMarker([lat, lng], {
                        radius: 2,
                        color: '#444',
                        fillColor: '#666',
                        fillOpacity: 0.7,
                        weight: 1
                    });
                    marker.addTo(this.samplePoints);
                }
            });

            this.samplePoints.addTo(this.map);
        } catch (error) {
            console.error('Error loading points:', error);
            alert('Error loading sample points');
        } finally {
            const overlay = document.querySelector('.loading-overlay');
            if (overlay) overlay.remove();
        }
    }
}

function showLoadingOverlay(message) {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.style.display = 'flex';
    overlay.innerHTML = `
        <div class="spinner"></div>
        <p>${message}</p>
    `;
    document.getElementById('quebec-map').appendChild(overlay);
}

function hideLoadingOverlay() {
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) overlay.remove();
}

// Initialize map when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.quebecMap = new QuebecMap('quebec-map');
});