// Static RGB Decomposition Visualization
class RGBDecompositionStatic {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.matrixCanvas = null;
        this.matrixCtx = null;
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
        this.matrixCanvas = document.getElementById('matrixCanvas');
        
        if (!this.canvas) {
            console.error('RGB decomposition canvas not found');
            return;
        }
        
        if (!this.matrixCanvas) {
            console.error('Matrix canvas not found');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.matrixCtx = this.matrixCanvas.getContext('2d');
        
        // Load CSV data
        this.loadCSVData();
    }

    async loadCSVData() {
        try {
            const response = await fetch('../assets/RGB_Values_per_Cell.csv');
            const csvText = await response.text();
            this.parseCSVData(csvText);
            this.convertToImageMatrix();
            this.drawVisualization();
            this.drawMatrixVisualization();
            this.logRGBMatrix();
        } catch (error) {
            console.error('Failed to load CSV data:', error);
            // Fallback to synthetic data
            this.generateSampleImage();
            this.drawVisualization();
            this.drawMatrixVisualization();
        }
    }

    parseCSVData(csvText) {
        const lines = csvText.trim().split('\n');
        const header = lines[0].split(',');
        
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
        const cellSize = 8; // Larger cell size since we have more space
        const displaySize = imageSize * cellSize;
        
        // Positions - center both images
        const spacing = 120;
        const totalWidth = displaySize * 2 + spacing;
        const startX = (width - totalWidth) / 2;
        
        const originalX = startX;
        const originalY = height / 2 - displaySize / 2;
        
        const grayscaleX = startX + displaySize + spacing;
        const grayscaleY = originalY;
        
        // Draw simple titles only
        ctx.fillStyle = '#333';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        
        // Original image title
        ctx.fillText('Original', originalX + displaySize/2, originalY - 15);
        
        // Grayscale title
        ctx.fillText('Grayscale', grayscaleX + displaySize/2, grayscaleY - 15);
        
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
    }

    drawMatrixVisualization() {
        if (!this.imageData) return;
        
        const ctx = this.matrixCtx;
        const width = this.matrixCanvas.width;
        const height = this.matrixCanvas.height;
        
        // Clear canvas
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        
        this.drawMatrixRepresentation(ctx, width/2, height/2);
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

    drawMatrixRepresentation(ctx, centerX, centerY) {
        // Get some sample values from the actual data
        const sampleValues = [];
        for (let i = 0; i < 5; i++) {
            const row = [];
            for (let j = 0; j < 5; j++) {
                if (i < this.imageData.length && j < this.imageData[0].length) {
                    row.push(this.imageData[i][j].r); // Use red channel values
                } else {
                    row.push(128); // fallback
                }
            }
            sampleValues.push(row);
        }
        
        // Draw matrix content
        ctx.fillStyle = '#333';
        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        
        const lineHeight = 16;
        const matrixHeight = lineHeight * 6; // 6 lines total
        let currentY = centerY - matrixHeight/2;
        
        // Draw opening bracket
        ctx.fillText('[', centerX - 100, currentY);
        
        // Draw sample rows
        for (let i = 0; i < 3; i++) {
            let rowText = '  [';
            for (let j = 0; j < 3; j++) {
                rowText += sampleValues[i][j].toString().padStart(3, ' ');
                if (j < 2) rowText += ',';
            }
            rowText += ', ..., ' + sampleValues[i][4].toString().padStart(3, ' ') + ']';
            if (i < 2) rowText += ',';
            
            ctx.fillText(rowText, centerX - 95, currentY);
            currentY += lineHeight;
        }
        
        // Draw ellipsis for middle rows
        ctx.fillText('  ...', centerX - 95, currentY);
        currentY += lineHeight;
        
        // Draw last row
        let lastRowText = '  [';
        for (let j = 0; j < 3; j++) {
            lastRowText += sampleValues[4][j].toString().padStart(3, ' ');
            if (j < 2) lastRowText += ',';
        }
        lastRowText += ', ..., ' + sampleValues[4][4].toString().padStart(3, ' ') + ']';
        
        ctx.fillText(lastRowText, centerX - 95, currentY);
        currentY += lineHeight;
        
        // Draw closing bracket
        ctx.fillText(']', centerX - 100, currentY);
        
        // Add dimension labels
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#666';
        ctx.fillText('36 columns', centerX, centerY + matrixHeight/2 + 25);
        
        // Vertical dimension label
        ctx.save();
        ctx.translate(centerX - 130, centerY);
        ctx.rotate(-Math.PI/2);
        ctx.fillText('36 rows', 0, 0);
        ctx.restore();
    }
}

// Initialize when page loads
new RGBDecompositionStatic(); 