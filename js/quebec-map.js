// Constants for mineral types and their image overlays
const MINERALS = {
    AU: { 
        name: 'Gold', 
        symbol: 'AU',
        imagePath: '../assets/newer-mineral-images/AU_heatmap.png',
        bounds: [
            [44.9930, -79.5720],  // Southwest corner
            [62.4910, -56.9430]   // Northeast corner
        ]
    },
    AG: { 
        name: 'Silver', 
        symbol: 'AG',
        imagePath: '../assets/newer-mineral-images/AG_heatmap.png',
        bounds: [
            [44.9930, -79.5720],
            [62.4910, -56.9430]
        ]
    },
    CU: { 
        name: 'Copper', 
        symbol: 'CU',
        imagePath: '../assets/newer-mineral-images/CU_heatmap.png',
        bounds: [
            [44.9930, -79.5720],
            [62.4910, -56.9430]
        ]
    },
    CO: { 
        name: 'Cobalt', 
        symbol: 'CO',
        imagePath: '../assets/newer-mineral-images/CO_heatmap.png',
        bounds: [
            [44.9930, -79.5720],
            [62.4910, -56.9430]
        ]
    },
    NI: { 
        name: 'Nickel', 
        symbol: 'NI',
        imagePath: '../assets/newer-mineral-images/NI_heatmap.png',
        bounds: [
            [44.9930, -79.5720],
            [62.4910, -56.9430]
        ]
    }
};

