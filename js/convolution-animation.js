// Convolution Animation
class ConvolutionAnimation {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.imageData = null;
        this.animationRunning = false;
        this.currentPosition = { row: 0, col: 0 };
        this.featureMaps = [];
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
        this.canvas = document.getElementById('convolutionCanvas');
        if (!this.canvas) {
            console.error('Convolution canvas not found');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        
        // Get the image data from the RGB decomposition
        if (window.cnnInputData && window.cnnInputData.normalizedRed) {
            this.imageData = window.cnnInputData.normalizedRed;
            this.startAnimation();
        } else {
            // Wait for data to be available
            setTimeout(() => {
                if (window.cnnInputData && window.cnnInputData.normalizedRed) {
                    this.imageData = window.cnnInputData.normalizedRed;
                    this.startAnimation();
                } else {
                    this.generateSampleData();
                    this.startAnimation();
                }
            }, 2000);
        }
    }

    generateSampleData() {
        // Fallback 36x36 normalized data
        this.imageData = [];
        for (let i = 0; i < 36; i++) {
            const row = [];
            for (let j = 0; j < 36; j++) {
                row.push(Math.random() * 0.5 + 0.25); // Random values between 0.25-0.75
            }
            this.imageData.push(row);
        }
    }

    getFilters() {
        return [
            {
                name: 'Horizontal Sobel',
                filter: [
                    [-1, 0, 1],
                    [-2, 0, 2],
                    [-1, 0, 1]
                ],
                color: '#ff6b6b'
            },
            {
                name: 'Vertical Sobel',
                filter: [
                    [-1, -2, -1],
                    [0, 0, 0],
                    [1, 2, 1]
                ],
                color: '#4ecdc4'
            },
            {
                name: 'Edge Detection',
                filter: [
                    [0, -1, 0],
                    [-1, 4, -1],
                    [0, -1, 0]
                ],
                color: '#45b7d1'
            }
        ];
    }

    startAnimation() {
        if (this.animationRunning) return;
        this.animationRunning = true;
        
        // Initialize feature maps
        const filters = this.getFilters();
        const outputSize = this.imageData.length - 2; // 34x34 for 36x36 input with 3x3 filter
        
        this.featureMaps = filters.map(() => {
            return Array(outputSize).fill().map(() => Array(outputSize).fill(0));
        });
        
        this.currentPosition = { row: 0, col: 0 };
        this.animateConvolution();
    }

    animateConvolution() {
        const filters = this.getFilters();
        const maxRow = this.imageData.length - 3;
        const maxCol = this.imageData[0].length - 3;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw input matrix
        this.drawInputMatrix();
        
        // Draw filters
        this.drawFilters(filters);
        
        // Draw feature maps
        this.drawFeatureMaps(filters);
        
        // Draw sliding window
        this.drawSlidingWindow();
        
        // Perform convolution at current position
        if (this.currentPosition.row <= maxRow && this.currentPosition.col <= maxCol) {
            this.performConvolutionAtPosition(filters);
        }
        
        // Move to next position
        this.currentPosition.col++;
        if (this.currentPosition.col > maxCol) {
            this.currentPosition.col = 0;
            this.currentPosition.row++;
        }
        
        // Continue animation or restart
        if (this.currentPosition.row <= maxRow) {
            setTimeout(() => this.animateConvolution(), 150);
        } else {
            // Restart animation after a pause
            setTimeout(() => {
                this.featureMaps = this.getFilters().map(() => {
                    const outputSize = this.imageData.length - 2;
                    return Array(outputSize).fill().map(() => Array(outputSize).fill(0));
                });
                this.currentPosition = { row: 0, col: 0 };
                this.animateConvolution();
            }, 2000);
        }
    }

