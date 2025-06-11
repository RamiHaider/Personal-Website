// Second Layer Static Visualization
function drawSecondLayerStatic() {
    const canvas = document.getElementById('secondLayerCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Get input data
    const cnnData = window.cnnInputData;
    if (!cnnData) {
        console.error('CNN input data not available yet');
        return;
    }
    
    // Generate the 3 max-pooled inputs (from first layer)
    const inputData = cnnData.normalizedRed;
    const firstLayerInputs = generateFirstLayerMaxPooled(inputData);
    
    // Define 6 filters for second layer
    const filters = [
        [[-1, -1, -1], [ 0,  0,  0], [ 1,  1,  1]], // Horizontal edge
        [[-1,  0,  1], [-1,  0,  1], [-1,  0,  1]], // Vertical edge
        [[ 0, -1,  0], [-1,  4, -1], [ 0, -1,  0]], // Diagonal edge
        [[ 1,  1,  1], [ 1,  1,  1], [ 1,  1,  1]], // Blur
        [[-1, -2, -1], [ 0,  0,  0], [ 1,  2,  1]], // Sobel X
        [[-1,  0,  1], [-2,  0,  2], [-1,  0,  1]]  // Sobel Y
    ];
    
    // Calculate 6 feature maps by applying each filter to the combined 3 inputs
    const featureMaps = generateSecondLayerFeatureMaps(firstLayerInputs, filters);
    
    // Apply ReLU to feature maps
    const reluMaps = featureMaps.map(map => 
        map.map(row => row.map(val => Math.max(0, val)))
    );
    
    // Apply max pooling to ReLU maps
    const maxPooledMaps = reluMaps.map(map => maxPool2D(map));
    
    // Layout parameters
    const startX = 20;
    const startY = 80;
    const mapSize = 45;
    const filterSize = 35;
    const arrowLength = 40;
    
    // Column positions - spread out much more
    const inputX = startX;
    const filtersX = inputX + mapSize + arrowLength + 30;
    const featureMapsX = filtersX + filterSize * 2 + arrowLength + 60; // Much more space after filters
    const reluX = featureMapsX + mapSize * 2 + arrowLength + 60; // Much more space after feature maps
    const maxPoolX = reluX + mapSize * 2 + arrowLength + 60; // Much more space after ReLU
    
    // Draw column headers
    drawColumnHeaders(ctx, inputX, filtersX, featureMapsX, reluX, maxPoolX, mapSize, filterSize);
    
    // Draw 3 input maps (max-pooled from first layer)
    drawInputMaps(ctx, firstLayerInputs, inputX, startY, mapSize);
    
    // Draw 6 filters in 2x3 grid
    drawFilters(ctx, filters, filtersX, startY, filterSize);
    
    // Draw 6 feature maps
    drawFeatureMaps(ctx, featureMaps, featureMapsX, startY, mapSize);
    
    // Draw 6 ReLU maps
    drawFeatureMaps(ctx, reluMaps, reluX, startY, mapSize);
    
    // Draw 6 max-pooled maps
    drawFeatureMaps(ctx, maxPooledMaps, maxPoolX, startY, mapSize);
    
    // Draw arrows between columns
    drawArrows(ctx, inputX, filtersX, featureMapsX, reluX, maxPoolX, startY, mapSize, filterSize, arrowLength);
}

function generateFirstLayerMaxPooled(inputData) {
    // Simulate the 3 max-pooled outputs from first layer
    const filters = [
        [[-1, -1, -1], [ 0,  0,  0], [ 1,  1,  1]], // Horizontal
        [[-1,  0,  1], [-1,  0,  1], [-1,  0,  1]], // Vertical  
        [[ 0, -1,  0], [-1,  4, -1], [ 0, -1,  0]]  // Diagonal
    ];
    
    return filters.map(filter => {
        const convolved = convolve2D(inputData, filter);
        const relu = convolved.map(row => row.map(val => Math.max(0, val)));
        return maxPool2D(relu);
    });
}

function generateSecondLayerFeatureMaps(inputs, filters) {
    // Each filter is applied to all 3 input maps and results are combined
    return filters.map(filter => {
        const results = inputs.map(inputMap => convolve2D(inputMap, filter));
        
        // Combine the 3 results (simple average)
        const combined = [];
        const size = results[0].length;
        
        for (let i = 0; i < size; i++) {
            combined[i] = [];
            for (let j = 0; j < size; j++) {
                combined[i][j] = (results[0][i][j] + results[1][i][j] + results[2][i][j]) / 3;
            }
        }
        
        return combined;
    });
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

function maxPool2D(input) {
    const inputSize = input.length;
    const outputSize = Math.floor(inputSize / 2);
    const output = [];
    
    for (let i = 0; i < outputSize; i++) {
        output[i] = [];
        for (let j = 0; j < outputSize; j++) {
            const maxVal = Math.max(
                input[i * 2][j * 2] || 0,
                input[i * 2][j * 2 + 1] || 0,
                input[i * 2 + 1] ? input[i * 2 + 1][j * 2] || 0 : 0,
                input[i * 2 + 1] ? input[i * 2 + 1][j * 2 + 1] || 0 : 0
            );
            output[i][j] = maxVal;
        }
    }
    
    return output;
}

function drawColumnHeaders(ctx, inputX, filtersX, featureMapsX, reluX, maxPoolX, mapSize, filterSize) {
    ctx.fillStyle = 'black';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    
    ctx.fillText('Input', inputX + mapSize/2, 30);
    ctx.fillText('Convolution', filtersX + filterSize, 30);
    ctx.fillText('Feature Maps', featureMapsX + mapSize/2, 30);
    ctx.fillText('ReLU', reluX + mapSize/2, 30);
    ctx.fillText('Max-Pooled', maxPoolX + mapSize/2, 30);
}

function drawInputMaps(ctx, inputMaps, startX, startY, mapSize) {
    const spacing = 55;
    
    // Find global scaling for all inputs
    let globalMin = Infinity, globalMax = -Infinity;
    inputMaps.forEach(map => {
        map.forEach(row => {
            row.forEach(val => {
                if (val < globalMin) globalMin = val;
                if (val > globalMax) globalMax = val;
            });
        });
    });
    
    // Draw 3 input maps vertically
    for (let i = 0; i < 3; i++) {
        const yPos = startY + i * spacing;
        drawMatrix(ctx, inputMaps[i], startX, yPos, mapSize, globalMin, globalMax);
    }
}

function drawFilters(ctx, filters, startX, startY, filterSize) {
    const spacing = 55;
    const colSpacing = 45;
    
    // Draw 6 filters in 2x3 grid
    for (let i = 0; i < 6; i++) {
        const row = i % 3;
        const col = Math.floor(i / 3);
        const xPos = startX + col * colSpacing;
        const yPos = startY + row * spacing;
        
        drawFilter(ctx, filters[i], xPos, yPos, filterSize);
    }
}

function drawFeatureMaps(ctx, featureMaps, startX, startY, mapSize) {
    const spacing = 55;
    const colSpacing = 55;
    
    // Find global scaling
    let globalMin = Infinity, globalMax = -Infinity;
    featureMaps.forEach(map => {
        map.forEach(row => {
            row.forEach(val => {
                if (val < globalMin) globalMin = val;
                if (val > globalMax) globalMax = val;
            });
        });
    });
    
    // Draw 6 feature maps in 2x3 grid
    for (let i = 0; i < 6; i++) {
        const row = i % 3;
        const col = Math.floor(i / 3);
        const xPos = startX + col * colSpacing;
        const yPos = startY + row * spacing;
        
        drawMatrix(ctx, featureMaps[i], xPos, yPos, mapSize, globalMin, globalMax);
    }
}

function drawMatrix(ctx, matrix, x, y, size, globalMin, globalMax) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const cellSize = size / Math.max(rows, cols);
    
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const value = matrix[i][j];
            
            let intensity;
            if (globalMax === globalMin) {
                intensity = 128;
            } else {
                intensity = Math.floor(((value - globalMin) / (globalMax - globalMin)) * 255);
            }
            
            ctx.fillStyle = `rgb(${intensity}, ${intensity}, ${intensity})`;
            ctx.fillRect(x + j * cellSize, y + i * cellSize, cellSize - 0.3, cellSize - 0.3);
        }
    }
    
    // Border
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 1, y - 1, size + 2, size + 2);
}

