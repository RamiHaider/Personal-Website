// Three Filters Static Visualization
function drawThreeFiltersStatic() {
    const canvas = document.getElementById('threeFiltersCanvas');
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
    
    // Define 3 filters
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
    
    // Calculate output feature maps
    const featureMaps = filters.map(filter => {
        return convolve2D(inputData, filter.kernel);
    });
    
    // Layout parameters - adjusted to fit properly
    const inputSize = 200;
    const filterSize = 45;
    const outputSize = 100;
    const spacing = 60;
    const startY = 120; // Moved down even further to give more room at the top
    
    // Calculate positions
    const inputX = 30;
    const filtersStartX = inputX + inputSize + spacing;
    const outputsStartX = filtersStartX + filterSize + spacing;
    
    // Calculate filter starting Y to center them relative to input
    const inputCenterY = startY + inputSize / 2;
    const verticalSpacing = 90; // Increased spacing to prevent overlap
    const totalFiltersHeight = 3 * filterSize + 2 * verticalSpacing;
    const filtersStartY = inputCenterY - totalFiltersHeight / 2;
    
    // Draw input matrix
    drawMatrix(ctx, inputData, inputX, startY, inputSize, 'Input');
    
    // Draw filters and outputs
    for (let i = 0; i < 3; i++) {
        const filterY = filtersStartY + i * (filterSize + verticalSpacing);
        const outputY = filterY - (outputSize - filterSize) / 2; // Center output with filter
        
        // Draw filter
        drawFilter(ctx, filters[i].kernel, filtersStartX, filterY, filterSize, filters[i].name);
        
        // Draw output feature map
        drawMatrix(ctx, featureMaps[i], outputsStartX, outputY, outputSize, `Feature Map #${i+1}`);
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

function drawMatrix(ctx, matrix, x, y, size, label) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const cellSize = size / Math.max(rows, cols);
    
    // Find min and max values for proper normalization
    let minVal = Infinity;
    let maxVal = -Infinity;
    
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const value = matrix[i][j];
            if (value < minVal) minVal = value;
            if (value > maxVal) maxVal = value;
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
    ctx.fillText(label, x + size/2, y - 10);
}

function drawFilter(ctx, kernel, x, y, size, label) {
    const kernelSize = kernel.length;
    const cellSize = size / kernelSize;
    
    // Draw kernel
    for (let i = 0; i < kernelSize; i++) {
        for (let j = 0; j < kernelSize; j++) {
            const value = kernel[i][j];
            
            // Color coding: red for positive, blue for negative, gray for zero
            if (value > 0) {
                ctx.fillStyle = `rgba(255, 0, 0, ${Math.abs(value) / 4})`;
            } else if (value < 0) {
                ctx.fillStyle = `rgba(0, 0, 255, ${Math.abs(value) / 4})`;
            } else {
                ctx.fillStyle = '#f0f0f0';
            }
            
            ctx.fillRect(x + j * cellSize, y + i * cellSize, cellSize, cellSize);
            
            // Border
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + j * cellSize, y + i * cellSize, cellSize, cellSize);
            
            // Value text
            ctx.fillStyle = 'black';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(value.toString(), 
                x + j * cellSize + cellSize/2, 
                y + i * cellSize + cellSize/2 + 3);
        }
    }
    
    // Draw label
    ctx.fillStyle = 'black';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + size/2, y - 10);
}



// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Wait for CSV data to be loaded by the RGB decomposition component
    const checkDataAndDraw = () => {
        if (window.cnnInputData) {
            drawThreeFiltersStatic();
        } else {
            setTimeout(checkDataAndDraw, 200);
        }
    };
    
    setTimeout(checkDataAndDraw, 500);
}); 