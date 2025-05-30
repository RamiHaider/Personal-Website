document.addEventListener('DOMContentLoaded', function() {
  // Get the container element
  const container = document.querySelector('.geomineral-container');
  if (!container) return;

  // Create canvas elements
  const mapCanvas = document.createElement('canvas');
  const gridCanvas = document.createElement('canvas');
  const vectorCanvas = document.createElement('canvas');
  const cnnCanvas = document.createElement('canvas'); // NEW: CNN visualization canvas
  const neuralNetworkCanvas = document.createElement('canvas');
  
  // Set canvas properties
  [mapCanvas, gridCanvas, vectorCanvas, cnnCanvas, neuralNetworkCanvas].forEach(canvas => {
    canvas.width = 800;
    canvas.height = 500;
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
  });
  
  // Make container relative for absolute positioning
  container.style.position = 'relative';
  container.style.height = '300px'; // Reverted back to the original 300px height
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
  visualizationWrapper.style.padding = '0'; // Removed padding to fill screen
  visualizationWrapper.style.opacity = '0';
  visualizationWrapper.style.transition = 'opacity 0.5s ease-in-out';
  container.appendChild(visualizationWrapper);
  
  // Create CNN visualization wrapper (NEW)
  const cnnWrapper = document.createElement('div');
  cnnWrapper.style.position = 'absolute';
  cnnWrapper.style.inset = '0';
  cnnWrapper.style.backgroundColor = '#111827'; // gray-900
  cnnWrapper.style.display = 'flex';
  cnnWrapper.style.alignItems = 'center';
  cnnWrapper.style.justifyContent = 'center';
  cnnWrapper.style.padding = '1rem';
  cnnWrapper.style.opacity = '0';
  cnnWrapper.style.transition = 'opacity 0.5s ease-in-out';
  cnnWrapper.appendChild(cnnCanvas);
  container.appendChild(cnnWrapper);
  
  // Create visualization container
  const vizContainer = document.createElement('div');
  vizContainer.style.width = '100%';
  vizContainer.style.maxWidth = '100%';
  vizContainer.style.height = '100%';
  vizContainer.style.display = 'flex';
  visualizationWrapper.appendChild(vizContainer);
  
  // Create vector, neural network, and prediction sections
  const vectorSection = document.createElement('div');
  vectorSection.style.width = '25%'; // Increased from 20% to 25%
  vectorSection.style.backgroundColor = '#111827'; // gray-900
  vectorSection.style.borderRadius = '0.5rem 0 0 0.5rem';
  vectorSection.style.padding = '0.5rem';
  vectorSection.style.transform = 'translateX(-100%)';
  vectorSection.style.transition = 'all 0.5s ease-in-out';
  vectorSection.appendChild(vectorCanvas);
  vizContainer.appendChild(vectorSection);
  
  const nnSection = document.createElement('div');
  nnSection.style.width = '50%'; // Stay at 50%
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
  predictionSection.style.width = '25%'; // Increased from 20% to 25%
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
  stageIndicatorContainer.style.display = 'none'; // Hide the indicators completely
  stageIndicatorContainer.style.alignItems = 'center';
  stageIndicatorContainer.style.gap = '0.5rem';
  container.appendChild(stageIndicatorContainer);
  
  const stageLabels = ['Select Region', 'Extract Matrix', 'CNN Processing', 'Feature Extraction', 'Neural Network', 'Predict'];
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
  let cellsInVector = [];
  // Track established connections to make them persistent
  let establishedConnections = [];
  let persistentConnections = []; // Array to store all connections
  let activeNeuronIndices = {
    input: -1,
    hidden1: -1,
    hidden2: -1,
    hidden3: -1,
    output: -1
  };
  let backgroundImage = new Image();
  let imageLoaded = false;

  // CNN-related state variables (NEW)
  let inputMatrix = [];
  let currentKernelIndex = 0;
  let currentCNNStage = 'convolution'; // 'convolution', 'relu', 'maxpool'
  let featureMaps = [];
  let currentConvStep = 0;
  let finalFeatureVector = [];
  
  // Define CNN kernels (3x3)
  const cnnKernels = [
    {
      name: 'Horizontal Sobel',
      values: [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]],
      color: '#ef4444' // red
    },
    {
      name: 'Vertical Sobel', 
      values: [[-1, -2, -1], [0, 0, 0], [1, 2, 1]],
      color: '#22c55e' // green
    },
    {
      name: 'Edge Detection',
      values: [[0, -1, 0], [-1, 4, -1], [0, -1, 0]],
      color: '#3b82f6' // blue
    },
    {
      name: 'Blur',
      values: [[1/9, 1/9, 1/9], [1/9, 1/9, 1/9], [1/9, 1/9, 1/9]],
      color: '#a855f7' // purple
    }
  ];
  
  // --- NEW: Image Loading and Processing Logic ---
  backgroundImage.onload = () => {
    console.log("Background image loaded.");
    imageLoaded = true;
    drawImageBackground(); // Draw the full image first

    // After showing the image, convert it to pixels and start the animation sequence
    setTimeout(() => {
      console.log("Extracting pixels from image...");
      extractPixelsFromImage(); 
      if (backgroundPixels.length > 0) {
        console.log("Drawing pixelated background...");
        drawBackgroundPixels(); // Draw the pixelated version
        console.log("Starting animation sequence...");
        startAnimationSequence(); // Start the main sequence
      } else {
        console.error("Pixel extraction failed or resulted in empty data.");
      }
    }, 2000); // Delay for 2 seconds
  };

  backgroundImage.onerror = () => {
    console.error("Failed to load background image. Check path and permissions.");
    // Optional: Fallback to generateGeoPixels if image fails?
    // backgroundPixels = generateGeoPixels();
    // drawBackgroundPixels();
    // startAnimationSequence(); 
  };
  
  // Function to draw the loaded image (full resolution)
  function drawImageBackground() {
    if (!imageLoaded) return;
    const ctx = mapCanvas.getContext('2d');
    ctx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
    ctx.drawImage(backgroundImage, 0, 0, mapCanvas.width, mapCanvas.height);
    console.log("Full background image drawn.");
  }

  // Function to extract pixel data from the loaded image
  function extractPixelsFromImage() {
    if (!imageLoaded) return [];

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true }); // Optimization hint
    tempCanvas.width = mapCanvas.width;
    tempCanvas.height = mapCanvas.height;

    tempCtx.drawImage(backgroundImage, 0, 0, tempCanvas.width, tempCanvas.height);

    let imageData;
    try {
      imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    } catch (e) {
      console.error("Error getting image data:", e);
      // This can happen due to CORS issues if running locally without a server
      // or if the image is tainted.
      return; // Stop if we can't get data
    }
    
    const data = imageData.data;
    const pixels = [];
    const pixelSize = 5; // Size of our visualization pixels

    for (let y = 0; y < tempCanvas.height; y += pixelSize) {
      const row = [];
      for (let x = 0; x < tempCanvas.width; x += pixelSize) {
        // Sample color from the center of the target pixel block
        const sampleX = x + Math.floor(pixelSize / 2);
        const sampleY = y + Math.floor(pixelSize / 2);
        const index = (sampleY * tempCanvas.width + sampleX) * 4;

        // Ensure index is within bounds
        if (index + 3 < data.length) {
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];
            // const a = data[index + 3]; // Alpha - could be used later
            
            row.push({
                x: x, // Store the top-left coords for drawing
                y: y,
                width: pixelSize,
                height: pixelSize,
                color: { r, g, b },
                region: 'image' // Placeholder region type
            });
        } else {
             console.warn(`Index out of bounds at x=${x}, y=${y}. Skipping pixel.`);
        }
      }
       if (row.length > 0) { // Only add row if it contains pixels
         pixels.push(row);
       }
    }
    backgroundPixels = pixels; // Assign to the global variable
    console.log(`Extracted ${backgroundPixels.flat().length} pixels into ${backgroundPixels.length} rows.`);
  }
  // --- END NEW Image Logic ---
  
  // Draw background pixels on canvas (Now uses image-derived data)
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
    console.log("Pixelated background drawn from backgroundPixels array.");
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
      selectionBox.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.5)';
      selectionBox.style.animation = 'pulse 1.5s infinite alternate';
      
      // Extract grid data from pixels in selection - ensure exact pixel boundaries
      // Make sure to snap to the grid boundaries
      const pixelSize = 5;
      
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
  
  // Replace the animateVectorization function with RGB decomposition
  function animateVectorization() {
    if (predictionStage < 2 || gridData.length === 0) return;
    
    // Go to RGB decomposition scene instead of vectorization
    fadeBackgroundForMatrix();
    
    // After highlighting the selected region, transition to RGB scene
    setTimeout(() => {
      predictionStage = 2; // RGB Decomposition stage
      updateStageIndicators();
      
      // Hide current visualization and show RGB decomposition
      mapCanvas.style.opacity = '0';
      gridCanvas.style.opacity = '0';
      visualizationWrapper.style.opacity = '0';
      
      showRGBDecomposition();
    }, 1500);
  }

  // NEW: RGB Decomposition Visualization
  function showRGBDecomposition() {
    if (predictionStage < 2) return;
    
    // Show CNN wrapper for RGB decomposition
    cnnWrapper.style.opacity = '1';
    
    // Start RGB decomposition animation
    setTimeout(() => {
      animateRGBDecomposition();
    }, 500);
  }

  function animateRGBDecomposition() {
    const ctx = cnnCanvas.getContext('2d');
    const width = cnnCanvas.width;
    const height = cnnCanvas.height;
    
    // Ensure we have gridData
    if (!gridData || gridData.length === 0) {
      console.error("No gridData available for RGB decomposition");
      return;
    }
    
    // Animation stages
    let animationStage = 0; // 0: show 4 matrices, 1: fade out others, 2: move red to left, 3: convert to intensity values
    
    const matrixRows = gridData.length;
    const matrixCols = gridData[0]?.length || 0;
    
    console.log(`RGB Decomposition starting with ${matrixRows}x${matrixCols} matrix`);
    
    const animateStage = () => {
      if (animationStage === 0) {
        // Stage 1: Show complete decomposition with all 4 matrices
        ctx.clearRect(0, 0, width, height);
        
        // Dark blue background
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);
        
        const cellSize = 25; // Same perfect size for all
        const matrixSpacing = 40;
        
        // Calculate positions for all 4 matrices side by side
        const totalMatricesWidth = (matrixCols * cellSize * 4) + (matrixSpacing * 3);
        const startX = (width - totalMatricesWidth) / 2;
        const centerY = height / 2 - (matrixRows * cellSize) / 2;
        
        // Position calculations for each matrix
        const originalX = startX;
        const redX = originalX + (matrixCols * cellSize) + matrixSpacing;
        const greenX = redX + (matrixCols * cellSize) + matrixSpacing;
        const blueX = greenX + (matrixCols * cellSize) + matrixSpacing;
        
        // Draw column headers
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        
        // Original RGB header
        ctx.fillStyle = '#ffffff';
        ctx.fillText('Original RGB', originalX + (matrixCols * cellSize)/2, centerY - 25);
        
        // Red header
        ctx.fillStyle = '#ff4444';
        ctx.fillText('Red Channel', redX + (matrixCols * cellSize)/2, centerY - 25);
        
        // Green header  
        ctx.fillStyle = '#44ff44';
        ctx.fillText('Green Channel', greenX + (matrixCols * cellSize)/2, centerY - 25);
        
        // Blue header
        ctx.fillStyle = '#4444ff';
        ctx.fillText('Blue Channel', blueX + (matrixCols * cellSize)/2, centerY - 25);
        
        // Draw all 4 matrices
        gridData.forEach((row, i) => {
          row.forEach((cell, j) => {
            const y = centerY + i * cellSize;
            
            // Original RGB Matrix
            let x = originalX + j * cellSize;
            ctx.fillStyle = `rgb(${cell.color.r}, ${cell.color.g}, ${cell.color.b})`;
            ctx.fillRect(x, y, cellSize - 2, cellSize - 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, cellSize - 2, cellSize - 2);
            
            // Red Channel Matrix
            x = redX + j * cellSize;
            ctx.fillStyle = `rgb(${cell.color.r}, 0, 0)`;
            ctx.fillRect(x, y, cellSize - 2, cellSize - 2);
            ctx.strokeStyle = 'rgba(255, 68, 68, 0.4)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, cellSize - 2, cellSize - 2);
            
            // Green Channel Matrix
            x = greenX + j * cellSize;
            ctx.fillStyle = `rgb(0, ${cell.color.g}, 0)`;
            ctx.fillRect(x, y, cellSize - 2, cellSize - 2);
            ctx.strokeStyle = 'rgba(68, 255, 68, 0.4)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, cellSize - 2, cellSize - 2);
            
            // Blue Channel Matrix
            x = blueX + j * cellSize;
            ctx.fillStyle = `rgb(0, 0, ${cell.color.b})`;
            ctx.fillRect(x, y, cellSize - 2, cellSize - 2);
            ctx.strokeStyle = 'rgba(68, 68, 255, 0.4)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, cellSize - 2, cellSize - 2);
          });
        });
        
        // Draw outlines around each matrix
        const matrices = [
          {x: originalX, color: '#ffffff'},
          {x: redX, color: '#ff4444'},
          {x: greenX, color: '#44ff44'},
          {x: blueX, color: '#4444ff'}
        ];
        
        matrices.forEach(matrix => {
          ctx.strokeStyle = matrix.color;
          ctx.lineWidth = 2;
          ctx.strokeRect(matrix.x - 2, centerY - 2, 
                        matrixCols * cellSize + 4, matrixRows * cellSize + 4);
        });
        
        // Add arrows showing decomposition flow
        const arrowY = centerY + (matrixRows * cellSize) / 2;
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        
        // Arrow from Original to Red
        ctx.beginPath();
        ctx.moveTo(originalX + matrixCols * cellSize + 5, arrowY);
        ctx.lineTo(redX - 5, arrowY);
        ctx.stroke();
        drawArrowHead(ctx, redX - 5, arrowY, 0);
        
        // Arrow from Red to Green  
        ctx.beginPath();
        ctx.moveTo(redX + matrixCols * cellSize + 5, arrowY);
        ctx.lineTo(greenX - 5, arrowY);
        ctx.stroke();
        drawArrowHead(ctx, greenX - 5, arrowY, 0);
        
        // Arrow from Green to Blue
        ctx.beginPath();
        ctx.moveTo(greenX + matrixCols * cellSize + 5, arrowY);
        ctx.lineTo(blueX - 5, arrowY);
        ctx.stroke();
        drawArrowHead(ctx, blueX - 5, arrowY, 0);
        
        animationStage++;
        setTimeout(animateStage, 3000);
        
      } else if (animationStage === 1) {
        // Stage 2: Fade out Original, Green, and Blue - highlight Red
        ctx.clearRect(0, 0, width, height);
        
        // Dark blue background
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);
        
        const cellSize = 25;
        const matrixSpacing = 40;
        
        // Calculate original positions
        const totalMatricesWidth = (matrixCols * cellSize * 4) + (matrixSpacing * 3);
        const startX = (width - totalMatricesWidth) / 2;
        const centerY = height / 2 - (matrixRows * cellSize) / 2;
        
        const originalX = startX;
        const redX = originalX + (matrixCols * cellSize) + matrixSpacing;
        const greenX = redX + (matrixCols * cellSize) + matrixSpacing;
        const blueX = greenX + (matrixCols * cellSize) + matrixSpacing;
        
        // Draw faded headers for Original, Green, Blue
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.globalAlpha = 0.3;
        
        ctx.fillStyle = '#ffffff';
        ctx.fillText('Original RGB', originalX + (matrixCols * cellSize)/2, centerY - 25);
        ctx.fillStyle = '#44ff44';
        ctx.fillText('Green Channel', greenX + (matrixCols * cellSize)/2, centerY - 25);
        ctx.fillStyle = '#4444ff';
        ctx.fillText('Blue Channel', blueX + (matrixCols * cellSize)/2, centerY - 25);
        
        // Draw highlighted Red header
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = '#ff4444';
        ctx.fillText('Red Channel (Selected)', redX + (matrixCols * cellSize)/2, centerY - 25);
        
        // Draw faded matrices
        ctx.globalAlpha = 0.2;
        gridData.forEach((row, i) => {
          row.forEach((cell, j) => {
            const y = centerY + i * cellSize;
            
            // Faded Original RGB Matrix
            let x = originalX + j * cellSize;
            ctx.fillStyle = `rgb(${cell.color.r}, ${cell.color.g}, ${cell.color.b})`;
            ctx.fillRect(x, y, cellSize - 2, cellSize - 2);
            
            // Faded Green Channel Matrix
            x = greenX + j * cellSize;
            ctx.fillStyle = `rgb(0, ${cell.color.g}, 0)`;
            ctx.fillRect(x, y, cellSize - 2, cellSize - 2);
            
            // Faded Blue Channel Matrix
            x = blueX + j * cellSize;
            ctx.fillStyle = `rgb(0, 0, ${cell.color.b})`;
            ctx.fillRect(x, y, cellSize - 2, cellSize - 2);
          });
        });
        
        // Draw highlighted Red Channel Matrix
        ctx.globalAlpha = 1.0;
        gridData.forEach((row, i) => {
          row.forEach((cell, j) => {
            const x = redX + j * cellSize;
            const y = centerY + i * cellSize;
            
            ctx.fillStyle = `rgb(${cell.color.r}, 0, 0)`;
            ctx.fillRect(x, y, cellSize - 2, cellSize - 2);
            ctx.strokeStyle = 'rgba(255, 68, 68, 0.8)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, cellSize - 2, cellSize - 2);
          });
        });
        
        // Glowing outline for Red matrix
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ff4444';
        ctx.shadowBlur = 15;
        ctx.strokeRect(redX - 3, centerY - 3, 
                      matrixCols * cellSize + 6, matrixRows * cellSize + 6);
        ctx.shadowBlur = 0;
        
        animationStage++;
        setTimeout(animateStage, 2000);
        
      } else if (animationStage === 2) {
        // Stage 3: Move Red Channel to left position
        ctx.clearRect(0, 0, width, height);
        
        // Dark blue background
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);
        
        // Header
        ctx.fillStyle = '#06b6d4';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Red Channel → Intensity Values', width / 2, 40);
        
        const cellSize = 25;
        
        // Position Red matrix on the left side
        const leftX = 80;
        const leftY = height / 2 - (matrixRows * cellSize) / 2;
        
        // Draw Red Channel matrix on the left
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Red Channel', leftX + (matrixCols * cellSize)/2, leftY - 25);
        
        gridData.forEach((row, i) => {
          row.forEach((cell, j) => {
            const x = leftX + j * cellSize;
            const y = leftY + i * cellSize;
            
            ctx.fillStyle = `rgb(${cell.color.r}, 0, 0)`;
            ctx.fillRect(x, y, cellSize - 2, cellSize - 2);
            ctx.strokeStyle = 'rgba(255, 68, 68, 0.6)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, cellSize - 2, cellSize - 2);
          });
        });
        
        // Draw arrow pointing to intensity conversion
        const arrowStartX = leftX + matrixCols * cellSize + 20;
        const arrowEndX = arrowStartX + 80;
        const arrowY = leftY + (matrixRows * cellSize) / 2;
        
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(arrowStartX, arrowY);
        ctx.lineTo(arrowEndX, arrowY);
        ctx.stroke();
        drawArrowHead(ctx, arrowEndX, arrowY, 0);
        
        // Label for conversion
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Convert to', arrowStartX + 40, arrowY - 10);
        ctx.fillText('Intensity Values', arrowStartX + 40, arrowY + 10);
        
        animationStage++;
        setTimeout(animateStage, 2000);
        
      } else if (animationStage === 3) {
        // Stage 4: Show intensity values matrix (grayscale with numbers)
        ctx.clearRect(0, 0, width, height);
        
        // Dark blue background
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);
        
        // Header
        ctx.fillStyle = '#06b6d4';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Intensity Matrix (Grayscale Values)', width / 2, 40);
        
        const cellSize = 30; // Slightly larger to show numbers
        
        // Position intensity matrix in center-left
        const intensityX = 120;
        const intensityY = height / 2 - (matrixRows * cellSize) / 2;
        
        // Draw intensity matrix label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Input Matrix (0-255)', intensityX + (matrixCols * cellSize)/2, intensityY - 25);
        
        // Prepare input matrix for CNN
        inputMatrix = [];
        gridData.forEach((row, i) => {
          const matrixRow = [];
          row.forEach((cell, j) => {
            const x = intensityX + j * cellSize;
            const y = intensityY + i * cellSize;
            
            // Draw grayscale cell based on red intensity
            const intensity = cell.color.r;
            ctx.fillStyle = `rgb(${intensity}, ${intensity}, ${intensity})`;
            ctx.fillRect(x, y, cellSize - 2, cellSize - 2);
            
            // Draw border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, cellSize - 2, cellSize - 2);
            
            // Draw intensity value as text
            ctx.fillStyle = intensity > 128 ? '#000000' : '#ffffff';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(intensity.toString(), x + cellSize/2, y + cellSize/2 + 4);
            
            // Store for CNN input
            matrixRow.push({
              ...cell,
              intensity: intensity / 255, // Normalize to 0-1
              displayIntensity: intensity
            });
          });
          inputMatrix.push(matrixRow);
        });
        
        // Draw outline around intensity matrix
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 3;
        ctx.strokeRect(intensityX - 3, intensityY - 3, 
                      matrixCols * cellSize + 6, matrixRows * cellSize + 6);
        
        // Add note about values
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${matrixRows}×${matrixCols} matrix with values 0-255`, 
                    intensityX + (matrixCols * cellSize)/2, intensityY + matrixRows * cellSize + 20);
        
        console.log(`Intensity matrix prepared: ${inputMatrix.length}x${inputMatrix[0]?.length || 0}`);
        
        // Transition to CNN processing
        setTimeout(() => {
          predictionStage = 3; // CNN Processing stage
          updateStageIndicators();
          animateCNNConvolution();
        }, 3000);
      }
    };
    
    animateStage();
  }
  
  // Helper function to draw arrow heads
  function drawArrowHead(ctx, x, y, angle) {
    const headLength = 8;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-headLength, -headLength/2);
    ctx.lineTo(-headLength, headLength/2);
    ctx.closePath();
    ctx.fillStyle = '#94a3b8';
    ctx.fill();
    ctx.restore();
  }

  // Update the extractInputMatrix function to use the R channel data
  function extractInputMatrix() {
    // No need to extract since we already have inputMatrix from RGB decomposition
    if (inputMatrix.length === 0 && gridData.length > 0) {
      // Fallback: extract R channel if somehow missed
      inputMatrix = [];
      gridData.forEach(row => {
        const matrixRow = [];
        row.forEach(cell => {
          matrixRow.push({
            ...cell,
            intensity: cell.color.r / 255, // Use Red channel
            displayIntensity: cell.color.r
          });
        });
        inputMatrix.push(matrixRow);
      });
    }
    console.log(`Using Red channel input matrix: ${inputMatrix.length}x${inputMatrix[0]?.length || 0}`);
  }
  
  // Neural network animation
  function animateNeuralNetwork() {
    if (predictionStage < 4) return;
    
    const ctx = neuralNetworkCanvas.getContext('2d');
    const width = neuralNetworkCanvas.width;
    const height = neuralNetworkCanvas.height;
    
    let animationFrame;
    
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Define neural network layers - now we show input as a compact vector
      const layers = [
        { name: 'input', neurons: 128, x: 80, color: '#3b82f6', compact: true }, // Compact input representation
        { name: 'hidden1', neurons: 6, x: 240, color: '#06b6d4' },
        { name: 'hidden2', neurons: 3, x: 400, color: '#14b8a6' },
        { name: 'hidden3', neurons: 6, x: 560, color: '#10b981' },
        { name: 'output', neurons: 3, x: 720, color: '#ec4899' }
      ];
      
      // Get currently active nodes and connections
      const currentNodeIndices = {
        input: activeNeuronIndices.input,
        hidden1: activeNeuronIndices.hidden1,
        hidden2: activeNeuronIndices.hidden2,
        hidden3: activeNeuronIndices.hidden3,
        output: activeNeuronIndices.output
      };
      
      // Add a background glow effect to active neural network
      ctx.fillStyle = 'rgba(10, 15, 25, 0.3)';
      ctx.fillRect(0, 0, width, height);
      
      // Draw grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 0.5;
      
      // Horizontal grid lines
      for (let i = 50; i < height - 50; i += 30) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
      }
      
      // Vertical grid lines
      for (let i = 0; i < width; i += 60) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      
      // Draw connections - simplified for 128 inputs
      layers.forEach((layer, layerIndex) => {
        if (layerIndex === 0) return; // Skip input layer connections (handle separately)
        
        const prevLayer = layers[layerIndex - 1];
        const sourceActive = currentNodeIndices[prevLayer.name];
        const targetActive = currentNodeIndices[layer.name];
        
        if (sourceActive >= 0) {
          // For input layer, draw from compact representation
          if (prevLayer.name === 'input') {
            const inputCenterY = height / 2;
            
            for (let j = 0; j < layer.neurons; j++) {
              const targetX = layer.x;
              
              let targetVerticalPadding = 40;
              if (layer.name === 'hidden2' || layer.name === 'output') {
                targetVerticalPadding = 90;
              } else if (layer.name === 'hidden1' || layer.name === 'hidden3') {
                targetVerticalPadding = 70;
              }
              const targetAvailableHeight = height - (targetVerticalPadding * 2);
              const targetSpacing = layer.neurons > 1 ? targetAvailableHeight / (layer.neurons - 1) : targetAvailableHeight;
              const targetY = targetVerticalPadding + (targetSpacing * j);
              
              const isTargetCurrentlyActivating = j === targetActive;
              const isTargetAlreadyActive = j < targetActive;
              const isTargetVisible = isTargetCurrentlyActivating || isTargetAlreadyActive;
              
              if (isTargetVisible) {
                const gradient = ctx.createLinearGradient(prevLayer.x, inputCenterY, targetX, targetY);
                gradient.addColorStop(0, prevLayer.color);
                gradient.addColorStop(1, layer.color);
                
                ctx.beginPath();
                ctx.moveTo(prevLayer.x + 40, inputCenterY); // From right edge of input representation
                ctx.lineTo(targetX, targetY);
                ctx.strokeStyle = gradient;
                ctx.lineWidth = 1.5;
                ctx.stroke();
              }
            }
          } else {
            // Normal connections between hidden layers
            const sourceX = prevLayer.x;
            
            let sourceVerticalPadding = 40;
            if (prevLayer.name === 'hidden2' || prevLayer.name === 'output') {
                sourceVerticalPadding = 90;
            } else if (prevLayer.name === 'hidden1' || layer.name === 'hidden3') {
                sourceVerticalPadding = 70;
            }
            const sourceAvailableHeight = height - (sourceVerticalPadding * 2);
            const sourceSpacing = prevLayer.neurons > 1 ? sourceAvailableHeight / (prevLayer.neurons - 1) : sourceAvailableHeight;
            const sourceY = sourceVerticalPadding + (sourceSpacing * sourceActive);
            
            for (let j = 0; j < layer.neurons; j++) {
              const targetX = layer.x;
              
              let targetVerticalPadding = 40;
              if (layer.name === 'hidden2' || layer.name === 'output') {
                targetVerticalPadding = 90;
              } else if (layer.name === 'hidden1' || layer.name === 'hidden3') {
                targetVerticalPadding = 70;
              }
              const targetAvailableHeight = height - (targetVerticalPadding * 2);
              const targetSpacing = layer.neurons > 1 ? targetAvailableHeight / (layer.neurons - 1) : targetAvailableHeight;
              const targetY = targetVerticalPadding + (targetSpacing * j);
              
              const isTargetCurrentlyActivating = j === targetActive;
              const isTargetAlreadyActive = j < targetActive;
              const isTargetRelevant = isTargetCurrentlyActivating || isTargetAlreadyActive;
              
              if (isTargetRelevant) {
                const gradient = ctx.createLinearGradient(sourceX, sourceY, targetX, targetY);
                gradient.addColorStop(0, prevLayer.color);
                gradient.addColorStop(1, layer.color);
                
                ctx.beginPath();
                ctx.moveTo(sourceX, sourceY);
                ctx.lineTo(targetX, targetY);
                ctx.strokeStyle = gradient;
                ctx.lineWidth = 1.5;
                ctx.stroke();
              }
            }
          }
        }
      });
      
      // Draw layer representations
      layers.forEach((layer, layerIndex) => {
        const activeIndex = currentNodeIndices[layer.name];
        
        if (layer.compact && layer.name === 'input') {
          // Draw compact input representation (128 features as a block)
          const blockWidth = 80;
          const blockHeight = 200;
          const blockX = layer.x - blockWidth/2;
          const blockY = height/2 - blockHeight/2;
          
          // Draw background
          ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
          ctx.fillRect(blockX, blockY, blockWidth, blockHeight);
          
          // Draw active portion
          if (activeIndex >= 0) {
            const activePortion = (activeIndex + 1) / layer.neurons;
            const activeHeight = blockHeight * activePortion;
            
            ctx.fillStyle = layer.color;
            ctx.fillRect(blockX, blockY + blockHeight - activeHeight, blockWidth, activeHeight);
            
            // Add glow effect
            ctx.shadowColor = layer.color;
            ctx.shadowBlur = 10;
            ctx.fillRect(blockX, blockY + blockHeight - activeHeight, blockWidth, activeHeight);
            ctx.shadowBlur = 0;
          }
          
          // Draw border
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = 2;
          ctx.strokeRect(blockX, blockY, blockWidth, blockHeight);
          
          // Draw feature count
          ctx.fillStyle = '#ffffff';
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`${layer.neurons} Features`, layer.x, blockY + blockHeight + 20);
          ctx.fillText(`${activeIndex + 1}/${layer.neurons} Active`, layer.x, blockY + blockHeight + 35);
          
        } else {
          // Draw normal neurons for hidden and output layers
          let verticalPadding = 40;
          
          if (layer.name === 'hidden2' || layer.name === 'output') {
            verticalPadding = 90;
          } else if (layer.name === 'hidden1' || layer.name === 'hidden3') {
            verticalPadding = 70;
          }
          
          const availableHeight = height - (verticalPadding * 2);
          const spacing = layer.neurons > 1 ? availableHeight / (layer.neurons - 1) : availableHeight;
          
          for (let i = 0; i < layer.neurons; i++) {
            const x = layer.x;
            const y = verticalPadding + (spacing * i);
            
            const isActive = i <= activeIndex;
            
            const baseSize = layer.name === 'output' ? 10 : 6;
            const size = isActive ? baseSize * 1.2 : baseSize;
            
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillStyle = isActive ? layer.color : 'rgba(255, 255, 255, 0.3)';
            
            if (isActive) {
              ctx.shadowColor = layer.color;
              ctx.shadowBlur = 10;
            } else {
              ctx.shadowBlur = 0;
            }
            
            ctx.fill();
            ctx.shadowBlur = 0;
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
        
        // Add layer label with improved styling
        const labelY = 25;
        
        ctx.fillStyle = 'rgba(17, 24, 39, 0.8)';
        ctx.fillRect(layer.x - 70, labelY - 20, 140, 30);

        ctx.fillStyle = layer.name === 'output' ? '#ec4899' : '#22d3ee';
        ctx.font = '1rem sans-serif';
        ctx.textAlign = 'center';
        
        const displayName = layer.name === 'input' ? 'CNN Features' :
                           layer.name === 'hidden1' ? 'Hidden Layer 1' :
                           layer.name === 'hidden2' ? 'Hidden Layer 2' :
                           layer.name === 'hidden3' ? 'Hidden Layer 3' : 
                           'Output';
        
        ctx.fillText(displayName, layer.x, labelY);
      });
      
      // Continue animation
      if (predictionStage >= 4) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    // Create cleanup handler
    const cleanup = () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
    };
    
    if (window.animationCleanupHandlers) {
      window.animationCleanupHandlers.push(cleanup);
    }
    
    return cleanup;
  }
  
  // Show prediction results
  function showPredictionResults() {
    if (!predictionResults || predictionStage < 4) return;
    
    // Clear previous content
    predictionSection.innerHTML = '';
    
    // Create header with matching styling
    const headerBg = document.createElement('div');
    headerBg.style.backgroundColor = 'rgba(17, 24, 39, 0.8)';
    headerBg.style.padding = '0.5rem 1rem';
    headerBg.style.marginBottom = '1rem';
    
    const header = document.createElement('div');
    header.textContent = 'Prediction Results';
    header.style.color = '#ec4899'; // Match output color
    header.style.fontSize = '1rem';
    header.style.textAlign = 'center';
    
    headerBg.appendChild(header);
    predictionSection.appendChild(headerBg);
    
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
    predictionSection.style.transform = 'translateX(0)';
    updateStageIndicators();
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
  
  // --- REVISED: Main animation setup and reset function ---
  function setupAndResetVisualization() {
    console.log("Setting up and resetting visualization...");
    // Clear any ongoing animations and intervals first
    if (window.animationCleanupHandlers) {
      window.animationCleanupHandlers.forEach(handler => {
        if (typeof handler === 'function') {
          try {
            handler();
          } catch (e) {
             console.warn("Error during cleanup handler:", e);
          }
        }
      });
    }
    window.animationCleanupHandlers = [];
    
    // Clear size factors to force regeneration
    window.neuronSizeFactors = null;
    window.connectionWidthFactors = null;
    
    // Reset prediction and visualization state
    predictionStage = 0; 
    predictionResults = null;
    gridData = [];
    cellsInVector = [];
    establishedConnections = [];
    persistentConnections = []; 
    activeNeuronIndices = { input: -1, hidden1: -1, hidden2: -1, hidden3: -1, output: -1 };
    
    // Reset CNN state variables
    inputMatrix = [];
    currentKernelIndex = 0;
    currentCNNStage = 'convolution';
    featureMaps = [];
    currentConvStep = 0;
    finalFeatureVector = [];
    
    // Generate new random position for selection box
    const margin = 50;
    const minX = Math.ceil(800 / 3);
    const availableWidth = 800 - margin*2 - minX;
    const selectionWidth = 30; 
    selectionBoxState = {
      x: minX + Math.floor(Math.random() * (availableWidth - selectionWidth)),
      y: margin + Math.floor(Math.random() * (500 - margin*2 - 30)),
      width: selectionWidth,
      height: 30
    };
    
    // Clear all canvases and sections
    const clearCanvas = (canvas) => {
      if (canvas instanceof HTMLCanvasElement) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      } else if (canvas instanceof HTMLElement) {
          canvas.innerHTML = ''; 
      }
    };
    // Clear grid, vector, CNN, NN, prediction. Keep mapCanvas as it holds the background.
    [gridCanvas, vectorCanvas, cnnCanvas, neuralNetworkCanvas, predictionSection].forEach(clearCanvas);
    
    // Reset section visibility and transforms
    visualizationWrapper.style.opacity = '0';
    cnnWrapper.style.opacity = '0';
    vectorSection.style.transform = 'translateX(-100%)';
    nnSection.style.opacity = '0';
    nnSection.style.transform = 'scale(0.95)';
    predictionSection.style.transform = 'translateX(100%)';
    mapCanvas.style.opacity = '1'; // Ensure map is fully visible after reset
    gridCanvas.style.opacity = '1'; // Reset grid canvas opacity
    selectionBox.style.display = 'none';
    selectionBox.style.opacity = '1'; // Reset selection box opacity

    // Reset stage indicators visually
    updateStageIndicators();
    console.log("Visualization setup and reset complete.");
  }

  // --- NEW: Function to schedule the animation stages ---
  function startAnimationSequence() {
     // Make sure background pixels are ready
     if (backgroundPixels.length === 0) {
        console.error("Attempted to start animation sequence, but backgroundPixels is empty.");
        return;
     }

     setupAndResetVisualization(); // Reset state before starting sequence

     // Schedule stages using the now-ready backgroundPixels

     // Stage 0 -> 1: Show selection box
     setTimeout(() => {
       predictionStage = 1; 
       updateSelection(); 
       updateStageIndicators(); 
     }, 500); // Short delay after pixel background is drawn
     
     // Stage 1 -> 2: Extract Data & Vectorize
     setTimeout(() => {
       predictionStage = 2; 
       updateStageIndicators(); 
       
       visualizationWrapper.style.opacity = '1';
       vectorSection.style.transform = 'translateX(0)';
       
       animateVectorization(); 
     }, 2500); // Start vectorization 2 seconds after selection appears (500 + 2000)
  }

  // Function to animate neural network with proper activation pattern
  function animateNeuralNetworkSequence() {
    // Define layer info - updated for CNN input
    const layerInfo = [
      { name: 'input', size: 128 },  // 128 features from CNN
      { name: 'hidden1', size: 6 }, 
      { name: 'hidden2', size: 3 }, 
      { name: 'hidden3', size: 6 },
      { name: 'output', size: 3 }
    ];
    
    // For 128 inputs, we'll use a simplified visualization
    // Instead of showing every connection, we'll show representative ones
    
    // Check if we have finalFeatureVector from CNN
    if (!finalFeatureVector || finalFeatureVector.length === 0) {
      console.log("CNN feature vector not ready, using placeholder");
      // Create placeholder vector
      finalFeatureVector = [];
      for (let i = 0; i < 128; i++) {
        finalFeatureVector.push(Math.random() * 0.8 + 0.1);
      }
    }
    
    // Create a simplified animation that shows groups of inputs activating
    const animationSteps = [];
    
    // Group inputs into batches for visualization
    const inputBatchSize = 16; // Show 16 inputs at a time
    const numBatches = Math.ceil(layerInfo[0].size / inputBatchSize);
    
    // 1. Activate inputs in batches and connect to hidden1
    for (let batch = 0; batch < numBatches; batch++) {
      animationSteps.push({
        type: 'activate_input_batch',
        batch: batch,
        batchSize: inputBatchSize
      });
      
      // Show connections to hidden1 for each batch
      for (let hidden1Node = 0; hidden1Node < layerInfo[1].size; hidden1Node++) {
        animationSteps.push({
          type: 'activate',
          layer: 'hidden1',
          node: hidden1Node
        });
      }
      
      // Reset hidden1 before next batch
      if (batch < numBatches - 1) {
        animationSteps.push({
          type: 'reset',
          layer: 'hidden1'
        });
      }
    }
    
    // 2. Continue with normal hidden layer processing
    for (let hidden1Node = 0; hidden1Node < layerInfo[1].size; hidden1Node++) {
      animationSteps.push({
        type: 'activate',
        layer: 'hidden1',
        node: hidden1Node
      });
      
      for (let hidden2Node = 0; hidden2Node < layerInfo[2].size; hidden2Node++) {
        animationSteps.push({
          type: 'activate',
          layer: 'hidden2',
          node: hidden2Node
        });
      }
      
      if (hidden1Node < layerInfo[1].size - 1) {
        animationSteps.push({
          type: 'reset',
          layer: 'hidden2'
        });
      }
    }
    
    // 3. Hidden2 to Hidden3
    for (let hidden2Node = 0; hidden2Node < layerInfo[2].size; hidden2Node++) {
      animationSteps.push({
        type: 'activate',
        layer: 'hidden2',
        node: hidden2Node
      });
      
      for (let hidden3Node = 0; hidden3Node < layerInfo[3].size; hidden3Node++) {
        animationSteps.push({
          type: 'activate',
          layer: 'hidden3',
          node: hidden3Node
        });
      }
      
      if (hidden2Node < layerInfo[2].size - 1) {
        animationSteps.push({
          type: 'reset',
          layer: 'hidden3'
        });
      }
    }
    
    // 4. Hidden3 to Output
    for (let hidden3Node = 0; hidden3Node < layerInfo[3].size; hidden3Node++) {
      animationSteps.push({
        type: 'activate',
        layer: 'hidden3',
        node: hidden3Node
      });
      
      for (let outputNode = 0; outputNode < layerInfo[4].size; outputNode++) {
        animationSteps.push({
          type: 'activate',
          layer: 'output',
          node: outputNode
        });
      }
      
      if (hidden3Node < layerInfo[3].size - 1) {
        animationSteps.push({
          type: 'reset',
          layer: 'output'
        });
      }
    }
    
    // Final full activation
    animationSteps.push({
      type: 'full_activation'
    });
    
    // Execute the animation sequence
    let currentStep = 0;
    let currentInputBatch = 0;
    
    // SPEED CONTROL: Much faster for 128 inputs
    let initialStepDelay = 15; // Faster initial speed
    let midStageDelay = 8;     
    let lateStageDelay = 3;    
    let stepDelay = initialStepDelay;
    
    const processNextStep = () => {
      if (currentStep > animationSteps.length * 0.2) {
        stepDelay = midStageDelay;
      }
      if (currentStep > animationSteps.length * 0.5) {
        stepDelay = lateStageDelay;
      }
      
      if (currentStep >= animationSteps.length) {
        // Animation sequence complete, show predictions
        setTimeout(() => {
          predictionStage = 5; // Final prediction stage
          predictionResults = [
            { type: 'Gold', probability: 0.82, color: '#FFD700' },
            { type: 'Copper', probability: 0.47, color: '#B87333' },
            { type: 'Iron', probability: 0.23, color: '#a52a2a' }
          ];
          predictionSection.style.transform = 'translateX(0)';
          updateStageIndicators();
          showPredictionResults();
          scheduleReset();
        }, 500);
        return;
      }
      
      const step = animationSteps[currentStep];
      
      if (step.type === 'activate') {
        activeNeuronIndices[step.layer] = step.node;
      } else if (step.type === 'reset') {
        activeNeuronIndices[step.layer] = -1;
      } else if (step.type === 'activate_input_batch') {
        // Activate a batch of input neurons
        currentInputBatch = step.batch;
        activeNeuronIndices.input = (step.batch + 1) * step.batchSize - 1;
      } else if (step.type === 'full_activation') {
        activeNeuronIndices.input = layerInfo[0].size - 1;
        activeNeuronIndices.hidden1 = layerInfo[1].size - 1;
        activeNeuronIndices.hidden2 = layerInfo[2].size - 1;
        activeNeuronIndices.hidden3 = layerInfo[3].size - 1;
        activeNeuronIndices.output = layerInfo[4].size - 1;
      }
      
      // Trigger neural network animation frame
      animateNeuralNetwork();
      
      currentStep++;
      
      requestAnimationFrame(() => {
        setTimeout(processNextStep, stepDelay);
      });
    };
    
    // Start the animation sequence
    animateNeuralNetwork();
    setTimeout(processNextStep, 1000);
  }
  
  // New function to handle reset after full visualization completes
  function scheduleReset() {
    // Only reset if we've completed the prediction stage
    if (predictionStage === 5) {
      console.log("Scheduling visualization reset...");
      setTimeout(() => {
        console.log("Resetting visualization now.");
        // Instead of runVisualization, trigger the image loading again
        // which starts the whole process over
        if (backgroundImage) {
           backgroundImage.src = 'assets/images/geophysics-image.png'; // Reload image to restart
        } else {
           console.error("Cannot restart, backgroundImage object not found.");
        }
      }, 7000); // Show prediction results for 7 seconds before resetting
    }
  }
  
  // Initialize and start visualization by loading the image
  console.log("Initiating visualization by loading image...");
  backgroundImage.src = 'assets/images/geophysics-image.png';

  // NEW: CNN Visualization Functions
  function showCNNVisualization() {
    if (predictionStage < 2) return;
    
    // Extract input matrix from gridData
    extractInputMatrix();
    
    // Show CNN wrapper
    cnnWrapper.style.opacity = '1';
    
    // Start CNN animation sequence
    setTimeout(() => {
      animateCNNConvolution();
    }, 500);
  }
  
  function animateCNNConvolution() {
    const ctx = cnnCanvas.getContext('2d');
    const width = cnnCanvas.width;
    const height = cnnCanvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw dark blue background
    ctx.fillStyle = '#1e3a8a'; // Dark blue background
    ctx.fillRect(0, 0, width, height);
    
    // Layout parameters
    const cellSize = 25;
    const kernelSize = 20;
    const spacing = 60;
    
    // Center the input matrix on the left
    const matrixWidth = inputMatrix[0]?.length || 0;
    const matrixHeight = inputMatrix.length;
    const matrixPixelWidth = matrixWidth * cellSize;
    const matrixPixelHeight = matrixHeight * cellSize;
    
    const inputX = 50;
    const inputY = height/2 - matrixPixelHeight/2;
    
    // Draw "Convolution" stage header
    ctx.fillStyle = '#06b6d4'; // cyan
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CNN Convolution - Real-time Feature Map Generation', width / 2, 30);
    
    // Draw Input Matrix
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Input Matrix`, inputX + matrixPixelWidth/2, inputY - 15);
    ctx.fillText(`${matrixHeight}×${matrixWidth}`, inputX + matrixPixelWidth/2, inputY - 2);
    
    // Draw input matrix
    if (inputMatrix.length > 0) {
      inputMatrix.forEach((row, i) => {
        row.forEach((cell, j) => {
          const x = inputX + j * cellSize;
          const y = inputY + i * cellSize;
          
          // Draw cell with grayscale intensity
          const intensity = Math.round(cell.displayIntensity);
          ctx.fillStyle = `rgb(${intensity}, ${intensity}, ${intensity})`;
          ctx.fillRect(x, y, cellSize - 2, cellSize - 2);
          
          // Draw border
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, cellSize - 2, cellSize - 2);
        });
      });
    }
    
    // Position for kernels (middle)
    const kernelsX = inputX + matrixPixelWidth + spacing;
    const kernelsY = height/2 - 100; // Start higher to fit all kernels
    
    // Position for feature maps (right side)
    const featureMapSize = (matrixHeight - 2) * 15; // Smaller cells for feature maps
    const featureMapsX = kernelsX + (kernelSize * 3) + spacing;
    const featureMapsY = height/2 - (featureMapSize * 2); // Adjust for multiple feature maps
    
    // Draw kernels and empty feature maps initially
    cnnKernels.slice(0, 3).forEach((kernel, kernelIndex) => { // Show first 3 kernels
      const kernelY = kernelsY + kernelIndex * 80;
      
      // Draw kernel label
      ctx.fillStyle = kernel.color;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${kernel.name}`, kernelsX + (kernelSize * 3)/2, kernelY - 10);
      
      // Draw 3x3 kernel
      kernel.values.forEach((row, i) => {
        row.forEach((value, j) => {
          const x = kernelsX + j * kernelSize;
          const y = kernelY + i * kernelSize;
          
          // Color based on value
          const intensity = Math.abs(value);
          const color = value >= 0 ? 
            `rgba(59, 130, 246, ${Math.min(1, intensity * 0.8)})` : // blue for positive
            `rgba(239, 68, 68, ${Math.min(1, intensity * 0.8)})`; // red for negative
          
          ctx.fillStyle = color;
          ctx.fillRect(x, y, kernelSize - 2, kernelSize - 2);
          
          // Draw border
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, kernelSize - 2, kernelSize - 2);
          
          // Draw value
          ctx.fillStyle = '#ffffff';
          ctx.font = '8px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(value.toFixed(1), x + kernelSize/2, y + kernelSize/2 + 2);
        });
      });
      
      // Draw empty feature map placeholder
      const fMapY = featureMapsY + kernelIndex * (featureMapSize + 30);
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(featureMapsX, fMapY, featureMapSize, featureMapSize);
      
      ctx.strokeStyle = kernel.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(featureMapsX, fMapY, featureMapSize, featureMapSize);
      
      // Feature map label
      ctx.fillStyle = kernel.color;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Feature Map ${kernelIndex + 1}`, featureMapsX + featureMapSize/2, fMapY - 5);
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px sans-serif';
      ctx.fillText(`${matrixHeight-2}×${matrixWidth-2}`, featureMapsX + featureMapSize/2, fMapY + featureMapSize + 12);
    });
    
    // Initialize feature maps storage
    const featureMaps = cnnKernels.slice(0, 3).map(() => 
      Array(matrixHeight - 2).fill().map(() => Array(matrixWidth - 2).fill(null))
    );
    
    // Start the progressive convolution animation
    setTimeout(() => {
      animateProgressiveConvolution(featureMaps);
    }, 2000);
  }
  
  function animateProgressiveConvolution(featureMaps) {
    const ctx = cnnCanvas.getContext('2d');
    const width = cnnCanvas.width;
    const height = cnnCanvas.height;
    
    const matrixWidth = inputMatrix[0]?.length || 0;
    const matrixHeight = inputMatrix.length;
    const cellSize = 25;
    const kernelSize = 20;
    const spacing = 60;
    
    const inputX = 50;
    const inputY = height/2 - (matrixHeight * cellSize)/2;
    const kernelsX = inputX + (matrixWidth * cellSize) + spacing;
    const featureMapsX = kernelsX + (kernelSize * 3) + spacing;
    
    // Calculate all convolution positions
    const convolutionPositions = [];
    for (let i = 0; i <= matrixHeight - 3; i++) {
      for (let j = 0; j <= matrixWidth - 3; j++) {
        convolutionPositions.push({ row: i, col: j });
      }
    }
    
    let currentPosition = 0;
    
    const animateNextPosition = () => {
      if (currentPosition >= convolutionPositions.length) {
        // All convolutions complete, move to next stage
        setTimeout(() => {
          currentCNNStage = 'relu';
          animateReLU();
        }, 2000);
        return;
      }
      
      const pos = convolutionPositions[currentPosition];
      
      // Redraw the base scene
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(0, 0, width, height);
      
      // Header
      ctx.fillStyle = '#06b6d4';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CNN Convolution - Real-time Feature Map Generation', width / 2, 30);
      
      // Draw input matrix with current kernel position highlighted
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Input Matrix`, inputX + (matrixWidth * cellSize)/2, inputY - 15);
      
      inputMatrix.forEach((row, i) => {
        row.forEach((cell, j) => {
          const x = inputX + j * cellSize;
          const y = inputY + i * cellSize;
          
          // Highlight the current 3x3 region for ALL kernels
          const isInKernel = i >= pos.row && i < pos.row + 3 && 
                           j >= pos.col && j < pos.col + 3;
          
          const intensity = Math.round(cell.displayIntensity);
          ctx.fillStyle = `rgb(${intensity}, ${intensity}, ${intensity})`;
          ctx.fillRect(x, y, cellSize - 2, cellSize - 2);
          
          // Different border for kernel region
          if (isInKernel) {
            ctx.strokeStyle = '#06b6d4'; // Cyan highlight
            ctx.lineWidth = 2;
          } else {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1;
          }
          ctx.strokeRect(x, y, cellSize - 2, cellSize - 2);
        });
      });
      
      // Draw kernels and perform convolutions
      const kernelsY = height/2 - 100;
      const featureMapsY = height/2 - (120); // Adjust for feature maps
      
      cnnKernels.slice(0, 3).forEach((kernel, kernelIndex) => {
        const kernelY = kernelsY + kernelIndex * 80;
        
        // Draw kernel
        ctx.fillStyle = kernel.color;
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${kernel.name}`, kernelsX + (kernelSize * 3)/2, kernelY - 10);
        
        kernel.values.forEach((row, i) => {
          row.forEach((value, j) => {
            const x = kernelsX + j * kernelSize;
            const y = kernelY + i * kernelSize;
            
            const intensity = Math.abs(value);
            const color = value >= 0 ? 
              `rgba(59, 130, 246, ${Math.min(1, intensity * 0.8)})` :
              `rgba(239, 68, 68, ${Math.min(1, intensity * 0.8)})`;
            
            ctx.fillStyle = color;
            ctx.fillRect(x, y, kernelSize - 2, kernelSize - 2);
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, kernelSize - 2, kernelSize - 2);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = '8px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(value.toFixed(1), x + kernelSize/2, y + kernelSize/2 + 2);
          });
        });
        
        // Calculate convolution result
        let convResult = 0;
        for (let ki = 0; ki < 3; ki++) {
          for (let kj = 0; kj < 3; kj++) {
            const inputValue = inputMatrix[pos.row + ki][pos.col + kj].intensity;
            const kernelValue = kernel.values[ki][kj];
            convResult += inputValue * kernelValue;
          }
        }
        
        // Apply ReLU
        const reluResult = Math.max(0, convResult);
        
        // Store in feature map
        featureMaps[kernelIndex][pos.row][pos.col] = reluResult;
        
        // Draw feature map with all values computed so far
        const fMapY = featureMapsY + kernelIndex * 90;
        const featureMapSize = (matrixHeight - 2) * 15;
        const featureCellSize = 15;
        
        // Background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(featureMapsX, fMapY, featureMapSize, featureMapSize);
        
        // Draw computed feature map cells
        featureMaps[kernelIndex].forEach((row, i) => {
          row.forEach((value, j) => {
            const x = featureMapsX + j * featureCellSize;
            const y = fMapY + i * featureCellSize;
            
            if (value !== null) {
              // Color based on activation strength
              const intensity = Math.min(255, Math.max(0, value * 255));
              ctx.fillStyle = `rgba(${intensity}, ${intensity}, ${intensity}, 0.8)`;
              ctx.fillRect(x, y, featureCellSize - 1, featureCellSize - 1);
            }
            
            // Border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x, y, featureCellSize - 1, featureCellSize - 1);
          });
        });
        
        // Highlight current position being calculated
        const currentX = featureMapsX + pos.col * featureCellSize;
        const currentY = fMapY + pos.row * featureCellSize;
        ctx.strokeStyle = kernel.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(currentX - 1, currentY - 1, featureCellSize + 2, featureCellSize + 2);
        
        // Feature map outline
        ctx.strokeStyle = kernel.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(featureMapsX, fMapY, featureMapSize, featureMapSize);
        
        // Labels
        ctx.fillStyle = kernel.color;
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Feature Map ${kernelIndex + 1}`, featureMapsX + featureMapSize/2, fMapY - 5);
        
        // Show current calculation result
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px sans-serif';
        ctx.fillText(`Result: ${reluResult.toFixed(2)}`, featureMapsX + featureMapSize/2, fMapY + featureMapSize + 25);
      });
      
      // Show calculation details
      const calcX = width - 150;
      const calcY = 80;
      
      ctx.fillStyle = '#06b6d4';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`Position: (${pos.row}, ${pos.col})`, calcX, calcY);
      ctx.fillText(`Step: ${currentPosition + 1}/${convolutionPositions.length}`, calcX, calcY + 15);
      
      currentPosition++;
      
      // Continue to next position
      setTimeout(animateNextPosition, 300); // Slower animation speed for better viewing
    };
    
    animateNextPosition();
  }
  
  function animateReLU() {
    const ctx = cnnCanvas.getContext('2d');
    const width = cnnCanvas.width;
    const height = cnnCanvas.height;
    
    // Animation stages for ReLU
    let reluStage = 0; // 0: move feature maps left, 1: show ReLU operation, 2: show output
    
    const matrixHeight = inputMatrix.length;
    const featureMapDim = matrixHeight - 2; // Feature map dimensions
    
    // Store the final feature maps from convolution (simulate some negative values for demo)
    const originalFeatureMaps = cnnKernels.slice(0, 3).map((kernel, kernelIndex) => {
      const featureMap = [];
      for (let i = 0; i < featureMapDim; i++) {
        const row = [];
        for (let j = 0; j < featureMapDim; j++) {
          // Generate realistic values including some negatives for ReLU demo
          let value = (Math.random() - 0.3) * 2; // Range from -0.6 to 1.4
          row.push(value);
        }
        featureMap.push(row);
      }
      return featureMap;
    });
    
    const animateReluStage = () => {
      if (reluStage === 0) {
        // Stage 1: Move feature maps to the left
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#111827'; // Darker background for ReLU stage
        ctx.fillRect(0, 0, width, height);
        
        // Header
        ctx.fillStyle = '#10b981'; // Green for ReLU
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ReLU Activation Function', width / 2, 40);
        
        // Subtitle
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px sans-serif';
        ctx.fillText('f(x) = max(0, x) - Converting negative values to zero', width / 2, 65);
        
        const cellSize = 20;
        const mapSpacing = 50;
        const leftX = 80;
        const startY = height/2 - (featureMapDim * cellSize * 3 + mapSpacing * 2) / 2;
        
        // Draw the 3 feature maps on the left side
        cnnKernels.slice(0, 3).forEach((kernel, kernelIndex) => {
          const mapY = startY + kernelIndex * (featureMapDim * cellSize + mapSpacing);
          
          // Feature map label
          ctx.fillStyle = kernel.color;
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`Feature Map ${kernelIndex + 1}`, leftX + (featureMapDim * cellSize)/2, mapY - 10);
          
          // Draw feature map
          originalFeatureMaps[kernelIndex].forEach((row, i) => {
            row.forEach((value, j) => {
              const x = leftX + j * cellSize;
              const y = mapY + i * cellSize;
              
              // Color based on value (red for negative, grayscale for positive)
              let fillColor;
              if (value < 0) {
                const intensity = Math.min(255, Math.abs(value) * 200);
                fillColor = `rgba(239, 68, 68, 0.8)`; // Red for negative values
              } else {
                const intensity = Math.min(255, value * 200);
                fillColor = `rgba(${intensity}, ${intensity}, ${intensity}, 0.8)`;
              }
              
              ctx.fillStyle = fillColor;
              ctx.fillRect(x, y, cellSize - 1, cellSize - 1);
              
              // Border
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
              ctx.lineWidth = 0.5;
              ctx.strokeRect(x, y, cellSize - 1, cellSize - 1);
              
              // Show value if negative (to demonstrate what will be changed)
              if (value < 0 && cellSize > 15) {
                ctx.fillStyle = '#ffffff';
                ctx.font = '8px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(value.toFixed(1), x + cellSize/2, y + cellSize/2 + 2);
              }
            });
          });
          
          // Outline
          ctx.strokeStyle = kernel.color;
          ctx.lineWidth = 2;
          ctx.strokeRect(leftX, mapY, featureMapDim * cellSize, featureMapDim * cellSize);
        });
        
        // Add arrow pointing to ReLU operation
        const arrowX = leftX + featureMapDim * cellSize + 30;
        const arrowY = height/2;
        
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(arrowX + 80, arrowY);
        ctx.stroke();
        drawArrowHead(ctx, arrowX + 80, arrowY, 0);
        
        // ReLU operation label
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ReLU', arrowX + 40, arrowY - 10);
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px sans-serif';
        ctx.fillText('max(0, x)', arrowX + 40, arrowY + 15);
        
        reluStage++;
        setTimeout(animateReluStage, 3000);
        
      } else if (reluStage === 1) {
        // Stage 2: Show ReLU operation in action
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#111827';
        ctx.fillRect(0, 0, width, height);
        
        // Header
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ReLU Activation: Negative → Zero', width / 2, 40);
        
        const cellSize = 18;
        const mapSpacing = 40;
        const inputX = 60;
        const outputX = 400;
        const startY = height/2 - (featureMapDim * cellSize * 3 + mapSpacing * 2) / 2;
        
        // Draw input and output side by side
        cnnKernels.slice(0, 3).forEach((kernel, kernelIndex) => {
          const mapY = startY + kernelIndex * (featureMapDim * cellSize + mapSpacing);
          
          // Input label
          ctx.fillStyle = '#ffffff';
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Before ReLU', inputX + (featureMapDim * cellSize)/2, mapY - 25);
          
          // Output label  
          ctx.fillText('After ReLU', outputX + (featureMapDim * cellSize)/2, mapY - 25);
          
          // Feature map labels
          ctx.fillStyle = kernel.color;
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText(`Map ${kernelIndex + 1}`, inputX + (featureMapDim * cellSize)/2, mapY - 10);
          ctx.fillText(`Map ${kernelIndex + 1}`, outputX + (featureMapDim * cellSize)/2, mapY - 10);
          
          // Draw input feature map
          originalFeatureMaps[kernelIndex].forEach((row, i) => {
            row.forEach((value, j) => {
              const x = inputX + j * cellSize;
              const y = mapY + i * cellSize;
              
              // Color based on value
              let fillColor;
              if (value < 0) {
                fillColor = `rgba(239, 68, 68, 0.8)`; // Red for negative
              } else {
                const intensity = Math.min(255, value * 200);
                fillColor = `rgba(${intensity}, ${intensity}, ${intensity}, 0.8)`;
              }
              
              ctx.fillStyle = fillColor;
              ctx.fillRect(x, y, cellSize - 1, cellSize - 1);
              
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
              ctx.lineWidth = 0.5;
              ctx.strokeRect(x, y, cellSize - 1, cellSize - 1);
            });
          });
          
          // Draw output feature map (after ReLU)
          originalFeatureMaps[kernelIndex].forEach((row, i) => {
            row.forEach((value, j) => {
              const x = outputX + j * cellSize;
              const y = mapY + i * cellSize;
              
              // Apply ReLU
              const reluValue = Math.max(0, value);
              const intensity = Math.min(255, reluValue * 200);
              
              ctx.fillStyle = `rgba(${intensity}, ${intensity}, ${intensity}, 0.8)`;
              ctx.fillRect(x, y, cellSize - 1, cellSize - 1);
              
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
              ctx.lineWidth = 0.5;
              ctx.strokeRect(x, y, cellSize - 1, cellSize - 1);
              
              // Show "0" for values that were negative
              if (value < 0) {
                ctx.fillStyle = '#ffffff';
                ctx.font = '8px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('0', x + cellSize/2, y + cellSize/2 + 2);
              }
            });
          });
          
          // Draw arrow between input and output
          const arrowY = mapY + (featureMapDim * cellSize) / 2;
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(inputX + featureMapDim * cellSize + 10, arrowY);
          ctx.lineTo(outputX - 10, arrowY);
          ctx.stroke();
          drawArrowHead(ctx, outputX - 10, arrowY, 0);
        });
        
        // Show ReLU equation
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('f(x) = max(0, x)', width/2, height - 40);
        
        reluStage++;
        setTimeout(animateReluStage, 4000);
        
      } else if (reluStage === 2) {
        // Stage 3: Show final output and transition to max pooling
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#111827';
        ctx.fillRect(0, 0, width, height);
        
        // Header
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ReLU Output → Max Pooling', width / 2, 40);
        
        const cellSize = 20;
        const mapSpacing = 50;
        const leftX = 80;
        const startY = height/2 - (featureMapDim * cellSize * 3 + mapSpacing * 2) / 2;
        
        // Draw the ReLU output feature maps
        cnnKernels.slice(0, 3).forEach((kernel, kernelIndex) => {
          const mapY = startY + kernelIndex * (featureMapDim * cellSize + mapSpacing);
          
          ctx.fillStyle = kernel.color;
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`ReLU Output ${kernelIndex + 1}`, leftX + (featureMapDim * cellSize)/2, mapY - 10);
          
          // Draw ReLU output
          originalFeatureMaps[kernelIndex].forEach((row, i) => {
            row.forEach((value, j) => {
              const x = leftX + j * cellSize;
              const y = mapY + i * cellSize;
              
              // Apply ReLU
              const reluValue = Math.max(0, value);
              const intensity = Math.min(255, reluValue * 200);
              
              ctx.fillStyle = `rgba(${intensity}, ${intensity}, ${intensity}, 0.8)`;
              ctx.fillRect(x, y, cellSize - 1, cellSize - 1);
              
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
              ctx.lineWidth = 0.5;
              ctx.strokeRect(x, y, cellSize - 1, cellSize - 1);
            });
          });
          
          ctx.strokeStyle = kernel.color;
          ctx.lineWidth = 2;
          ctx.strokeRect(leftX, mapY, featureMapDim * cellSize, featureMapDim * cellSize);
        });
        
        // Arrow to max pooling
        const arrowX = leftX + featureMapDim * cellSize + 30;
        const arrowY = height/2;
        
        ctx.strokeStyle = '#f59e0b'; // Amber for max pooling
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(arrowX + 80, arrowY);
        ctx.stroke();
        drawArrowHead(ctx, arrowX + 80, arrowY, 0);
        
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Max Pooling', arrowX + 40, arrowY - 10);
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px sans-serif';
        ctx.fillText('2×2 Downsampling', arrowX + 40, arrowY + 15);
        
        // Transition to max pooling
        setTimeout(() => {
          currentCNNStage = 'maxpool';
          animateMaxPool();
        }, 3000);
      }
    };
    
    animateReluStage();
  }
  
  function animateMaxPool() {
    const ctx = cnnCanvas.getContext('2d');
    const width = cnnCanvas.width;
    const height = cnnCanvas.height;
    
    // Clear and redraw with MaxPool focus
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, width, height);
    
    // Draw "MaxPool" stage header
    ctx.fillStyle = '#f59e0b'; // amber
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Max Pooling', width / 2, 30);
    
    // Show max pooling visualization
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('2x2 Max Pooling (Downsampling)', width / 2, 60);
    
    // After MaxPool, show multiple rounds
    setTimeout(() => {
      showMultipleRounds();
    }, 2000);
  }
  
  function showMultipleRounds() {
    const ctx = cnnCanvas.getContext('2d');
    const width = cnnCanvas.width;
    const height = cnnCanvas.height;
    
    // Clear and show simplified multiple rounds
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, width, height);
    
    // Draw header
    ctx.fillStyle = '#8b5cf6'; // purple
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Deep Convolution Layers', width / 2, 30);
    
    // Show simplified flow
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px sans-serif';
    ctx.fillText('Round 1: 4 Feature Maps → Round 2: 8 Feature Maps → Round 3: 20 Feature Maps', width / 2, 70);
    
    // Generate final feature vector (simulate 128 features)
    finalFeatureVector = [];
    for (let i = 0; i < 128; i++) {
      finalFeatureVector.push(Math.random() * 0.8 + 0.1); // Random values between 0.1-0.9
    }
    
    // Show final flattening
    setTimeout(() => {
      showFeatureFlattening();
    }, 3000);
  }
  
  function showFeatureFlattening() {
    const ctx = cnnCanvas.getContext('2d');
    const width = cnnCanvas.width;
    const height = cnnCanvas.height;
    
    // Clear and show flattening
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, width, height);
    
    // Draw header
    ctx.fillStyle = '#ec4899'; // pink
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Feature Vector Flattening', width / 2, 30);
    
    // Show final vector
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px sans-serif';
    ctx.fillText(`20 Feature Maps → Flattened to ${finalFeatureVector.length} Features`, width / 2, 70);
    
    // Draw a representation of the flattened vector
    const vectorStartX = 100;
    const vectorStartY = 100;
    const cellWidth = 4;
    const cellHeight = 15;
    
    finalFeatureVector.slice(0, 100).forEach((value, i) => { // Show first 100 features
      const x = vectorStartX + (i % 20) * cellWidth;
      const y = vectorStartY + Math.floor(i / 20) * cellHeight;
      
      const intensity = Math.round(value * 255);
      ctx.fillStyle = `rgb(${intensity}, ${intensity}, ${intensity})`;
      ctx.fillRect(x, y, cellWidth - 1, cellHeight - 1);
    });
    
    // Continue to neural network
    setTimeout(() => {
      predictionStage = 4; // Skip to neural network stage
      cnnWrapper.style.opacity = '0';
      
      // Show neural network visualization
      setTimeout(() => {
        visualizationWrapper.style.opacity = '1';
        vectorSection.style.transform = 'translateX(0)';
        nnSection.style.opacity = '1';
        nnSection.style.transform = 'scale(1)';
        
        // Update neural network to use 128 inputs instead of 9
        updateNeuralNetworkForCNN();
      }, 500);
    }, 3000);
  }
  
  function updateNeuralNetworkForCNN() {
    // Modify the neural network to handle 128 inputs
    // This will be a simplified version showing the dense vector input
    predictionStage = 4;
    updateStageIndicators();
    animateNeuralNetworkSequence();
  }
}); 