function drawFilter(ctx, kernel, x, y, size) {
    const cellSize = size / 3;
    
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            const value = kernel[i][j];
            
            if (value > 0) {
                ctx.fillStyle = '#ffcccc';
            } else if (value < 0) {
                ctx.fillStyle = '#ccccff';
            } else {
                ctx.fillStyle = '#f0f0f0';
            }
            
            ctx.fillRect(x + j * cellSize, y + i * cellSize, cellSize - 1, cellSize - 1);
            
            // Value text
            ctx.fillStyle = '#333';
            ctx.font = '8px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(value.toString(), x + j * cellSize + cellSize/2, y + i * cellSize + cellSize/2 + 2);
        }
    }
    
    // Border
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 1, y - 1, size + 2, size + 2);
}

function drawArrows(ctx, inputX, filtersX, featureMapsX, reluX, maxPoolX, startY, mapSize, filterSize, arrowLength) {
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    
    const arrowY = startY + 75; // Middle of the maps
    
    // Arrow positions - with proper spacing
    const arrows = [
        { from: inputX + mapSize + 10, to: filtersX - 10 },
        { from: filtersX + filterSize * 2 + 10, to: featureMapsX - 10 },
        { from: featureMapsX + mapSize * 2 + 10, to: reluX - 10 },
        { from: reluX + mapSize * 2 + 10, to: maxPoolX - 10 }
    ];
    
    arrows.forEach(arrow => {
        // Arrow line
        ctx.beginPath();
        ctx.moveTo(arrow.from, arrowY);
        ctx.lineTo(arrow.to, arrowY);
        ctx.stroke();
        
        // Arrow head
        ctx.beginPath();
        ctx.moveTo(arrow.to - 5, arrowY - 3);
        ctx.lineTo(arrow.to, arrowY);
        ctx.lineTo(arrow.to - 5, arrowY + 3);
        ctx.stroke();
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const checkDataAndDraw = () => {
        if (window.cnnInputData) {
            drawSecondLayerStatic();
        } else {
            setTimeout(checkDataAndDraw, 100);
        }
    };
    
    checkDataAndDraw();
}); 