    drawInputMatrix() {
        const startX = 50;
        const startY = 100;
        const cellSize = 8;
        
        for (let i = 0; i < this.imageData.length; i++) {
            for (let j = 0; j < this.imageData[i].length; j++) {
                const value = this.imageData[i][j];
                const intensity = Math.floor(value * 255);
                
                this.ctx.fillStyle = `rgb(${intensity}, ${intensity}, ${intensity})`;
                this.ctx.fillRect(startX + j * cellSize, startY + i * cellSize, cellSize, cellSize);
                
                // Border
                this.ctx.strokeStyle = 'rgba(0,0,0,0.1)';
                this.ctx.lineWidth = 0.5;
                this.ctx.strokeRect(startX + j * cellSize, startY + i * cellSize, cellSize, cellSize);
            }
        }
        
        // Matrix border
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(startX - 1, startY - 1, this.imageData[0].length * cellSize + 2, this.imageData.length * cellSize + 2);
    }

    drawFilters(filters) {
        const startX = 400;
        const startY = 50;
        const filterSize = 40;
        const spacing = 20;
        
        filters.forEach((filterObj, filterIndex) => {
            const x = startX + filterIndex * (filterSize * 3 + spacing + 80);
            const y = startY;
            
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    const value = filterObj.filter[i][j];
                    const intensity = Math.max(0, Math.min(255, (value + 2) * 50)); // Normalize for display
                    
                    this.ctx.fillStyle = filterObj.color;
                    this.ctx.fillRect(x + j * filterSize, y + i * filterSize, filterSize - 2, filterSize - 2);
                    
                    // Value text
                    this.ctx.fillStyle = 'white';
                    this.ctx.font = 'bold 12px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(value.toString(), x + j * filterSize + filterSize/2, y + i * filterSize + filterSize/2 + 4);
                }
            }
            
            // Filter border
            this.ctx.strokeStyle = filterObj.color;
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(x - 2, y - 2, filterSize * 3 + 4, filterSize * 3 + 4);
        });
    }

    drawFeatureMaps(filters) {
        const startX = 400;
        const startY = 250;
        const cellSize = 6;
        const spacing = 120;
        
        filters.forEach((filterObj, filterIndex) => {
            const x = startX + filterIndex * spacing;
            const y = startY;
            const featureMap = this.featureMaps[filterIndex];
            
            for (let i = 0; i < featureMap.length; i++) {
                for (let j = 0; j < featureMap[i].length; j++) {
                    let value = featureMap[i][j];
                    
                    // Normalize and clamp the value for display
                    value = Math.max(-1, Math.min(1, value));
                    const intensity = Math.floor((value + 1) * 127.5); // Map [-1,1] to [0,255]
                    
                    this.ctx.fillStyle = `rgb(${intensity}, ${intensity}, ${intensity})`;
                    this.ctx.fillRect(x + j * cellSize, y + i * cellSize, cellSize, cellSize);
                }
            }
            
            // Feature map border
            this.ctx.strokeStyle = filterObj.color;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x - 1, y - 1, featureMap[0].length * cellSize + 2, featureMap.length * cellSize + 2);
        });
    }

    drawSlidingWindow() {
        const startX = 50;
        const startY = 100;
        const cellSize = 8;
        const windowSize = cellSize * 3;
        
        const x = startX + this.currentPosition.col * cellSize;
        const y = startY + this.currentPosition.row * cellSize;
        
        // Highlight current 3x3 window
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(x, y, windowSize, windowSize);
        
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
        this.ctx.fillRect(x, y, windowSize, windowSize);
    }

    performConvolutionAtPosition(filters) {
        const row = this.currentPosition.row;
        const col = this.currentPosition.col;
        
        filters.forEach((filterObj, filterIndex) => {
            let sum = 0;
            
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    const inputValue = this.imageData[row + i][col + j];
                    const filterValue = filterObj.filter[i][j];
                    sum += inputValue * filterValue;
                }
            }
            
            this.featureMaps[filterIndex][row][col] = sum;
        });
    }
}

// Initialize when page loads
new ConvolutionAnimation(); 