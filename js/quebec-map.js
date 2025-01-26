// Constants for mineral types and their image overlays
const MINERALS = {
    AU: { 
        name: 'Gold', 
        symbol: 'AU',
        imagePath: '../assets/mineral_images/AU_heatmap.png'
    },
    AG: { 
        name: 'Silver', 
        symbol: 'AG',
        imagePath: '../assets/mineral_images/AG_heatmap.png'
    },
    CU: { 
        name: 'Copper', 
        symbol: 'CU',
        imagePath: '../assets/mineral_images/CU_heatmap.png'
    },
    CO: { 
        name: 'Cobalt', 
        symbol: 'CO',
        imagePath: '../assets/mineral_images/CO_heatmap.png'
    },
    NI: { 
        name: 'Nickel', 
        symbol: 'NI',
        imagePath: '../assets/mineral_images/NI_heatmap.png'
    }
};

class QuebecMap {
    constructor(mapId) {
        this.map = null;
        this.currentMineralLayer = null;
        this.data = null;
        this.mapId = mapId;
        
        // Flip the latitude coordinates in the bounds
        this.imageBounds = [
            [62.491, -79.572],  // Northwest corner [lat, lng]
            [44.993, -56.943]   // Southeast corner [lat, lng]
        ];
        
        // Initialize the map
        this.initializeMap();
    }

    initializeMap() {
        // Initialize map centered on Quebec
        this.map = L.map(this.mapId).setView([53.7, -68.2], 5); // Centered between bounds
        
        // Add default satellite layer
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
        
        // Add default layer
        this.baseLayers.satellite.addTo(this.map);
        
        // Add scale control
        L.control.scale().addTo(this.map);
    }

    async loadData() {
        try {
            // Updated file path to match your samples.csv
            const response = await fetch('../assets/samples.csv');
            const csvText = await response.text();
            
            // Parse CSV
            this.data = this.parseCSV(csvText);
            console.log('Data loaded successfully:', this.data.length, 'points');
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    parseCSV(csvText) {
        // Simple CSV parser (we can make this more robust if needed)
        const lines = csvText.split('\n');
        const headers = lines[0].split(',');
        
        return lines.slice(1)
            .filter(line => line.trim())
            .map(line => {
                const values = line.split(',');
                const point = {};
                headers.forEach((header, index) => {
                    point[header.trim()] = values[index];
                });
                return point;
            });
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
            this.imageBounds,
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
}

// Add this to your DOMContentLoaded event handler
document.getElementById('opacityControl').addEventListener('input', function(e) {
    quebecMap.setMineralLayerOpacity(e.target.value);
}); 