// Simple ReLU Visualization
function drawReLUVisualization() {
    const canvas = document.getElementById('reluCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Get input data (36x36 grayscale values from 0-1)
    const cnnData = window.cnnInputData;
    if (!cnnData) {
        console.error('CNN input data not available yet');
        return;
    }
    
    // Use the normalized red channel as grayscale input
    const inputData = cnnData.normalizedRed;
    
    // Define the same 3 filters as in the convolution
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
    const featureMaps = filters.map(filter => {
        return convolve2D(inputData, filter.kernel);
    });
    
    // Apply ReLU to create the "after" feature maps
    const reluFeatureMaps = featureMaps.map(featureMap => {
        return featureMap.map(row => 
            row.map(value => Math.max(0, value)) // ReLU: max(0, x)
        );
    });
    
    // Layout parameters
    const mapSize = 100;
    const spacing = 80;
    const arrowWidth = 60;
    const columnSpacing = 20;
    
    // Calculate positions for two columns
    const beforeX = 50;
    const afterX = beforeX + mapSize + arrowWidth + spacing;
    const startY = 50;
    const verticalSpacing = 140;
    
    // Draw "Before ReLU" label
    ctx.fillStyle = 'black';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Before ReLU', beforeX + mapSize/2, startY - 20);
    
    // Draw "After ReLU" label
    ctx.fillText('After ReLU', afterX + mapSize/2, startY - 20);
    
    // Find global min/max across all original feature maps to maintain consistent scale
    let globalMin = Infinity;
    let globalMax = -Infinity;
    
    featureMaps.forEach(matrix => {
        matrix.forEach(row => {
            row.forEach(value => {
                if (value < globalMin) globalMin = value;
                if (value > globalMax) globalMax = value;
            });
        });
    });
    
    // Draw feature maps before and after ReLU
    for (let i = 0; i < 3; i++) {
        const yPos = startY + i * verticalSpacing;
        
        // Draw "before" feature map (left column) with global scale
        drawFeatureMap(ctx, featureMaps[i], beforeX, yPos, mapSize, `Feature Map ${i+1}`, true, globalMin, globalMax);
        
        // Draw arrow
        drawArrow(ctx, beforeX + mapSize + 20, yPos + mapSize/2, arrowWidth - 40);
        
        // Draw "after" feature map (right column) with same global scale
        drawFeatureMap(ctx, reluFeatureMaps[i], afterX, yPos, mapSize, `Feature Map ${i+1}`, true, globalMin, globalMax);
    }
}

function convolve2D(input, kernel) {
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

function drawFeatureMap(ctx, matrix, x, y, size, label, useGlobalScale = false, globalMin = null, globalMax = null) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const cellSize = size / Math.max(rows, cols);
    
    // Use provided global scale or calculate local scale
    let minVal, maxVal;
    if (useGlobalScale && globalMin !== null && globalMax !== null) {
        minVal = globalMin;
        maxVal = globalMax;
    } else {
        // Find min and max values for proper normalization
        minVal = Infinity;
        maxVal = -Infinity;
        
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const value = matrix[i][j];
                if (value < minVal) minVal = value;
                if (value > maxVal) maxVal = value;
            }
        }
    }
    
    // Draw matrix
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            let value = matrix[i][j];
            
            // Normalize value for display (0-255 range)
            let normalizedValue;
            if (maxVal === minVal) {
                normalizedValue = 128; // Gray if all values are the same
            } else {
                normalizedValue = Math.floor(((value - minVal) / (maxVal - minVal)) * 255);
            }
            
            const grayValue = Math.max(0, Math.min(255, normalizedValue));
            ctx.fillStyle = `rgb(${grayValue}, ${grayValue}, ${grayValue})`;
            ctx.fillRect(x + j * cellSize, y + i * cellSize, cellSize, cellSize);
            
            // Light border for visibility
            ctx.strokeStyle = '#ddd';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x + j * cellSize, y + i * cellSize, cellSize, cellSize);
        }
    }
    
    // Draw label
    ctx.fillStyle = 'black';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + size/2, y + size + 20);
}

function drawArrow(ctx, x, y, width) {
    const arrowHeight = 10;
    
    ctx.fillStyle = 'black';
    ctx.beginPath();
    
    // Arrow body
    ctx.moveTo(x, y - 2);
    ctx.lineTo(x + width - 10, y - 2);
    ctx.lineTo(x + width - 10, y + 2);
    ctx.lineTo(x, y + 2);
    
    // Arrow head
    ctx.moveTo(x + width - 10, y - arrowHeight/2);
    ctx.lineTo(x + width, y);
    ctx.lineTo(x + width - 10, y + arrowHeight/2);
    
    ctx.fill();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for CNN data to be loaded
    const checkDataAndDraw = () => {
        if (window.cnnInputData) {
            drawReLUVisualization();
        } else {
            setTimeout(checkDataAndDraw, 100);
        }
    };
    
    checkDataAndDraw();
}); 