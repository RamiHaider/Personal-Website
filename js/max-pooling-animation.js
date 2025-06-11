// Max Pooling Animation
class MaxPoolingAnimation {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.featureMaps = null;
        this.outputMaps = null;
        this.animationRunning = false;
        this.currentMapIndex = 0;
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
        this.canvas = document.getElementById('maxPoolingCanvas');
        if (!this.canvas) {
            console.error('Max pooling canvas not found');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        
        // Wait for CNN data to be available, then generate feature maps
        this.waitForDataAndStart();
    }

    waitForDataAndStart() {
        const checkData = () => {
            if (window.cnnInputData && window.cnnInputData.normalizedRed) {
                this.generateFeatureMaps();
                this.setupOutputMaps();
                this.startAnimation();
            } else {
                setTimeout(checkData, 100);
            }
        };
        
        checkData();
    }

    generateFeatureMaps() {
        // Use the same logic as ReLU visualization to get consistent feature maps
        const inputData = window.cnnInputData.normalizedRed;
        
        // Define the same 3 filters as in ReLU visualization
        const filters = [
            {
                name: "Horizontal Edge",
                kernel: [
                    [-1, -1, -1],
                    [ 0,  0,  0],
                    [ 1,  1,  1]
                ]
            },
            {
                name: "Vertical Edge", 
                kernel: [
                    [-1,  0,  1],
                    [-1,  0,  1],
                    [-1,  0,  1]
                ]
            },
            {
                name: "Diagonal Edge",
                kernel: [
                    [ 0, -1,  0],
                    [-1,  4, -1],
                    [ 0, -1,  0]
                ]
            }
        ];
        
        // Calculate feature maps (same as convolution output)
        const rawFeatureMaps = filters.map(filter => {
            return this.convolve2D(inputData, filter.kernel);
        });
        
        // Apply ReLU to get the same feature maps as ReLU visualization
        this.featureMaps = rawFeatureMaps.map(featureMap => {
            return featureMap.map(row => 
                row.map(value => Math.max(0, value)) // ReLU: max(0, x)
            );
        });
    }

    convolve2D(input, kernel) {
        const inputSize = input.length;
        const kernelSize = kernel.length;
        const outputSize = inputSize - kernelSize + 1;
        const output = [];
        
        for (let i = 0; i < outputSize; i++) {
            output[i] = [];
            for (let j = 0; j < outputSize; j++) {
                let sum = 0;
                for (let ki = 0; ki < kernelSize; ki++) {
                    for (let kj = 0; kj < kernelSize; kj++) {
                        sum += input[i + ki][j + kj] * kernel[ki][kj];
                    }
                }
                output[i][j] = sum;
            }
        }
        
        return output;
    }

    setupOutputMaps() {
        // Calculate output dimensions after 2x2 max pooling with stride 2
        const inputSize = this.featureMaps[0].length;
        const poolSize = 2;
        const stride = 2;
        const outputSize = Math.floor((inputSize - poolSize) / stride) + 1;
        
        // Initialize 3 output maps
        this.outputMaps = [];
        for (let i = 0; i < 3; i++) {
            const outputMap = [];
            for (let j = 0; j < outputSize; j++) {
                outputMap.push(new Array(outputSize).fill(0));
            }
            this.outputMaps.push(outputMap);
        }
    }

    startAnimation() {
        if (this.animationRunning) return;
        this.animationRunning = true;
        
        this.currentPosition = { row: 0, col: 0 };
        this.animatePooling();
    }

    animatePooling() {
        const inputSize = this.featureMaps[0].length;
        const stride = 2;
        const maxRow = Math.floor((inputSize - 2) / stride);
        const maxCol = Math.floor((inputSize - 2) / stride);
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw all feature maps, pooling windows, and outputs
        this.drawAllFeatureMaps();
        this.drawPoolingWindows();
        this.drawAllOutputs();
        this.drawLabels();
        
        // Perform max pooling at current position for all maps simultaneously
        if (this.currentPosition.row <= maxRow && this.currentPosition.col <= maxCol) {
            this.performMaxPoolingAtPositionAllMaps();
        }
        
        // Move to next position
        this.currentPosition.col++;
        if (this.currentPosition.col > maxCol) {
            this.currentPosition.col = 0;
            this.currentPosition.row++;
        }
        
        // Check if all positions are complete
        if (this.currentPosition.row > maxRow) {
            // Restart animation after a pause
            setTimeout(() => {
                this.setupOutputMaps(); // Reset output maps
                this.currentPosition = { row: 0, col: 0 };
                this.animatePooling();
            }, 2000);
        } else {
            // Continue animation
            setTimeout(() => this.animatePooling(), 150);
        }
    }

    drawAllFeatureMaps() {
        const startX = 50;
        const startY = 50;
        const mapSize = 100;
        const verticalSpacing = 130; // Increased spacing
        
        // Find global min/max across all feature maps for consistent scaling
        let globalMin = Infinity;
        let globalMax = -Infinity;
        
        this.featureMaps.forEach(matrix => {
            matrix.forEach(row => {
                row.forEach(value => {
                    if (value < globalMin) globalMin = value;
                    if (value > globalMax) globalMax = value;
                });
            });
        });
        
        // Draw all 3 feature maps
        for (let mapIndex = 0; mapIndex < 3; mapIndex++) {
            const yPos = startY + mapIndex * verticalSpacing;
            const currentMap = this.featureMaps[mapIndex];
            const rows = currentMap.length;
            const cols = currentMap[0].length;
            const cellSize = mapSize / Math.max(rows, cols);
            
            // Draw feature map
            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    const value = currentMap[i][j];
                    
                    // Normalize for display using global scale
                    let intensity;
                    if (globalMax === globalMin) {
                        intensity = 128;
                    } else {
                        intensity = Math.floor(((value - globalMin) / (globalMax - globalMin)) * 255);
                    }
                    
                    this.ctx.fillStyle = `rgb(${intensity}, ${intensity}, ${intensity})`;
                    this.ctx.fillRect(startX + j * cellSize, yPos + i * cellSize, cellSize - 0.5, cellSize - 0.5);
                }
            }
            
