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
  let selectionBoxState = { x: 240, y: 120, width: 160, height: 160 }; // Changed to 32x32 pixels (160=32*5)
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
  
  // CONFIGURATION - FULL ANIMATION MODE
  const DEVELOPMENT_MODE = false; // Show full CNN pipeline
  
  // Hard-coded feature vector for development (216 values)
  const HARDCODED_FEATURE_VECTOR = Array.from({ length: 216 }, (_, i) => {
    // Create realistic feature values with some variation
    const baseValue = 0.3 + Math.sin(i * 0.1) * 0.3 + Math.random() * 0.4;
    return Math.max(0, Math.min(1, baseValue));
  });
  
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
    
    // DEVELOPMENT MODE: Skip directly to neural network
    if (DEVELOPMENT_MODE) {
      console.log("DEVELOPMENT MODE: Skipping to neural network visualization");
      
      // Set up for neural network directly
      finalFeatureVector = [...HARDCODED_FEATURE_VECTOR];
      predictionStage = 4; // Neural Network stage
      updateStageIndicators();
      
      // Show the flattening scene briefly, then go to neural network
      setTimeout(() => {
        showDevelopmentFlattening();
      }, 1000);
      
      return; // Skip normal pipeline
    }
    
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
    // Only show and update selection in stage 1
    if (predictionStage === 1) {
      // Extract grid data from pixels in selection - ensure exact pixel boundaries
      // Make sure to snap to the grid boundaries
      const pixelSize = 5;
      
      // Snap selectionBox to pixel grid
      const snappedX = Math.floor(selectionBoxState.x / pixelSize) * pixelSize;
      const snappedY = Math.floor(selectionBoxState.y / pixelSize) * pixelSize;
      const snappedWidth = Math.ceil(selectionBoxState.width / pixelSize) * pixelSize;
      const snappedHeight = Math.ceil(selectionBoxState.height / pixelSize) * pixelSize;
      
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
      
      // Create selective blur effect - blur everything EXCEPT the selected region
      const mapCtx = mapCanvas.getContext('2d');
      const width = mapCanvas.width;
      const height = mapCanvas.height;
      
      // Clear and redraw the full pixelated background first
      mapCtx.clearRect(0, 0, width, height);
      
      // Draw all background pixels
      backgroundPixels.forEach(row => {
        row.forEach(pixel => {
          mapCtx.fillStyle = `rgb(${pixel.color.r}, ${pixel.color.g}, ${pixel.color.b})`;
          mapCtx.fillRect(pixel.x, pixel.y, pixel.width, pixel.height);
        });
      });
      
      // Apply blur to everything first
      mapCtx.save();
      mapCtx.filter = 'blur(6px)';
      
      // Create a temporary canvas for the blurred version
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext('2d');
      
      // Draw pixelated background to temp canvas
      backgroundPixels.forEach(row => {
        row.forEach(pixel => {
          tempCtx.fillStyle = `rgb(${pixel.color.r}, ${pixel.color.g}, ${pixel.color.b})`;
          tempCtx.fillRect(pixel.x, pixel.y, pixel.width, pixel.height);
        });
      });
      
      // Apply blur and draw the blurred version
      mapCtx.filter = 'blur(6px)';
      mapCtx.drawImage(tempCanvas, 0, 0);
      
      // Remove blur filter and draw sharp pixelated version in selected region
      mapCtx.filter = 'none';
      
      // Clip to the selected region and draw sharp pixelated version
      mapCtx.save();
      mapCtx.beginPath();
      mapCtx.rect(snappedX, snappedY, snappedWidth, snappedHeight);
      mapCtx.clip();
      
      // Draw sharp pixelated version in the clipped area
      backgroundPixels.forEach(row => {
        row.forEach(pixel => {
          // Only draw pixels that are in the selected region
          if (pixel.x >= snappedX && pixel.x < snappedX + snappedWidth &&
              pixel.y >= snappedY && pixel.y < snappedY + snappedHeight) {
            mapCtx.fillStyle = `rgb(${pixel.color.r}, ${pixel.color.g}, ${pixel.color.b})`;
            mapCtx.fillRect(pixel.x, pixel.y, pixel.width, pixel.height);
          }
        });
      });
      
      mapCtx.restore();
      mapCtx.restore();
      
      // Draw animated white selection outline on canvas
      const ctx = gridCanvas.getContext('2d');
      
      // Create animation frame for dashed line movement (slower)
      let dashOffset = 0;
      const animateSelection = () => {
        if (predictionStage !== 1) return; // Stop animation if stage changed
        
        ctx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
        
        // Draw white selection outline with animated dash (reduced stroke width)
        ctx.strokeStyle = '#ffffff'; // White color as requested
        ctx.lineWidth = 3; // Reduced from 6 to 3 for thinner stroke
        ctx.setLineDash([12, 6]); // Dashed line pattern
        ctx.lineDashOffset = -dashOffset; // Animate the dash offset
        
        // Add glow effect
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 10; // Reduced glow for thinner stroke
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        ctx.strokeRect(
          snappedX - 3, 
          snappedY - 3, 
          snappedWidth + 6, 
          snappedHeight + 6
        );
        
        // Reset shadow
        ctx.shadowBlur = 0;
        
        // Increment dash offset for animation (slower)
        dashOffset = (dashOffset + 0.3) % 18; // Reduced from +1 to +0.3 for slower animation
        
        // Continue animation
        requestAnimationFrame(animateSelection);
      };
      
      // Start the animation
      animateSelection();
      
    } else {
      // For other stages, hide the selection and restore normal background
      const ctx = gridCanvas.getContext('2d');
      ctx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
      
      // Restore normal pixelated background without blur
      const mapCtx = mapCanvas.getContext('2d');
      mapCtx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
      
      // Redraw pixelated background
      backgroundPixels.forEach(row => {
        row.forEach(pixel => {
          mapCtx.fillStyle = `rgb(${pixel.color.r}, ${pixel.color.g}, ${pixel.color.b})`;
          mapCtx.fillRect(pixel.x, pixel.y, pixel.width, pixel.height);
        });
      });
    }
  }
  
  // Transition background to focus on selection
  function fadeBackgroundForMatrix() {
    if (predictionStage < 2 || gridData.length === 0) return;
    
    // Create overlay to fade background except for selection area
    mapCanvas.style.transition = 'opacity 1s ease-in-out';
    
    // Make the background slightly transparent
    mapCanvas.style.opacity = '0.3';
    
    // Note: selectionBox div removed - selection now handled by canvas only
    
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
  
  // Replace the animateVectorization function with direct RGB transition
  function animateVectorization() {
    if (predictionStage < 2 || gridData.length === 0) return;
    
    // Go directly to RGB decomposition without intermediate highlighting
    predictionStage = 2; // RGB Decomposition stage
    updateStageIndicators();
    
    // Hide current visualization and show RGB decomposition immediately
    mapCanvas.style.opacity = '0';
    gridCanvas.style.opacity = '0';
    visualizationWrapper.style.opacity = '0';
    
    // Faster transition to RGB decomposition
    setTimeout(() => {
      showRGBDecomposition();
    }, 150); // Reduced from 300ms to 150ms for faster transition
  }

  // NEW: RGB Decomposition Visualization
  function showRGBDecomposition() {
    if (predictionStage < 2) return;
    
    // Show CNN wrapper for RGB decomposition
    cnnWrapper.style.opacity = '1';
    
    // Start RGB decomposition animation immediately (simplified)
    setTimeout(() => {
      animateRGBDecomposition();
    }, 300);
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
      
    // Simplified animation - just one stage showing Original + R/G/B
    const matrixRows = gridData.length;
    const matrixCols = gridData[0]?.length || 0;
    
    console.log(`RGB Decomposition starting with ${matrixRows}x${matrixCols} matrix`);
    
    // Single stage: Show complete decomposition with all 4 matrices
    ctx.clearRect(0, 0, width, height);
    
    // Dark blue background (consistent)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);
    
    const cellSize = 8; // Size for original matrix
    const smallCellSize = 3; // Much smaller for the 3 stacked channels
    const channelSpacing = 40; // Vertical spacing between channels
    
    // Calculate positions
    const originalX = 120; // Fixed position for original on left
    const originalY = height / 2 - (matrixRows * cellSize) / 2;
    
    const channelsStartX = originalX + (matrixCols * cellSize) + 80; // Channels on right
    const channelsStartY = height / 2 - (3 * matrixRows * smallCellSize + 2 * channelSpacing) / 2;
    
    // Draw original matrix with black strokes
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Original RGB', originalX + (matrixCols * cellSize)/2, originalY - 25);
    
    gridData.forEach((row, i) => {
      row.forEach((cell, j) => {
        const x = originalX + j * cellSize;
        const y = originalY + i * cellSize;
        
        // Draw original RGB cell
        ctx.fillStyle = `rgb(${cell.color.r}, ${cell.color.g}, ${cell.color.b})`;
        ctx.fillRect(x, y, cellSize - 1, cellSize - 1);
        
        // Black stroke, thinner
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, cellSize - 1, cellSize - 1);
      });
    });
    
    // Draw the 3 channels stacked vertically
    const channels = [
      { name: 'R', color: '#ff4444', getValue: (cell) => cell.color.r, opacity: 1.0 },
      { name: 'G', color: '#44ff44', getValue: (cell) => cell.color.g, opacity: 0.6 },
      { name: 'B', color: '#4444ff', getValue: (cell) => cell.color.b, opacity: 0.6 }
    ];
    
    channels.forEach((channel, channelIndex) => {
      const channelY = channelsStartY + channelIndex * (matrixRows * smallCellSize + channelSpacing);
      
      // Channel label to the left
      ctx.fillStyle = channel.color;
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(channel.name, channelsStartX - 30, channelY + (matrixRows * smallCellSize) / 2 + 7);
      
      // Draw channel matrix
      gridData.forEach((row, i) => {
        row.forEach((cell, j) => {
          const x = channelsStartX + j * smallCellSize;
          const y = channelY + i * smallCellSize;
          
          const value = channel.getValue(cell);
          if (channel.name === 'R') {
            ctx.fillStyle = `rgba(${value}, 0, 0, ${channel.opacity})`;
          } else if (channel.name === 'G') {
            ctx.fillStyle = `rgba(0, ${value}, 0, ${channel.opacity})`;
        } else {
            ctx.fillStyle = `rgba(0, 0, ${value}, ${channel.opacity})`;
          }
          
          ctx.fillRect(x, y, smallCellSize - 1, smallCellSize - 1);
          
          // Thin black stroke
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 0.3;
          ctx.strokeRect(x, y, smallCellSize - 1, smallCellSize - 1);
      });
    });
    
      // Channel outline (dimmed for G and B)
      ctx.strokeStyle = channel.opacity < 1.0 ? `${channel.color}80` : channel.color; // Add transparency to outline for dimmed channels
      ctx.lineWidth = 1.5;
      ctx.strokeRect(channelsStartX - 2, channelY - 2, 
                    matrixCols * smallCellSize + 4, matrixRows * smallCellSize + 4);
    });
    
    // Show overlay message after 2 seconds
    setTimeout(() => {
      showRedChannelConversion(); // Go directly to Red channel conversion, skip processing overlay
    }, 2500); // Increased from 2000ms to 2500ms for more viewing time
  }
  
  function showRedChannelConversion() {
    // Move to the Red → Intensity conversion scene
    const ctx = cnnCanvas.getContext('2d');
    const width = cnnCanvas.width;
    const height = cnnCanvas.height;
    const matrixRows = gridData.length;
    const matrixCols = gridData[0]?.length || 0;
    
    // Stage: Show Red Channel and Intensity Matrix side by side
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);
    
    // Header
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Red Channel → Intensity Values', width / 2, 40);
    
    const cellSize = 8;
    const matrixSpacing = 120; // Increased spacing between matrices
    
    // Position Red matrix on the left side
    const leftX = 100;
    const leftY = height / 2 - (matrixRows * cellSize) / 2;
    
    // Position Intensity matrix on the right side
    const rightX = leftX + (matrixCols * cellSize) + matrixSpacing;
    const rightY = height / 2 - (matrixRows * cellSize) / 2;
    
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
    
    // Draw Intensity Matrix on the right
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Intensity Matrix (0-255)', rightX + (matrixCols * cellSize)/2, rightY - 25);
    
    // Prepare input matrix for CNN
    inputMatrix = [];
    gridData.forEach((row, i) => {
      const matrixRow = [];
      row.forEach((cell, j) => {
        const x = rightX + j * cellSize;
        const y = rightY + i * cellSize;
        
        // Draw grayscale cell based on red intensity
        const intensity = cell.color.r;
        ctx.fillStyle = `rgb(${intensity}, ${intensity}, ${intensity})`;
        ctx.fillRect(x, y, cellSize - 2, cellSize - 2);
        
        // Draw border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, cellSize - 2, cellSize - 2);
        
        // Store for CNN input
        matrixRow.push({
          ...cell,
          intensity: intensity / 255, // Normalize to 0-1
          displayIntensity: intensity
        });
      });
      inputMatrix.push(matrixRow);
    });
    
    // Draw outlines around both matrices
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 3;
    ctx.strokeRect(leftX - 3, leftY - 3, 
                  matrixCols * cellSize + 6, matrixRows * cellSize + 6);
    
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;
    ctx.strokeRect(rightX - 3, rightY - 3, 
                  matrixCols * cellSize + 6, matrixRows * cellSize + 6);
    
    // Conversion text in the middle (no arrow)
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    const middleX = leftX + (matrixCols * cellSize) + matrixSpacing/2;
    const middleY = height / 2;
    ctx.fillText('Convert to', middleX, middleY - 10);
    ctx.fillText('Intensity Values', middleX, middleY + 10);
    
    // Add note about values
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${matrixRows}×${matrixCols} matrix with values 0-255`, 
                rightX + (matrixCols * cellSize)/2, rightY + matrixRows * cellSize + 20);
    
    console.log(`Intensity matrix prepared: ${inputMatrix.length}x${inputMatrix[0]?.length || 0}`);
    
    // Transition to CNN processing
    setTimeout(() => {
      predictionStage = 3; // CNN Processing stage
      updateStageIndicators();
      animateCNNConvolution();
    }, 3000);
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
  
  // Neural network animation - COMPLETELY REPLACED with sophisticated version
  function animateNeuralNetwork() {
    if (predictionStage < 4) return;
    
    const ctx = neuralNetworkCanvas.getContext('2d');
    const width = neuralNetworkCanvas.width;
    const height = neuralNetworkCanvas.height;
    
    // SOPHISTICATED NEURAL NETWORK ARCHITECTURE
    const layers = [
      { name: 'input', neurons: 60, visualNeurons: 216, x: 80, color: '#3b82f6' },
      { name: 'hidden1', neurons: 30, visualNeurons: 96, x: 240, color: '#06b6d4' },
      { name: 'hidden2', neurons: 32, visualNeurons: 32, x: 400, color: '#14b8a6' },
      { name: 'hidden3', neurons: 12, visualNeurons: 12, x: 560, color: '#10b981' },
      { name: 'output', neurons: 3, visualNeurons: 3, x: 720, color: '#ec4899' }
    ];
    
    // Animation state for new system
    if (!window.neuralAnimationState) {
      window.neuralAnimationState = {
        currentInputIndex: 0,
        currentLayerPair: 0,
        animationStep: 0,
        cascadeSpeed: 4,
        activeConnections: [],
        connectionIdCounter: 0,
        animationFrame: null
      };
    }
    
    const state = window.neuralAnimationState;
    
    // Layer pairs for cascade animation
    const layerPairs = [
      { from: 0, to: 1, name: 'Input → Hidden1' },
      { from: 1, to: 2, name: 'Hidden1 → Hidden2' },
      { from: 2, to: 3, name: 'Hidden2 → Hidden3' },
      { from: 3, to: 4, name: 'Hidden3 → Output' }
    ];
    
    // Generate realistic feature vector using our actual flattened data
    const featureVector = finalFeatureVector.length > 0 ? 
      finalFeatureVector.slice(0, 60) : // Use actual CNN flattened data
      HARDCODED_FEATURE_VECTOR.slice(0, 60); // Fallback to hardcoded if not available
    
    function getLayerPositions(layerIndex) {
      const layer = layers[layerIndex];
      const positions = [];
      
      if (layerIndex === 0) {
        // Input: visual column but actual processing count
        const columnWidth = 24;
        const columnHeight = 400; // Slightly smaller to fit our canvas
        const cellHeight = columnHeight / layer.visualNeurons;
        const startY = (height - columnHeight) / 2;
        
        for (let i = 0; i < layer.neurons; i++) {
          // Map actual neurons to visual positions
          const visualIndex = Math.floor((i / layer.neurons) * layer.visualNeurons);
          positions.push({
            x: layer.x,
            y: startY + visualIndex * cellHeight,
            width: columnWidth,
            height: Math.max(2, cellHeight * 3), // Make cells slightly larger
            visualY: startY + visualIndex * cellHeight
          });
        }
      } else {
        // Hidden/Output: spread vertically
        const startY = 80;
        const endY = height - 80;
        const spacing = layer.neurons > 1 ? (endY - startY) / (layer.neurons - 1) : 0;
        
        for (let i = 0; i < layer.neurons; i++) {
          positions.push({
            x: layer.x,
            y: startY + i * spacing,
            width: 14,
            height: 14
          });
        }
      }
      
      return positions;
    }
    
    function addConnection(fromPos, toPos, fromColor, toColor) {
      const connection = {
        id: state.connectionIdCounter++,
        fromX: fromPos.x + fromPos.width,
        fromY: fromPos.y + fromPos.height/2,
        toX: toPos.x,
        toY: toPos.y + toPos.height/2,
        fromColor: fromColor,
        toColor: toColor,
        age: 0,
        maxAge: 600 // Persist for 10 seconds at 60fps
      };
      
      state.activeConnections.push(connection);
    }
    
    function updateConnections() {
      // Age all connections and remove old ones
      state.activeConnections = state.activeConnections.filter(conn => {
        conn.age++;
        return conn.age < conn.maxAge;
      });
    }
    
    function drawConnections() {
      state.activeConnections.forEach(conn => {
        // Static alpha - no glowing effect
        const alpha = Math.max(0.1, 1 - (conn.age / conn.maxAge));
        
        // Create gradient
        const gradient = ctx.createLinearGradient(
          conn.fromX, conn.fromY,
          conn.toX, conn.toY
        );
        gradient.addColorStop(0, conn.fromColor);
        gradient.addColorStop(1, conn.toColor);
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = alpha * 0.6; // Consistent opacity
        
        // Draw connection line
        ctx.beginPath();
        ctx.moveTo(conn.fromX, conn.fromY);
        ctx.lineTo(conn.toX, conn.toY);
        ctx.stroke();
      });
      
      ctx.globalAlpha = 1;
    }
    
    function drawBackground() {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);
      
      // Subtle grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
    }
    
    function drawLayers() {
      layers.forEach((layer, layerIdx) => {
        const positions = getLayerPositions(layerIdx);
        
        // Layer title
        ctx.fillStyle = layer.color;
        ctx.font = 'bold 14px Arial'; // Slightly smaller for our canvas
        ctx.textAlign = 'center';
        
        const layerNames = {
          input: 'CNN Features',
          hidden1: 'Hidden 1',
          hidden2: 'Hidden 2', 
          hidden3: 'Hidden 3',
          output: 'Output'
        };
        
        ctx.fillText(layerNames[layer.name], layer.x + (layerIdx === 0 ? 12 : 0), 35);
        ctx.font = '10px Arial';
        ctx.fillText(`(${layer.visualNeurons})`, layer.x + (layerIdx === 0 ? 12 : 0), 50);
        
        if (layerIdx === 0) {
          // Draw full visual column first
          const columnWidth = 24;
          const columnHeight = 400;
          const cellHeight = columnHeight / layer.visualNeurons;
          const startY = (height - columnHeight) / 2;
          
          // Draw all visual cells with grayscale intensity (matching flattening scene)
          for (let i = 0; i < layer.visualNeurons; i++) {
            const value = featureVector[i % featureVector.length];
            
            // Use grayscale intensity like in flattening scene (no more rainbow colors)
            const intensity = Math.min(255, Math.max(50, value * 200)); // Ensure visibility
            ctx.fillStyle = `rgb(${intensity}, ${intensity}, ${intensity})`;
            ctx.fillRect(layer.x, startY + i * cellHeight, columnWidth, Math.max(1, cellHeight - 0.5));
          }
          
          // Highlight active processing neurons
          positions.forEach((pos, i) => {
            const pair = layerPairs[state.currentLayerPair] || layerPairs[0];
            const isActive = (pair.from === layerIdx) && 
                            (i === state.currentInputIndex % layer.neurons);
            
            if (isActive) {
              ctx.strokeStyle = layer.color;
              ctx.lineWidth = 3;
              ctx.strokeRect(pos.x - 2, pos.y - 1, pos.width + 4, pos.height + 2);
            }
          });
          
          // Column border
          ctx.strokeStyle = layer.color;
          ctx.lineWidth = 2;
          ctx.strokeRect(layer.x - 3, startY - 3, columnWidth + 6, columnHeight + 6);
          
        } else {
          // Hidden/Output layers: circular neurons
          positions.forEach((pos, i) => {
            const pair = layerPairs[state.currentLayerPair] || layerPairs[0];
            const isTargetLayer = pair.to === layerIdx;
            const isActive = isTargetLayer && (state.animationStep % 15) < 8;
            
            ctx.beginPath();
            ctx.arc(pos.x, pos.y + pos.height/2, pos.width/2, 0, Math.PI * 2);
            
            if (isActive) {
              ctx.fillStyle = layer.color;
            } else {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            }
            
            ctx.fill();
            
            // Border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 1;
            ctx.stroke();
          });
        }
      });
    }
    
    function updateAnimation() {
      state.animationStep++;
      
      // Move to next input neuron every few frames
      if (state.animationStep % state.cascadeSpeed === 0) {
        const pair = layerPairs[state.currentLayerPair] || layerPairs[0];
        const fromPositions = getLayerPositions(pair.from);
        const toPositions = getLayerPositions(pair.to);
        const fromLayer = layers[pair.from];
        const toLayer = layers[pair.to];
        
        // Current active input neuron
        const activeInputIdx = state.currentInputIndex % fromLayer.neurons;
        
        if (activeInputIdx < fromPositions.length) {
          const fromPos = fromPositions[activeInputIdx];
          
          // Add connections from current input to ALL neurons in target layer
          toPositions.forEach((toPos) => {
            addConnection(fromPos, toPos, fromLayer.color, toLayer.color);
          });
        }
        
        state.currentInputIndex++;
        
        // If we've gone through all inputs in current layer, move to next layer pair
        if (state.currentInputIndex >= fromLayer.neurons) {
          state.currentInputIndex = 0;
          state.currentLayerPair++;
          
          // Check if we've completed all layer pairs (ONE FORWARD PASS ONLY)
          if (state.currentLayerPair >= layerPairs.length) {
            // ANIMATION COMPLETE - immediately show prediction results
            console.log("Neural network forward pass complete!");
            
            // Stop the animation loop
            if (state.animationFrame) {
              cancelAnimationFrame(state.animationFrame);
              state.animationFrame = null;
            }
            
            // Immediately transition to prediction results (no delay)
            setTimeout(() => {
              if (predictionStage === 4) {
                predictionStage = 5;
                predictionResults = [
                  { type: 'Gold', probability: 0.78, color: '#FFD700' },
                  { type: 'Copper', probability: 0.52, color: '#B87333' },
                  { type: 'Iron', probability: 0.31, color: '#a52a2a' }
                ];
                predictionSection.style.transform = 'translateX(0)';
                updateStageIndicators();
                showPredictionResults();
                scheduleReset();
              }
            }, 500); // Very short delay just for visual smoothness
            
            return; // Exit the animation loop
          }
        }
      }
    }
    
    // Main animation loop
    function animate() {
      // Stop animation if we've moved past the neural network stage
      if (predictionStage !== 4) {
        if (state.animationFrame) {
          cancelAnimationFrame(state.animationFrame);
          state.animationFrame = null;
        }
        return;
      }
      
      drawBackground();
      updateAnimation();
      updateConnections();
      drawConnections();
      drawLayers();
      
      // Continue animation only if still in neural network stage
      if (predictionStage === 4) {
        state.animationFrame = requestAnimationFrame(animate);
      }
    }
    
    // Start animation if not already running
    if (!state.animationFrame) {
      animate();
    }
    
    // Cleanup function
    window.neuralNetworkCleanup = () => {
      if (state.animationFrame) {
        cancelAnimationFrame(state.animationFrame);
        state.animationFrame = null;
      }
      state.activeConnections = [];
      window.neuralAnimationState = null;
    };
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
    const selectionWidth = 160; // Changed from 30 to 160 (32 * 5 pixels)
    const selectionHeight = 160; // Changed from 30 to 160 (32 * 5 pixels)
    selectionBoxState = {
      x: minX + Math.floor(Math.random() * (availableWidth - selectionWidth)),
      y: margin + Math.floor(Math.random() * (500 - margin*2 - selectionHeight)),
      width: selectionWidth,
      height: selectionHeight
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
    // Note: selectionBox div removed - no longer needed

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
     
     // Stage 1 -> 2: Extract Data & Go directly to RGB decomposition (longer delay)
     setTimeout(() => {
       predictionStage = 2; 
       updateStageIndicators(); 
       
       visualizationWrapper.style.opacity = '1';
       vectorSection.style.transform = 'translateX(0)';
       
       animateVectorization(); // This now goes directly to RGB with no intermediate steps
     }, 4000); // Increased from 2000 to 4000 for longer appreciation of selection
  }

  // Function to animate neural network with proper activation pattern
  function animateNeuralNetworkSequence() {
    // Define layer info - updated for flattened CNN features
    const layerInfo = [
      { name: 'input', size: 216 },    // 216 features from flattened 6 feature maps
      { name: 'hidden1', size: 96 },   // First hidden layer
      { name: 'hidden2', size: 32 },   // Second hidden layer  
      { name: 'hidden3', size: 12 },   // Third hidden layer
      { name: 'output', size: 3 }      // Output layer (3 mineral types)
    ];
    
    // Check if we have finalFeatureVector from CNN
    if (!finalFeatureVector || finalFeatureVector.length === 0) {
      console.log("CNN feature vector not ready, using placeholder");
      // Create placeholder vector
      finalFeatureVector = [];
      for (let i = 0; i < 216; i++) {
        finalFeatureVector.push(Math.random() * 0.8 + 0.1);
      }
    }
    
    console.log(`Neural network starting with ${finalFeatureVector.length} input features`);
    
    // Create a simplified animation that shows groups of inputs activating
    const animationSteps = [];
    
    // Group inputs into batches for visualization (smaller batches for 216 inputs)
    const inputBatchSize = 12; // Show 12 inputs at a time for smoother animation
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
      
      // Reset hidden1 before next batch (except last batch)
      if (batch < numBatches - 1) {
        animationSteps.push({
          type: 'reset',
          layer: 'hidden1'
        });
      }
    }
    
    // 2. Hidden1 → Hidden2 connections
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
    
    // 3. Hidden2 → Hidden3 connections
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
    
    // 4. Hidden3 → Output connections
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
    
    // SPEED CONTROL: Adjusted for 216 inputs and new layer structure
    let initialStepDelay = 8;  // Faster initial speed for 216 inputs
    let midStageDelay = 5;     // Medium speed for hidden layers
    let lateStageDelay = 15;   // Slower for final output layer
    let stepDelay = initialStepDelay;
    
    const processNextStep = () => {
      // Adjust speed based on progress
      if (currentStep > animationSteps.length * 0.3) {
        stepDelay = midStageDelay;
      }
      if (currentStep > animationSteps.length * 0.8) {
        stepDelay = lateStageDelay;
      }
      
      if (currentStep >= animationSteps.length) {
        // Animation sequence complete, show predictions
        setTimeout(() => {
          predictionStage = 5; // Final prediction stage
          predictionResults = [
            { type: 'Gold', probability: 0.78, color: '#FFD700' },
            { type: 'Copper', probability: 0.52, color: '#B87333' },
            { type: 'Iron', probability: 0.31, color: '#a52a2a' }
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
        
        if (DEVELOPMENT_MODE) {
          // In development mode, restart from neural network
          console.log("DEVELOPMENT MODE: Restarting from neural network");
          
          // Reset neural network state
          activeNeuronIndices = { input: -1, hidden1: -1, hidden2: -1, hidden3: -1, output: -1 };
          predictionStage = 4;
          predictionResults = null;
          
          // Clear sections
          predictionSection.style.transform = 'translateX(100%)';
          visualizationWrapper.style.opacity = '0';
          nnSection.style.opacity = '0';
          
          // Restart development sequence
          setTimeout(() => {
            showDevelopmentFlattening();
          }, 1000);
        } else {
          // Normal mode - restart from image loading
          if (backgroundImage) {
             backgroundImage.src = 'assets/images/geophysics-image.png'; // Reload image to restart
          } else {
             console.error("Cannot restart, backgroundImage object not found.");
          }
        }
      }, 3000); // Show prediction results for 3 seconds before resetting
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
    
    console.log("Starting CNN convolution visualization");
    console.log("Input matrix dimensions:", inputMatrix.length, "x", inputMatrix[0]?.length || 0);
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw dark blue background (consistent with other scenes)
    ctx.fillStyle = '#0f172a'; // Changed from '#1e3a8a' to '#0f172a' for consistency
    ctx.fillRect(0, 0, width, height);
    
    // Draw stage headers at the top
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    
    const headerY = 25;
    const stageSpacing = width / 3;
    
    // Convolution stage (active - fully white)
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Convolution', stageSpacing * 0.5, headerY);
    
    // ReLU stage (inactive - dimmed)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillText('ReLU', stageSpacing * 1.5, headerY);
    
    // MaxPooling stage (inactive - dimmed)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillText('MaxPooling', stageSpacing * 2.5, headerY);
    
    // Layout parameters
    const cellSize = 8; // Reduced from 25 to 8 to fit 32x32 matrices
    const kernelSize = 20;
    const spacing = 60;
    
    // Center the input matrix on the left
    const matrixWidth = inputMatrix[0]?.length || 0;
    const matrixHeight = inputMatrix.length;
    
    if (matrixWidth === 0 || matrixHeight === 0) {
      console.error("Input matrix is empty or undefined!");
      return;
    }
    
    const matrixPixelWidth = matrixWidth * cellSize;
    const matrixPixelHeight = matrixHeight * cellSize;
    
    // Calculate feature map dimensions and size (smaller to avoid title overlap)
    const featureMapDim = matrixHeight - 2; // 30x30 after 3x3 convolution on 32x32
    const featureMapSize = featureMapDim * 3.2; // Smaller feature maps to avoid title overlap
    
    const inputX = 50;
    const inputY = height / 2 - (matrixHeight * cellSize)/2;
    const kernelsX = inputX + (matrixWidth * cellSize) + spacing;
    const featureMapsX = kernelsX + (kernelSize * 3) + spacing;
    
    // Draw Input Matrix (removed subtitle)
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
    const kernelsY = height/2 - 110; // Adjusted up slightly to accommodate smaller feature maps
    
    // Position for feature maps (right side) - adjusted for smaller maps
    const featureMapsY = height/2 - (featureMapSize * 1.6); // Reduced from 1.8 to 1.6 for smaller maps
    
    // Position for results (to the right of feature maps)
    const resultsX = featureMapsX + featureMapSize + 30; // 30px spacing from feature maps
    
    // Draw kernels and empty feature maps initially
    cnnKernels.slice(0, 3).forEach((kernel, kernelIndex) => {
      const kernelY = kernelsY + kernelIndex * 85; // Increased spacing from 80 to 85 for better alignment
      
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
      
      // Draw empty feature map placeholder (better aligned with kernel)
      const fMapY = featureMapsY + kernelIndex * (featureMapSize + 35); // Increased spacing from 30 to 35 for better alignment
      
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
    
    console.log(`Initialized feature maps: ${featureMaps.length} maps of ${featureMaps[0].length}x${featureMaps[0][0].length}`);
    
    // Start the progressive convolution animation
    setTimeout(() => {
      console.log("Starting progressive convolution animation");
      animateProgressiveConvolution(featureMaps, resultsX); // Pass resultsX for positioning
    }, 2000);
  }
  
  function animateProgressiveConvolution(featureMaps, resultsX) {
    const ctx = cnnCanvas.getContext('2d');
    const width = cnnCanvas.width;
    const height = cnnCanvas.height;
    
    const matrixWidth = inputMatrix[0]?.length || 0;
    const matrixHeight = inputMatrix.length;
    const cellSize = 8; // Reduced from 25 to 8 to fit 32x32 matrices
    const kernelSize = 20;
    const spacing = 60;
    
    // Calculate feature map size based on convolution output
    const featureMapDim = matrixHeight - 2; // 30x30 after 3x3 convolution on 32x32
    const featureMapSize = featureMapDim * 3.2; // Smaller feature maps to avoid title overlap
    
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
    
    console.log(`Starting convolution animation with ${convolutionPositions.length} positions`);
    
    let currentPosition = 0;
    
    const animateNextPosition = () => {
      if (currentPosition >= convolutionPositions.length) {
        // All convolutions complete, move to ReLU visualization scene
        console.log("Convolution complete, showing ReLU visualization");
        setTimeout(() => {
          showReLUVisualization(featureMaps);
        }, 1000);
        return;
      }
      
      const pos = convolutionPositions[currentPosition];
      
      // Redraw the base scene
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);
      
      // Draw stage headers at the top
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      
      const headerY = 25;
      const stageSpacing = width / 3;
      
      // Convolution stage (active - fully white)
      ctx.fillStyle = '#ffffff';
      ctx.fillText('Convolution', stageSpacing * 0.5, headerY);
      
      // ReLU stage (inactive - dimmed)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillText('ReLU', stageSpacing * 1.5, headerY);
      
      // MaxPooling stage (inactive - dimmed)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillText('MaxPooling', stageSpacing * 2.5, headerY);
      
      // Draw input matrix with current kernel position highlighted (removed subtitle)
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
      const kernelsY = height/2 - 110; // Updated to match new position
      const featureMapsY = height/2 - (featureMapSize * 1.6); // Updated to match new position
      
      cnnKernels.slice(0, 3).forEach((kernel, kernelIndex) => {
        const kernelY = kernelsY + kernelIndex * 85; // Updated spacing to match
        
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
        
        // Draw feature map with all values computed so far (smaller size)
        const fMapY = featureMapsY + kernelIndex * (featureMapSize + 35); // Updated spacing to match
        const featureCellSize = 3.2; // Reduced from 4 to 3.2 for smaller feature maps
        
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
        
        // Show current calculation result to the RIGHT of feature maps
        const resultY = fMapY + (featureMapSize / 2);
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left'; // Left align for right-side positioning
        ctx.fillText(`Result: ${reluResult.toFixed(2)}`, resultsX, resultY);
      });
      
      // Removed calculation details (position/step text)
      
      currentPosition++;
      
      // Continue to next position (much faster)
      setTimeout(animateNextPosition, 5); // Much faster convolution animation
    };
    
    // Start the animation
    console.log("Starting convolution animation loop");
    animateNextPosition();
  }
  
  // NEW: ReLU Visualization Scene
  function showReLUVisualization(featureMaps) {
    const ctx = cnnCanvas.getContext('2d');
    const width = cnnCanvas.width;
    const height = cnnCanvas.height;
    
    console.log("Starting combined ReLU and MaxPooling visualization");
    
    // Use the actual computed feature maps from convolution (with some negatives added for ReLU demo)
    const matrixHeight = inputMatrix.length;
    const featureMapDim = matrixHeight - 2;
    
    // Use actual feature maps but add some negative values to demonstrate ReLU effect
    const demonstrationFeatureMaps = featureMaps.map((featureMap, kernelIndex) => {
      return featureMap.map(row => {
        return row.map(value => {
          // Use actual computed value but occasionally make some negative for ReLU demonstration
          const actualValue = value || 0;
          // Add some negative bias to about 20% of values for demonstration
          const shouldMakeNegative = Math.random() < 0.2;
          return shouldMakeNegative ? actualValue - Math.random() * 0.5 : actualValue;
        });
      });
    });
    
    // Calculate rectified feature maps
    const rectifiedFeatureMaps = demonstrationFeatureMaps.map(featureMap => 
      featureMap.map(row => row.map(value => Math.max(0, value)))
    );
    
    // Initialize maxpooled feature maps
    const pooledDim = Math.floor(featureMapDim / 2);
    const pooledFeatureMaps = cnnKernels.slice(0, 3).map(() => 
      Array(pooledDim).fill().map(() => Array(pooledDim).fill(null))
    );
    
    // Calculate all 2x2 pool positions (stride 2)
    const poolPositions = [];
    for (let i = 0; i <= featureMapDim - 2; i += 2) {
      for (let j = 0; j <= featureMapDim - 2; j += 2) {
        poolPositions.push({ row: i, col: j });
      }
    }
    
    let currentPoolPosition = 0;
    let animationStage = 0; // 0: show original, 1: show ReLU'd, 2: wait, 3: animate pooling
    
    const animateScene = () => {
      // Clear and setup scene
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);
      
      // Draw stage headers
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      
      const headerY = 25;
      const stageSpacing = width / 3;
      
      // Convolution stage (completed - dimmed)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillText('Convolution', stageSpacing * 0.5, headerY);
      
      // ReLU and MaxPooling stages (active - fully white)
      ctx.fillStyle = '#ffffff';
      ctx.fillText('ReLU + MaxPooling', stageSpacing * 1.5, headerY);
      
      // Clear third header
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillText('', stageSpacing * 2.5, headerY);
      
      // Layout for 3 columns
      const columnWidth = width / 3;
      const featureMapSize = featureMapDim * 2.8;
      const featureCellSize = 2.8;
      
      // Column positions
      const col1X = columnWidth * 0.5 - featureMapSize/2; // Original
      const col2X = columnWidth * 1.5 - featureMapSize/2; // ReLU'd maps
      const col3X = columnWidth * 2.5 - (pooledDim * 6)/2; // MaxPooled maps (smaller)
      
      const startY = height/2 - (featureMapSize * 1.5);
      
      // Column titles
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Original', col1X + featureMapSize/2, startY - 30);
      
      if (animationStage >= 1) {
        ctx.fillText('After ReLU', col2X + featureMapSize/2, startY - 30);
      }
      
      if (animationStage >= 2) {
        ctx.fillText('After MaxPool', col3X + (pooledDim * 6)/2, startY - 30);
      }
      
      // Draw ReLU function indicator between columns 1 and 2
      if (animationStage >= 1) {
        const graphX = (col1X + featureMapSize + col2X) / 2 - 40;
        const graphY = height/2 - 50; // Moved up to avoid matrices
        
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ReLU', graphX + 40, graphY);
        ctx.font = '10px sans-serif';
        ctx.fillText('f(x)=max(0,x)', graphX + 40, graphY + 15);
      }
      
      // Draw max pooling indicator between columns 2 and 3
      if (animationStage >= 3) {
        const arrowX = (col2X + featureMapSize + col3X) / 2 - 40;
        const arrowY = height/2 - 50; // Moved up to avoid matrices
        
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('2×2 MaxPool', arrowX + 40, arrowY);
        ctx.font = '10px sans-serif';
        ctx.fillText('Stride=2', arrowX + 40, arrowY + 15);
      }
      
      // Draw the 3 feature maps in each column
      cnnKernels.slice(0, 3).forEach((kernel, kernelIndex) => {
        const mapY = startY + kernelIndex * (featureMapSize + 30);
        
        // Column 1: Original feature maps (always visible)
        ctx.fillStyle = kernel.color;
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Map ${kernelIndex + 1}`, col1X + featureMapSize/2, mapY - 5);
        
        demonstrationFeatureMaps[kernelIndex].forEach((row, i) => {
          row.forEach((value, j) => {
            const x = col1X + j * featureCellSize;
            const y = mapY + i * featureCellSize;
            
            // Show normal grayscale values (same as convolution scene)
            const normalizedValue = (value + 1) / 2; // Normalize from [-1,1] to [0,1]
            const intensity = Math.min(255, Math.max(0, normalizedValue * 200));
            const fillColor = `rgba(${intensity}, ${intensity}, ${intensity}, 0.8)`;
            
            ctx.fillStyle = fillColor;
            ctx.fillRect(x, y, featureCellSize - 1, featureCellSize - 1);
            
            // Border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x, y, featureCellSize - 1, featureCellSize - 1);
          });
        });
        
        // Outline
        ctx.strokeStyle = kernel.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(col1X, mapY, featureMapSize, featureMapSize);
        
        // Column 2: ReLU'd feature maps (visible from stage 1+)
        if (animationStage >= 1) {
          ctx.fillStyle = kernel.color;
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`Map ${kernelIndex + 1}`, col2X + featureMapSize/2, mapY - 5);
          
          rectifiedFeatureMaps[kernelIndex].forEach((row, i) => {
            row.forEach((value, j) => {
              const x = col2X + j * featureCellSize;
              const y = mapY + i * featureCellSize;
              
              // Highlight current 2x2 pooling window if in animation stage
              let inWindow = false;
              if (animationStage === 3 && currentPoolPosition < poolPositions.length) {
                const pos = poolPositions[currentPoolPosition];
                inWindow = i >= pos.row && i < pos.row + 2 && 
                          j >= pos.col && j < pos.col + 2;
              }
              
              const intensity = Math.min(255, value * 200);
              ctx.fillStyle = `rgba(${intensity}, ${intensity}, ${intensity}, 0.8)`;
              ctx.fillRect(x, y, featureCellSize - 1, featureCellSize - 1);
              
              // Different border for pooling window
              if (inWindow) {
                ctx.strokeStyle = '#f59e0b'; // Orange highlight for pooling window
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, featureCellSize - 1, featureCellSize - 1);
              } else {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(x, y, featureCellSize - 1, featureCellSize - 1);
              }
            });
          });
          
          // Outline
          ctx.strokeStyle = kernel.color;
          ctx.lineWidth = 2;
          ctx.strokeRect(col2X, mapY, featureMapSize, featureMapSize);
        }
        
        // Column 3: MaxPooled feature maps (visible from stage 2+)
        if (animationStage >= 2) {
          ctx.fillStyle = kernel.color;
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`Map ${kernelIndex + 1}`, col3X + (pooledDim * 6)/2, mapY - 5);
          
          pooledFeatureMaps[kernelIndex].forEach((row, i) => {
            row.forEach((value, j) => {
              const x = col3X + j * 6;
              const y = mapY + i * 6;
              
              if (value !== null) {
                const intensity = Math.min(255, value * 200);
                ctx.fillStyle = `rgba(${intensity}, ${intensity}, ${intensity}, 0.8)`;
                ctx.fillRect(x, y, 5, 5);
                
                // Highlight current cell being computed
                if (animationStage === 3 && currentPoolPosition < poolPositions.length) {
                  const pos = poolPositions[currentPoolPosition];
                  const poolRow = Math.floor(pos.row / 2);
                  const poolCol = Math.floor(pos.col / 2);
                  if (i === poolRow && j === poolCol) {
                    ctx.strokeStyle = '#f59e0b';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x - 1, y - 1, 7, 7);
                  }
                }
              } else {
                // Empty cell
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.fillRect(x, y, 5, 5);
              }
            });
          });
          
          // Outline
          ctx.strokeStyle = kernel.color;
          ctx.lineWidth = 2;
          ctx.strokeRect(col3X, mapY, pooledDim * 6, pooledDim * 6);
        }
      });
      
      // Draw arrows (REMOVED - arrows not needed)
      /*
      if (animationStage >= 1) {
        // Arrow from Original to ReLU'd
        const arrowY = height/2;
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(col1X + featureMapSize + 10, arrowY);
        ctx.lineTo(col2X - 10, arrowY);
        ctx.stroke();
        drawArrowHead(ctx, col2X - 10, arrowY, 0);
      }
      
      if (animationStage >= 2) {
        // Arrow from ReLU'd to MaxPooled
        const arrowY = height/2;
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(col2X + featureMapSize + 10, arrowY);
        ctx.lineTo(col3X - 10, arrowY);
        ctx.stroke();
        drawArrowHead(ctx, col3X - 10, arrowY, 0);
      }
      */
      
      // Handle animation progression
      if (animationStage === 0) {
        // Stage 1: Show original, then transition to ReLU'd
        console.log("ReLU Animation Stage 0 → 1");
        setTimeout(() => {
          animationStage = 1;
          animateScene();
        }, 1500);
      } else if (animationStage === 1) {
        // Stage 2: Show ReLU'd, then prepare for pooling
        console.log("ReLU Animation Stage 1 → 2");
        setTimeout(() => {
          animationStage = 2;
          animateScene();
        }, 1500);
      } else if (animationStage === 2) {
        // Stage 3: Wait a moment, then start pooling animation
        console.log("ReLU Animation Stage 2 → 3");
        setTimeout(() => {
          animationStage = 3;
          animateScene();
        }, 1000);
      } else if (animationStage === 3) {
        // Stage 4: Animate max pooling
        if (currentPoolPosition < poolPositions.length) {
          const pos = poolPositions[currentPoolPosition];
          
          // Calculate max value from current 2x2 window for each feature map
          cnnKernels.slice(0, 3).forEach((kernel, kernelIndex) => {
            let maxValue = 0;
            for (let wi = 0; wi < 2; wi++) {
              for (let wj = 0; wj < 2; wj++) {
                const val = rectifiedFeatureMaps[kernelIndex][pos.row + wi][pos.col + wj];
                maxValue = Math.max(maxValue, val);
              }
            }
            
            // Store pooled value
            const poolRow = Math.floor(pos.row / 2);
            const poolCol = Math.floor(pos.col / 2);
            pooledFeatureMaps[kernelIndex][poolRow][poolCol] = maxValue;
          });
          
          currentPoolPosition++;
          
          // Continue animation
          setTimeout(animateScene, 10); // Fast sliding animation
        } else {
          // Animation complete
          console.log("Combined ReLU and MaxPooling animation complete");
          
          // Show completion message
          setTimeout(() => {
            ctx.fillStyle = '#10b981';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('ReLU + MaxPooling Complete!', width/2, height - 30);
            
            // Transition to second convolution layer
            setTimeout(() => {
              animateSecondConvolution(pooledFeatureMaps);
            }, 2000);
          }, 1000);
        }
      }
    };
    
    // Start the animation
    animateScene();
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
        ctx.fillStyle = '#0f172a'; // Consistent dark background
        ctx.fillRect(0, 0, width, height);
        
        // Draw stage headers with ReLU highlighted
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        
        const headerY = 25;
        const stageSpacing = width / 3;
        
        // Convolution stage (inactive - dimmed)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillText('Convolution', stageSpacing * 0.5, headerY);
        
        // ReLU stage (active - fully white)
        ctx.fillStyle = '#ffffff';
        ctx.fillText('ReLU', stageSpacing * 1.5, headerY);
        
        // MaxPooling stage (inactive - dimmed)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillText('MaxPooling', stageSpacing * 2.5, headerY);
        
        // Subtitle
        ctx.fillStyle = '#10b981'; // Green for ReLU
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('f(x) = max(0, x) - Converting negative values to zero', width / 2, 50);
        
        const cellSize = 8; // Reduced from 20 to 8 for 30x30 feature maps
        const mapSpacing = 60;
        const leftX = 50;
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
        ctx.fillStyle = '#0f172a'; // Consistent dark background
        ctx.fillRect(0, 0, width, height);
        
        // Draw stage headers with ReLU highlighted
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        
        const headerY = 25;
        const stageSpacing = width / 3;
        
        // Convolution stage (inactive - dimmed)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillText('Convolution', stageSpacing * 0.5, headerY);
        
        // ReLU stage (active - fully white)
        ctx.fillStyle = '#ffffff';
        ctx.fillText('ReLU', stageSpacing * 1.5, headerY);
        
        // MaxPooling stage (inactive - dimmed)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillText('MaxPooling', stageSpacing * 2.5, headerY);
        
        // Subtitle
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Negative → Zero', width / 2, 50);
        
        const cellSize = 6; // Reduced from 18 to 6 for 30x30 input maps
        const mapSpacing = 50;
        const leftX = 50;
        const rightX = 450;
        const startY = height/2 - (featureMapDim * cellSize * 3 + mapSpacing * 2) / 2;
        
        // Draw input and output side by side
        cnnKernels.slice(0, 3).forEach((kernel, kernelIndex) => {
          const mapY = startY + kernelIndex * (featureMapDim * cellSize + mapSpacing);
          
          // Input label
          ctx.fillStyle = '#ffffff';
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Before ReLU', leftX + (featureMapDim * cellSize)/2, mapY - 25);
          
          // Output label  
          ctx.fillText('After ReLU', rightX + (featureMapDim * cellSize)/2, mapY - 25);
          
          // Feature map labels
          ctx.fillStyle = kernel.color;
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText(`Map ${kernelIndex + 1}`, leftX + (featureMapDim * cellSize)/2, mapY - 10);
          ctx.fillText(`Map ${kernelIndex + 1}`, rightX + (featureMapDim * cellSize)/2, mapY - 10);
          
          // Draw input feature map
          originalFeatureMaps[kernelIndex].forEach((row, i) => {
            row.forEach((value, j) => {
              const x = leftX + j * cellSize;
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
              const x = rightX + j * cellSize;
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
          ctx.moveTo(leftX + featureMapDim * cellSize + 10, arrowY);
          ctx.lineTo(rightX - 10, arrowY);
          ctx.stroke();
          drawArrowHead(ctx, rightX - 10, arrowY, 0);
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
        ctx.fillStyle = '#0f172a'; // Consistent dark background
        ctx.fillRect(0, 0, width, height);
        
        // Draw stage headers with ReLU highlighted
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        
        const headerY = 25;
        const stageSpacing = width / 3;
        
        // Convolution stage (inactive - dimmed)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillText('Convolution', stageSpacing * 0.5, headerY);
        
        // ReLU stage (active - fully white)
        ctx.fillStyle = '#ffffff';
        ctx.fillText('ReLU', stageSpacing * 1.5, headerY);
        
        // MaxPooling stage (inactive - dimmed)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillText('MaxPooling', stageSpacing * 2.5, headerY);
        
        // Subtitle
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ReLU Output → Max Pooling', width / 2, 50);
        
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
    
    // Animation stages for Max Pooling
    let poolStage = 0; // 0: setup, 1: animate sliding windows, 2: show final result
    
    const matrixHeight = inputMatrix.length;
    const featureMapDim = matrixHeight - 2; // Feature map dimensions after convolution
    
    // Generate ReLU output feature maps (simulate realistic data)
    const reluFeatureMaps = cnnKernels.slice(0, 3).map((kernel, kernelIndex) => {
      const featureMap = [];
      for (let i = 0; i < featureMapDim; i++) {
        const row = [];
        for (let j = 0; j < featureMapDim; j++) {
          // Generate positive values only (post-ReLU)
          let value = Math.random() * 1.2; // Range from 0 to 1.2
          row.push(value);
        }
        featureMap.push(row);
      }
      return featureMap;
    });
    
    // Calculate pooled dimensions (2x2 pooling)
    const pooledDim = Math.floor(featureMapDim / 2);
    const pooledFeatureMaps = cnnKernels.slice(0, 3).map(() => 
      Array(pooledDim).fill().map(() => Array(pooledDim).fill(null))
    );
    
    const animatePoolStage = () => {
      if (poolStage === 0) {
        // Stage 1: Setup - show ReLU outputs and explain max pooling
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#0f172a'; // Consistent dark background
        ctx.fillRect(0, 0, width, height);
        
        // Draw stage headers with MaxPooling highlighted
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        
        const headerY = 25;
        const stageSpacing = width / 3;
        
        // Convolution stage (inactive - dimmed)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillText('Convolution', stageSpacing * 0.5, headerY);
        
        // ReLU stage (inactive - dimmed)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillText('ReLU', stageSpacing * 1.5, headerY);
        
        // MaxPooling stage (active - fully white)
        ctx.fillStyle = '#ffffff';
        ctx.fillText('MaxPooling', stageSpacing * 2.5, headerY);
        
        // Subtitle
        ctx.fillStyle = '#f59e0b'; // Amber for max pooling
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('2×2 Downsampling - Sliding window taking maximum values', width / 2, 50);
        
        const cellSize = 20;
        const mapSpacing = 60;
        const leftX = 50;
        const startY = height/2 - (featureMapDim * cellSize * 3 + mapSpacing * 2) / 2;
        
        // Draw the 3 ReLU feature maps
        cnnKernels.slice(0, 3).forEach((kernel, kernelIndex) => {
          const mapY = startY + kernelIndex * (featureMapDim * cellSize + mapSpacing);
          
          // Feature map label
          ctx.fillStyle = kernel.color;
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`ReLU Output ${kernelIndex + 1}`, leftX + (featureMapDim * cellSize)/2, mapY - 15);
          ctx.fillStyle = '#ffffff';
          ctx.font = '12px sans-serif';
          ctx.fillText(`${featureMapDim}×${featureMapDim}`, leftX + (featureMapDim * cellSize)/2, mapY - 2);
          
          // Draw feature map
          reluFeatureMaps[kernelIndex].forEach((row, i) => {
            row.forEach((value, j) => {
              const x = leftX + j * cellSize;
              const y = mapY + i * cellSize;
              
              // Grayscale intensity based on value
              const intensity = Math.min(255, value * 200);
              ctx.fillStyle = `rgba(${intensity}, ${intensity}, ${intensity}, 0.8)`;
              ctx.fillRect(x, y, cellSize - 1, cellSize - 1);
              
              // Border
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
              ctx.lineWidth = 0.5;
              ctx.strokeRect(x, y, cellSize - 1, cellSize - 1);
            });
          });
          
          // Outline
          ctx.strokeStyle = kernel.color;
          ctx.lineWidth = 2;
          ctx.strokeRect(leftX, mapY, featureMapDim * cellSize, featureMapDim * cellSize);
        });
        
        // Arrow to pooling operation
        const arrowX = leftX + featureMapDim * cellSize + 30;
        const arrowY = height/2;
        
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(arrowX + 100, arrowY);
        ctx.stroke();
        drawArrowHead(ctx, arrowX + 100, arrowY, 0);
        
        // Max pooling explanation
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('2×2 Max Pool', arrowX + 50, arrowY - 15);
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px sans-serif';
        ctx.fillText('Stride = 2', arrowX + 50, arrowY + 5);
        ctx.fillText('Output: ' + pooledDim + '×' + pooledDim, arrowX + 50, arrowY + 20);
        
        poolStage++;
        setTimeout(animatePoolStage, 3000);
        
      } else if (poolStage === 1) {
        // Stage 2: Animate sliding 2x2 windows across each feature map
        animateMaxPoolSliding();
        
      } else if (poolStage === 2) {
        // Stage 3: Show final pooled results
        showFinalPooledResults();
      }
    };
    
    const animateMaxPoolSliding = () => {
      // Calculate all 2x2 pool positions
      const poolPositions = [];
      for (let i = 0; i <= featureMapDim - 2; i += 2) { // Stride 2
        for (let j = 0; j <= featureMapDim - 2; j += 2) { // Stride 2
          poolPositions.push({ row: i, col: j });
        }
      }
      
      let currentPos = 0;
      
      const slidePool = () => {
        if (currentPos >= poolPositions.length) {
          // All pooling complete
          poolStage++;
          setTimeout(animatePoolStage, 1000);
          return;
        }
        
        const pos = poolPositions[currentPos];
        
        // Redraw scene
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#111827';
        ctx.fillRect(0, 0, width, height);
        
        // Header
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Max Pooling - Sliding 2×2 Window', width / 2, 30);
        
        const cellSize = 18;
        const mapSpacing = 50;
        const leftX = 50;
        const rightX = 450;
        const startY = height/2 - (featureMapDim * cellSize * 3 + mapSpacing * 2) / 2;
        
        // Draw input feature maps with sliding window
        cnnKernels.slice(0, 3).forEach((kernel, kernelIndex) => {
          const mapY = startY + kernelIndex * (featureMapDim * cellSize + mapSpacing);
          
          // Input map label
          ctx.fillStyle = kernel.color;
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`Input ${kernelIndex + 1}`, leftX + (featureMapDim * cellSize)/2, mapY - 15);
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px sans-serif';
          ctx.fillText(`${featureMapDim}×${featureMapDim}`, leftX + (featureMapDim * cellSize)/2, mapY - 3);
          
          // Draw input feature map
          reluFeatureMaps[kernelIndex].forEach((row, i) => {
            row.forEach((value, j) => {
              const x = leftX + j * cellSize;
              const y = mapY + i * cellSize;
              
              // Highlight current 2x2 window
              const inWindow = i >= pos.row && i < pos.row + 2 && 
                             j >= pos.col && j < pos.col + 2;
              
              const intensity = Math.min(255, value * 200);
              ctx.fillStyle = `rgba(${intensity}, ${intensity}, ${intensity}, 0.8)`;
              ctx.fillRect(x, y, cellSize - 1, cellSize - 1);
              
              // Different border for pooling window
              if (inWindow) {
                ctx.strokeStyle = '#f59e0b';
                ctx.lineWidth = 2;
              } else {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 0.5;
              }
              ctx.strokeRect(x, y, cellSize - 1, cellSize - 1);
              
              // Show values in the current window
              if (inWindow && cellSize > 15) {
                ctx.fillStyle = '#ffffff';
                ctx.font = '8px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(value.toFixed(2), x + cellSize/2, y + cellSize/2 + 2);
              }
            });
          });
          
          // Calculate max value from 2x2 window
          let maxValue = 0;
          for (let wi = 0; wi < 2; wi++) {
            for (let wj = 0; wj < 2; wj++) {
              const val = reluFeatureMaps[kernelIndex][pos.row + wi][pos.col + wj];
              maxValue = Math.max(maxValue, val);
            }
          }
          
          // Store pooled value
          const poolRow = Math.floor(pos.row / 2);
          const poolCol = Math.floor(pos.col / 2);
          pooledFeatureMaps[kernelIndex][poolRow][poolCol] = maxValue;
          
          // Draw output feature map (pooled) with progress
          const pooledCellSize = 12; // Reduced from 25 to 12 for 15x15 pooled maps
          const outputMapY = mapY;
          
          ctx.fillStyle = kernel.color;
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`Pooled ${kernelIndex + 1}`, rightX + (pooledDim * pooledCellSize)/2, outputMapY - 15);
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px sans-serif';
          ctx.fillText(`${pooledDim}×${pooledDim}`, rightX + (pooledDim * pooledCellSize)/2, outputMapY - 3);
          
          // Draw pooled feature map with computed values so far
          pooledFeatureMaps[kernelIndex].forEach((row, i) => {
            row.forEach((value, j) => {
              const x = rightX + j * pooledCellSize;
              const y = outputMapY + i * pooledCellSize;
              
              if (value !== null) {
                const intensity = Math.min(255, value * 200);
                ctx.fillStyle = `rgba(${intensity}, ${intensity}, ${intensity}, 0.8)`;
                ctx.fillRect(x, y, pooledCellSize - 1, pooledCellSize - 1);
                
                // Highlight current cell being computed
                if (i === poolRow && j === poolCol) {
                  ctx.strokeStyle = '#f59e0b';
                  ctx.lineWidth = 3;
                  ctx.strokeRect(x - 1, y - 1, pooledCellSize + 1, pooledCellSize + 1);
                  
                  // Show max value
                  ctx.fillStyle = '#ffffff';
                  ctx.font = 'bold 10px sans-serif';
                  ctx.textAlign = 'center';
                  ctx.fillText(maxValue.toFixed(2), x + pooledCellSize/2, y + pooledCellSize/2 + 3);
                }
              } else {
                // Empty cell
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.fillRect(x, y, pooledCellSize - 1, pooledCellSize - 1);
              }
              
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
              ctx.lineWidth = 0.5;
              ctx.strokeRect(x, y, pooledCellSize - 1, pooledCellSize - 1);
            });
          });
          
          // Draw arrow from input window to output cell
          const inputCenterX = leftX + pos.col * cellSize + cellSize;
          const inputCenterY = mapY + pos.row * cellSize + cellSize;
          const outputCenterX = rightX + poolCol * pooledCellSize + pooledCellSize/2;
          const outputCenterY = outputMapY + poolRow * pooledCellSize + pooledCellSize/2;
          
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(inputCenterX, inputCenterY);
          ctx.lineTo(outputCenterX, outputCenterY);
          ctx.stroke();
          drawArrowHead(ctx, outputCenterX, outputCenterY, 0);
        });
        
        // Show current operation details
        ctx.fillStyle = '#f59e0b';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`Position: (${pos.row}, ${pos.col})`, width - 180, 80);
        ctx.fillText(`Step: ${currentPos + 1}/${poolPositions.length}`, width - 180, 95);
        ctx.fillText(`Window: 2×2`, width - 180, 110);
        ctx.fillText(`Operation: max()`, width - 180, 125);
        
        currentPos++;
        setTimeout(slidePool, 400); // Animation speed
      };
      
      slidePool();
    };
    
    const showFinalPooledResults = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, width, height);
      
      // Header
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Max Pooling Complete', width / 2, 40);
      
      // Subtitle
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px sans-serif';
      ctx.fillText(`Downsampled from ${featureMapDim}×${featureMapDim} to ${pooledDim}×${pooledDim}`, width / 2, 65);
      
      const cellSize = 12; // Reduced from 25 to 12 for 15x15 pooled maps
      const mapSpacing = 60;
      const centerX = width/2 - (pooledDim * cellSize * 3 + mapSpacing * 2) / 2;
      const centerY = height/2 - (pooledDim * cellSize) / 2;
      
      // Draw final pooled feature maps
      cnnKernels.slice(0, 3).forEach((kernel, kernelIndex) => {
        const mapX = centerX + kernelIndex * (pooledDim * cellSize + mapSpacing);
        
        // Feature map label
        ctx.fillStyle = kernel.color;
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Pooled Map ${kernelIndex + 1}`, mapX + (pooledDim * cellSize)/2, centerY - 25);
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px sans-serif';
        ctx.fillText(`${pooledDim}×${pooledDim}`, mapX + (pooledDim * cellSize)/2, centerY - 8);
        
        // Draw pooled feature map
        pooledFeatureMaps[kernelIndex].forEach((row, i) => {
          row.forEach((value, j) => {
            const x = mapX + j * cellSize;
            const y = centerY + i * cellSize;
            
            const intensity = Math.min(255, value * 200);
            ctx.fillStyle = `rgba(${intensity}, ${intensity}, ${intensity}, 0.8)`;
            ctx.fillRect(x, y, cellSize - 2, cellSize - 2);
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, cellSize - 2, cellSize - 2);
          });
        });
        
        // Outline
        ctx.strokeStyle = kernel.color;
        ctx.lineWidth = 3;
        ctx.strokeRect(mapX, centerY, pooledDim * cellSize, pooledDim * cellSize);
      });
      
      // Show completion message
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Ready for Neural Network Processing', width / 2, height - 40);
      
      // After showing final results, transition to neural network (commented out for now)
      setTimeout(() => {
        console.log("Max pooling complete - Neural network stage would start here");
        // TODO: Uncomment when ready to continue to neural network
        // predictionStage = 4; 
        // updateStageIndicators();
        // animateNeuralNetworkSequence();
      }, 4000);
    };
    
    animatePoolStage();
  }

  // NEW: Second Convolution Layer (3 inputs → 6 outputs)
  function animateSecondConvolution(inputFeatureMaps) {
    const ctx = cnnCanvas.getContext('2d');
    const width = cnnCanvas.width;
    const height = cnnCanvas.height;
    
    console.log("Starting second convolution layer");
    
    // Define 6 new kernels for second layer
    const secondLayerKernels = [
      { name: 'Edge1', values: [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]], color: '#ef4444' },
      { name: 'Edge2', values: [[1, 1, 1], [0, 0, 0], [-1, -1, -1]], color: '#f97316' },
      { name: 'Corner1', values: [[-1, -1, 0], [-1, 0, 1], [0, 1, 1]], color: '#eab308' },
      { name: 'Corner2', values: [[0, -1, -1], [1, 0, -1], [1, 1, 0]], color: '#22c55e' },
      { name: 'Texture1', values: [[1, -1, 1], [-1, 1, -1], [1, -1, 1]], color: '#3b82f6' },
      { name: 'Texture2', values: [[-1, 1, -1], [1, -1, 1], [-1, 1, -1]], color: '#8b5cf6' }
    ];
    
    const inputDim = inputFeatureMaps[0].length; // Should be 15x15 from first pooling
    const outputDim = inputDim - 2; // 13x13 after 3x3 convolution
    
    // Initialize 6 output feature maps
    const secondLayerOutputs = secondLayerKernels.map(() => 
      Array(outputDim).fill().map(() => Array(outputDim).fill(null))
    );
    
    // Calculate all convolution positions
    const convPositions = [];
    for (let i = 0; i <= inputDim - 3; i++) {
      for (let j = 0; j <= inputDim - 3; j++) {
        convPositions.push({ row: i, col: j });
      }
    }
    
    let currentPos = 0;
    
    const animateConvolution = () => {
      if (currentPos >= convPositions.length) {
        // Second convolution complete, move to second ReLU+MaxPooling
        console.log("Second convolution complete, moving to second ReLU+MaxPooling");
        setTimeout(() => {
          showSecondReLUMaxPooling(secondLayerOutputs);
        }, 1000);
        return;
      }
      
      const pos = convPositions[currentPos];
      
      // Clear and redraw scene
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);
      
      // Header
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Second Convolution Layer', width/2, 25);
      
      ctx.fillStyle = '#06b6d4';
      ctx.font = '14px sans-serif';
      ctx.fillText('3 inputs → 6 outputs', width/2, 50);
      
      // Layout consistent with ReLU+MaxPooling scene: 3 main columns
      const mainColumnWidth = width / 3;
      const cellSize = 6; // Good size for visibility
      const kernelSize = 18; // Slightly smaller to fit better
      
      // Calculate map sizes based on dimensions
      const inputMapSize = inputDim * cellSize; // 15x15 input maps
      const outputMapSize = outputDim * cellSize; // 13x13 output maps
      
      // Column positions for the 3 stages
      const col1CenterX = mainColumnWidth * 0.5; // Input maps
      const col2CenterX = mainColumnWidth * 1.5; // Kernels  
      const col3CenterX = mainColumnWidth * 2.5; // Output maps
      
      const startY = 80; // Start higher to accommodate layout
      const rowSpacing = (height - startY - 40) / 3; // Space for 3 rows
      
      // Column titles
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Input (3 maps)', col1CenterX, startY - 30);
      ctx.fillText('Kernels (6)', col2CenterX, startY - 30);
      ctx.fillText('Output (6 maps)', col3CenterX, startY - 30);
      
      // Layout for input maps: 3 maps arranged as 2 columns (2+1 distribution)
      const inputSubColSpacing = inputMapSize + 20;
      
      // Draw 3 input feature maps in 2 columns (maps 0,1,2 → positions 0,1,2)
      for (let mapIdx = 0; mapIdx < 3; mapIdx++) {
        const subCol = 0; // All maps in left sub-column for now
        const row = mapIdx; // Each map in its own row (0, 1, 2)
        
        const mapX = col1CenterX - inputSubColSpacing/2 + subCol * inputSubColSpacing - inputMapSize/2;
        const mapY = startY + row * rowSpacing;
        
        ctx.fillStyle = cnnKernels[mapIdx].color;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Map ${mapIdx + 1}`, mapX + inputMapSize/2, mapY - 8);
        
        inputFeatureMaps[mapIdx].forEach((row, i) => {
          row.forEach((value, j) => {
            const x = mapX + j * cellSize;
            const y = mapY + i * cellSize;
            
            // Highlight current 3x3 region
            const inKernel = i >= pos.row && i < pos.row + 3 && 
                           j >= pos.col && j < pos.col + 3;
            
            const intensity = Math.min(255, value * 200);
            ctx.fillStyle = `rgba(${intensity}, ${intensity}, ${intensity}, 0.8)`;
            ctx.fillRect(x, y, cellSize - 1, cellSize - 1);
            
            // Different border for kernel region
            if (inKernel) {
              ctx.strokeStyle = '#06b6d4';
              ctx.lineWidth = 1.5;
            } else {
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
              ctx.lineWidth = 0.5;
            }
            ctx.strokeRect(x, y, cellSize - 1, cellSize - 1);
          });
        });
        
        // Input map outline
        ctx.strokeStyle = cnnKernels[mapIdx].color;
        ctx.lineWidth = 2;
        ctx.strokeRect(mapX, mapY, inputMapSize, inputMapSize);
      }
      
      // Layout for kernels: 6 kernels in 2 columns of 3 rows
      const kernelSubColSpacing = kernelSize * 3 + 25;
      
      secondLayerKernels.forEach((kernel, kernelIdx) => {
        const subCol = Math.floor(kernelIdx / 3); // 0 or 1 (left or right sub-column)
        const row = kernelIdx % 3; // 0, 1, or 2 (top, middle, bottom)
        
        const kernelX = col2CenterX - kernelSubColSpacing/2 + subCol * kernelSubColSpacing - (kernelSize * 3)/2;
        const kernelY = startY + row * rowSpacing;
        
        // Kernel label
        ctx.fillStyle = kernel.color;
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(kernel.name, kernelX + (kernelSize * 3)/2, kernelY - 8);
        
        // Draw 3x3 kernel
        kernel.values.forEach((kernelRow, i) => {
          kernelRow.forEach((value, j) => {
            const x = kernelX + j * kernelSize;
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
            
            // Show value
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 8px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(value.toFixed(1), x + kernelSize/2, y + kernelSize/2 + 2);
          });
        });
        
        // Calculate convolution result for this kernel
        let convResult = 0;
        for (let inputMapIdx = 0; inputMapIdx < 3; inputMapIdx++) {
          for (let ki = 0; ki < 3; ki++) {
            for (let kj = 0; kj < 3; kj++) {
              const inputValue = inputFeatureMaps[inputMapIdx][pos.row + ki][pos.col + kj];
              const kernelValue = kernel.values[ki][kj];
              convResult += inputValue * kernelValue;
            }
          }
        }
        
        // Apply ReLU and store
        const reluResult = Math.max(0, convResult);
        secondLayerOutputs[kernelIdx][pos.row][pos.col] = reluResult;
        
        // Kernel outline
        ctx.strokeStyle = kernel.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(kernelX, kernelY, kernelSize * 3, kernelSize * 3);
      });
      
      // Layout for output maps: 6 maps in 2 columns of 3 rows
      const outputSubColSpacing = outputMapSize + 20;
      
      secondLayerKernels.forEach((kernel, kernelIdx) => {
        const subCol = Math.floor(kernelIdx / 3); // 0 or 1 (left or right sub-column)
        const row = kernelIdx % 3; // 0, 1, or 2 (top, middle, bottom)
        
        const mapX = col3CenterX - outputSubColSpacing/2 + subCol * outputSubColSpacing - outputMapSize/2;
        const mapY = startY + row * rowSpacing;
        
        // Map label
        ctx.fillStyle = kernel.color;
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Out ${kernelIdx + 1}`, mapX + outputMapSize/2, mapY - 8);
        
        // Draw feature map with computed values so far
        secondLayerOutputs[kernelIdx].forEach((outputRow, i) => {
          outputRow.forEach((value, j) => {
            const x = mapX + j * cellSize;
            const y = mapY + i * cellSize;
            
            if (value !== null) {
              const intensity = Math.min(255, value * 200);
              ctx.fillStyle = `rgba(${intensity}, ${intensity}, ${intensity}, 0.8)`;
              ctx.fillRect(x, y, cellSize - 1, cellSize - 1);
            } else {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
              ctx.fillRect(x, y, cellSize - 1, cellSize - 1);
            }
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x, y, cellSize - 1, cellSize - 1);
          });
        });
        
        // Highlight current position
        const currentX = mapX + pos.col * cellSize;
        const currentY = mapY + pos.row * cellSize;
        ctx.strokeStyle = kernel.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(currentX - 1, currentY - 1, cellSize + 1, cellSize + 1);
        
        // Output map outline
        ctx.strokeStyle = kernel.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(mapX, mapY, outputMapSize, outputMapSize);
      });
      
      // Draw arrows between columns (REMOVED - arrows not needed)
      /*
      const arrowY = height/2;
      
      // Arrow from Input to Kernels
      const arrow1StartX = col1CenterX + inputMapSize/2 + 10;
      const arrow1EndX = col2CenterX - kernelSize * 1.5 - 10;
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(arrow1StartX, arrowY);
      ctx.lineTo(arrow1EndX, arrowY);
      ctx.stroke();
      drawArrowHead(ctx, arrow1EndX, arrowY, 0);
      
      // Arrow from Kernels to Output
      const arrow2StartX = col2CenterX + kernelSize * 1.5 + 10;
      const arrow2EndX = col3CenterX - outputMapSize/2 - 10;
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(arrow2StartX, arrowY);
      ctx.lineTo(arrow2EndX, arrowY);
      ctx.stroke();
      drawArrowHead(ctx, arrow2EndX, arrowY, 0);
      */
      
      currentPos++;
      setTimeout(animateConvolution, 25); // Slower animation - increased from 8ms to 25ms
    };
    
    animateConvolution();
  }

  // NEW: Second ReLU + MaxPooling Scene (6 maps in 2 columns of 3 rows)
  function showSecondReLUMaxPooling(inputFeatureMaps) {
    const ctx = cnnCanvas.getContext('2d');
    const width = cnnCanvas.width;
    const height = cnnCanvas.height;
    
    console.log("Starting second ReLU and MaxPooling visualization");
    
    // Add initial delay
    setTimeout(() => {
      const featureMapDim = inputFeatureMaps[0].length; // Should be 13x13
      
      // Use actual computed feature maps but add some negative values for ReLU demonstration
      const demonstrationFeatureMaps = inputFeatureMaps.map(featureMap => 
        featureMap.map(row => row.map(value => {
          const actualValue = value || 0;
          // Add some negative bias to about 15% of values for ReLU demonstration
          const shouldMakeNegative = Math.random() < 0.15;
          return shouldMakeNegative ? actualValue - Math.random() * 0.3 : actualValue;
        }))
      );
      
      // Calculate rectified feature maps
      const rectifiedFeatureMaps = demonstrationFeatureMaps.map(featureMap => 
        featureMap.map(row => row.map(value => Math.max(0, value)))
      );
      
      // Initialize maxpooled feature maps (smaller)
      const pooledDim = Math.floor(featureMapDim / 2);
      const pooledFeatureMaps = Array(6).fill().map(() => 
        Array(pooledDim).fill().map(() => Array(pooledDim).fill(null))
      );
      
      // Define colors for 6 feature maps
      const mapColors = [
        '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'
      ];
      
      // Calculate pool positions
      const poolPositions = [];
      for (let i = 0; i <= featureMapDim - 2; i += 2) {
        for (let j = 0; j <= featureMapDim - 2; j += 2) {
          poolPositions.push({ row: i, col: j });
        }
      }
      
      let currentPoolPosition = 0;
      let animationStage = 0; // 0: original, 1: ReLU'd, 2: wait, 3: animate pooling
      
      const animateScene = () => {
        // Clear and setup
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);
        
        // Header
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Second Layer: ReLU + MaxPooling', width/2, 25);
        
        // Layout for 3 main columns, each containing 2 sub-columns of 3 rows
        const mainColumnWidth = width / 3;
        const mapSize = featureMapDim * 4.5; // Increased from 2.2 to 4.5 for bigger maps
        const cellSize = 4.5; // Increased from 2.2 to 4.5
        const pooledMapSize = pooledDim * 8; // Increased pooled map size
        
        // Column positions for the 3 stages
        const col1CenterX = mainColumnWidth * 0.5; // Original
        const col2CenterX = mainColumnWidth * 1.5; // ReLU'd  
        const col3CenterX = mainColumnWidth * 2.5; // MaxPooled
        
        const startY = 80; // Start higher to accommodate bigger maps
        const rowSpacing = (height - startY - 40) / 3; // Space for 3 rows
        
        // Column titles
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Original (6 maps)', col1CenterX, startY - 30);
        
        if (animationStage >= 1) {
          ctx.fillText('After ReLU', col2CenterX, startY - 30);
        }
        
        if (animationStage >= 2) {
          ctx.fillText('After MaxPool', col3CenterX, startY - 30);
        }
        
        // Draw ReLU function indicator between columns 1 and 2
        if (animationStage >= 1) {
          const arrowX = (col1CenterX + mapSize/2 + col2CenterX - mapSize/2) / 2;
          const arrowY = height/2 - 40; // Moved up to avoid matrices
          
          ctx.fillStyle = '#10b981';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('ReLU', arrowX, arrowY);
          ctx.font = '10px sans-serif';
          ctx.fillText('f(x)=max(0,x)', arrowX, arrowY + 15);
        }
        
        // Draw max pooling indicator between columns 2 and 3
        if (animationStage >= 3) {
          const arrowX = (col2CenterX + mapSize/2 + col3CenterX - pooledMapSize/2) / 2;
          const arrowY = height/2 - 40; // Moved up to avoid matrices
          
          ctx.fillStyle = '#f59e0b';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('2×2 MaxPool', arrowX, arrowY);
          ctx.font = '10px sans-serif';
          ctx.fillText('Stride=2', arrowX, arrowY + 15);
        }
        
        // Draw 6 feature maps arranged as 2 columns of 3 rows in each stage
        for (let mapIdx = 0; mapIdx < 6; mapIdx++) {
          const subCol = Math.floor(mapIdx / 3); // 0 or 1 (left or right sub-column)
          const row = mapIdx % 3; // 0, 1, or 2 (top, middle, bottom)
          
          // Calculate positions for 2 sub-columns within each main column
          const subColSpacing = mapSize + 20;
          const mapY = startY + row * rowSpacing;
          
          // Column 1: Original maps
          const map1X = col1CenterX - subColSpacing/2 + subCol * subColSpacing - mapSize/2;
          
          ctx.fillStyle = mapColors[mapIdx];
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`Map ${mapIdx + 1}`, map1X + mapSize/2, mapY - 8);
          
          demonstrationFeatureMaps[mapIdx].forEach((row, i) => {
            row.forEach((value, j) => {
              const x = map1X + j * cellSize;
              const y = mapY + i * cellSize;
              
              const normalizedValue = (value + 1) / 2;
              const intensity = Math.min(255, Math.max(0, normalizedValue * 200));
              ctx.fillStyle = `rgba(${intensity}, ${intensity}, ${intensity}, 0.8)`;
              ctx.fillRect(x, y, cellSize - 0.5, cellSize - 0.5);
            });
          });
          
          ctx.strokeStyle = mapColors[mapIdx];
          ctx.lineWidth = 2;
          ctx.strokeRect(map1X, mapY, mapSize, mapSize);
          
          // Column 2: ReLU'd maps
          if (animationStage >= 1) {
            const map2X = col2CenterX - subColSpacing/2 + subCol * subColSpacing - mapSize/2;
            
            ctx.fillStyle = mapColors[mapIdx];
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`Map ${mapIdx + 1}`, map2X + mapSize/2, mapY - 8);
            
            rectifiedFeatureMaps[mapIdx].forEach((row, i) => {
              row.forEach((value, j) => {
                const x = map2X + j * cellSize;
                const y = mapY + i * cellSize;
                
                // Highlight pooling window
                let inWindow = false;
                if (animationStage === 3 && currentPoolPosition < poolPositions.length) {
                  const pos = poolPositions[currentPoolPosition];
                  inWindow = i >= pos.row && i < pos.row + 2 && 
                            j >= pos.col && j < pos.col + 2;
                }
                
                const intensity = Math.min(255, value * 200);
                ctx.fillStyle = `rgba(${intensity}, ${intensity}, ${intensity}, 0.8)`;
                ctx.fillRect(x, y, cellSize - 0.5, cellSize - 0.5);
                
                // Different border for pooling window
                if (inWindow) {
                  ctx.strokeStyle = '#f59e0b';
                  ctx.lineWidth = 1.5;
                  ctx.strokeRect(x, y, cellSize - 0.5, cellSize - 0.5);
                } else {
                  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                  ctx.lineWidth = 0.5;
                  ctx.strokeRect(x, y, cellSize - 0.5, cellSize - 0.5);
                }
              });
            });
            
            ctx.strokeStyle = mapColors[mapIdx];
            ctx.lineWidth = 2;
            ctx.strokeRect(map2X, mapY, mapSize, mapSize);
          }
          
          // Column 3: MaxPooled maps
          if (animationStage >= 2) {
            const pooledCellSize = 8; // Increased cell size for pooled maps
            const actualPooledMapSize = pooledDim * pooledCellSize;
            const map3X = col3CenterX - subColSpacing/2 + subCol * subColSpacing - actualPooledMapSize/2;
            
            ctx.fillStyle = mapColors[mapIdx];
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`Map ${mapIdx + 1}`, map3X + actualPooledMapSize/2, mapY - 8);
            
            pooledFeatureMaps[mapIdx].forEach((row, i) => {
              row.forEach((value, j) => {
                const x = map3X + j * pooledCellSize;
                const y = mapY + i * pooledCellSize;
                
                if (value !== null) {
                  const intensity = Math.min(255, value * 200);
                  ctx.fillStyle = `rgba(${intensity}, ${intensity}, ${intensity}, 0.8)`;
                  ctx.fillRect(x, y, pooledCellSize - 1, pooledCellSize - 1);
                  
                  // Highlight current cell
                  if (animationStage === 3 && currentPoolPosition < poolPositions.length) {
                    const pos = poolPositions[currentPoolPosition];
                    const poolRow = Math.floor(pos.row / 2);
                    const poolCol = Math.floor(pos.col / 2);
                    if (i === poolRow && j === poolCol) {
                      ctx.strokeStyle = '#f59e0b';
                      ctx.lineWidth = 2;
                      ctx.strokeRect(x - 1, y - 1, pooledCellSize + 1, pooledCellSize + 1);
                    }
                  }
                } else {
                  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                  ctx.fillRect(x, y, pooledCellSize - 1, pooledCellSize - 1);
                }
                
                // Border
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(x, y, pooledCellSize - 1, pooledCellSize - 1);
              });
            });
            
            ctx.strokeStyle = mapColors[mapIdx];
            ctx.lineWidth = 2;
            ctx.strokeRect(map3X, mapY, actualPooledMapSize, actualPooledMapSize);
          }
        }
        
        // Draw arrows between columns (REMOVED - arrows not needed)
        /*
        if (animationStage >= 1) {
          // Arrow from Original to ReLU'd - positioned higher
          const arrowY = height/2 - 50;
          const arrow1StartX = col1CenterX + mapSize/2 + 20; // Use correct variable names
          const arrow1EndX = col2CenterX - mapSize/2 - 20; // Use correct variable names
          
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(arrow1StartX, arrowY);
          ctx.lineTo(arrow1EndX, arrowY);
          ctx.stroke();
          drawArrowHead(ctx, arrow1EndX, arrowY, 0);
        }
        
        if (animationStage >= 2) {
          // Arrow from ReLU'd to MaxPooled - positioned higher and shorter
          const arrowY = height/2 - 50;
          const arrow2StartX = col2CenterX + mapSize/2 + 20; // Use correct variable names
          const arrow2EndX = col3CenterX - pooledMapSize/2 - 20; // Use correct variable names
          
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(arrow2StartX, arrowY);
          ctx.lineTo(arrow2EndX, arrowY);
          ctx.stroke();
          drawArrowHead(ctx, arrow2EndX, arrowY, 0);
        }
        */
        
        // Animation progression
        if (animationStage === 0) {
          setTimeout(() => {
            animationStage = 1;
            animateScene();
          }, 2000); // Increased delay from 1500 to 2000
        } else if (animationStage === 1) {
          setTimeout(() => {
            animationStage = 2;
            animateScene();
          }, 2000); // Increased delay from 1500 to 2000
        } else if (animationStage === 2) {
          setTimeout(() => {
            animationStage = 3;
            animateScene();
          }, 1500); // Slightly increased delay
        } else if (animationStage === 3) {
          // Animate pooling
          if (currentPoolPosition < poolPositions.length) {
            const pos = poolPositions[currentPoolPosition];
            
            // Calculate max pooling for all 6 maps
            for (let mapIdx = 0; mapIdx < 6; mapIdx++) {
              let maxValue = 0;
              for (let wi = 0; wi < 2; wi++) {
                for (let wj = 0; wj < 2; wj++) {
                  const val = rectifiedFeatureMaps[mapIdx][pos.row + wi][pos.col + wj];
                  maxValue = Math.max(maxValue, val);
                }
              }
              
              const poolRow = Math.floor(pos.row / 2);
              const poolCol = Math.floor(pos.col / 2);
              pooledFeatureMaps[mapIdx][poolRow][poolCol] = maxValue;
            }
            
            currentPoolPosition++;
            setTimeout(animateScene, 12); // Slightly slower for 6 maps
          } else {
            // Complete - CNN processing finished
            console.log("Second layer ReLU + MaxPooling complete");
            
            // Add final delay and remove completion message
            setTimeout(() => {
              // Calculate final feature vector from pooled feature maps (for future use)
              finalFeatureVector = [];
              pooledFeatureMaps.forEach(featureMap => {
                featureMap.forEach(row => {
                  row.forEach(value => {
                    finalFeatureVector.push(value || 0);
                  });
                });
              });
              
              console.log(`Final feature vector length: ${finalFeatureVector.length}`);
              
              // NEW: Transition to flattening animation
              setTimeout(() => {
                animateFeatureMapFlattening(pooledFeatureMaps);
              }, 500); // Reduced from 2000ms for faster transition
              
              // COMMENTED OUT: Direct transition to neural network stage
              // Uncomment these lines when ready to continue to neural network visualization
              /*
              setTimeout(() => {
                predictionStage = 4; // Neural Network stage
                updateStageIndicators();
                
                // Hide CNN wrapper and show NN section
                cnnWrapper.style.opacity = '0';
                setTimeout(() => {
                  visualizationWrapper.style.opacity = '1';
                  nnSection.style.opacity = '1';
                  nnSection.style.transform = 'scale(1)';
                  animateNeuralNetworkSequence();
                }, 500);
              }, 2000);
              */
            }, 2000); // Added end delay
          }
        }
      };
      
      animateScene();
    }, 1000); // Initial delay before starting
  }

  // NEW: Feature Map Flattening Animation
  function animateFeatureMapFlattening(pooledFeatureMaps) {
    const ctx = cnnCanvas.getContext('2d');
    const width = cnnCanvas.width;
    const height = cnnCanvas.height;
    
    console.log("Starting feature map flattening animation");
    
    // Calculate dimensions
    const featureMapDim = pooledFeatureMaps[0].length; // Should be ~6x6 or similar
    const totalElements = featureMapDim * featureMapDim * 6; // 6 maps
    
    console.log(`Flattening ${pooledFeatureMaps.length} maps of ${featureMapDim}x${featureMapDim} = ${totalElements} elements`);
    
    // Colors for the 6 maps
    const mapColors = [
      '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'
    ];
    
    // Calculate sizes for display
    const mapCellSize = 12; // Size for feature map cells
    const vectorCellSize = 2; // Very small size for column vector
    const mapSpacing = 20;
    
    // Positions
    const leftMargin = 50;
    const mapStartY = 100;
    const vectorX = width - 150; // Column vector on the right
    const vectorStartY = 80;
    const vectorWidth = 20;
    const vectorHeight = height - 160; // Available height for vector
    
    let currentMapIndex = 0;
    let currentCellIndex = 0;
    let flattenedVector = [];
    let animationStage = 0; // 0: show maps, 1: flatten one by one, 2: show complete vector, 3: transition
    
    const animateFlattening = () => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);
      
      // Header
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Flattening Feature Maps', width/2, 30);
      
      ctx.fillStyle = '#06b6d4';
      ctx.font = '14px sans-serif';
      ctx.fillText('Converting 2D feature maps to 1D vector for fully connected layers', width/2, 55);
      
      // Draw the 6 feature maps on the left
      for (let mapIdx = 0; mapIdx < 6; mapIdx++) {
        const subCol = Math.floor(mapIdx / 3);
        const row = mapIdx % 3;
        
        const mapX = leftMargin + subCol * (featureMapDim * mapCellSize + mapSpacing);
        const mapY = mapStartY + row * (featureMapDim * mapCellSize + mapSpacing);
        
        // Map label
        ctx.fillStyle = mapColors[mapIdx];
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Map ${mapIdx + 1}`, mapX + (featureMapDim * mapCellSize)/2, mapY - 8);
        
        // Draw map cells
        pooledFeatureMaps[mapIdx].forEach((row, i) => {
          row.forEach((value, j) => {
            const x = mapX + j * mapCellSize;
            const y = mapY + i * mapCellSize;
            
            // Highlight cells that have been flattened
            let isFlattened = false;
            if (animationStage >= 1) {
              if (mapIdx < currentMapIndex) {
                isFlattened = true; // Entire previous maps are flattened
              } else if (mapIdx === currentMapIndex) {
                const cellPosition = i * featureMapDim + j;
                isFlattened = cellPosition < currentCellIndex;
              }
            }
            
            const intensity = Math.min(255, value * 200);
            if (isFlattened) {
              // Dimmed/highlighted for flattened cells
              ctx.fillStyle = `rgba(${intensity}, ${intensity}, ${intensity}, 0.3)`;
            } else {
              ctx.fillStyle = `rgba(${intensity}, ${intensity}, ${intensity}, 0.8)`;
            }
            ctx.fillRect(x, y, mapCellSize - 1, mapCellSize - 1);
            
            // Border
            if (isFlattened) {
              ctx.strokeStyle = mapColors[mapIdx];
              ctx.lineWidth = 2;
            } else {
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
              ctx.lineWidth = 0.5;
            }
            ctx.strokeRect(x, y, mapCellSize - 1, mapCellSize - 1);
          });
        });
        
        // Map outline
        ctx.strokeStyle = mapColors[mapIdx];
        ctx.lineWidth = 2;
        ctx.strokeRect(mapX, mapY, featureMapDim * mapCellSize, featureMapDim * mapCellSize);
      }
      
      // Draw column vector on the right
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Flattened Vector', vectorX + vectorWidth/2, vectorStartY - 25);
      ctx.fillText(`(${totalElements} × 1)`, vectorX + vectorWidth/2, vectorStartY - 8);
      
      // Vector background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(vectorX, vectorStartY, vectorWidth, vectorHeight);
      
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(vectorX, vectorStartY, vectorWidth, vectorHeight);
      
      // Draw flattened elements in the vector - matching neural network style
      const cellHeight = vectorHeight / totalElements;
      flattenedVector.forEach((element, index) => {
        const y = vectorStartY + index * cellHeight;
        const intensity = Math.min(255, element.value * 200);
        
        // Use grayscale intensity like neural network input (not colors)
        ctx.fillStyle = `rgb(${intensity}, ${intensity}, ${intensity})`;
        ctx.fillRect(vectorX + 2, y, vectorWidth - 4, Math.max(1, cellHeight - 0.5));
      });
      
      // Animation stages
      if (animationStage === 0) {
        // Initial display - show all maps
        setTimeout(() => {
          animationStage = 1;
          animateFlattening();
        }, 800); // Reduced from 2000ms to 800ms for faster start
        
      } else if (animationStage === 1) {
        // Flattening animation
        if (currentMapIndex < 6) {
          const currentMap = pooledFeatureMaps[currentMapIndex];
          const mapSize = featureMapDim * featureMapDim;
          
          if (currentCellIndex < mapSize) {
            // Add current cell to flattened vector
            const row = Math.floor(currentCellIndex / featureMapDim);
            const col = currentCellIndex % featureMapDim;
            const value = currentMap[row][col];
            
            flattenedVector.push({
              value: value,
              color: '#ffffff', // Remove color coding - use white for all cells
              mapIndex: currentMapIndex,
              cellIndex: currentCellIndex
            });
            
            currentCellIndex++;
            setTimeout(animateFlattening, 15); // Fast flattening
          } else {
            // Move to next map
            currentMapIndex++;
            currentCellIndex = 0;
            setTimeout(animateFlattening, 300); // Brief pause between maps
          }
        } else {
          // All maps flattened
          animationStage = 2;
          setTimeout(animateFlattening, 1000);
        }
        
      } else if (animationStage === 2) {
        // Show complete vector
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Flattening Complete!', width/2, height - 40);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px sans-serif';
        ctx.fillText(`${totalElements} features ready for fully connected layers`, width/2, height - 20);
        
        // Show current flattening progress
        ctx.fillStyle = '#06b6d4';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        if (currentMapIndex < 6) {
          ctx.fillText(`Flattening Map ${currentMapIndex + 1}...`, leftMargin, height - 60);
          ctx.fillText(`Progress: ${flattenedVector.length}/${totalElements}`, leftMargin, height - 40);
        }
        
        setTimeout(() => {
          animationStage = 3;
          animateFlattening();
        }, 500); // Reduced from 2000ms for faster transition
        
      } else if (animationStage === 3) {
        // Transition to neural network
        console.log("Flattening complete, transitioning to neural network");
        
        // Update finalFeatureVector with our flattened data
        finalFeatureVector = flattenedVector.map(element => element.value);
        
        setTimeout(() => {
          predictionStage = 4; // Neural Network stage
          updateStageIndicators();
          
          // Hide CNN wrapper and show NN section
          cnnWrapper.style.opacity = '0';
          setTimeout(() => {
            visualizationWrapper.style.opacity = '1';
            nnSection.style.opacity = '1';
            nnSection.style.transform = 'scale(1)';
            // NEW: Both development and production mode use the sophisticated neural network
            animateNeuralNetwork();
          }, 300); // Reduced from 500ms to 300ms  
        }, 300); // Reduced from 1000ms to 300ms
      }
    };
    
    animateFlattening();
  }

  // DEVELOPMENT MODE: Use the existing flattened vector scene  
  function showDevelopmentFlattening() {
    console.log("Using existing flattened vector scene");
    
    // Create mock pooled feature maps for the existing animation
    const mockPooledFeatureMaps = Array(6).fill().map((_, mapIdx) => {
      const dim = 6; // 6x6 feature maps
      return Array(dim).fill().map(() => 
        Array(dim).fill().map(() => Math.random() * 0.8 + 0.1)
      );
    });
    
    // Use the existing flattening animation (it already has the rainbow colors)
    animateFeatureMapFlattening(mockPooledFeatureMaps);
  }
  
  // REMOVED OLD animateSimplifiedNeuralNetwork function - replaced with sophisticated version
}); 
