// Three Filters Static Visualization
function drawThreeFiltersStatic() {
    console.log('🚀 Starting three-filters visualization...');
    
    const canvas = document.getElementById('threeFiltersCanvas');
    if (!canvas) {
        console.error('❌ threeFiltersCanvas not found');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Try to get input data
    let inputData = null;
    
    // First, try to get data from global CNN data
    if (window.cnnInputData && window.cnnInputData.normalizedRed) {
        console.log('✅ Using window.cnnInputData for three-filters');
        inputData = window.cnnInputData.normalizedRed;
    } 
    // Fallback to embedded data
    else if (typeof REAL_RGB_DATA !== 'undefined') {
        console.log('✅ Using embedded REAL_RGB_DATA directly in three-filters');
        // Convert to normalized red channel (grayscale)
        inputData = REAL_RGB_DATA.map(row => 
            row.map(pixel => pixel.r / 255)
        );
    }
    
    if (!inputData) {
        console.error('❌ No data available for three-filters visualization');
        // Draw error message
        ctx.fillStyle = 'red';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ERROR: No data available', canvasWidth/2, canvasHeight/2);
        return;
    }
    
    console.log('🎨 Drawing three filters with input data:', inputData.length + 'x' + inputData[0].length);
    
    // Define the same 3 filters as used in ReLU visualization
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
    
    // Calculate the same feature maps as used in ReLU "Before" section
    const featureMaps = filters.map(filter => {
        return convolve2D(inputData, filter.kernel);
    });
    
    // Layout parameters
    const inputSize = 150;
    const filterSize = 55;
    const outputSize = 110;
    const spacing = 60;
    const startY = 40;

    // Calculate positions for horizontal layout: Input | Filter1 | Output1
    //                                              | Filter2 | Output2
    //                                              | Filter3 | Output3
    const inputX = 30;
    const filtersStartX = inputX + inputSize + spacing;
    const outputsStartX = filtersStartX + filterSize + spacing;

    // Calculate filter starting Y to space them out vertically
    const verticalSpacing = 60;
    const filtersStartY = startY + 20;
    
    // Draw input matrix (grayscale)
    drawMatrix(ctx, inputData, inputX, startY, inputSize, 'Input (36x36)');
    
    // Draw filters and outputs without any arrows
    for (let i = 0; i < 3; i++) {
        const filterY = filtersStartY + i * (filterSize + verticalSpacing);
        const outputY = filterY + (filterSize - outputSize) / 2; // Align with filter
        
        // Draw filter
        drawFilter(ctx, filters[i].kernel, filtersStartX, filterY, filterSize, filters[i].name);
        
        // Draw output feature map (using the same data as ReLU "Before" section)
        drawMatrix(ctx, featureMaps[i], outputsStartX, outputY, outputSize, `Output ${i+1} (34x34)`);
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
            ctx.fillRect(x + j * cellSize, y + i * cellSize, cellSize - 0.5, cellSize - 0.5);
        }
    }
    
    // Draw border around the matrix
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 1, y - 1, cols * cellSize + 2, rows * cellSize + 2);
    
    // Draw label
    ctx.fillStyle = 'black';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + (cols * cellSize)/2, y - 8);
}

function drawFilter(ctx, kernel, x, y, size, label) {
    const kernelSize = kernel.length;
    const cellSize = size / kernelSize;
    
    // Draw kernel
    for (let i = 0; i < kernelSize; i++) {
        for (let j = 0; j < kernelSize; j++) {
            const value = kernel[i][j];
            
            // Color coding: red for positive, blue for negative, light gray for zero
            if (value > 0) {
                ctx.fillStyle = `rgba(255, 100, 100, ${Math.min(1, Math.abs(value) / 2)})`;
            } else if (value < 0) {
                ctx.fillStyle = `rgba(100, 100, 255, ${Math.min(1, Math.abs(value) / 2)})`;
            } else {
                ctx.fillStyle = '#f8f8f8';
            }
            
            ctx.fillRect(x + j * cellSize, y + i * cellSize, cellSize - 1, cellSize - 1);
            
            // Border
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + j * cellSize, y + i * cellSize, cellSize, cellSize);
            
            // Value text
            ctx.fillStyle = 'black';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(value.toString(), 
                x + j * cellSize + cellSize/2, 
                y + i * cellSize + cellSize/2 + 4);
        }
    }
    
    // Draw label
    ctx.fillStyle = 'black';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + size/2, y - 8);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 DOM loaded, attempting to draw three-filters...');
    
    // Try immediately first
    setTimeout(() => {
        drawThreeFiltersStatic();
    }, 100);
    
    // Then keep trying until we have data
    const checkDataAndDraw = () => {
        if (window.cnnInputData || typeof REAL_RGB_DATA !== 'undefined') {
            drawThreeFiltersStatic();
        } else {
            console.log('⏳ Still waiting for data in three-filters...');
            setTimeout(checkDataAndDraw, 300);
        }
    };
    
    setTimeout(checkDataAndDraw, 500);
}); 