            // Border
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = 1.5;
            this.ctx.strokeRect(startX - 1, yPos - 1, mapSize + 2, mapSize + 2);
        }
    }

    drawPoolingWindows() {
        const startX = 50;
        const startY = 50;
        const mapSize = 100;
        const verticalSpacing = 130; // Updated to match feature maps
        const stride = 2;
        
        // Draw pooling window on all 3 feature maps simultaneously
        for (let mapIndex = 0; mapIndex < 3; mapIndex++) {
            const yPos = startY + mapIndex * verticalSpacing;
            const currentMap = this.featureMaps[mapIndex];
            const rows = currentMap.length;
            const cols = currentMap[0].length;
            const cellSize = mapSize / Math.max(rows, cols);
            
            // Calculate window position
            const windowX = startX + this.currentPosition.col * stride * cellSize;
            const windowY = yPos + this.currentPosition.row * stride * cellSize;
            const windowSize = 2 * cellSize;
            
            // Draw 2x2 pooling window
            this.ctx.strokeStyle = '#ff0000';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(windowX, windowY, windowSize, windowSize);
            
            // Semi-transparent overlay
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
            this.ctx.fillRect(windowX, windowY, windowSize, windowSize);
        }
    }

    drawAllOutputs() {
        const startX = 280;
        const mapSize = 50; // Smaller since pooled outputs are smaller
        const verticalSpacing = 130; // Updated to match feature maps
        const featureMapSize = 100;
        
        // Find global min/max across all feature maps for consistent scaling
        let globalMin = Infinity;
        let globalMax = -Infinity;
        
        this.featureMaps.forEach(matrix => {
            matrix.forEach(row => {
                row.forEach(value => {
                    if (value < globalMin) globalMin = value;
                    if (value > globalMax) globalMax = value;
                });
            });
        });
        
        // Draw all 3 output maps
        for (let mapIndex = 0; mapIndex < 3; mapIndex++) {
            // Align output with center of corresponding feature map
            const featureMapY = 50 + mapIndex * verticalSpacing;
            const yPos = featureMapY + (featureMapSize - mapSize) / 2; // Center align
            
            const currentOutput = this.outputMaps[mapIndex];
            const rows = currentOutput.length;
            const cols = currentOutput[0].length;
            const cellSize = mapSize / Math.max(rows, cols);
            
            // Draw output map
            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    const value = currentOutput[i][j];
                    
                    // Normalize for display using same scale as input
                    let intensity;
                    if (value === 0) {
                        intensity = 240; // Light gray for unprocessed
                    } else {
                        if (globalMax === globalMin) {
                            intensity = 128;
                        } else {
                            intensity = Math.floor(((value - globalMin) / (globalMax - globalMin)) * 255);
                        }
                    }
                    
                    // Highlight current output cell being computed for all maps
                    if (i === this.currentPosition.row && 
                        j === this.currentPosition.col) {
                        this.ctx.fillStyle = '#90EE90'; // Light green for current
                    } else {
                        this.ctx.fillStyle = `rgb(${intensity}, ${intensity}, ${intensity})`;
                    }
                    
                    this.ctx.fillRect(startX + j * cellSize, yPos + i * cellSize, cellSize - 0.5, cellSize - 0.5);
                }
            }
            
            // Border
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = 1.5;
            this.ctx.strokeRect(startX - 1, yPos - 1, mapSize + 2, mapSize + 2);
        }
    }

    drawLabels() {
        this.ctx.fillStyle = 'black';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        
        // Main labels
        this.ctx.fillText('After ReLU', 100, 30);
        this.ctx.fillText('Max-Pooled', 305, 30);
        
        // Arrow positioned at middle feature map level (feature map 2, index 1)
        const middleMapY = 50 + 1 * 130 + 50; // startY + index * spacing + half mapSize
        
        // Arrow
        this.ctx.strokeStyle = 'black';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(170, middleMapY);
        this.ctx.lineTo(250, middleMapY);
        this.ctx.stroke();
        
        // Arrow head
        this.ctx.beginPath();
        this.ctx.moveTo(245, middleMapY - 5);
        this.ctx.lineTo(250, middleMapY);
        this.ctx.lineTo(245, middleMapY + 5);
        this.ctx.stroke();
    }

    performMaxPoolingAtPositionAllMaps() {
        const row = this.currentPosition.row;
        const col = this.currentPosition.col;
        const stride = 2;
        
        // Process all 3 feature maps at the same position
        for (let mapIndex = 0; mapIndex < 3; mapIndex++) {
            const currentMap = this.featureMaps[mapIndex];
            
            // Extract 2x2 window
            const window = [];
            for (let i = 0; i < 2; i++) {
                for (let j = 0; j < 2; j++) {
                    const mapRow = row * stride + i;
                    const mapCol = col * stride + j;
                    if (mapRow < currentMap.length && mapCol < currentMap[0].length) {
                        window.push(currentMap[mapRow][mapCol]);
                    }
                }
            }
            
            // Find maximum value
            const maxValue = Math.max(...window);
            
            // Store in output
            this.outputMaps[mapIndex][row][col] = maxValue;
        }
    }
}

// Initialize when page loads
new MaxPoolingAnimation(); 