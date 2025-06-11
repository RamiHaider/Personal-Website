// Flattening Animation - From 6 Feature Maps to Column Vector
function drawFlatteningAnimation() {
    const canvas = document.getElementById('flatteningCanvas');
    if (!canvas) {
        console.error('Flattening canvas not found');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    console.log("Starting flattening animation");
    
    // Get CNN data and generate the 6 max-pooled feature maps from second layer
    const cnnData = window.cnnInputData;
    if (!cnnData) {
        console.error('CNN input data not available for flattening');
        return;
    }
    
    // Generate the same feature maps as in second layer
    const inputData = cnnData.normalizedRed;
    const firstLayerInputs = generateFirstLayerMaxPooled(inputData);
    const filters = [
        [[-1, -1, -1], [ 0,  0,  0], [ 1,  1,  1]], // Horizontal edge
        [[-1,  0,  1], [-1,  0,  1], [-1,  0,  1]], // Vertical edge
        [[ 0, -1,  0], [-1,  4, -1], [ 0, -1,  0]], // Diagonal edge
        [[ 1,  1,  1], [ 1,  1,  1], [ 1,  1,  1]], // Blur
        [[-1, -2, -1], [ 0,  0,  0], [ 1,  2,  1]], // Sobel X
        [[-1,  0,  1], [-2,  0,  2], [-1,  0,  1]]  // Sobel Y
    ];
    
    const featureMaps = generateSecondLayerFeatureMaps(firstLayerInputs, filters);
    const reluMaps = featureMaps.map(map => 
        map.map(row => row.map(val => Math.max(0, val)))
    );
    const maxPooledMaps = reluMaps.map(map => maxPool2D(map));
    
    // Calculate dimensions
    const featureMapDim = maxPooledMaps[0].length; // Should be 3x3 or similar
    const totalElements = featureMapDim * featureMapDim * 6; // 6 maps
    
    console.log(`Flattening ${maxPooledMaps.length} maps of ${featureMapDim}x${featureMapDim} = ${totalElements} elements`);
    
    // Layout parameters
    const mapCellSize = 20;
    const vectorCellSize = 2;
    const mapSpacing = 25;
    
    // Positions
    const leftMargin = 40;
    const mapStartY = 120;
    const vectorX = width - 100;
    const vectorStartY = 100;
    const vectorWidth = 25;
    const vectorHeight = height - 200;
    
    let currentMapIndex = 0;
    let currentCellIndex = 0;
    let flattenedVector = [];
    let animationStage = 0; // 0: show maps, 1: flatten one by one, 2: show complete vector, 3: restart
    
    const animateFlattening = () => {
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        
        // Header
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Flattening Feature Maps', width/2, 35);
        
        ctx.fillStyle = '#666666';
        ctx.font = '14px Arial';
        ctx.fillText('Converting 2D feature maps to 1D vector for fully connected layers', width/2, 60);
        
        // Draw the 6 feature maps on the left in 2x3 grid
        for (let mapIdx = 0; mapIdx < 6; mapIdx++) {
            const col = Math.floor(mapIdx / 3);
            const row = mapIdx % 3;
            
            const mapX = leftMargin + col * (featureMapDim * mapCellSize + mapSpacing * 2);
            const mapY = mapStartY + row * (featureMapDim * mapCellSize + mapSpacing);
            
            // Map label
            ctx.fillStyle = '#333333';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`Map ${mapIdx + 1}`, mapX + (featureMapDim * mapCellSize)/2, mapY - 8);
            
            // Draw map cells
            for (let i = 0; i < featureMapDim; i++) {
                for (let j = 0; j < featureMapDim; j++) {
                    const x = mapX + j * mapCellSize;
                    const y = mapY + i * mapCellSize;
                    const value = maxPooledMaps[mapIdx][i][j];
                    
                    // Highlight cells that have been flattened
                    let isFlattened = false;
                    let isCurrentCell = false;
                    
                    if (animationStage >= 1) {
                        if (mapIdx < currentMapIndex) {
                            isFlattened = true; // Entire previous maps are flattened
                        } else if (mapIdx === currentMapIndex) {
                            const cellPosition = i * featureMapDim + j;
                            isFlattened = cellPosition < currentCellIndex;
                            isCurrentCell = cellPosition === currentCellIndex;
                        }
                    }
                    
                    const intensity = Math.min(255, Math.max(0, value * 150 + 50));
                    
                    if (isCurrentCell) {
                        // Highlight current cell being flattened with simple border
                        ctx.fillStyle = `rgba(${intensity}, ${intensity}, ${intensity}, 0.9)`;
                        ctx.fillRect(x, y, mapCellSize - 1, mapCellSize - 1);
                        ctx.fillStyle = '#000000';
                        ctx.font = 'bold 10px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText('→', x + mapCellSize/2, y + mapCellSize/2 + 3);
                    } else if (isFlattened) {
                        // Dimmed for flattened cells
                        ctx.fillStyle = `rgba(${intensity}, ${intensity}, ${intensity}, 0.4)`;
                        ctx.fillRect(x, y, mapCellSize - 1, mapCellSize - 1);
                    } else {
                        // Normal cells
                        ctx.fillStyle = `rgba(${intensity}, ${intensity}, ${intensity}, 0.9)`;
                        ctx.fillRect(x, y, mapCellSize - 1, mapCellSize - 1);
                    }
                    
                    // Border
                    if (isCurrentCell) {
                        ctx.strokeStyle = '#000000';
                        ctx.lineWidth = 3;
                    } else if (isFlattened) {
                        ctx.strokeStyle = '#999999';
                        ctx.lineWidth = 1;
                    } else {
                        ctx.strokeStyle = 'rgba(200, 200, 200, 0.6)';
                        ctx.lineWidth = 0.5;
                    }
                    ctx.strokeRect(x, y, mapCellSize - 1, mapCellSize - 1);
                }
            }
            
            // Map outline
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 2;
            ctx.strokeRect(mapX, mapY, featureMapDim * mapCellSize, featureMapDim * mapCellSize);
        }
        
        // Draw column vector on the right
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Flattened Vector', vectorX + vectorWidth/2, vectorStartY - 30);
        ctx.font = '12px Arial';
        ctx.fillText(`(${totalElements} × 1)`, vectorX + vectorWidth/2, vectorStartY - 12);
        
        // Vector background
        ctx.fillStyle = 'rgba(240, 240, 240, 0.8)';
        ctx.fillRect(vectorX, vectorStartY, vectorWidth, vectorHeight);
        
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.strokeRect(vectorX, vectorStartY, vectorWidth, vectorHeight);
        
        // Draw flattened elements in the vector
        const cellHeight = vectorHeight / totalElements;
        flattenedVector.forEach((element, index) => {
            const y = vectorStartY + index * cellHeight;
            const intensity = Math.min(255, Math.max(0, element.value * 150 + 50));
            
            // Use grayscale intensity for vector elements
            ctx.fillStyle = `rgb(${intensity}, ${intensity}, ${intensity})`;
            ctx.fillRect(vectorX + 2, y, vectorWidth - 4, Math.max(1, cellHeight - 0.5));
        });
        
        // Animation stages
        if (animationStage === 0) {
            // Initial display - show all maps
            setTimeout(() => {
                animationStage = 1;
                animateFlattening();
            }, 1200);
            
        } else if (animationStage === 1) {
            // Flattening animation
            if (currentMapIndex < 6) {
                const currentMap = maxPooledMaps[currentMapIndex];
                const mapSize = featureMapDim * featureMapDim;
                
                if (currentCellIndex < mapSize) {
                    // Add current cell to flattened vector
                    const row = Math.floor(currentCellIndex / featureMapDim);
                    const col = currentCellIndex % featureMapDim;
                    const value = currentMap[row][col];
                    
                    flattenedVector.push({
                        value: value,
                        mapIndex: currentMapIndex,
                        cellIndex: currentCellIndex
                    });
                    
                    currentCellIndex++;
                    setTimeout(animateFlattening, 80); // Moderate speed
                } else {
                    // Move to next map
                    currentMapIndex++;
                    currentCellIndex = 0;
                    setTimeout(animateFlattening, 400); // Brief pause between maps
                }
            } else {
                // All maps flattened
                animationStage = 2;
                setTimeout(animateFlattening, 1500);
            }
            
        } else if (animationStage === 2) {
            // Show complete vector
            ctx.fillStyle = '#10b981';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('✓ Flattening Complete!', width/2, height - 50);
            
            ctx.fillStyle = '#333333';
            ctx.font = '13px Arial';
            ctx.fillText(`${totalElements} features ready for fully connected layers`, width/2, height - 25);
            
            setTimeout(() => {
                animationStage = 3;
                animateFlattening();
            }, 2500);
            
        } else if (animationStage === 3) {
            // Reset and restart
            console.log("Restarting flattening animation");
            currentMapIndex = 0;
            currentCellIndex = 0;
            flattenedVector = [];
            animationStage = 0;
            setTimeout(animateFlattening, 1000);
        }
    };
    
    // Helper functions (same as in second-layer-static.js)
    function generateFirstLayerMaxPooled(inputData) {
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
    
    // Start the animation
    animateFlattening();
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Wait for CNN data to be ready
    const checkDataAndDraw = () => {
        if (window.cnnInputData) {
            console.log('CNN input data ready, starting flattening animation');
            drawFlatteningAnimation();
        } else {
            console.log('Waiting for CNN input data...');
            setTimeout(checkDataAndDraw, 100);
        }
    };
    
    checkDataAndDraw();
}); 