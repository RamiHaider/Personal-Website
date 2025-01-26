// Constants for mineral types and their thresholds
const MINERALS = {
    AU: { name: 'Gold', symbol: 'AU', threshold: 0.5 },
    AG: { name: 'Silver', symbol: 'AG', threshold: 0.5 },
    CU: { name: 'Copper', symbol: 'CU', threshold: 0.5 },
    CO: { name: 'Cobalt', symbol: 'CO', threshold: 0.5 },
    NI: { name: 'Nickel', symbol: 'NI', threshold: 0.5 }
};

class QuebecMap {
    constructor(mapId) {
        this.map = null;
        this.currentMineralLayer = null;
        this.data = null;
        this.mapId = mapId;
        
        // Initialize the map
        this.initializeMap();
    }

    initializeMap() {
        // Initialize map centered on Quebec
        this.map = L.map(this.mapId).setView([47.5, -72], 6);
        
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
        }

        if (mineralType === 'none') return;

        // Create new layer
        const points = this.data.map(point => {
            const lat = parseFloat(point.Latitude);
            const lng = parseFloat(point.Longitude);
            const prob = parseFloat(point[`${mineralType}_prob`]);
            
            return {
                lat,
                lng,
                prob
            };
        });

        // Create heatmap layer
        this.currentMineralLayer = L.heatLayer(points.map(p => [p.lat, p.lng, p.prob]), {
            radius: 25,
            blur: 15,
            maxZoom: 10,
            max: 1.0,
            gradient: {
                0.0: 'blue',
                0.5: 'lime',
                1.0: 'red'
            }
        }).addTo(this.map);
    }
} 