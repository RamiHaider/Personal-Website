// Parallel Neural Network Visualization
function drawParallelNeuralNetwork() {
    const canvas = document.getElementById('neuralNetworkCanvas');
    if (!canvas) {
        console.error('Neural network canvas not found');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;  
    const height = canvas.height;
    
    console.log("Starting parallel neural network animation");
    
    // Get the flattened vector data from our CNN pipeline
    const cnnData = window.cnnInputData;
    if (!cnnData) {
        console.error('CNN input data not available for neural network');
        return;
    }
    
    // Generate the flattened vector (same as in flattening animation)
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
    
    // Create flattened vector
    const flattenedVector = [];
    maxPooledMaps.forEach(map => {
        map.forEach(row => {
            row.forEach(value => {
                flattenedVector.push(value);
            });
        });
    });
    
    console.log(`Neural network input: ${flattenedVector.length} features`);
    
    // Network architecture - simpler for our CNN blog
    const layers = [
        { name: 'input', neurons: flattenedVector.length, x: 80, color: '#3b82f6' },
        { name: 'hidden1', neurons: 32, x: 250, color: '#06b6d4' },
        { name: 'hidden2', neurons: 16, x: 420, color: '#14b8a6' },
        { name: 'hidden3', neurons: 8, x: 590, color: '#10b981' },
        { name: 'output', neurons: 3, x: 760, color: '#ec4899' }
    ];
    
    // Animation state
    let currentLayerPair = 0;
    let animationStep = 0;
    let connections = [];
    let isAnimating = true;
    
    // Layer processing pairs
    const layerPairs = [
        { from: 0, to: 1, name: 'Input → Hidden 1' },
        { from: 1, to: 2, name: 'Hidden 1 → Hidden 2' },
        { from: 2, to: 3, name: 'Hidden 2 → Hidden 3' },
        { from: 3, to: 4, name: 'Hidden 3 → Output' }
    ];
    
    function getLayerPositions(layerIndex) {
        const layer = layers[layerIndex];
        const positions = [];
        
        if (layerIndex === 0) {
            // Input layer - vertical column of feature vector
            const columnWidth = 30;
            const columnHeight = height - 120;
            const cellHeight = columnHeight / layer.neurons;
            const startY = 80;
            
            for (let i = 0; i < layer.neurons; i++) {
                positions.push({
                    x: layer.x,
                    y: startY + i * cellHeight,
                    width: columnWidth,
                    height: Math.max(1, cellHeight - 0.5)
                });
            }
        } else {
            // Hidden/Output layers - circular neurons spread vertically
            const startY = 100;
            const endY = height - 100;
            const spacing = layer.neurons > 1 ? (endY - startY) / (layer.neurons - 1) : 0;
            
            for (let i = 0; i < layer.neurons; i++) {
                positions.push({
                    x: layer.x,
                    y: startY + i * spacing,
                    width: 16,
                    height: 16
                });
            }
        }
        
        return positions;
    }
    
    function drawBackground() {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        
        // Header
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Fully Connected Neural Network', width/2, 30);
        
        ctx.fillStyle = '#666666';
        ctx.font = '12px Arial';
        ctx.fillText('Processing flattened features through parallel connections', width/2, 50);
    }
    
    function drawLayers() {
        layers.forEach((layer, layerIdx) => {
            const positions = getLayerPositions(layerIdx);
            
            // Layer label
            ctx.fillStyle = '#333333';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(layer.name.replace('hidden', 'Hidden '), layer.x + (layerIdx === 0 ? 15 : 0), height - 20);
            
            if (layerIdx === 0) {
                // Input layer - draw feature vector column
                positions.forEach((pos, i) => {
                    const value = flattenedVector[i];
                    const intensity = Math.min(255, Math.max(50, value * 150 + 50));
                    
                    ctx.fillStyle = `rgb(${intensity}, ${intensity}, ${intensity})`;
                    ctx.fillRect(pos.x, pos.y, pos.width, pos.height);
                });
                
                // Column border
                ctx.strokeStyle = '#333333';
                ctx.lineWidth = 2;
                ctx.strokeRect(positions[0].x - 2, positions[0].y - 2, 
                              positions[0].width + 4, 
                              positions[positions.length-1].y - positions[0].y + positions[positions.length-1].height + 4);
                
                // Input count label
                ctx.fillStyle = '#666666';
                ctx.font = '10px Arial';
                ctx.fillText(`(${layer.neurons})`, layer.x + 15, height - 5);
                
            } else {
                // Hidden/Output layers - circular neurons
                positions.forEach((pos, i) => {
                    const pair = layerPairs[currentLayerPair];
                    const isTargetLayer = pair && pair.to === layerIdx;
                    const isActive = isTargetLayer && animationStep < 30; // Show activation briefly
                    
                    ctx.beginPath();
                    ctx.arc(pos.x, pos.y + pos.height/2, pos.width/2, 0, Math.PI * 2);
                    
                    if (isActive) {
                        ctx.fillStyle = layer.color;
                    } else {
                        ctx.fillStyle = 'rgba(200, 200, 200, 0.8)';
                    }
                    
                    ctx.fill();
                    
                    // Border
                    ctx.strokeStyle = '#999999';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                });
                
                // Neuron count label
                ctx.fillStyle = '#666666';
                ctx.font = '10px Arial';
                ctx.fillText(`(${layer.neurons})`, layer.x, height - 5);
            }
        });
    }
    
    function drawConnections() {
        connections.forEach(conn => {
            const alpha = Math.max(0.1, 1 - (conn.age / 90)); // Fade over 1.5 seconds
            
            ctx.strokeStyle = `rgba(100, 100, 100, ${alpha * 0.6})`;
            ctx.lineWidth = 0.8;
            
            ctx.beginPath();
            ctx.moveTo(conn.fromX, conn.fromY);
            ctx.lineTo(conn.toX, conn.toY);
            ctx.stroke();
            
            conn.age++;
        });
        
        // Remove old connections
        connections = connections.filter(conn => conn.age < 90);
    }
    
    function createAllConnections(fromLayerIdx, toLayerIdx) {
        const fromPositions = getLayerPositions(fromLayerIdx);
        const toPositions = getLayerPositions(toLayerIdx);
        
        // Create ALL connections simultaneously (parallel processing)
        fromPositions.forEach(fromPos => {
            toPositions.forEach(toPos => {
                connections.push({
                    fromX: fromPos.x + fromPos.width,
                    fromY: fromPos.y + fromPos.height/2,
                    toX: toPos.x,
                    toY: toPos.y + toPos.height/2,
                    age: 0
                });
            });
        });
    }
    
    function animate() {
        if (!isAnimating) return;
        
        drawBackground();
        drawConnections();
        drawLayers();
        
        animationStep++;
        
        // Process each layer pair with delays
        if (animationStep === 30) {
            // Input → Hidden 1
            createAllConnections(0, 1);
            currentLayerPair = 0;
        } else if (animationStep === 90) {
            // Hidden 1 → Hidden 2  
            createAllConnections(1, 2);
            currentLayerPair = 1;
        } else if (animationStep === 150) {
            // Hidden 2 → Hidden 3
            createAllConnections(2, 3);
            currentLayerPair = 2;
        } else if (animationStep === 210) {
            // Hidden 3 → Output
            createAllConnections(3, 4);
            currentLayerPair = 3;
        } else if (animationStep === 300) {
            // Animation complete - pause and restart
            setTimeout(() => {
                animationStep = 0;
                currentLayerPair = 0;
                connections = [];
                animate();
            }, 2000);
            return;
        }
        
        requestAnimationFrame(animate);
    }
    
    // Helper functions (same as in flattening animation)
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
    animate();
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Wait for CNN data to be ready
    const checkDataAndDraw = () => {
        if (window.cnnInputData) {
            console.log('CNN input data ready, starting neural network animation');
            drawParallelNeuralNetwork();
        } else {
            console.log('Waiting for CNN input data...');
            setTimeout(checkDataAndDraw, 100);
        }
    };
    
    checkDataAndDraw();
}); 