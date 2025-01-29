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
        const selectionButton = document.getElementById('selectionModeToggle');
        if (selectionButton) {
            selectionButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent the click from reaching the map
                this.toggleSelectionMode();
            });
        }

        // Map click handler - only bind when selection mode is active
        this.map.on('click', (e) => {
            if (this.isSelectionMode) {
                this.handleMapClick(e);
            }
        });

        // Heatmap viewer
        document.getElementById('heatmapViewer').addEventListener('change', (e) => {
            this.showMineralHeatmap(e.target.value);
            e.target.value = '';
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

                <!-- Updated Mineral Prospectivity Section -->
                <div class="model-agreement-card">
                    <h3>Mineral Prospectivity Score</h3>
                    <div class="confidence-grid">
                        <div class="confidence-score">
                            <span class="score-value">0</span>
                            <button class="info-button" id="scoreInfo" style="
                                border: none;
                                background: none;
                                color: #666;
                                font-size: 0.8em;
                                text-decoration: underline;
                                cursor: pointer;
                                margin-top: 5px;
                            ">Click to see calculation</button>
                        </div>
                        <div class="agreement-stats">
                            <div class="stat-item">
                                <div class="stat-label-group">
                                    <span class="stat-label">Strong Signal</span>
                                </div>

                                <span class="stat-value" id="strong-signals">0</span>
                            </div>
                            <div class="stat-item">
                                <div class="stat-label-group">
                                    <span class="stat-label">Anomalous Signals</span>
                                </div>
                                <span class="stat-value" id="potential-signals">0</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="stats-card">
                    <h3>Selected Area Statistics</h3>
                    <div class="total-samples"></div>
                        <table class="results-table">
                            <thead>
                                <tr>
                                    <th>Mineral</th>
                                    <th>Anomalous Samples</th>
                                    <th>Strong Samples</th>
                                    <th>Max Probability</th>
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

    async handleMapClick(e) {
        if (!this.isSelectionMode) return;

        // Show loading overlay
        this.showLoadingOverlay('Predicting on Region...');
        
        // Remove existing selection box
        if (this.selectionBox) {
            this.map.removeLayer(this.selectionBox);
        }

        // Calculate bounds
        const kmSize = 5;
        const degreeSize = this.kmToDegrees(kmSize);
        const bounds = [
            [e.latlng.lat - degreeSize/2, e.latlng.lng - degreeSize/2],
            [e.latlng.lat + degreeSize/2, e.latlng.lng + degreeSize/2]
        ];

        // Draw new selection box
        this.selectionBox = L.rectangle(bounds, {
            color: '#ff7800',
            weight: 1,
            fillOpacity: 0.2
        }).addTo(this.map);

        // Add artificial delay for UX
        await new Promise(resolve => setTimeout(resolve, 1500));

        try {
            // Calculate statistics
            await this.calculateStatistics(bounds);
        } catch (error) {
            console.error('Error calculating statistics:', error);
        } finally {
            // Hide loading overlay and remove selection instruction
            this.hideLoadingOverlay();
            this.removeSelectionInstruction();
            
            // Turn off selection mode
            this.isSelectionMode = false;
            this.map.getContainer().style.cursor = 'grab';
            
            // Update button state
            const button = document.getElementById('selectionModeToggle');
            if (button) {
                button.textContent = 'Predict Region';
                button.style.backgroundColor = '#fff';
                button.style.color = '#000';
            }
        }
    }

    async calculateStatistics(bounds) {
        const [[minLat, minLng], [maxLat, maxLng]] = bounds;
        
        try {
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
                AU: { anomalous: 0, strong: 0, maxProb: 0 },
                AG: { anomalous: 0, strong: 0, maxProb: 0 },
                CU: { anomalous: 0, strong: 0, maxProb: 0 },
                CO: { anomalous: 0, strong: 0, maxProb: 0 },
                NI: { anomalous: 0, strong: 0, maxProb: 0 }
            };
    
            points.forEach(point => {
                Object.keys(stats).forEach(mineral => {
                    const mineral_lower = mineral.toLowerCase();
                    const pred = point[`${mineral_lower}_pred`];
                    const prob = point[`${mineral_lower}_prob`] || 0;
                    
                    // Update max probability if this is higher
                    stats[mineral].maxProb = Math.max(stats[mineral].maxProb, prob);
                    
                    if (pred === 2) {
                        stats[mineral].strong++;
                    } else if (pred === 1) {
                        stats[mineral].anomalous++;
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
        }
    }
    
    displayResults(stats, totalPoints) {
        const resultsContainer = document.getElementById('selection-results');
        if (!resultsContainer) return;
        
        const tbody = resultsContainer.querySelector('tbody');
        const totalSamplesDiv = resultsContainer.querySelector('.total-samples');
        
        tbody.innerHTML = '';
        totalSamplesDiv.textContent = `Total Samples in Region: ${totalPoints}`;
        
        // Calculate total strong and anomalous signals
        const totalStrong = Object.values(stats).reduce((sum, data) => sum + data.strong, 0);
        const totalAnomalous = Object.values(stats).reduce((sum, data) => sum + data.anomalous, 0);
    
        // Update signal counts
        resultsContainer.querySelector('#strong-signals').textContent = totalStrong;
        resultsContainer.querySelector('#potential-signals').textContent = totalAnomalous;
        
        // Calculate prospectivity score
        let prospectivityScore = 0;
        prospectivityScore += totalStrong * 30;      // 30 points per strong signal (was very strong)
        prospectivityScore += totalAnomalous * 15;   // 15 points per anomalous signal (was strong)
        
        // Add bonuses for multiple minerals
        const mineralsWithSignals = Object.values(stats)
            .filter(data => (data.strong + data.anomalous) > 0).length;
        if (mineralsWithSignals >= 2) prospectivityScore += 10;
        
        // Add bonus for high concentration
        const highConcentrationMinerals = Object.values(stats)
            .filter(data => (data.strong + data.anomalous) / totalPoints > 0.5).length;
        prospectivityScore += highConcentrationMinerals * 10;
    
        const finalScore = Math.min(100, prospectivityScore);
        
        // Update score display
        resultsContainer.querySelector('.score-value').textContent = finalScore.toFixed(0);
        
        // Update info button click handler
        const scoreInfoButton = document.getElementById('scoreInfo');
        if (scoreInfoButton) {
            scoreInfoButton.onclick = () => {
                alert(
                    'Prospectivity Score Calculation:\n\n' +
                    '• 30 points per Strong Signal (pred = 2)\n' +
                    '• 15 points per Anomalous Signal (pred = 1)\n' +
                    '• 10 bonus points for 2+ different mineral types\n' +
                    '• 10 bonus points per mineral with high concentration\n\n' +
                    'Current Breakdown:\n' +
                    `• Strong Signals: ${totalStrong} × 30 = ${totalStrong * 30}\n` +
                    `• Anomalous Signals: ${totalAnomalous} × 15 = ${totalAnomalous * 15}\n` +
                    `• Multiple Minerals Bonus: ${(mineralsWithSignals >= 2) ? '10' : '0'}\n` +
                    `• High Concentration Bonus: ${highConcentrationMinerals * 10}\n` +
                    `• Total (capped at 100): ${finalScore}`
                );
            };
        }
        
        // Update table
        Object.entries(stats).forEach(([mineral, data]) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${MINERALS[mineral].name}</td>
                <td>${data.anomalous}/${totalPoints}</td>
                <td>${data.strong}/${totalPoints}</td>
                <td>${(data.maxProb * 100).toFixed(1)}%</td>
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
        const button = document.getElementById('selectionModeToggle');
        
        if (this.isSelectionMode) {
            // Enter selection mode
            this.map.getContainer().style.cursor = 'crosshair';
            if (button) {
                button.textContent = 'Cancel Selection';
                button.style.backgroundColor = '#e9ecef';
                button.style.color = '#212529';
            }
            this.showSelectionInstruction();
        } else {
            // Exit selection mode
            this.map.getContainer().style.cursor = 'grab';
            if (button) {
                button.textContent = 'Predict Region';
                button.style.backgroundColor = '#fff';
                button.style.color = '#000';
            }
            this.removeSelectionInstruction();
            
            // Clear existing selection if any
            if (this.selectionBox) {
                this.map.removeLayer(this.selectionBox);
                this.selectionBox = null;
            }
            
            // Hide results container
            const resultsContainer = document.getElementById('selection-results');
            if (resultsContainer) {
                resultsContainer.style.display = 'none';
            }
        }
    }

    showSelectionInstruction() {
        const instruction = document.createElement('div');
        instruction.id = 'selection-instruction';
        instruction.className = 'selection-instruction';
        instruction.innerHTML = 'Click anywhere on the map to predict a region';
        document.getElementById('quebec-map').appendChild(instruction);
    }

    removeSelectionInstruction() {
        const instruction = document.getElementById('selection-instruction');
        if (instruction) instruction.remove();
    }

    showLoadingOverlay(message = 'Loading...') {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="spinner"></div>
                <p class="loading-text">${message}</p>
            </div>
        `;
        document.getElementById('quebec-map').appendChild(overlay);
        
        // Fade in animation
        requestAnimationFrame(() => {
            overlay.style.opacity = '0';
            overlay.style.display = 'flex';
            requestAnimationFrame(() => {
                overlay.style.opacity = '1';
            });
        });
    }

    hideLoadingOverlay() {
        const overlay = document.querySelector('.loading-overlay');
        if (overlay) overlay.remove();
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
            background: white;
            font-size: 24px;
            cursor: pointer;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            color: #000;
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