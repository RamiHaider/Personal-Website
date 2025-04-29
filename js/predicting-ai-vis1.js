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
    const pixelSize = 10; // Size of our visualization pixels

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
    
    // Vector cells setup - ensure perfect squares with better spacing
    const vectorCellSize = 40; // Increased from 28 to 40 for wider cells
    const vectorCellSpacing = 5; // Minimal spacing between cells
    const vectorStartY = 50; // Start higher to use more vertical space
    const vectorX = vectorCanvas.width / 2 - vectorCellSize / 2; // Center colored vector
    
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
    cellsInVector = []; // Use the global variable instead of creating a local one
    
    // Clear vector canvas initially
    ctx.clearRect(0, 0, vectorCanvas.width, vectorCanvas.height);
    
    // Draw label for feature vector with improved styling like prediction results
    // First draw a semi-transparent background for better readability
    ctx.fillStyle = 'rgba(17, 24, 39, 0.8)'; // Darker background for better contrast
    ctx.fillRect(vectorCanvas.width/2 - 70, 10, 140, 30); // Larger background area

    // Then draw the text
    ctx.fillStyle = '#3b82f6'; // Blue for input
    ctx.font = '1rem sans-serif'; // Larger font size
    ctx.textAlign = 'center';
    ctx.fillText('Input Vector', vectorCanvas.width / 2, 30);
    
    const animateNextCell = () => {
      if (cellIndex >= totalCells) {
        // Once all cells are in vector, add black & white copy after a delay
        setTimeout(createBWCopy, 500); // Reduced delay from 1000ms to 500ms
        return;
      }
      
      const cell = flattenedCells[cellIndex];
      // Stack cells on top of each other with spacing
      const vectorY = vectorStartY + (cellIndex * (vectorCellSize + vectorCellSpacing));
      
      // Animation for cell movement
      let cellAnimationProgress = 0;
      const animationDuration = 200; // ms per cell
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
        const endX = vectorX;
        const endY = vectorY;
        const endWidth = vectorCellSize;
        const endHeight = vectorCellSize;
        
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
              // Unprocessed cells remain
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
        
        // Redraw the label with improved styling
        // First draw a semi-transparent background for better readability
        ctx.fillStyle = 'rgba(17, 24, 39, 0.8)'; // Darker background for better contrast
        ctx.fillRect(vectorCanvas.width/2 - 70, 10, 140, 30); // Larger background area

        // Then draw the text
        ctx.fillStyle = '#3b82f6'; // Blue for input
        ctx.font = '1rem sans-serif'; // Larger font size
        ctx.textAlign = 'center';
        ctx.fillText('Input Vector', vectorCanvas.width / 2, 30);
        
        // Draw previously transferred cells as perfect squares stacked on top of each other
        cellsInVector.forEach((item) => {
          // Draw cell with original color
          ctx.fillStyle = `rgba(${item.color.r}, ${item.color.g}, ${item.color.b}, 0.8)`;
          
          // Ensure perfect squares
          const squareSize = Math.min(item.width, item.height);
          ctx.fillRect(item.x, item.y, squareSize, squareSize);
          
          // Add border
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.lineWidth = 1;
          ctx.strokeRect(item.x, item.y, squareSize, squareSize);
        });
        
        // Draw the current moving cell
        ctx.fillStyle = `rgba(${cell.color.r}, ${cell.color.g}, ${cell.color.b}, 0.8)`;
        
        // Ensure the cells are perfectly square
        const squareSize = Math.min(currentWidth, currentHeight);
        ctx.fillRect(currentX, currentY, squareSize, squareSize);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1;
        ctx.strokeRect(currentX, currentY, squareSize, squareSize);
        
        // Continue animation if not complete
        if (cellAnimationProgress < 1) {
          requestAnimationFrame(animateCellMovement);
        } else {
          // Animation complete, store the cell in final position
          // Make sure we're using perfect squares for the vector cells
          const squareSize = Math.min(endWidth, endHeight);
          cellsInVector.push({
            x: endX,
            y: endY,
            width: squareSize,
            height: squareSize,
            squareSize: squareSize,
            color: cell.color,
            // Calculate grayscale intensity based on RGB values
            intensity: Math.round(0.299 * cell.color.r + 0.587 * cell.color.g + 0.114 * cell.color.b)
          });
          
          // Move to next cell
          cellIndex++;
          
          // Continue to next cell with a small delay
          if (cellIndex < totalCells) {
            setTimeout(animateNextCell, 50);
          } else {
            // Last cell complete, now create BW copy after a brief pause
            setTimeout(createBWCopy, 500);
          }
        }
      };
      
      // Start the cell animation
      animateCellMovement();
    };
    
    // Create a black and white copy of the vector
    const createBWCopy = () => {
      // Draw a black and white copy on the right side of the original vector
      // We will NOT transform the original colored vector, but add a new BW copy
      
      // Removed the dividing line between colored and BW vectors
      
      // Add Feature Vector label on right side
      ctx.fillStyle = 'rgba(17, 24, 39, 0.8)'; // Darker background
      const bwLabelX = vectorCanvas.width * 0.85; // Position relative to canvas width
      ctx.fillRect(bwLabelX - 70, 10, 140, 30); // Larger background
      ctx.fillStyle = '#3b82f6';
      ctx.font = '1rem sans-serif'; // Larger font
      ctx.textAlign = 'center';
      ctx.fillText('Feature Vector', bwLabelX, 30); // Adjusted position
      
      // Animate the creation of BW copies sequentially, with horizontal slide
      let bwCellIndex = 0;
      const slideDuration = 150; // ms for horizontal slide
      const intervalDelay = 50;  // ms between the start of each slide

      const processNextBWNode = () => {
        if (bwCellIndex >= cellsInVector.length) {
          // *** REFACTOR: Trigger neural network animation immediately after BW nodes are done ***
          setTimeout(() => {
            predictionStage = 3; // Set stage to Processing
            updateStageIndicators(); // Update indicators for the new stage
            nnSection.style.opacity = '1'; // Ensure NN section is visible
            nnSection.style.transform = 'scale(1)';
            animateNeuralNetworkSequence(); // Start the sequence
          }, 200);
          return;
        }
        
        const cell = cellsInVector[bwCellIndex];
        const startX = cell.x + vectorCellSize / 2; // Start from center of colored cell
        const startY = cell.y + vectorCellSize / 2; // Start from center of colored cell
        
        const endX = vectorCanvas.width * 0.85 - vectorCellSize/2; // Final X position for BW node (shifted right)
        const endY = vectorStartY + (bwCellIndex * (vectorCellSize + vectorCellSpacing)); // Final Y position
        
        const finalRadius = vectorCellSize / 2;
        const startRadius = 5; // Start small

        const animationStartTime = Date.now();

        function animateSlide() {
          const elapsed = Date.now() - animationStartTime;
          const progress = Math.min(1, elapsed / slideDuration);

          // Calculate current position and size using easing (ease-out)
          const easedProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
          const currentX = startX + (endX - startX) * easedProgress;
          const currentY = startY + (endY - startY) * easedProgress;
          const currentRadius = startRadius + (finalRadius - startRadius) * easedProgress;

          // --- Redraw necessary background elements --- 
          // Clear the entire canvas to prevent trails
          ctx.clearRect(0, 0, vectorCanvas.width, vectorCanvas.height);

          // Redraw the original colored vector cells (essential to prevent trails)
          cellsInVector.forEach((item) => {
            ctx.fillStyle = `rgba(${item.color.r}, ${item.color.g}, ${item.color.b}, 0.8)`;
            const squareSize = Math.min(item.width, item.height);
            ctx.fillRect(item.x, item.y, squareSize, squareSize);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.lineWidth = 1;
            ctx.strokeRect(item.x, item.y, squareSize, squareSize);
          });
          
          // Redraw label
          ctx.fillStyle = 'rgba(17, 24, 39, 0.8)';
          ctx.fillRect(bwLabelX - 70, 10, 140, 30);
          ctx.fillStyle = '#3b82f6';
          ctx.font = '1rem sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Feature Vector', bwLabelX, 30);

          // Redraw all *previously completed* BW nodes in their final state
          for (let i = 0; i < bwCellIndex; i++) {
              const prevCell = cellsInVector[i];
              const prevX = vectorCanvas.width * 0.85 - vectorCellSize/2;
              const prevY = vectorStartY + (i * (vectorCellSize + vectorCellSpacing));
              const prevIntensity = prevCell.intensity;
              const prevGrayValue = Math.round(prevIntensity);
              const prevRadius = vectorCellSize / 2;
              const prevCenterX = prevX + prevRadius;
              const prevCenterY = prevY + prevRadius;

              ctx.fillStyle = `rgb(${prevGrayValue}, ${prevGrayValue}, ${prevGrayValue})`;
              ctx.shadowColor = '#3b82f6';
              ctx.shadowBlur = 5;
              ctx.beginPath();
              ctx.arc(prevCenterX, prevCenterY, prevRadius, 0, Math.PI * 2);
              ctx.fill();
              ctx.shadowBlur = 0;

              ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
              ctx.font = '12px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText((prevIntensity/255).toFixed(2), prevCenterX, prevCenterY + 4);
          }

          // --- Draw the currently animating BW node --- 
          const intensity = cell.intensity;
          const grayValue = Math.round(intensity);
          
          ctx.fillStyle = `rgb(${grayValue}, ${grayValue}, ${grayValue})`;
          ctx.shadowColor = '#3b82f6';
          ctx.shadowBlur = 5;
          
          const circleCenterX = currentX + vectorCellSize / 2; // Adjust center based on currentX
          const circleCenterY = currentY + vectorCellSize / 2; // Adjust center based on currentY

          ctx.beginPath();
          ctx.arc(currentX + finalRadius, currentY + finalRadius, currentRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Draw text only when node is close to final size/position
          if (progress > 0.8) {
              const textAlpha = Math.min(1, (progress - 0.8) / 0.2); // Fade in text
              ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * textAlpha})`;
              ctx.font = '12px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText((intensity/255).toFixed(2), currentX + finalRadius, currentY + finalRadius + 4);
          }

          // Continue animation or proceed to next node
          if (progress < 1) {
            requestAnimationFrame(animateSlide);
          } else {
            // Animation for this node complete
            // Update the final position info (redundant but good practice)
            cellsInVector[bwCellIndex].bwX = endX; 
            cellsInVector[bwCellIndex].bwY = endY;
            bwCellIndex++;
            // Schedule the *next* node animation after a short delay
            setTimeout(processNextBWNode, intervalDelay); 
          }
        }
        
        // Start the animation for the current node
        animateSlide(); 
      };
      
      // Start the process for the first BW node
      processNextBWNode();
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
      
      // Define neural network layers - now we skip input (it's shown in vectorSection)
      // and only show hidden and output layers
      const layers = [
        { name: 'hidden1', neurons: 6, x: 160, color: '#06b6d4' },  // Reduced to 6 neurons
        { name: 'hidden2', neurons: 3, x: 400, color: '#14b8a6' },
        { name: 'hidden3', neurons: 6, x: 620, color: '#10b981' },
        { name: 'output', neurons: 3, x: 760, color: '#ec4899' }
      ];
      
      // Get currently active nodes and connections
      const currentNodeIndices = {
        input: activeNeuronIndices.input,
        hidden1: activeNeuronIndices.hidden1,
        hidden2: activeNeuronIndices.hidden2,
        hidden3: activeNeuronIndices.hidden3,
        output: activeNeuronIndices.output
      };
      
      // Generate random size variations for neurons
      // Do this once so they remain consistent across animation frames
      if (!window.neuronSizeFactors) {
        window.neuronSizeFactors = {};
        window.connectionWidthFactors = {};
        
        // For each layer, create random size factors for each neuron
        layers.forEach(layer => {
          window.neuronSizeFactors[layer.name] = [];
          window.connectionWidthFactors[layer.name] = [];
          
          for (let i = 0; i < layer.neurons; i++) {
            // Generate random size factor between 0.7 and 1.5
            window.neuronSizeFactors[layer.name][i] = 0.7 + Math.random() * 0.8;
            
            // Generate random connection width factor between 0.6 and 2.0
            window.connectionWidthFactors[layer.name][i] = 0.6 + Math.random() * 1.4;
          }
        });
      }
      
      // First, check if cellsInVector exists and has BW coordinates
      const hasBWCells = cellsInVector && cellsInVector.length > 0 && 
                        cellsInVector[0].hasOwnProperty('bwX') &&
                        cellsInVector[0].hasOwnProperty('bwY');
                        
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
      
      // OPTIMIZATION: Only redraw a portion of persistent connections per frame to improve performance
      const maxConnectionsPerFrame = 120; // Increased from 100 to 120
      const connectionsToDraw = persistentConnections.length > maxConnectionsPerFrame ? 
                            persistentConnections.slice(-maxConnectionsPerFrame) : // Draw the LAST N connections
                            persistentConnections;
      
      // Draw connections between layers following the specific pattern
      connectionsToDraw.forEach(conn => {
        const gradient = ctx.createLinearGradient(conn.fromX, conn.fromY, conn.toX, conn.toY);
        gradient.addColorStop(0, conn.gradient[0]);
        gradient.addColorStop(1, conn.gradient[1]);
        
        // Use the line width stored in the connection object
        const lineWidth = conn.lineWidth || 1.5;
        
        ctx.beginPath();
        ctx.moveTo(conn.fromX, conn.fromY);
        ctx.lineTo(conn.toX, conn.toY);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      });
      
      // Now draw new active connections
      layers.forEach((layer, layerIndex) => {
        if (layerIndex === 0) {
          // For the first hidden layer, connections come from outside (the input vector)
          const inputActive = currentNodeIndices.input;
          const targetActive = currentNodeIndices.hidden1;
          
          // Calculate consistent vertical padding
          const verticalPadding = 40;
          const availableHeight = height - (verticalPadding * 2);
          
          // For each neuron in the first hidden layer
          for (let j = 0; j < layer.neurons; j++) {
            const targetX = layer.x;
            
            // *** FIX: Use consistent Y calculation for TARGET neuron (hidden1), respecting padding ***
            let targetVerticalPadding = 40; // Default padding
            if (layer.name === 'hidden2' || layer.name === 'output') { // 3-neuron layers
                targetVerticalPadding = 90;
            } else if (layer.name === 'hidden1' || layer.name === 'hidden3') { // 6-neuron layers (this layer is hidden1)
                targetVerticalPadding = 70;
            }
            const targetAvailableHeight = height - (targetVerticalPadding * 2);
            const targetSpacing = layer.neurons > 1 ? targetAvailableHeight / (layer.neurons - 1) : targetAvailableHeight;
            const targetY = targetVerticalPadding + (targetSpacing * j);
            
            // Only draw connection if:
            // 1. Input neuron is active AND
            // 2. Either this target neuron is the currently activating one OR
            //    we've already activated this target neuron
            const isTargetCurrentlyActivating = j === targetActive;
            const isTargetAlreadyActive = j < targetActive;
            const isTargetVisible = isTargetCurrentlyActivating || isTargetAlreadyActive;
            
            // Only draw connection from the active input to relevant targets if BW cells exist
            if (inputActive >= 0 && isTargetVisible && hasBWCells && cellsInVector[inputActive]) {
              // Draw from the BW cell center
              const cell = cellsInVector[inputActive];
              const sourceX = 0; // Left edge of neural network canvas
              
              // Calculate center of BW circle for proper connection point
              const circleSize = Math.min(cell.width, cell.height);
              const sourceY = cell.bwY + circleSize/2; // Center of BW circle
              
              const gradient = ctx.createLinearGradient(sourceX, sourceY, targetX, targetY);
              gradient.addColorStop(0, '#3b82f6'); // Input color
              gradient.addColorStop(1, layer.color);
              
              // Create connection info
              const connection = {
                fromLayer: 'input',
                fromIndex: inputActive,
                toLayer: layer.name,
                toIndex: j,
                fromX: sourceX,
                fromY: sourceY,
                toX: targetX,
                toY: targetY,
                gradient: ['#3b82f6', layer.color],
                lineWidth: 1.5 * (window.connectionWidthFactors[layer.name][j] || 1)
              };
              
              // Check if this connection already exists
              const existingConnection = persistentConnections.find(c => 
                c.fromLayer === connection.fromLayer && 
                c.fromIndex === connection.fromIndex &&
                c.toLayer === connection.toLayer &&
                c.toIndex === connection.toIndex
              );
              
              if (!existingConnection) {
                persistentConnections.push(connection);
              }
              
              // Get randomized line width for this target neuron
              const lineWidthFactor = window.connectionWidthFactors[layer.name][j] || 1;
              const randomizedLineWidth = 1.5 * lineWidthFactor;
              
              ctx.beginPath();
              ctx.moveTo(sourceX, sourceY);
              ctx.lineTo(targetX, targetY);
              ctx.strokeStyle = gradient;
              ctx.lineWidth = randomizedLineWidth;
              ctx.stroke();
            }
          }
        } else {
          // Normal connections between visible layers
          const prevLayer = layers[layerIndex - 1];
          const sourceActive = currentNodeIndices[prevLayer.name];
          const targetActive = currentNodeIndices[layer.name];
          
          // Draw connections only from the currently active source neuron
          // to appropriate target neurons
          if (sourceActive >= 0) {
            const sourceX = prevLayer.x;
            
            // *** FIX: Use consistent Y calculation for SOURCE neuron, respecting padding ***
            let sourceVerticalPadding = 40; // Default padding
            if (prevLayer.name === 'hidden2' || prevLayer.name === 'output') { // 3-neuron layers
                sourceVerticalPadding = 90;
            } else if (prevLayer.name === 'hidden1' || prevLayer.name === 'hidden3') { // 6-neuron layers
                sourceVerticalPadding = 70;
            }
            const sourceAvailableHeight = height - (sourceVerticalPadding * 2);
            const sourceSpacing = prevLayer.neurons > 1 ? sourceAvailableHeight / (prevLayer.neurons - 1) : sourceAvailableHeight;
            const sourceY = sourceVerticalPadding + (sourceSpacing * sourceActive);
            
            for (let j = 0; j < layer.neurons; j++) {
              const targetX = layer.x;
              
              // *** FIX: Use consistent Y calculation for target neuron, respecting padding ***
              let targetVerticalPadding = 40; // Default padding
              if (layer.name === 'hidden2' || layer.name === 'output') { // 3-neuron layers
                targetVerticalPadding = 90;
              } else if (layer.name === 'hidden1' || layer.name === 'hidden3') { // 6-neuron layers
                targetVerticalPadding = 70;
              }
              const targetAvailableHeight = height - (targetVerticalPadding * 2);
              const targetSpacing = layer.neurons > 1 ? targetAvailableHeight / (layer.neurons - 1) : targetAvailableHeight;
              const targetY = targetVerticalPadding + (targetSpacing * j);
              
              // Only draw connection to this target if:
              // 1. It's the currently activating target, OR
              // 2. It's already been activated
              const isTargetCurrentlyActivating = j === targetActive;
              const isTargetAlreadyActive = j < targetActive;
              const isTargetRelevant = isTargetCurrentlyActivating || isTargetAlreadyActive;
              
              if (isTargetRelevant) {
                // Create connection info
                const connection = {
                  fromLayer: prevLayer.name,
                  fromIndex: sourceActive,
                  toLayer: layer.name,
                  toIndex: j,
                  fromX: sourceX,
                  fromY: sourceY,
                  toX: targetX,
                  toY: targetY,
                  gradient: [prevLayer.color, layer.color],
                  lineWidth: 1.5 * (window.connectionWidthFactors[layer.name][j] || 1)
                };
                
                // Check if this connection already exists
                const existingConnection = persistentConnections.find(c => 
                  c.fromLayer === connection.fromLayer && 
                  c.fromIndex === connection.fromIndex &&
                  c.toLayer === connection.toLayer &&
                  c.toIndex === connection.toIndex
                );
                
                if (!existingConnection) {
                  persistentConnections.push(connection);
                }
                
                // Draw connection with gradient
                const gradient = ctx.createLinearGradient(sourceX, sourceY, targetX, targetY);
                gradient.addColorStop(0, prevLayer.color);
                gradient.addColorStop(1, layer.color);
                
                // Get randomized line width for this target neuron
                const lineWidthFactor = window.connectionWidthFactors[layer.name][j] || 1;
                const randomizedLineWidth = 1.5 * lineWidthFactor;
                
                ctx.beginPath();
                ctx.moveTo(sourceX, sourceY);
                ctx.lineTo(targetX, targetY);
                ctx.strokeStyle = gradient;
                ctx.lineWidth = randomizedLineWidth;
                ctx.stroke();
              } else {
                // Draw inactive connection
                ctx.beginPath();
                ctx.moveTo(sourceX, sourceY);
                ctx.lineTo(targetX, targetY);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = 0.5;
                ctx.stroke();
              }
            }
          }
        }
      });
      
      // Draw neurons
      layers.forEach((layer, layerIndex) => {
        const activeIndex = currentNodeIndices[layer.name];
        
        // Adjust spacing based on neuron count - special case for layer with few neurons
        let verticalPadding = 40;
        
        // For layers with 3 neurons (hidden2, output), use higher padding to center them
        if (layer.name === 'hidden2' || layer.name === 'output') {
          verticalPadding = 90; // Much higher padding to center the 3 neurons
        } else if (layer.name === 'hidden1' || layer.name === 'hidden3') { // 6-neuron layers
          verticalPadding = 70; // Bring them closer to the middle
        }
        
        const availableHeight = height - (verticalPadding * 2);
        const spacing = layer.neurons > 1 ? availableHeight / (layer.neurons - 1) : availableHeight;
        
        for (let i = 0; i < layer.neurons; i++) {
          const x = layer.x;
          const y = verticalPadding + (spacing * i);
          
          // Determine if this neuron is active
          const isActive = i <= activeIndex;
          
          // Get the randomized size factor for this neuron
          const sizeFactor = window.neuronSizeFactors[layer.name][i] || 1;
          
          // Calculate neuron size
          const baseSize = layer.name === 'output' ? 10 : 6;
          const size = isActive ? baseSize * 1.2 * sizeFactor : baseSize * sizeFactor;
          
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
        
        // Add layer label with improved styling
        const labelY = 25;
        
        // First draw a semi-transparent background for better readability
        ctx.fillStyle = 'rgba(17, 24, 39, 0.8)'; // Darker background
        ctx.fillRect(layer.x - 70, labelY - 20, 140, 30); // Larger background area

        // Then draw the text
        ctx.fillStyle = layer.name === 'output' ? '#ec4899' : '#22d3ee'; // Pink for output, cyan for hidden
        ctx.font = '1rem sans-serif'; // Larger font
        ctx.textAlign = 'center';
        
        // Layer names
        const displayName = layer.name === 'hidden1' ? 'Hidden Layer 1' :
                           layer.name === 'hidden2' ? 'Hidden Layer 2' :
                           layer.name === 'hidden3' ? 'Hidden Layer 3' : 
                           'Output';
        
        ctx.fillText(displayName, layer.x, labelY);
      });
      
      // Continue animation
      if (predictionStage === 3) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    // Create cleanup handler to cancel animation frame
    const cleanup = () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
    };
    
    // Register cleanup handler
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
    // Clear grid, vector, NN, prediction. Keep mapCanvas as it holds the background.
    [gridCanvas, vectorCanvas, neuralNetworkCanvas, predictionSection].forEach(clearCanvas);
    
    // Reset section visibility and transforms
    visualizationWrapper.style.opacity = '0';
    vectorSection.style.transform = 'translateX(-100%)';
    nnSection.style.opacity = '0';
    nnSection.style.transform = 'scale(0.95)';
    predictionSection.style.transform = 'translateX(100%)';
    mapCanvas.style.opacity = '1'; // Ensure map is fully visible after reset
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
    // Define layer info
    const layerInfo = [
      { name: 'input', size: 9 },  // 3x3 grid
      { name: 'hidden1', size: 6 }, // Changed from 9 to 6 neurons
      { name: 'hidden2', size: 3 }, 
      { name: 'hidden3', size: 6 },
      { name: 'output', size: 3 }
    ];
    
    // Check if black and white nodes exist - if not, delay start
    if (!cellsInVector || !cellsInVector[0] || typeof cellsInVector[0].bwX === 'undefined') {
      console.log("BW nodes not ready, delaying neural network animation");
      setTimeout(animateNeuralNetworkSequence, 1000);
      return;
    }
    
    // Queue of animation steps to perform
    const animationSteps = [];
    
    // First, build the complete sequence of node activations:
    
    // 1. For each input node, activate it and connect to all relevant hidden1 nodes
    for (let inputNode = 0; inputNode < layerInfo[0].size; inputNode++) {
      animationSteps.push({
        type: 'activate',
        layer: 'input',
        node: inputNode
      });
      
      // Let each input node fully connect to hidden1 before moving to the next input
      for (let hidden1Node = 0; hidden1Node < layerInfo[1].size; hidden1Node++) {
        if (hidden1Node === 0) {
          // For the first hidden node, add it separately
          animationSteps.push({
            type: 'activate',
            layer: 'hidden1',
            node: hidden1Node
          });
        } else {
          // For subsequent nodes, show connections from current input to this node
          animationSteps.push({
            type: 'activate',
            layer: 'hidden1',
            node: hidden1Node
          });
        }
      }
      
      // Reset hidden1 activation before next input neuron
      if (inputNode < layerInfo[0].size - 1) {
        animationSteps.push({
          type: 'reset',
          layer: 'hidden1'
        });
      }
    }
    
    // 2. For each hidden1 node, connect to all relevant hidden2 nodes
    for (let hidden1Node = 0; hidden1Node < layerInfo[1].size; hidden1Node++) {
      // Reactivate the hidden1 node
      animationSteps.push({
        type: 'activate',
        layer: 'hidden1',
        node: hidden1Node
      });
      
      // Connect to each hidden2 node
      for (let hidden2Node = 0; hidden2Node < layerInfo[2].size; hidden2Node++) {
        animationSteps.push({
          type: 'activate',
          layer: 'hidden2',
          node: hidden2Node
        });
      }
      
      // Reset hidden2 activation before next hidden1 neuron
      if (hidden1Node < layerInfo[1].size - 1) {
        animationSteps.push({
          type: 'reset',
          layer: 'hidden2'
        });
      }
    }
    
    // 3. For each hidden2 node, connect to all relevant hidden3 nodes
    for (let hidden2Node = 0; hidden2Node < layerInfo[2].size; hidden2Node++) {
      // Reactivate the hidden2 node
      animationSteps.push({
        type: 'activate',
        layer: 'hidden2',
        node: hidden2Node
      });
      
      // Connect to each hidden3 node
      for (let hidden3Node = 0; hidden3Node < layerInfo[3].size; hidden3Node++) {
        animationSteps.push({
          type: 'activate',
          layer: 'hidden3',
          node: hidden3Node
        });
      }
      
      // Reset hidden3 activation before next hidden2 neuron
      if (hidden2Node < layerInfo[2].size - 1) {
        animationSteps.push({
          type: 'reset',
          layer: 'hidden3'
        });
      }
    }
    
    // 4. For each hidden3 node, connect to all output nodes
    for (let hidden3Node = 0; hidden3Node < layerInfo[3].size; hidden3Node++) {
      // Reactivate the hidden3 node
      animationSteps.push({
        type: 'activate',
        layer: 'hidden3',
        node: hidden3Node
      });
      
      // Connect to each output node
      for (let outputNode = 0; outputNode < layerInfo[4].size; outputNode++) {
        animationSteps.push({
          type: 'activate',
          layer: 'output',
          node: outputNode
        });
      }
      
      // Reset output activation before next hidden3 neuron
      if (hidden3Node < layerInfo[3].size - 1) {
        animationSteps.push({
          type: 'reset',
          layer: 'output'
        });
      }
    }
    
    // Last step: Full activation to show final prediction
    animationSteps.push({
      type: 'full_activation'
    });
    
    // Execute the animation sequence
    let currentStep = 0;
    
    // SPEED CONTROL: Adjust these values to control animation speed
    let initialStepDelay = 30; // Reduced from 40 to 30 - adjust this for overall speed
    let midStageDelay = 15;    // Reduced from 20 to 15
    let lateStageDelay = 5;    // Reduced from 10 to 5
    let stepDelay = initialStepDelay;
    
    const processNextStep = () => {
      // Adjust the delay based on progress to speed up in later stages
      if (currentStep > animationSteps.length * 0.3) {
        stepDelay = midStageDelay; // Faster in middle stages
      }
      if (currentStep > animationSteps.length * 0.6) {
        stepDelay = lateStageDelay; // Much faster in later stages
      }
      
      if (currentStep >= animationSteps.length) {
        // Animation sequence complete, show predictions
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
          scheduleReset(); // Call scheduleReset to trigger the reset after predictions
        }, 500);
        return;
      }
      
      const step = animationSteps[currentStep];
      
      if (step.type === 'activate') {
        // Activate a specific node in a layer
        activeNeuronIndices[step.layer] = step.node;
      } else if (step.type === 'reset') {
        // Reset a layer's activation
        activeNeuronIndices[step.layer] = -1;
      } else if (step.type === 'full_activation') {
        // Fully activate all layers for final display
        activeNeuronIndices.input = layerInfo[0].size - 1;
        activeNeuronIndices.hidden1 = layerInfo[1].size - 1;
        activeNeuronIndices.hidden2 = layerInfo[2].size - 1;
        activeNeuronIndices.hidden3 = layerInfo[3].size - 1;
        activeNeuronIndices.output = layerInfo[4].size - 1;
      }
      
      // Trigger neural network animation frame
      animateNeuralNetwork();
      
      // Move to next step
      currentStep++;
      
      // Use requestAnimationFrame for smoother animation and to ensure previous frame completes
      requestAnimationFrame(() => {
        setTimeout(processNextStep, stepDelay);
      });
    };
    
    // Start the animation sequence after making sure neurons are drawn
    animateNeuralNetwork(); // Draw the initial state first
    setTimeout(processNextStep, 1000); // Start sequence after a delay
  }
  
  // New function to handle reset after full visualization completes
  function scheduleReset() {
    // Only reset if we've completed the prediction stage
    if (predictionStage === 4) {
      console.log("Scheduling visualization reset...");
      setTimeout(() => {
        console.log("Resetting visualization now.");
        // Instead of runVisualization, trigger the image loading again
        // which starts the whole process over
        if (backgroundImage) {
           backgroundImage.src = 'assets/images/usgs-Qu8lplStSSE-unsplash.jpg'; // Reload image to restart
        } else {
           console.error("Cannot restart, backgroundImage object not found.");
        }
      }, 7000); // Show prediction results for 7 seconds before resetting
    }
  }
  
  // Initialize and start visualization by loading the image
  console.log("Initiating visualization by loading image...");
  backgroundImage.src = 'assets/images/usgs-Qu8lplStSSE-unsplash.jpg';
}); 