class QuebecMap {
    constructor(mapId) {
        // Initialize Supabase client first
        this.supabase = supabase.createClient(
            'https://cnbpmepdmtpgrbllufcb.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuYnBtZXBkbXRwZ3JibGx1ZmNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc5MjM4MjEsImV4cCI6MjA1MzQ5OTgyMX0.UqDleR4ucntrg9x6FNgJigKZjKiATFYiMiLiZZj3B2w'
        );

        // Initialize map
        this.map = L.map(mapId, {
            center: [52, -68],
            zoom: 5,
            minZoom: 3,
            maxZoom: 12
        });

        // Initialize layers group for sample points
        this.samplePoints = L.layerGroup();
        
        // Initialize base layers
        this.baseLayers = {
            'OpenStreetMap': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }),
            'Satellite': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: '© Esri'
            })
        };

        // Add default base layer
        this.baseLayers['OpenStreetMap'].addTo(this.map);

        // Add scale control
        L.control.scale({
            metric: true,
            imperial: false
        }).addTo(this.map);

        // Add layer control
        L.control.layers(this.baseLayers, null, {position: 'topright'}).addTo(this.map);

        // Add selection control (prediction functionality)
        this.addSelectionControl();
        this.addImageViewerControl();

        // Add this at the end of constructor
        this.bindEvents();

        // Add after map initialization
        this.isSelectionMode = false;
        this.selectionBox = null;
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
            this.toggleSelectionMode();
        });

        // Map click handler
        this.map.on('click', this.handleMapClick.bind(this));

        // Add this to your existing bindEvents method
        document.getElementById('heatmapViewer').addEventListener('change', (e) => {
            this.showMineralHeatmap(e.target.value);
            e.target.value = ''; // Reset selection
        });
    }

    createResultsContainer() {
        const container = document.createElement('div');
        container.id = 'selection-results';
        container.className = 'selection-results';
        container.style.display = 'none';
        
        const thresholds = {
            AU: '100 ppb',
            AG: '1 ppm',
            CU: '100 ppm',
            CO: '20 ppm',
            NI: '100 ppm'
        };
        
        container.innerHTML = `
            <div class="results-wrapper">
                <div class="threshold-card">
                    <h4>Anomaly Thresholds</h4>
                    <div class="threshold-grid">
                        ${Object.entries(thresholds).map(([mineral, threshold]) => 
                            `<div class="threshold-item">
                                <span class="mineral">${mineral}</span>
                                <span class="value">${threshold}</span>
                             </div>`
                        ).join('')}
                    </div>
                </div>

                <!-- New Model Agreement Section -->
                <div class="model-agreement-card">
                    <h4>Model Confidence</h4>
                    <div class="confidence-grid">
                        <div class="confidence-score">
                            <span class="score-value">--</span>
                            <span class="score-label">Confidence Score</span>
                        </div>
                        <div class="agreement-stats">
                            <div class="stat-item">
                                <span class="stat-label">Strong Signals</span>
                                <span class="stat-value" id="strong-signals">--</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Potential Signals</span>
                                <span class="stat-value" id="potential-signals">--</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="stats-card">
                    <h4>Selected Area Statistics</h4>
                    <div class="total-samples"></div>
                    <table class="results-table">
                        <thead>
                            <tr>
                                <th>Mineral</th>
                                <th>Anomalous Samples</th>
                                <th>Probability of Threshold</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>
            </div>
        `;
        
        return container;
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
            // Show loading overlay
            const loadingOverlay = document.createElement('div');
            loadingOverlay.className = 'loading-overlay';
            loadingOverlay.innerHTML = '<div class="spinner"></div><p>Analyzing region...</p>';
            document.getElementById('quebec-map').appendChild(loadingOverlay);

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
                AU: { anomalous: 0, totalProb: 0, strongSignals: 0, veryStrongSignals: 0, probValues: [] },
                AG: { anomalous: 0, totalProb: 0, strongSignals: 0, veryStrongSignals: 0, probValues: [] },
                CU: { anomalous: 0, totalProb: 0, strongSignals: 0, veryStrongSignals: 0, probValues: [] },
                CO: { anomalous: 0, totalProb: 0, strongSignals: 0, veryStrongSignals: 0, probValues: [] },
                NI: { anomalous: 0, totalProb: 0, strongSignals: 0, veryStrongSignals: 0, probValues: [] }
            };

            points.forEach(point => {
                Object.keys(stats).forEach(mineral => {
                    const mineral_lower = mineral.toLowerCase();
                    const pred = point[`${mineral_lower}_pred`];
                    const prob = point[`${mineral_lower}_prob`] || 0;
                    
                    stats[mineral].probValues.push(prob);
                    
                    if (pred === 2) {
                        stats[mineral].veryStrongSignals++;
                        stats[mineral].anomalous++;
                        stats[mineral].totalProb += prob;
                    } else if (pred === 1) {
                        stats[mineral].strongSignals++;
                        stats[mineral].anomalous++;
                        stats[mineral].totalProb += prob;
                    }
                });
            });

            // Create results container if it doesn't exist
            if (!document.getElementById('selection-results')) {
                document.getElementById('quebec-map').parentNode.appendChild(this.createResultsContainer());
            }

            // Display results
            this.displayResults(stats, points.length);

        } catch (error) {
            console.error('Error fetching points:', error);
        } finally {
            document.querySelector('.loading-overlay')?.remove();
        }
    }

    displayResults(stats, totalPoints) {
        const resultsContainer = document.getElementById('selection-results');
        if (!resultsContainer) return;
        
        const tbody = resultsContainer.querySelector('tbody');
        const totalSamplesDiv = resultsContainer.querySelector('.total-samples');
        
        tbody.innerHTML = '';
        totalSamplesDiv.textContent = `Total Samples in Region: ${totalPoints}`;
        
        // Calculate total signals for confidence score
        const totalVeryStrong = Object.values(stats).reduce((sum, data) => sum + data.veryStrongSignals, 0);
        const totalStrong = Object.values(stats).reduce((sum, data) => sum + data.strongSignals, 0);
        
        // Update confidence score (40 points per very strong, 15 per strong)
        const confidenceScore = Math.min(100, (totalVeryStrong * 40) + (totalStrong * 15));
        resultsContainer.querySelector('.score-value').textContent = confidenceScore;
        
        // Update signal counts
        resultsContainer.querySelector('#strong-signals').textContent = totalVeryStrong;
        resultsContainer.querySelector('#potential-signals').textContent = totalStrong;
        
        // Update table
        Object.entries(stats).forEach(([mineral, data]) => {
            const row = document.createElement('tr');
            let probability;
            
            if (data.anomalous > 0) {
                // If anomalous samples exist, use average of anomalous probabilities
                probability = (data.totalProb / data.anomalous) * 100;
            } else {
                // If no anomalous samples, use maximum probability
                probability = Math.max(...data.probValues) * 100;
            }
            
            row.innerHTML = `
                <td>${MINERALS[mineral].name}</td>
                <td>${data.anomalous}/${totalPoints}</td>
                <td>${probability.toFixed(1)}%</td>
            `;
            tbody.appendChild(row);
        });
        
        resultsContainer.style.display = 'block';
    }

    showMineralLayer(mineralType) {
        // Remove current layer if it exists
        if (this.currentMineralLayer) {
            this.map.removeLayer(this.currentMineralLayer);
            this.currentMineralLayer = null;
        }

        if (mineralType === 'none') return;

        if (mineralType === 'test') {
            // Create a heatmap from visible points
            this.createTestHeatmap();
            return;
        }

        // Handle other mineral layers as before...
        const mineral = MINERALS[mineralType];
        if (!mineral) return;

        this.currentMineralLayer = L.imageOverlay(
            mineral.imagePath,
            mineral.bounds,
            { opacity: 0.7 }
        ).addTo(this.map);
    }

    async createTestHeatmap() {
        try {
            const bounds = this.map.getBounds();
            const { data: points, error } = await this.supabase
                .rpc('get_points_in_bounds', {
                    min_lat: bounds.getSouth(),
                    min_lng: bounds.getWest(),
                    max_lat: bounds.getNorth(),
                    max_lng: bounds.getEast()
                });

            if (error) throw error;

            // Convert points to heatmap format
            const heatData = points.map(point => {
                const locationStr = point.location;
                const match = locationStr.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
                if (match) {
                    const lng = parseFloat(match[1]);
                    const lat = parseFloat(match[2]);
                    return [lat, lng, 1]; // [lat, lng, intensity]
                }
                return null;
            }).filter(point => point !== null);

            // Create heatmap layer
            this.currentMineralLayer = L.heatLayer(heatData, {
                radius: 25,
                blur: 15,
                maxZoom: 12,
                max: 1.0,
                gradient: {0.4: 'blue', 0.65: 'lime', 1: 'red'}
            }).addTo(this.map);

        } catch (error) {
            console.error('Error creating heatmap:', error);
        }
    }

    setMineralLayerOpacity(opacity) {
        if (this.currentMineralLayer) {
            this.currentMineralLayer.setOpacity(opacity / 100);
        }
    }

    addSelectionControl() {
        const control = L.control({position: 'topright'});
        
        control.onAdd = () => {
            const div = L.DomUtil.create('div', 'leaflet-control leaflet-bar');
            const button = document.createElement('button');
            button.id = 'selectionModeToggle';
            button.className = 'control-button';
            button.textContent = 'Predict Region';
            button.style.padding = '6px 10px';
            button.style.backgroundColor = '#fff';
            button.style.border = '2px solid rgba(0,0,0,0.2)';
            button.style.borderRadius = '4px';
            button.style.cursor = 'pointer';
            div.appendChild(button);
            return div;
        };
        
        control.addTo(this.map);
    }

    toggleSelectionMode() {
        this.isSelectionMode = !this.isSelectionMode;
        this.map.getContainer().style.cursor = this.isSelectionMode ? 'crosshair' : 'grab';
        const button = document.getElementById('selectionModeToggle');
        button.textContent = this.isSelectionMode ? 'Cancel Selection' : 'Predict Region';
        
        if (this.isSelectionMode) {
            button.style.backgroundColor = '#e9ecef';
            button.style.color = '#212529';
        } else {
            button.style.backgroundColor = '#fff';
            button.style.color = '#000';
        }

        // Clear existing selection if disabling
        if (!this.isSelectionMode && this.selectionBox) {
            this.map.removeLayer(this.selectionBox);
            this.selectionBox = null;
            const resultsContainer = document.getElementById('selection-results');
            if (resultsContainer) resultsContainer.style.display = 'none';
        }
    }

    showLoadingOverlay(message) {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.style.display = 'flex';
        overlay.innerHTML = `
            <div class="spinner"></div>
            <p>${message}</p>
        `;
        document.getElementById('quebec-map').appendChild(overlay);
    }

    hideLoadingOverlay() {
        const overlay = document.querySelector('.loading-overlay');
        if (overlay) overlay.remove();
    }

    addImageViewerControl() {
        const control = L.control({position: 'topright'});
        
        control.onAdd = () => {
            const div = L.DomUtil.create('div', 'leaflet-control leaflet-bar');
            const button = document.createElement('button');
            button.id = 'imageViewerToggle';
            button.className = 'control-button';
            button.textContent = 'View Mineral Maps';
            button.style.padding = '6px 10px';
            button.style.backgroundColor = '#fff';
            button.style.border = '2px solid rgba(0,0,0,0.2)';
            button.style.borderRadius = '4px';
            button.style.cursor = 'pointer';
            
            button.addEventListener('click', () => this.showImageViewer());
            div.appendChild(button);
            return div;
        };
        
        control.addTo(this.map);
    }

    showImageViewer() {
        const modal = document.createElement('div');
        modal.className = 'mineral-image-viewer';
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 20px rgba(0,0,0,0.2);
            z-index: 1000;
            max-width: 800px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
        `;

        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.cssText = `
            position: absolute;
            right: 10px;
            top: 10px;
            border: none;
            background: none;
            font-size: 24px;
            cursor: pointer;
            padding: 5px;
        `;
        closeButton.onclick = () => modal.remove();

        const content = document.createElement('div');
        content.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        `;

        Object.entries(MINERALS).forEach(([key, mineral]) => {
            const card = document.createElement('div');
            card.style.cssText = `
                text-align: center;
                padding: 10px;
            `;
            
            card.innerHTML = `
                <h3 style="margin-bottom: 10px;">${mineral.name}</h3>
                <img src="${mineral.imagePath}" 
                     alt="${mineral.name} heatmap" 
                     style="max-width: 100%; height: auto; border-radius: 4px;">
            `;
            
            content.appendChild(card);
        });

        modal.appendChild(closeButton);
        modal.appendChild(content);
        document.body.appendChild(modal);
    }

    showMineralHeatmap(mineralType) {
        if (!mineralType) return;
        
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 20px rgba(0,0,0,0.2);
            z-index: 1000;
            max-width: 800px;
            width: 90%;
        `;

        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.cssText = `
            position: absolute;
            right: 10px;
            top: 10px;
            border: none;
            background: none;
            font-size: 24px;
            cursor: pointer;
        `;
        closeButton.onclick = () => modal.remove();

        const img = document.createElement('img');
        img.src = MINERALS[mineralType].imagePath;
        img.alt = `${MINERALS[mineralType].name} heatmap`;
        img.style.width = '100%';
        img.style.borderRadius = '4px';

        modal.appendChild(closeButton);
        modal.appendChild(img);
        document.body.appendChild(modal);
    }
}

// Initialize map when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.quebecMap = new QuebecMap('quebec-map');
});