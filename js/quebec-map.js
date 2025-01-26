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
        // Initialize map properties
        this.mapId = mapId;
        this.currentMineralLayer = null;
        this.selectionBox = null;
        this.isSelectionMode = false;
        this.searchCount = 0;
        this.lastSearchTime = 0;
        
        // Initialize the map
        this.initializeMap();
        
        // Bind event handlers
        this.bindEvents();
    }



    
    initializeMap() {
        // Initialize map with bounds restriction
        this.map = L.map(this.mapId, {
            maxBounds: [
                [43.0, -82.0],  // Southwest
                [64.0, -54.0]   // Northeast
            ],
            maxBoundsViscosity: 1.0,  // Makes the bounds "sticky"
            minZoom: 4,
            maxZoom: 12
        }).setView([53.7, -68.2], 5);
        
        // Add base layers
        this.baseLayers = {
            satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri',
                maxZoom: 19
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
    }

    bindEvents() {
        // Bind map click event for selection
        this.map.on('click', (e) => {
            if (this.isSelectionMode) {
                this.handleMapClick(e);
            }
        });
    }

    handleMapClick(e) {
        // Check rate limit (20 searches per hour)
        const now = Date.now();
        if (now - this.lastSearchTime < 3600000) { // 1 hour in milliseconds
            if (this.searchCount >= 20) {
                alert('You have reached the maximum number of searches per hour. Please try again later.');
                return;
            }
        } else {
            // Reset counter if an hour has passed
            this.searchCount = 0;
            this.lastSearchTime = now;
        }

        // Create 5km × 5km selection box
        if (this.selectionBox) {
            this.map.removeLayer(this.selectionBox);
        }

        const center = e.latlng;
        const boxSize = 0.045; // Approximately 5km in degrees

        const bounds = [
            [center.lat - boxSize/2, center.lng - boxSize/2],
            [center.lat + boxSize/2, center.lng + boxSize/2]
        ];

        this.selectionBox = L.rectangle(bounds, {
            color: 'red',
            weight: 2,
            fillOpacity: 0.1
        }).addTo(this.map);

        // Show loading overlay
        document.querySelector('.loading-overlay').style.display = 'flex';

        // Simulate loading time (remove this in production)
        setTimeout(() => {
            this.processSelection(bounds);
        }, 1000);

        // Increment search counter
        this.searchCount++;
    }

    processSelection(bounds) {
        // Here you would normally query your database
        // For now, let's simulate some results
        const results = {
            AU: { probability: Math.random(), count: Math.floor(Math.random() * 5) },
            AG: { probability: Math.random(), count: Math.floor(Math.random() * 5) },
            CU: { probability: Math.random(), count: Math.floor(Math.random() * 5) },
            CO: { probability: Math.random(), count: Math.floor(Math.random() * 5) },
            NI: { probability: Math.random(), count: Math.floor(Math.random() * 5) }
        };

        this.showResults(results);
    }

    showResults(results) {
        // Hide loading overlay
        document.querySelector('.loading-overlay').style.display = 'none';

        // Create or update results display
        // You'll need to implement this based on your UI requirements
        console.log('Selection Results:', results);
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
}

// Initialize map when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.quebecMap = new QuebecMap('quebec-map');
    
    // Add event listeners for controls
    document.getElementById('baseLayerSelect')?.addEventListener('change', (e) => {
        Object.values(quebecMap.baseLayers).forEach(layer => quebecMap.map.removeLayer(layer));
        quebecMap.baseLayers[e.target.value].addTo(quebecMap.map);
    });

    document.getElementById('mineralLayerSelect')?.addEventListener('change', (e) => {
        quebecMap.showMineralLayer(e.target.value);
    });

    document.getElementById('opacityControl')?.addEventListener('input', (e) => {
        quebecMap.setMineralLayerOpacity(e.target.value);
    });
});