document.addEventListener('DOMContentLoaded', function() {
  // Get the container element
  const container = document.querySelector('.geomineral-container');
  if (!container) return;

  // Create canvas elements
  const mapCanvas = document.createElement('canvas');
  const gridCanvas = document.createElement('canvas');
  const vectorCanvas = document.createElement('canvas');
  const neuralNetworkCanvas = document.createElement('canvas');
  
  // Set canvas properties
  [mapCanvas, gridCanvas, vectorCanvas, neuralNetworkCanvas].forEach(canvas => {
    canvas.width = 800;
    canvas.height = 500;
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
  });
  
  // Make container relative for absolute positioning
  container.style.position = 'relative';
  container.style.height = '300px';
  container.style.overflow = 'hidden';
  container.style.backgroundColor = '#1f2937'; // gray-800
  container.style.borderRadius = '0.5rem';
  
  // Append canvases to container
  container.appendChild(mapCanvas);
  container.appendChild(gridCanvas);
  
  // Create visualization wrapper div
  const visualizationWrapper = document.createElement('div');
  visualizationWrapper.style.position = 'absolute';
  visualizationWrapper.style.inset = '0';
  visualizationWrapper.style.display = 'flex';
  visualizationWrapper.style.alignItems = 'center';
  visualizationWrapper.style.justifyContent = 'center';
  visualizationWrapper.style.padding = '1rem';
  visualizationWrapper.style.opacity = '0';
  visualizationWrapper.style.transition = 'opacity 0.5s ease-in-out';
  container.appendChild(visualizationWrapper);
  
  // Create visualization container
  const vizContainer = document.createElement('div');
  vizContainer.style.width = '100%';
  vizContainer.style.maxWidth = '100%';
  vizContainer.style.height = '100%';
  vizContainer.style.display = 'flex';
  visualizationWrapper.appendChild(vizContainer);
  
  // Create vector, neural network, and prediction sections
  const vectorSection = document.createElement('div');
  vectorSection.style.width = '20%';
  vectorSection.style.backgroundColor = '#111827'; // gray-900
  vectorSection.style.borderRadius = '0.5rem 0 0 0.5rem';
  vectorSection.style.padding = '0.5rem';
  vectorSection.style.transform = 'translateX(-100%)';
  vectorSection.style.transition = 'all 0.5s ease-in-out';
  vectorSection.appendChild(vectorCanvas);
  vizContainer.appendChild(vectorSection);
  
  const nnSection = document.createElement('div');
  nnSection.style.width = '60%';
  nnSection.style.backgroundColor = '#111827'; // gray-900
  nnSection.style.padding = '1rem';
  nnSection.style.display = 'flex';
  nnSection.style.flexDirection = 'column';
  nnSection.style.justifyContent = 'center';
  nnSection.style.alignItems = 'center';
  nnSection.style.opacity = '0';
  nnSection.style.transform = 'scale(0.95)';
  nnSection.style.transition = 'all 0.5s ease-in-out';
  nnSection.appendChild(neuralNetworkCanvas);
  vizContainer.appendChild(nnSection);
  
  const predictionSection = document.createElement('div');
  predictionSection.style.width = '20%';
  predictionSection.style.backgroundColor = '#111827'; // gray-900
  predictionSection.style.borderRadius = '0 0.5rem 0.5rem 0';
  predictionSection.style.padding = '1rem';
  predictionSection.style.transform = 'translateX(100%)';
  predictionSection.style.transition = 'all 0.5s ease-in-out';
  vizContainer.appendChild(predictionSection);
  
  // Create selection box - only one selection box now
  const selectionBox = document.createElement('div');
  selectionBox.style.position = 'absolute';
  selectionBox.style.border = '2px solid #06b6d4'; // cyan-500
  selectionBox.style.transition = 'all 0.5s ease-in-out';
  selectionBox.style.display = 'none'; // Initially hidden
  container.appendChild(selectionBox);
  
  // Create stage indicators
  const stageIndicatorContainer = document.createElement('div');
  stageIndicatorContainer.style.position = 'absolute';
  stageIndicatorContainer.style.bottom = '0.75rem';
  stageIndicatorContainer.style.left = '50%';
  stageIndicatorContainer.style.transform = 'translateX(-50%)';
  stageIndicatorContainer.style.display = 'flex';
  stageIndicatorContainer.style.alignItems = 'center';
  stageIndicatorContainer.style.gap = '0.5rem';
  container.appendChild(stageIndicatorContainer);
  
  const stageLabels = ['Select Region', 'Extract Data', 'Vectorize', 'Process', 'Predict'];
  const stageIndicators = stageLabels.map((label, i) => {
    const indicator = document.createElement('div');
    indicator.textContent = label;
    indicator.style.padding = '0.25rem 0.75rem';
    indicator.style.borderRadius = '9999px';
    indicator.style.fontSize = '0.75rem';
    indicator.style.backgroundColor = '#374151'; // gray-700
    indicator.style.color = '#9ca3af'; // gray-400
    indicator.style.transition = 'all 0.3s ease-in-out';
    stageIndicatorContainer.appendChild(indicator);
    return indicator;
  });
  
  // State variables
  let predictionStage = 0;
  let selectionBoxState = { x: 240, y: 120, width: 60, height: 60 };
  let predictionResults = null;
  let gridData = [];
  let backgroundPixels = [];
  let activeNeuronIndices = {
    input: -1,
    conv1: -1,
    conv2: -1,
    conv3: -1,
    fc: -1,
    output: -1
  };
  
  // Generate geographical background pixels
  function generateGeoPixels() {
    const pixels = [];
    const canvasWidth = 800;
    const canvasHeight = 500;
    const pixelSize = 10;
    
    // Create different geographical regions
    const regions = [
      { type: 'water', baseColor: { r: 30, g: 60, b: 120 }, variance: 20 },
      { type: 'plains', baseColor: { r: 100, g: 160, b: 90 }, variance: 30 },
      { type: 'desert', baseColor: { r: 210, g: 180, b: 140 }, variance: 25 },
      { type: 'mountains', baseColor: { r: 120, g: 100, b: 90 }, variance: 40 },
      { type: 'forest', baseColor: { r: 40, g: 100, b: 50 }, variance: 35 }
    ];
    
    // Create region map
    const regionMap = Array(Math.ceil(canvasHeight / pixelSize))
      .fill()
      .map(() => Array(Math.ceil(canvasWidth / pixelSize)).fill(0));
    
    // Generate random region centers
    const numRegionCenters = 8;
    const regionCenters = [];
    
    for (let i = 0; i < numRegionCenters; i++) {
      regionCenters.push({
        x: Math.floor(Math.random() * (canvasWidth / pixelSize)),
        y: Math.floor(Math.random() * (canvasHeight / pixelSize)),
        type: Math.floor(Math.random() * regions.length)
      });
    }
    
    // Assign each cell to the closest region center
    for (let y = 0; y < regionMap.length; y++) {
      for (let x = 0; x < regionMap[0].length; x++) {
        let closestDistance = Infinity;
        let closestRegion = 0;
        
        regionCenters.forEach((center, idx) => {
          const distance = Math.sqrt(Math.pow(center.x - x, 2) + Math.pow(center.y - y, 2));
          if (distance < closestDistance) {
            closestDistance = distance;
            closestRegion = center.type;
          }
        });
        
        regionMap[y][x] = closestRegion;
      }
    }
    
    // Create pixels based on regionMap
    for (let y = 0; y < canvasHeight; y += pixelSize) {
      const row = [];
      for (let x = 0; x < canvasWidth; x += pixelSize) {
        const regionIdx = regionMap[Math.floor(y / pixelSize)][Math.floor(x / pixelSize)];
        const region = regions[regionIdx];
        
        // Add noise/variance for natural look
        const color = {
          r: Math.min(255, Math.max(0, region.baseColor.r + (Math.random() * region.variance * 2 - region.variance))),
          g: Math.min(255, Math.max(0, region.baseColor.g + (Math.random() * region.variance * 2 - region.variance))),
          b: Math.min(255, Math.max(0, region.baseColor.b + (Math.random() * region.variance * 2 - region.variance)))
        };
        
        row.push({
          x,
          y,
          width: pixelSize,
          height: pixelSize,
          color,
          region: region.type
        });
      }
      pixels.push(row);
    }
    
    return pixels;
  }
  
  // Draw background pixels on canvas
  function drawBackgroundPixels() {
    const ctx = mapCanvas.getContext('2d');
    ctx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
    
    // Draw all background pixels
    backgroundPixels.forEach(row => {
      row.forEach(pixel => {
        ctx.fillStyle = `rgb(${pixel.color.r}, ${pixel.color.g}, ${pixel.color.b})`;
        ctx.fillRect(pixel.x, pixel.y, pixel.width, pixel.height);
      });
    });
  }
  
  // Update selection box and grid data
  function updateSelection() {
    // Only show and update selection box in stage 1
    if (predictionStage === 1) {
      selectionBox.style.display = 'block';
      selectionBox.style.left = selectionBoxState.x + 'px';
      selectionBox.style.top = selectionBoxState.y + 'px';
      selectionBox.style.width = selectionBoxState.width + 'px';
      selectionBox.style.height = selectionBoxState.height + 'px';
      
      selectionBox.style.borderStyle = 'dashed';
      selectionBox.style.boxShadow = '0 0 10px rgba(34, 211, 238, 0.5)';
      selectionBox.style.animation = 'pulse 1.5s infinite alternate';
      
      // Extract grid data from pixels in selection - ensure exact pixel boundaries
      // Make sure to snap to the grid boundaries
      const pixelSize = 10;
      
      // Snap selectionBox to pixel grid
      const snappedX = Math.floor(selectionBoxState.x / pixelSize) * pixelSize;
      const snappedY = Math.floor(selectionBoxState.y / pixelSize) * pixelSize;
      const snappedWidth = Math.ceil(selectionBoxState.width / pixelSize) * pixelSize;
      const snappedHeight = Math.ceil(selectionBoxState.height / pixelSize) * pixelSize;
      
      // Update the selection box position to match the grid
      selectionBox.style.left = snappedX + 'px';
      selectionBox.style.top = snappedY + 'px';
      selectionBox.style.width = snappedWidth + 'px';
      selectionBox.style.height = snappedHeight + 'px';
      
      gridData = [];
      backgroundPixels.forEach(row => {
        const rowData = [];
        row.forEach(pixel => {
          if (
            pixel.x >= snappedX && 
            pixel.x < snappedX + snappedWidth &&
            pixel.y >= snappedY && 
            pixel.y < snappedY + snappedHeight
          ) {
            rowData.push({
              ...pixel,
              inSelection: true
            });
          }
        });
        if (rowData.length > 0) {
          gridData.push(rowData);
        }
      });
      
      // Draw grid
      const ctx = gridCanvas.getContext('2d');
      ctx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
      
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        snappedX - 1, 
        snappedY - 1, 
        snappedWidth + 2, 
        snappedHeight + 2
      );
      
      if (gridData.length > 0) {
        gridData.forEach(row => {
          row.forEach(cell => {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.lineWidth = 1;
            ctx.strokeRect(cell.x, cell.y, cell.width, cell.height);
          });
        });
      }
    } else if (predictionStage === 0) {
      // If we're in stage 0, just set the position but keep hidden
      selectionBox.style.display = 'none';
      selectionBox.style.left = selectionBoxState.x + 'px';
      selectionBox.style.top = selectionBoxState.y + 'px';
      selectionBox.style.width = selectionBoxState.width + 'px';
      selectionBox.style.height = selectionBoxState.height + 'px';
    } else {
      // For other stages, hide the selection box
      selectionBox.style.display = 'none';
    }
  }
  
  // Transition background to focus on selection
  function fadeBackgroundForMatrix() {
    if (predictionStage < 2 || gridData.length === 0) return;
    
    // Create overlay to fade background except for selection area
    mapCanvas.style.transition = 'opacity 1s ease-in-out';
    
    // Make the background slightly transparent
    mapCanvas.style.opacity = '0.3';
    
    // Make selection box transition
    selectionBox.style.opacity = '0';
    
    // Highlight matrix cells
    const ctx = gridCanvas.getContext('2d');
    ctx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
    
    gridData.forEach(row => {
      row.forEach(cell => {
        // Draw highlighted cell borders
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 1;
        ctx.strokeRect(cell.x, cell.y, cell.width, cell.height);
        
        // Draw cell with slightly enhanced color
        const brightenFactor = 1.2;
        ctx.fillStyle = `rgba(
          ${Math.min(255, cell.color.r * brightenFactor)},
          ${Math.min(255, cell.color.g * brightenFactor)},
          ${Math.min(255, cell.color.b * brightenFactor)},
          0.9)`;
        ctx.fillRect(cell.x + 1, cell.y + 1, cell.width - 2, cell.height - 2);
      });
    });
  }
  
  // Matrix to vector animation - improved cell-by-cell animation
  function animateVectorization() {
    if (predictionStage < 2 || gridData.length === 0) return;
    
    // First fade the background and highlight the matrix
    fadeBackgroundForMatrix();
    
    const ctx = vectorCanvas.getContext('2d');
    let startTime = Date.now();
    let cellIndex = 0;
    let animationId;
    
    // Vector cells setup
    const vectorCellHeight = 8; // Slightly larger for visibility
    const vectorCellWidth = vectorCanvas.width - 20;
    const vectorCellSpacing = 2;
    
    // Flatten grid data
    const flattenedCells = [];
    gridData.forEach(row => {
      row.forEach(cell => {
        flattenedCells.push(cell);
      });
    });
    
    // Sort by y then x for row-by-row unwrapping
    flattenedCells.sort((a, b) => {
      if (a.y === b.y) return a.x - b.x;
      return a.y - b.y;
    });
    
    const totalCells = flattenedCells.length;
    const cellsInVector = [];
    
    // Clear vector canvas initially
    ctx.clearRect(0, 0, vectorCanvas.width, vectorCanvas.height);
    
    // Draw label for feature vector
    ctx.fillStyle = 'rgba(34, 211, 238, 0.9)';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Feature Vector', vectorCanvas.width / 2, 20);
    
    const animateNextCell = () => {
      if (cellIndex >= totalCells) {
        return;
      }
      
      const cell = flattenedCells[cellIndex];
      const vectorY = 30 + cellIndex * (vectorCellHeight + vectorCellSpacing);
      
      // Animation for cell movement
      let cellAnimationProgress = 0;
      const animationDuration = 200; // ms per cell - twice as fast (was 800)
      const cellAnimationStart = Date.now();
      
      const animateCellMovement = () => {
        // Calculate animation progress
        const elapsed = Date.now() - cellAnimationStart;
        cellAnimationProgress = Math.min(1, elapsed / animationDuration);
        
        // Starting position (in the matrix)
        const startX = cell.x;
        const startY = cell.y;
        const startWidth = cell.width;
        const startHeight = cell.height;
        
        // Ending position (in the vector)
        const endX = 10;
        const endY = vectorY;
        const endWidth = vectorCellWidth;
        const endHeight = vectorCellHeight;
        
        // Current position based on animation progress
        const currentX = startX + (endX - startX) * cellAnimationProgress;
        const currentY = startY + (endY - startY) * cellAnimationProgress;
        const currentWidth = startWidth + (endWidth - startWidth) * cellAnimationProgress;
        const currentHeight = startHeight + (endHeight - startHeight) * cellAnimationProgress;
        
        // Highlight the current cell in the grid
        const gridCtx = gridCanvas.getContext('2d');
        
        // Redraw all cells to ensure they stay visible
        gridData.forEach(row => {
          row.forEach(gridCell => {
            // Skip the current animating cell - it's moving
            if (gridCell.x === cell.x && gridCell.y === cell.y) return;
            
            const isAlreadyProcessed = flattenedCells.findIndex(fc => 
              fc.x === gridCell.x && fc.y === gridCell.y) < cellIndex;
              
            // Redraw with appropriate style
            if (isAlreadyProcessed) {
              // Already processed cells are dimmed
              gridCtx.fillStyle = `rgba(${gridCell.color.r}, ${gridCell.color.g}, ${gridCell.color.b}, 0.3)`;
            } else {
              // Unprocessed cells remain bright
              gridCtx.fillStyle = `rgba(${gridCell.color.r}, ${gridCell.color.g}, ${gridCell.color.b}, 0.9)`;
            }
            gridCtx.fillRect(gridCell.x + 1, gridCell.y + 1, gridCell.width - 2, gridCell.height - 2);
            gridCtx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            gridCtx.lineWidth = 1;
            gridCtx.strokeRect(gridCell.x, gridCell.y, gridCell.width, gridCell.height);
          });
        });
        
        // Draw moving cell
        gridCtx.clearRect(cell.x, cell.y, cell.width, cell.height);
        
        // Redraw vector canvas with all previously moved cells and the current one
        ctx.clearRect(0, 0, vectorCanvas.width, vectorCanvas.height);
        
        // Redraw the label
        ctx.fillStyle = 'rgba(34, 211, 238, 0.9)';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Feature Vector', vectorCanvas.width / 2, 20);
        
        // Draw previously transferred cells
        cellsInVector.forEach(item => {
          ctx.fillStyle = `rgba(${item.color.r}, ${item.color.g}, ${item.color.b}, 0.8)`;
          ctx.fillRect(item.x, item.y, item.width, item.height);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = 1;
          ctx.strokeRect(item.x, item.y, item.width, item.height);
        });
        
        // Draw the current moving cell
        ctx.fillStyle = `rgba(${cell.color.r}, ${cell.color.g}, ${cell.color.b}, 0.8)`;
        ctx.fillRect(currentX, currentY, currentWidth, currentHeight);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1;
        ctx.strokeRect(currentX, currentY, currentWidth, currentHeight);
        
        // Continue animation if not complete
        if (cellAnimationProgress < 1) {
          requestAnimationFrame(animateCellMovement);
        } else {
          // Animation complete, store the cell in final position
          cellsInVector.push({
            x: endX,
            y: endY,
            width: endWidth,
            height: endHeight,
            color: cell.color
          });
          
          // Move to next cell
          cellIndex++;
          
          // Continue to next cell with a small delay
          if (cellIndex < totalCells) {
            setTimeout(animateNextCell, 50); // Faster cell transition (was 100)
          }
        }
      };
      
      // Start the cell animation
      animateCellMovement();
    };
    
    // Start the animation with the first cell
    setTimeout(animateNextCell, 500);
  }
  
  // Neural network animation
  function animateNeuralNetwork() {
    if (predictionStage < 3) return;
    
    const ctx = neuralNetworkCanvas.getContext('2d');
    const width = neuralNetworkCanvas.width;
    const height = neuralNetworkCanvas.height;
    
    let animationFrame;
    
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Define neural network layers
      const layers = [
        { name: 'input', neurons: 10, x: 50, color: '#3b82f6' },
        { name: 'conv1', neurons: 6, x: 150, color: '#06b6d4' },
        { name: 'conv2', neurons: 6, x: 250, color: '#14b8a6' },
        { name: 'conv3', neurons: 6, x: 350, color: '#10b981' },
        { name: 'fc', neurons: 8, x: 450, color: '#6366f1' },
        { name: 'output', neurons: 3, x: 550, color: '#ec4899' }
      ];
      
      // Draw connections first (behind neurons)
      layers.forEach((layer, layerIndex) => {
        if (layerIndex === 0) return; // Skip first layer (no incoming connections)
        
        const prevLayer = layers[layerIndex - 1];
        const sourceActive = activeNeuronIndices[prevLayer.name];
        const targetActive = activeNeuronIndices[layer.name];
        
        // Draw connections
        for (let i = 0; i < prevLayer.neurons; i++) {
          for (let j = 0; j < layer.neurons; j++) {
            const sourceX = prevLayer.x;
            const sourceY = 50 + ((height - 100) / (prevLayer.neurons - 1)) * i;
            const targetX = layer.x;
            const targetY = 50 + ((height - 100) / (layer.neurons - 1)) * j;
            
            // Determine if this connection is active
            const isActive = sourceActive >= i && targetActive >= 0;
            
            // Draw connection with gradient
            const gradient = ctx.createLinearGradient(sourceX, sourceY, targetX, targetY);
            gradient.addColorStop(0, prevLayer.color);
            gradient.addColorStop(1, layer.color);
            
            ctx.beginPath();
            ctx.moveTo(sourceX, sourceY);
            ctx.lineTo(targetX, targetY);
            ctx.strokeStyle = isActive ? gradient : 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = isActive ? 1.5 : 0.5;
            ctx.stroke();
          }
        }
      });
      
      // Draw neurons
      layers.forEach((layer, layerIndex) => {
        const activeIndex = activeNeuronIndices[layer.name];
        
        for (let i = 0; i < layer.neurons; i++) {
          const x = layer.x;
          const y = 50 + ((height - 100) / (layer.neurons - 1)) * i;
          
          // Determine if this neuron is active
          const isActive = i <= activeIndex;
          
          // Calculate neuron size
          const baseSize = layerIndex === 5 ? 10 : 6; // Output neurons are larger
          const size = isActive ? baseSize * 1.5 : baseSize;
          
          // Draw neuron
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fillStyle = isActive ? layer.color : 'rgba(255, 255, 255, 0.3)';
          
          // Add glow effect to active neurons
          if (isActive) {
            ctx.shadowColor = layer.color;
            ctx.shadowBlur = 10;
          } else {
            ctx.shadowBlur = 0;
          }
          
          ctx.fill();
          ctx.shadowBlur = 0;
          
          // Draw neuron border
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        
        // Add layer label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(layer.name.toUpperCase(), layer.x, 25);
      });
      
      // Continue animation
      if (predictionStage === 3) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }
  
  // Show prediction results
  function showPredictionResults() {
    if (!predictionResults || predictionStage < 4) return;
    
    // Clear previous content
    predictionSection.innerHTML = '';
    
    // Create header
    const header = document.createElement('div');
    header.textContent = 'Prediction Results';
    header.style.fontSize = '0.75rem';
    header.style.textAlign = 'center';
    header.style.marginBottom = '0.5rem';
    header.style.color = '#22d3ee'; // cyan-400
    predictionSection.appendChild(header);
    
    // Create results container
    const resultsContainer = document.createElement('div');
    resultsContainer.style.marginTop = '1rem';
    predictionSection.appendChild(resultsContainer);
    
    // Add each mineral prediction
    predictionResults.forEach((mineral, i) => {
      const mineralContainer = document.createElement('div');
      mineralContainer.style.marginBottom = '0.75rem';
      
      // Mineral name row
      const nameRow = document.createElement('div');
      nameRow.style.display = 'flex';
      nameRow.style.alignItems = 'center';
      nameRow.style.gap = '0.5rem';
      nameRow.style.marginBottom = '0.25rem';
      
      const colorDot = document.createElement('div');
      colorDot.style.width = '0.75rem';
      colorDot.style.height = '0.75rem';
      colorDot.style.borderRadius = '9999px';
      colorDot.style.backgroundColor = mineral.color;
      
      const nameLabel = document.createElement('span');
      nameLabel.textContent = mineral.type;
      nameLabel.style.fontSize = '0.875rem';
      nameLabel.style.color = 'white';
      
      nameRow.appendChild(colorDot);
      nameRow.appendChild(nameLabel);
      mineralContainer.appendChild(nameRow);
      
      // Progress bar
      const progressBar = document.createElement('div');
      progressBar.style.width = '100%';
      progressBar.style.height = '0.75rem';
      progressBar.style.backgroundColor = '#374151'; // gray-700
      progressBar.style.borderRadius = '9999px';
      progressBar.style.overflow = 'hidden';
      
      const progress = document.createElement('div');
      progress.style.height = '100%';
      progress.style.width = `${mineral.probability * 100}%`;
      progress.style.backgroundColor = mineral.color;
      progress.style.opacity = '0.8';
      progress.style.borderRadius = '9999px';
      progress.style.transition = 'width 1s ease-in-out';
      
      progressBar.appendChild(progress);
      mineralContainer.appendChild(progressBar);
      
      // Percentage label
      const percentLabel = document.createElement('span');
      percentLabel.textContent = `${Math.round(mineral.probability * 100)}%`;
      percentLabel.style.fontSize = '0.75rem';
      percentLabel.style.fontWeight = '500';
      percentLabel.style.color = '#d1d5db'; // gray-300
      percentLabel.style.display = 'block';
      percentLabel.style.textAlign = 'right';
      percentLabel.style.marginTop = '0.25rem';
      
      mineralContainer.appendChild(percentLabel);
      resultsContainer.appendChild(mineralContainer);
    });
  }
  
  // Update stage indicators
  function updateStageIndicators() {
    stageIndicators.forEach((indicator, i) => {
      if (i === predictionStage) {
        indicator.style.backgroundColor = '#155e75'; // cyan-800
        indicator.style.color = 'white';
      } else {
        indicator.style.backgroundColor = '#374151'; // gray-700
        indicator.style.color = '#9ca3af'; // gray-400
      }
    });
  }
  
  // Add CSS animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0% { opacity: 0.4; }
      100% { opacity: 0.8; }
    }
    
    @keyframes pulseSize {
      0% { transform: scale(0.9); }
      100% { transform: scale(1.1); }
    }
    
    @keyframes pulseNeural {
      0% { transform: scale(0.8); opacity: 0.6; }
      100% { transform: scale(1.2); opacity: 1; }
    }
    
    @keyframes pulseBrighter {
      0% { filter: brightness(0.8); transform: scale(0.9); }
      100% { filter: brightness(1.3); transform: scale(1.1); }
    }
  `;
  document.head.appendChild(style);
  
  // Main animation sequence
  function runVisualization() {
    // Reset everything
    predictionStage = 0;
    predictionResults = null;
    gridData = [];
    activeNeuronIndices = {
      input: -1,
      conv1: -1,
      conv2: -1,
      conv3: -1,
      fc: -1,
      output: -1
    };
    
    // Generate new random position - snap to pixel grid with exactly 4x4 cells
    const pixelSize = 10;
    const gridCols = 4; // Fixed at 4 cells wide
    const gridRows = 4; // Fixed at 4 cells tall
    
    const newX = Math.floor((100 + Math.floor(Math.random() * 500)) / pixelSize) * pixelSize;
    const newY = Math.floor((50 + Math.floor(Math.random() * 300)) / pixelSize) * pixelSize;
    selectionBoxState = { 
      x: newX, 
      y: newY, 
      width: gridCols * pixelSize, 
      height: gridRows * pixelSize 
    };
    
    // Initially hide the selection box
    selectionBox.style.display = 'none';
    
    updateSelection();
    updateStageIndicators();
    
    // Reset canvases
    const contexts = [
      mapCanvas.getContext('2d'),
      gridCanvas.getContext('2d'),
      vectorCanvas.getContext('2d'),
      neuralNetworkCanvas.getContext('2d')
    ];
    contexts.forEach(ctx => ctx.clearRect(0, 0, 800, 500));
    
    // Reset visualization display
    mapCanvas.style.opacity = '1';
    visualizationWrapper.style.opacity = '0';
    vectorSection.style.transform = 'translateX(-100%)';
    nnSection.style.opacity = '0';
    nnSection.style.transform = 'scale(0.95)';
    predictionSection.style.transform = 'translateX(100%)';
    
    // Generate background pixels
    backgroundPixels = generateGeoPixels();
    drawBackgroundPixels();
    
    // Schedule stages
    setTimeout(() => {
      predictionStage = 1; // Now selection box will appear
      updateSelection();
      updateStageIndicators();
    }, 2000);
    
    setTimeout(() => {
      predictionStage = 2;
      updateSelection(); // This will hide the selection box
      visualizationWrapper.style.opacity = '1';
      vectorSection.style.transform = 'translateX(0)';
      updateStageIndicators();
      animateVectorization();
    }, 4000);
    
    setTimeout(() => {
      predictionStage = 3;
      nnSection.style.opacity = '1';
      nnSection.style.transform = 'scale(1)';
      updateStageIndicators();
      
      // Animate data flowing through neural network
      const layerNames = ['input', 'conv1', 'conv2', 'conv3', 'fc', 'output'];
      const layerSizes = [10, 6, 6, 6, 8, 3];
      
      layerNames.forEach((layer, layerIdx) => {
        for (let i = 0; i < layerSizes[layerIdx]; i++) {
          setTimeout(() => {
            activeNeuronIndices[layer] = i;
            animateNeuralNetwork();
            
            if (layer === 'output' && i === layerSizes[layerIdx] - 1) {
              setTimeout(() => {
                predictionStage = 4;
                predictionResults = [
                  { type: 'Gold', probability: 0.82, color: '#FFD700' },
                  { type: 'Copper', probability: 0.47, color: '#B87333' },
                  { type: 'Iron', probability: 0.23, color: '#a52a2a' }
                ];
                predictionSection.style.transform = 'translateX(0)';
                updateStageIndicators();
                showPredictionResults();
              }, 500);
            }
          }, (layerIdx * 1500) + (i * 300));
        }
      });
      
      animateNeuralNetwork();
    }, 9000); // Reduced from 12000 to 9000 to account for faster animation
    
    // Reset and restart the animation
    setTimeout(() => {
      runVisualization();
    }, 22000); // Reduced from 25000 to 22000
  }
  
  // Initialize and start visualization
  runVisualization();
}); 