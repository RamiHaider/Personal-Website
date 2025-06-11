// Static RGB Decomposition Visualization
class RGBDecompositionStatic {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.imageData = null;
        this.csvData = null;
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupCanvas());
        } else {
            this.setupCanvas();
        }
    }

    setupCanvas() {
        this.canvas = document.getElementById('rgbDecompositionCanvas');
        
        if (!this.canvas) {
            console.error('RGB decomposition canvas not found');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        
        // Use embedded real data if available, otherwise load CSV
        if (typeof REAL_RGB_DATA !== 'undefined') {
            console.log('✅ Using embedded REAL RGB data from CSV file!');
            this.imageData = REAL_RGB_DATA;
            this.drawVisualization();
            this.logRGBMatrix();
        } else {
            console.log('❌ Embedded data not found, trying to load CSV...');
            this.loadCSVData();
        }
    }

    async loadCSVData() {
        try {
            console.log('Attempting to load CSV from:', '../assets/RGB_Values_per_Cell.csv');
            const response = await fetch('../assets/RGB_Values_per_Cell.csv');
            console.log('Response status:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }
            const csvText = await response.text();
            console.log('CSV loaded successfully! Length:', csvText.length);
            console.log('First 200 chars:', csvText.substring(0, 200));
            
            this.parseCSVData(csvText);
            this.convertToImageMatrix();
            this.drawVisualization();
            this.logRGBMatrix();
        } catch (error) {
            console.error('FAILED TO LOAD CSV DATA:', error);
            console.error('Error details:', error.message);
            console.error('This means the visualization is using FAKE random data instead of real data!');
            
            // Try different path variations
            console.log('Trying alternative paths...');
            
            try {
                console.log('Trying: assets/RGB_Values_per_Cell.csv');
                const response2 = await fetch('assets/RGB_Values_per_Cell.csv');
                if (response2.ok) {
                    const csvText = await response2.text();
                    console.log('SUCCESS with alternative path!');
                    this.parseCSVData(csvText);
                    this.convertToImageMatrix();
                    this.drawVisualization();
                    this.logRGBMatrix();
                    return;
                }
            } catch (e2) {
                console.log('Alternative path also failed:', e2.message);
            }
            
            console.log('ALL CSV LOADING ATTEMPTS FAILED - FALLING BACK TO RANDOM DATA!');
            // Fallback to synthetic data
            this.generateSampleImage();
            this.drawVisualization();
        }
    }

    parseCSVData(csvText) {
        const lines = csvText.trim().split('\n');
        const header = lines[0].split(',');
        console.log('CSV header:', header);
        
        this.csvData = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const row = parseInt(values[0]);
            const col = parseInt(values[1]);
            const r = parseInt(values[2]);
            const g = parseInt(values[3]);
            const b = parseInt(values[4]);
            
            this.csvData.push({ row, col, r, g, b });
        }
        
        console.log(`Loaded ${this.csvData.length} RGB values from CSV`);
        console.log('First few data points:', this.csvData.slice(0, 5));
        console.log('Last few data points:', this.csvData.slice(-5));
    }

    convertToImageMatrix() {
        if (!this.csvData) return;
        
        // Find the dimensions
        const maxRow = Math.max(...this.csvData.map(item => item.row));
        const maxCol = Math.max(...this.csvData.map(item => item.col));
        const numRows = maxRow + 1;
        const numCols = maxCol + 1;
        
        console.log(`Converting CSV to ${numRows}x${numCols} matrix`);
        
        // Initialize matrix
        this.imageData = [];
        for (let i = 0; i < numRows; i++) {
            this.imageData[i] = [];
        }
        
        // Fill matrix with CSV data
        this.csvData.forEach(item => {
            this.imageData[item.row][item.col] = {
                r: item.r,
                g: item.g,
                b: item.b
            };
        });
        
        console.log('Successfully converted CSV to image matrix');
    }

    logRGBMatrix() {
        if (!this.imageData) return;
        
        const numRows = this.imageData.length;
        const numCols = this.imageData[0].length;
        
        console.log('=== RGB MATRIX FOR CNN ===');
        console.log(`Matrix dimensions: ${numRows}x${numCols}`);
        
        // Extract separate channel matrices
        const redMatrix = this.imageData.map(row => row.map(pixel => pixel.r));
        const greenMatrix = this.imageData.map(row => row.map(pixel => pixel.g));
        const blueMatrix = this.imageData.map(row => row.map(pixel => pixel.b));
        
        console.log('Red Channel Matrix:');
        console.log(redMatrix);
        
        console.log('Green Channel Matrix:');
        console.log(greenMatrix);
        
        console.log('Blue Channel Matrix:');
        console.log(blueMatrix);
        
        // Normalized matrices (0-1)
        const normalizedRed = this.imageData.map(row => 
            row.map(pixel => parseFloat((pixel.r / 255).toFixed(3)))
        );
        const normalizedGreen = this.imageData.map(row => 
            row.map(pixel => parseFloat((pixel.g / 255).toFixed(3)))
        );
        const normalizedBlue = this.imageData.map(row => 
            row.map(pixel => parseFloat((pixel.b / 255).toFixed(3)))
        );
        
        console.log('Normalized Red Channel (0-1):');
        console.log(normalizedRed);
        
        console.log('Normalized Green Channel (0-1):');
        console.log(normalizedGreen);
        
        console.log('Normalized Blue Channel (0-1):');
        console.log(normalizedBlue);
        
        // Make the matrices globally available for CNN processing
        window.cnnInputData = {
            red: redMatrix,
            green: greenMatrix,
            blue: blueMatrix,
            normalizedRed: normalizedRed,
            normalizedGreen: normalizedGreen,
            normalizedBlue: normalizedBlue,
            dimensions: { rows: numRows, cols: numCols }
        };
        
        console.log('CNN input data is now available at window.cnnInputData');
        console.log('Use window.cnnInputData.normalizedRed for single-channel CNN input');
        console.log('Use [window.cnnInputData.normalizedRed, window.cnnInputData.normalizedGreen, window.cnnInputData.normalizedBlue] for 3-channel CNN input');
    }

    generateSampleImage() {
        // Fallback: Generate a 36x36 sample image to match CSV dimensions
        console.warn('⚠️ USING FAKE RANDOM DATA - REAL CSV DATA FAILED TO LOAD!');
        this.usingFakeData = true; // Flag for drawing warning
        
        const size = 36;
        this.imageData = [];
        
        for (let i = 0; i < size; i++) {
            const row = [];
            for (let j = 0; j < size; j++) {
                // Create a sample pattern
                const baseIntensity = Math.floor(128 + 50 * Math.sin(i * 0.2) * Math.cos(j * 0.2));
                const noise = Math.floor(Math.random() * 60 - 30);
                
                const r = Math.max(0, Math.min(255, baseIntensity + noise));
                const g = Math.max(0, Math.min(255, baseIntensity + noise * 0.8));
                const b = Math.max(0, Math.min(255, baseIntensity + noise * 0.6));
                
                row.push({ r, g, b });
            }
            this.imageData.push(row);
        }
    }

    drawVisualization() {
        if (!this.imageData) {
            console.error('No image data available for visualization');
            return;
        }

        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Clear canvas
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        
        const imageSize = this.imageData.length; // Will be 36x36
        const cellSize = 6; // Reduced cell size to make images smaller
        const displaySize = imageSize * cellSize;
        
        // Positions - center both images with minimal padding
        const spacing = 120;
        const totalWidth = displaySize * 2 + spacing;
        const startX = (width - totalWidth) / 2;
        
        const originalX = startX;
        const originalY = (height - displaySize) / 2; // Center vertically with minimal padding
        
        const grayscaleX = startX + displaySize + spacing;
        const grayscaleY = originalY;
        
        // Draw simple titles only
        ctx.fillStyle = '#333';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        
        // Original image title
        ctx.fillText('Original', originalX + displaySize/2, originalY - 10);
        
        // Grayscale title
        ctx.fillText('Grayscale', grayscaleX + displaySize/2, grayscaleY - 10);
        
        // Draw original image
        this.drawImageMatrix(ctx, this.imageData, originalX, originalY, cellSize, 'original');
        
        // Draw grayscale conversion (using red channel)
        this.drawImageMatrix(ctx, this.imageData, grayscaleX, grayscaleY, cellSize, 'grayscale');
        
        // Draw arrow from original to grayscale
        this.drawArrow(ctx, 
            originalX + displaySize + 10, 
            originalY + displaySize/2, 
            grayscaleX - 10, 
            grayscaleY + displaySize/2
        );
        
        // Draw warning if using fake data
        if (this.usingFakeData) {
            ctx.fillStyle = 'red';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('⚠️ WARNING: USING FAKE DATA - CSV FAILED TO LOAD!', width/2, height - 20);
        }
    }

    drawImageMatrix(ctx, imageData, x, y, cellSize, type) {
        const numRows = imageData.length;
        const numCols = imageData[0].length;
        
        for (let i = 0; i < numRows; i++) {
            for (let j = 0; j < numCols; j++) {
                const pixel = imageData[i][j];
                const pixelX = x + j * cellSize;
                const pixelY = y + i * cellSize;
                
                let fillColor;
                switch (type) {
                    case 'original':
                        fillColor = `rgb(${pixel.r}, ${pixel.g}, ${pixel.b})`;
                        break;
                    case 'r':
                        fillColor = `rgb(${pixel.r}, 0, 0)`;
                        break;
                    case 'g':
                        fillColor = `rgb(0, ${pixel.g}, 0)`;
                        break;
                    case 'b':
                        fillColor = `rgb(0, 0, ${pixel.b})`;
                        break;
                    case 'grayscale':
                        fillColor = `rgb(${pixel.r}, ${pixel.r}, ${pixel.r})`;
                        break;
                }
                
                ctx.fillStyle = fillColor;
                ctx.fillRect(pixelX, pixelY, cellSize, cellSize);
            }
        }
        
        // Add border around the matrix
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x - 1, y - 1, numCols * cellSize + 2, numRows * cellSize + 2);
    }

    drawArrow(ctx, x1, y1, x2, y2) {
        const headLength = 8;
        const angle = Math.atan2(y2 - y1, x2 - x1);
        
        // Draw arrow line
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        
        // Draw arrow head
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI/6), y2 - headLength * Math.sin(angle - Math.PI/6));
        ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI/6), y2 - headLength * Math.sin(angle + Math.PI/6));
        ctx.closePath();
        ctx.fill();
    }
}

// Initialize when page loads
new RGBDecompositionStatic(); 