// Simple Convolution Visualization
class SimpleConvolution {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.imageData = null;
        this.paddedData = null;
        this.outputData = null;
        this.animationRunning = false;
        this.currentPosition = { row: 0, col: 0 };
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupCanvas());
        } else {
            this.setupCanvas();
        }
    }

    setupCanvas() {
        this.canvas = document.getElementById('simpleConvolutionCanvas');
        if (!this.canvas) {
            console.error('Simple convolution canvas not found');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        
        // Get the image data from the RGB decomposition
        if (window.cnnInputData && window.cnnInputData.normalizedRed) {
            this.imageData = window.cnnInputData.normalizedRed;
            this.setupPaddedData();
            this.startAnimation();
        } else if (typeof REAL_RGB_DATA !== 'undefined') {
            console.log('SimpleConvolution: Falling back to REAL_RGB_DATA');
            this.imageData = REAL_RGB_DATA.map(row => row.map(pixel => pixel.r / 255));
            this.setupPaddedData();
            this.startAnimation();
        } else {
            // Wait for data to be available
            setTimeout(() => {
                if (window.cnnInputData && window.cnnInputData.normalizedRed) {
                    this.imageData = window.cnnInputData.normalizedRed;
                } else if (typeof REAL_RGB_DATA !== 'undefined') {
                    this.imageData = REAL_RGB_DATA.map(row => row.map(pixel => pixel.r / 255));
                } else {
                    this.generateSampleData();
                }
                this.setupPaddedData();
                this.startAnimation();
            }, 2000);
        }
    }

    generateSampleData() {
        // Fallback 36x36 normalized data
        this.imageData = [];
        for (let i = 0; i < 36; i++) {
            const row = [];
            for (let j = 0; j < 36; j++) {
                row.push(Math.random() * 0.5 + 0.25);
            }
            this.imageData.push(row);
        }
    }

    setupPaddedData() {
        // Add 1-pixel padding around the image (zero padding)
        const originalSize = this.imageData.length;
        const paddedSize = originalSize + 2;
        
        this.paddedData = Array(paddedSize).fill().map(() => Array(paddedSize).fill(0));
        
        // Copy original data to center of padded matrix
        for (let i = 0; i < originalSize; i++) {
            for (let j = 0; j < originalSize; j++) {
                this.paddedData[i + 1][j + 1] = this.imageData[i][j];
            }
        }
        
        // Initialize output matrix (same size as original)
        this.outputData = Array(originalSize).fill().map(() => Array(originalSize).fill(0));
    }

    getFilter() {
        // Simple edge detection filter
        return [
            [0, -1, 0],
            [-1, 4, -1],
            [0, -1, 0]
        ];
    }

    startAnimation() {
        if (this.animationRunning) return;
        this.animationRunning = true;
        
        this.currentPosition = { row: 0, col: 0 };
        this.animateConvolution();
    }

    animateConvolution() {
        const maxRow = this.imageData.length - 1;
        const maxCol = this.imageData[0].length - 1;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw all components
        this.drawPaddedInput();
        this.drawFilter();
        this.drawOutput();
        this.drawSlidingWindow();
        
        // Perform convolution at current position
        if (this.currentPosition.row <= maxRow && this.currentPosition.col <= maxCol) {
            this.performConvolutionAtPosition();
        }
        
        // Move to next position
        this.currentPosition.col++;
        if (this.currentPosition.col > maxCol) {
            this.currentPosition.col = 0;
            this.currentPosition.row++;
        }
        
        // Continue animation or restart
        if (this.currentPosition.row <= maxRow) {
            setTimeout(() => this.animateConvolution(), 100);
        } else {
            // Restart animation after a pause
            setTimeout(() => {
                this.outputData = Array(this.imageData.length).fill().map(() => Array(this.imageData.length).fill(0));
                this.currentPosition = { row: 0, col: 0 };
                this.animateConvolution();
            }, 2000);
        }
    }

    drawPaddedInput() {
        const startX = 50;
        const startY = 50;
        const cellSize = 5;
        
        for (let i = 0; i < this.paddedData.length; i++) {
            for (let j = 0; j < this.paddedData[i].length; j++) {
                const value = this.paddedData[i][j];
                const intensity = Math.floor(value * 255);
                
                // Distinguish padding (gray border) from actual data
                if (i === 0 || i === this.paddedData.length - 1 || j === 0 || j === this.paddedData[i].length - 1) {
                    this.ctx.fillStyle = '#e5e5e5'; // Light gray for padding
                } else {
                    this.ctx.fillStyle = `rgb(${intensity}, ${intensity}, ${intensity})`;
                }
                
                this.ctx.fillRect(startX + j * cellSize, startY + i * cellSize, cellSize, cellSize);
            }
        }
        
        // Matrix border
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(startX - 1, startY - 1, this.paddedData[0].length * cellSize + 2, this.paddedData.length * cellSize + 2);
    }

    drawFilter() {
        const startX = 300;
        const startY = 80;
        const cellSize = 40;
        const filter = this.getFilter();
        
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const value = filter[i][j];
                
                // Color based on value
                if (value > 0) {
                    this.ctx.fillStyle = '#ffcccc'; // Light red for positive
                } else if (value < 0) {
                    this.ctx.fillStyle = '#ccccff'; // Light blue for negative
                } else {
                    this.ctx.fillStyle = '#f0f0f0'; // Light gray for zero
                }
                
                this.ctx.fillRect(startX + j * cellSize, startY + i * cellSize, cellSize - 2, cellSize - 2);
                
                // Value text
                this.ctx.fillStyle = '#333';
                this.ctx.font = 'bold 16px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(value.toString(), startX + j * cellSize + cellSize/2, startY + i * cellSize + cellSize/2 + 6);
            }
        }
        
        // Filter border
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(startX - 2, startY - 2, cellSize * 3 + 4, cellSize * 3 + 4);
    }

    drawOutput() {
        const startX = 500;
        const startY = 50;
        const cellSize = 5;
        
        for (let i = 0; i < this.outputData.length; i++) {
            for (let j = 0; j < this.outputData[i].length; j++) {
                let value = this.outputData[i][j];
                
                // Normalize and clamp the value for display
                value = Math.max(-2, Math.min(2, value));
                const intensity = Math.floor((value + 2) * 63.75); // Map [-2,2] to [0,255]
                
                this.ctx.fillStyle = `rgb(${intensity}, ${intensity}, ${intensity})`;
                this.ctx.fillRect(startX + j * cellSize, startY + i * cellSize, cellSize, cellSize);
            }
        }
        
        // Output border
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(startX - 1, startY - 1, this.outputData[0].length * cellSize + 2, this.outputData.length * cellSize + 2);
    }

    drawSlidingWindow() {
        const startX = 50;
        const startY = 50;
        const cellSize = 5;
        const windowSize = cellSize * 3;
        
        // Position in padded coordinates
        const x = startX + this.currentPosition.col * cellSize;
        const y = startY + this.currentPosition.row * cellSize;
        
        // Highlight current 3x3 window
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, windowSize, windowSize);
        
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.15)';
        this.ctx.fillRect(x, y, windowSize, windowSize);
    }

    performConvolutionAtPosition() {
        const row = this.currentPosition.row;
        const col = this.currentPosition.col;
        const filter = this.getFilter();
        
        let sum = 0;
        
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const inputValue = this.paddedData[row + i][col + j];
                const filterValue = filter[i][j];
                sum += inputValue * filterValue;
            }
        }
        
        this.outputData[row][col] = sum;
    }
}

// Initialize when page loads
new SimpleConvolution(); 