document.addEventListener('DOMContentLoaded', function() {
  // Get the container element
  const container = document.querySelector('.geomineral-container');
  if (!container) return;

  // Create canvas elements for different visualization stages
  const mapCanvas = document.createElement('canvas');
  const gridCanvas = document.createElement('canvas');
  const convolutionCanvas = document.createElement('canvas');
  const poolingCanvas = document.createElement('canvas');
  const flattenCanvas = document.createElement('canvas');
  const denseCanvas = document.createElement('canvas');
  
  // Set canvas properties
  [mapCanvas, gridCanvas, convolutionCanvas, poolingCanvas, flattenCanvas, denseCanvas].forEach(canvas => {
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
  container.style.backgroundColor = '#0a0f1c'; // Darker background
  container.style.borderRadius = '0.5rem';
  
  // Append canvases to container
  container.appendChild(mapCanvas);
  container.appendChild(gridCanvas);
  container.appendChild(convolutionCanvas);
  container.appendChild(poolingCanvas);
  container.appendChild(flattenCanvas);
  container.appendChild(denseCanvas);

  // Create selection box for region selection
  const selectionBox = document.createElement('div');
  selectionBox.style.position = 'absolute';
  selectionBox.style.border = '2px solid #00ff88';
  selectionBox.style.transition = 'all 0.5s ease-in-out';
  selectionBox.style.display = 'none';
  selectionBox.style.boxShadow = '0 0 15px rgba(0, 255, 136, 0.6)';
  container.appendChild(selectionBox);

  // Create info panel for stage information
  const infoPanel = document.createElement('div');
  infoPanel.style.position = 'absolute';
  infoPanel.style.top = '10px';
  infoPanel.style.left = '10px';
  infoPanel.style.backgroundColor = 'rgba(10, 15, 28, 0.95)';
  infoPanel.style.color = '#00ff88';
  infoPanel.style.padding = '12px';
  infoPanel.style.borderRadius = '8px';
  infoPanel.style.fontFamily = 'monospace';
  infoPanel.style.fontSize = '13px';
  infoPanel.style.border = '1px solid #00ff88';
  infoPanel.style.minWidth = '250px';
  infoPanel.style.backdropFilter = 'blur(5px)';
  infoPanel.innerHTML = 'Initializing CNN Visualization...';
  container.appendChild(infoPanel);

  // State variables
  let currentStage = 'loading';
  let backgroundPixels = [];
  let selectedRegion = [];
  let convolutionResults = [];
  let poolingResults = [];
  let flattenedVector = [];
  let predictionResults = null;
  
  // CNN Architecture parameters
  const PIXEL_SIZE = 8; // Size of each pixel in the visualization
  const INPUT_SIZE = 15; // 15x15 input region
  const FILTER_SIZE = 3; // 3x3 convolution filters
  const POOL_SIZE = 2; // 2x2 max pooling
  const NUM_FILTERS = 6; // Number of convolution filters
  
  // Animation state
  let animationStep = 0;
  let currentFilter = 0;
  let currentConvPosition = { x: 0, y: 0 };
  let animationId;
  let selectionBoxState = { x: 200, y: 100, width: INPUT_SIZE * PIXEL_SIZE, height: INPUT_SIZE * PIXEL_SIZE };
  
  // Image loading
  let backgroundImage = new Image();
  let imageLoaded = false;

  // Define CNN filters with different purposes
  const cnnFilters = [
    {
      name: "Edge Detector",
      kernel: [[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]],
      color: '#ff6b6b',
      description: "Detects edges and boundaries"
    },
    {
      name: "Vertical Lines",
      kernel: [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]],
      color: '#4ecdc4',
      description: "Detects vertical features"
    },
    {
      name: "Horizontal Lines", 
      kernel: [[-1, -2, -1], [0, 0, 0], [1, 2, 1]],
      color: '#45b7d1',
      description: "Detects horizontal features"
    },
    {
      name: "Blur Filter",
      kernel: [[1/9, 1/9, 1/9], [1/9, 1/9, 1/9], [1/9, 1/9, 1/9]],
      color: '#96ceb4',
      description: "Smooths and blurs features"
    },
    {
      name: "Sharpen Filter",
      kernel: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]],
      color: '#ffeaa7',
      description: "Enhances fine details"
    },
    {
      name: "Diagonal Detector",
      kernel: [[2, -1, -1], [-1, 2, -1], [-1, -1, 2]],
      color: '#fd79a8',
      description: "Detects diagonal patterns"
    }
  ];

  // Image loading and processing
  backgroundImage.onload = () => {
    console.log("Background image loaded successfully");
    imageLoaded = true;
    extractPixelsFromImage();
    if (backgroundPixels.length > 0) {
      drawBackgroundPixels();
      setTimeout(startCNNVisualization, 1000);
    }
  };

  backgroundImage.onerror = () => {
    console.error("Failed to load background image, generating synthetic data");
    generateSyntheticGeoData();
    drawBackgroundPixels();
    setTimeout(startCNNVisualization, 1000);
  };

  // Extract pixels from the loaded satellite image
  function extractPixelsFromImage() {
    if (!imageLoaded) return;

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    tempCanvas.width = mapCanvas.width;
    tempCanvas.height = mapCanvas.height;

    tempCtx.drawImage(backgroundImage, 0, 0, tempCanvas.width, tempCanvas.height);

    try {
      const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const data = imageData.data;
      backgroundPixels = [];

      for (let y = 0; y < tempCanvas.height; y += PIXEL_SIZE) {
        const row = [];
        for (let x = 0; x < tempCanvas.width; x += PIXEL_SIZE) {
          const sampleX = x + Math.floor(PIXEL_SIZE / 2);
          const sampleY = y + Math.floor(PIXEL_SIZE / 2);
          const index = (sampleY * tempCanvas.width + sampleX) * 4;

          if (index + 3 < data.length) {
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];
            
            row.push({
              x: x,
              y: y,
              width: PIXEL_SIZE,
              height: PIXEL_SIZE,
              r: r,
              g: g,
              b: b,
              intensity: Math.round(0.299 * r + 0.587 * g + 0.114 * b), // Grayscale intensity
              geological: Math.sin(x * 0.01) * Math.cos(y * 0.01) * 50 + 128 // Simulated geological data
            });
          }
        }
        if (row.length > 0) {
          backgroundPixels.push(row);
        }
      }
      console.log(`Extracted ${backgroundPixels.flat().length} pixels from image`);
    } catch (e) {
      console.error("Error extracting pixels:", e);
      generateSyntheticGeoData();
    }
  }

  // Generate synthetic geological data as fallback
  function generateSyntheticGeoData() {
    backgroundPixels = [];
    for (let y = 0; y < 500; y += PIXEL_SIZE) {
      const row = [];
      for (let x = 0; x < 800; x += PIXEL_SIZE) {
        // Create realistic geological patterns
        const noise = Math.random() * 60;
        const pattern1 = Math.sin(x * 0.02) * Math.cos(y * 0.02) * 40;
        const pattern2 = Math.sin(x * 0.005) * Math.sin(y * 0.008) * 30;
        const baseIntensity = 120 + pattern1 + pattern2 + noise;
        
        // Add some mineral-like variations
        const mineralVariation = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 20;
        const r = Math.max(0, Math.min(255, baseIntensity + mineralVariation));
        const g = Math.max(0, Math.min(255, baseIntensity * 0.9));
        const b = Math.max(0, Math.min(255, baseIntensity * 0.7));
        
        row.push({
          x: x,
          y: y,
          width: PIXEL_SIZE,
          height: PIXEL_SIZE,
          r: r,
          g: g,
          b: b,
          intensity: Math.round(0.299 * r + 0.587 * g + 0.114 * b),
          geological: baseIntensity
        });
      }
      backgroundPixels.push(row);
    }
    console.log("Generated synthetic geological data");
  }

  // Draw the pixelated background
  function drawBackgroundPixels() {
    const ctx = mapCanvas.getContext('2d');
    ctx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
    
    backgroundPixels.forEach(row => {
      row.forEach(pixel => {
        ctx.fillStyle = `rgb(${pixel.r}, ${pixel.g}, ${pixel.b})`;
        ctx.fillRect(pixel.x, pixel.y, pixel.width, pixel.height);
      });
    });
    console.log("Background pixels drawn");
  }

  // Select a random region for CNN processing
  function selectInputRegion() {
    // Generate random position for selection box
    const margin = 50;
    const maxX = 800 - selectionBoxState.width - margin;
    const maxY = 500 - selectionBoxState.height - margin;
    
    selectionBoxState.x = margin + Math.floor(Math.random() * (maxX - margin));
    selectionBoxState.y = margin + Math.floor(Math.random() * (maxY - margin));
    
    // Extract the selected region data
    selectedRegion = [];
    const startPixelX = Math.floor(selectionBoxState.x / PIXEL_SIZE);
    const startPixelY = Math.floor(selectionBoxState.y / PIXEL_SIZE);
    
    for (let y = 0; y < INPUT_SIZE; y++) {
      const row = [];
      for (let x = 0; x < INPUT_SIZE; x++) {
        const pixelRowIndex = startPixelY + y;
        const pixelColIndex = startPixelX + x;
        
        if (backgroundPixels[pixelRowIndex] && backgroundPixels[pixelRowIndex][pixelColIndex]) {
          const pixel = backgroundPixels[pixelRowIndex][pixelColIndex];
          row.push({
            x: pixel.x,
            y: pixel.y,
            r: pixel.r,
            g: pixel.g,
            b: pixel.b,
            intensity: pixel.intensity,
            geological: pixel.geological
          });
        }
      }
      if (row.length > 0) {
        selectedRegion.push(row);
      }
    }
    
    console.log(`Selected ${INPUT_SIZE}x${INPUT_SIZE} region for CNN processing`);
  }

  // Show the selection box with animation
  function showSelectionBox() {
    selectionBox.style.display = 'block';
    selectionBox.style.left = selectionBoxState.x + 'px';
    selectionBox.style.top = selectionBoxState.y + 'px';
    selectionBox.style.width = selectionBoxState.width + 'px';
    selectionBox.style.height = selectionBoxState.height + 'px';
    
    // Add pulsing animation
    selectionBox.style.animation = 'pulse 1.5s infinite alternate';
    
    // Draw grid inside selection
    const ctx = gridCanvas.getContext('2d');
    ctx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
    
    // Draw selection highlight
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 10;
    ctx.strokeRect(selectionBoxState.x - 1, selectionBoxState.y - 1, 
                   selectionBoxState.width + 2, selectionBoxState.height + 2);
    ctx.shadowBlur = 0;
    
    // Draw internal grid
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.4)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= INPUT_SIZE; i++) {
      const x = selectionBoxState.x + (i * PIXEL_SIZE);
      const y = selectionBoxState.y + (i * PIXEL_SIZE);
      
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(x, selectionBoxState.y);
      ctx.lineTo(x, selectionBoxState.y + selectionBoxState.height);
      ctx.stroke();
      
      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(selectionBoxState.x, y);
      ctx.lineTo(selectionBoxState.x + selectionBoxState.width, y);
      ctx.stroke();
    }
  }

  // Perform convolution operation with a specific filter
  function performConvolution(filterIndex) {
    if (!selectedRegion.length || !cnnFilters[filterIndex]) return [];
    
    const filter = cnnFilters[filterIndex];
    const outputSize = INPUT_SIZE - FILTER_SIZE + 1;
    const result = [];
    
    for (let y = 0; y < outputSize; y++) {
      const row = [];
      for (let x = 0; x < outputSize; x++) {
        let sum = 0;
        
        // Apply convolution kernel
        for (let ky = 0; ky < FILTER_SIZE; ky++) {
          for (let kx = 0; kx < FILTER_SIZE; kx++) {
            const inputY = y + ky;
            const inputX = x + kx;
            
            if (selectedRegion[inputY] && selectedRegion[inputY][inputX]) {
              const pixelValue = selectedRegion[inputY][inputX].intensity;
              const kernelValue = filter.kernel[ky][kx];
              sum += pixelValue * kernelValue;
            }
          }
        }
        
        // Apply ReLU activation function
        const activatedValue = Math.max(0, sum);
        row.push({
          x: x,
          y: y,
          value: activatedValue,
          normalizedValue: Math.min(255, Math.abs(activatedValue) / 10) // For visualization
        });
      }
      result.push(row);
    }
    
    return result;
  }

  // Update info panel with current stage information
  function updateInfoPanel() {
    const stageInfo = {
      'loading': {
        title: 'CNN Initialization',
        description: 'Loading geological satellite data...',
        details: 'Preparing for Convolutional Neural Network analysis'
      },
      'background': {
        title: 'Stage 1: Input Data',
        description: 'Displaying satellite geological imagery',
        details: `Resolution: ${800}x${500} pixels, Pixel size: ${PIXEL_SIZE}px`
      },
      'selection': {
        title: 'Stage 2: Region Selection',
        description: `Selecting ${INPUT_SIZE}x${INPUT_SIZE} region for analysis`,
        details: 'CNN input layer preparation'
      },
      'convolution': {
        title: 'Stage 3: Convolution Layer',
        description: `Applying filter ${currentFilter + 1}/${NUM_FILTERS}: ${cnnFilters[currentFilter]?.name}`,
        details: `${FILTER_SIZE}x${FILTER_SIZE} kernel, ReLU activation`
      },
      'pooling': {
        title: 'Stage 4: Max Pooling',
        description: `${POOL_SIZE}x${POOL_SIZE} max pooling operation`,
        details: 'Reducing spatial dimensions, preserving important features'
      },
      'flatten': {
        title: 'Stage 5: Flatten Layer',
        description: 'Converting 2D feature maps to 1D vector',
        details: 'Preparing for dense layer processing'
      },
      'dense': {
        title: 'Stage 6: Dense Layers',
        description: 'Fully connected neural network processing',
        details: 'Final classification and prediction'
      },
      'prediction': {
        title: 'Stage 7: Prediction Results',
        description: 'Mineral classification complete',
        details: 'Confidence scores for detected minerals'
      }
    };
    
    const info = stageInfo[currentStage] || stageInfo['loading'];
    
    infoPanel.innerHTML = `
      <div style="color: #00ff88; font-weight: bold; font-size: 14px;">${info.title}</div>
      <div style="margin-top: 8px; color: #88ccff; font-size: 12px;">${info.description}</div>
      <div style="margin-top: 8px; color: #cccccc; font-size: 11px;">${info.details}</div>
      <div style="margin-top: 12px; color: #ffaa44; font-size: 11px;">
        CNN Architecture: Conv2D(${NUM_FILTERS}) → MaxPool → Flatten → Dense → Output(3)
      </div>
    `;
  }

  // Main animation function
  function animate() {
    updateInfoPanel();
    
    switch(currentStage) {
      case 'background':
        // Show background for 2 seconds
        setTimeout(() => {
          currentStage = 'selection';
          selectInputRegion();
        }, 2000);
        break;
        
      case 'selection':
        showSelectionBox();
        setTimeout(() => {
          currentStage = 'convolution';
          currentFilter = 0;
          animationStep = 0;
        }, 3000);
        break;
        
      case 'convolution':
        animateConvolutionProcess();
        break;
        
      case 'pooling':
        animatePoolingProcess();
        break;
        
      case 'flatten':
        animateFlattenProcess();
        break;
        
      case 'dense':
        animateDenseProcess();
        break;
        
      case 'prediction':
        showPredictionResults();
        setTimeout(() => {
          resetVisualization();
        }, 5000);
        break;
    }
    
    if (currentStage !== 'complete') {
      animationId = requestAnimationFrame(animate);
    }
  }

  // Start the CNN visualization sequence
  function startCNNVisualization() {
    console.log("Starting CNN visualization sequence");
    currentStage = 'background';
    animationStep = 0;
    currentFilter = 0;
    
    // Clear all canvases except map
    [gridCanvas, convolutionCanvas, poolingCanvas, flattenCanvas, denseCanvas].forEach(canvas => {
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    });
    
    animate();
  }

  // Reset visualization for loop
  function resetVisualization() {
    console.log("Resetting visualization");
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    
    // Clear all canvases
    [gridCanvas, convolutionCanvas, poolingCanvas, flattenCanvas, denseCanvas].forEach(canvas => {
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    });
    
    // Hide selection box
    selectionBox.style.display = 'none';
    
    // Reset state
    selectedRegion = [];
    convolutionResults = [];
    poolingResults = [];
    flattenedVector = [];
    predictionResults = null;
    
    // Restart after a brief pause
    setTimeout(() => {
      drawBackgroundPixels();
      startCNNVisualization();
    }, 2000);
  }

  // Add CSS animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0% { 
        opacity: 0.6; 
        transform: scale(1);
        box-shadow: 0 0 15px rgba(0, 255, 136, 0.6);
      }
      100% { 
        opacity: 1; 
        transform: scale(1.02);
        box-shadow: 0 0 25px rgba(0, 255, 136, 0.9);
      }
    }
    
    @keyframes glow {
      0%, 100% { filter: brightness(1); }
      50% { filter: brightness(1.2); }
    }
    
    @keyframes slideIn {
      from { transform: translateX(-100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  // Initialize the visualization
  console.log("Initializing CNN visualization");
  backgroundImage.src = 'assets/images/usgs-Qu8lplStSSE-unsplash.jpg';

  // Animate the convolution process with sliding filter
  function animateConvolutionProcess() {
    const ctx = convolutionCanvas.getContext('2d');
    
    // Clear previous frame
    ctx.clearRect(0, 0, convolutionCanvas.width, convolutionCanvas.height);
    
    if (!selectedRegion.length || currentFilter >= NUM_FILTERS) {
      // Move to pooling stage
      currentStage = 'pooling';
      return;
    }
    
    const filter = cnnFilters[currentFilter];
    const outputSize = INPUT_SIZE - FILTER_SIZE + 1;
    
    // Calculate current filter position
    const totalPositions = outputSize * outputSize;
    const currentPos = animationStep % (totalPositions * 3); // 3 frames per position
    const positionIndex = Math.floor(currentPos / 3);
    
    currentConvPosition.x = positionIndex % outputSize;
    currentConvPosition.y = Math.floor(positionIndex / outputSize);
    
    // Draw filter information panel
    drawFilterInfo(filter, currentFilter);
    
    // Draw the sliding filter overlay
    drawSlidingFilter(filter);
    
    // Draw convolution output
    drawConvolutionOutput(filter, currentFilter);
    
    // Update animation
    animationStep++;
    
    // Check if current filter is complete
    if (currentPos >= totalPositions * 3 - 1) {
      // Store convolution result
      convolutionResults[currentFilter] = performConvolution(currentFilter);
      
      // Move to next filter
      currentFilter++;
      animationStep = 0;
      
      if (currentFilter >= NUM_FILTERS) {
        setTimeout(() => {
          currentStage = 'pooling';
          animationStep = 0;
        }, 1000);
      }
    }
  }

  // Draw filter information
  function drawFilterInfo(filter, filterIndex) {
    const ctx = convolutionCanvas.getContext('2d');
    
    // Filter info panel
    const panelX = 20;
    const panelY = 20;
    const panelWidth = 200;
    const panelHeight = 120;
    
    // Background
    ctx.fillStyle = 'rgba(10, 15, 28, 0.9)';
    ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    ctx.strokeStyle = filter.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
    
    // Filter name
    ctx.fillStyle = filter.color;
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`Filter ${filterIndex + 1}: ${filter.name}`, panelX + 10, panelY + 20);
    
    // Description
    ctx.fillStyle = '#cccccc';
    ctx.font = '11px monospace';
    ctx.fillText(filter.description, panelX + 10, panelY + 40);
    
    // Draw kernel
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';
    ctx.fillText('Kernel:', panelX + 10, panelY + 60);
    
    const kernelStartX = panelX + 10;
    const kernelStartY = panelY + 70;
    const cellSize = 15;
    
    for (let ky = 0; ky < FILTER_SIZE; ky++) {
      for (let kx = 0; kx < FILTER_SIZE; kx++) {
        const value = filter.kernel[ky][kx];
        const cellX = kernelStartX + kx * cellSize;
        const cellY = kernelStartY + ky * cellSize;
        
        // Color based on value
        const intensity = Math.abs(value) * 100;
        ctx.fillStyle = value > 0 ? 
          `rgba(255, 100, 100, ${Math.min(1, intensity)})` : 
          `rgba(100, 100, 255, ${Math.min(1, intensity)})`;
        ctx.fillRect(cellX, cellY, cellSize - 1, cellSize - 1);
        
        // Draw value
        ctx.fillStyle = 'white';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(value.toFixed(1), cellX + cellSize/2, cellY + cellSize/2 + 3);
      }
    }
    ctx.textAlign = 'left';
  }

  // Draw sliding filter overlay on input region
  function drawSlidingFilter(filter) {
    const ctx = convolutionCanvas.getContext('2d');
    
    if (!selectedRegion.length) return;
    
    // Calculate filter position on the input
    const filterPixelX = selectionBoxState.x + (currentConvPosition.x * PIXEL_SIZE);
    const filterPixelY = selectionBoxState.y + (currentConvPosition.y * PIXEL_SIZE);
    const filterSize = FILTER_SIZE * PIXEL_SIZE;
    
    // Draw glowing filter overlay
    ctx.strokeStyle = filter.color;
    ctx.lineWidth = 3;
    ctx.shadowColor = filter.color;
    ctx.shadowBlur = 15;
    ctx.strokeRect(filterPixelX, filterPixelY, filterSize, filterSize);
    ctx.shadowBlur = 0;
    
    // Draw filter grid
    ctx.strokeStyle = `${filter.color}80`; // Semi-transparent
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= FILTER_SIZE; i++) {
      const x = filterPixelX + (i * PIXEL_SIZE);
      const y = filterPixelY + (i * PIXEL_SIZE);
      
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(x, filterPixelY);
      ctx.lineTo(x, filterPixelY + filterSize);
      ctx.stroke();
      
      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(filterPixelX, y);
      ctx.lineTo(filterPixelX + filterSize, y);
      ctx.stroke();
    }
    
    // Show computation result for current position
    if (convolutionResults[currentFilter]) {
      const result = convolutionResults[currentFilter];
      if (result[currentConvPosition.y] && result[currentConvPosition.y][currentConvPosition.x]) {
        const value = result[currentConvPosition.y][currentConvPosition.x].value;
        
        // Draw result bubble
        const bubbleX = filterPixelX + filterSize + 20;
        const bubbleY = filterPixelY + filterSize / 2;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.beginPath();
        ctx.arc(bubbleX, bubbleY, 25, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = filter.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = filter.color;
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(value.toFixed(0), bubbleX, bubbleY + 4);
        ctx.textAlign = 'left';
      }
    }
  }

  // Draw convolution output feature map
  function drawConvolutionOutput(filter, filterIndex) {
    const ctx = convolutionCanvas.getContext('2d');
    
    // Feature map position
    const mapX = 600;
    const mapY = 50;
    const outputSize = INPUT_SIZE - FILTER_SIZE + 1;
    const cellSize = 8;
    
    // Feature map background
    ctx.fillStyle = 'rgba(10, 15, 28, 0.9)';
    ctx.fillRect(mapX - 10, mapY - 30, outputSize * cellSize + 20, outputSize * cellSize + 50);
    ctx.strokeStyle = filter.color;
    ctx.lineWidth = 1;
    ctx.strokeRect(mapX - 10, mapY - 30, outputSize * cellSize + 20, outputSize * cellSize + 50);
    
    // Title
    ctx.fillStyle = filter.color;
    ctx.font = '12px monospace';
    ctx.fillText(`Feature Map ${filterIndex + 1}`, mapX, mapY - 10);
    
    // Draw feature map
    const result = performConvolution(filterIndex);
    
    for (let y = 0; y < outputSize; y++) {
      for (let x = 0; x < outputSize; x++) {
        const cellX = mapX + x * cellSize;
        const cellY = mapY + y * cellSize;
        
        if (result[y] && result[y][x]) {
          const value = result[y][x].normalizedValue;
          const intensity = Math.min(255, value);
          
          // Color based on filter
          let r, g, b;
          if (filter.color === '#ff6b6b') { // Red
            r = intensity; g = intensity/3; b = intensity/3;
          } else if (filter.color === '#4ecdc4') { // Cyan
            r = intensity/3; g = intensity; b = intensity;
          } else if (filter.color === '#45b7d1') { // Blue
            r = intensity/3; g = intensity/2; b = intensity;
          } else if (filter.color === '#96ceb4') { // Green
            r = intensity/3; g = intensity; b = intensity/2;
          } else if (filter.color === '#ffeaa7') { // Yellow
            r = intensity; g = intensity; b = intensity/3;
          } else { // Pink
            r = intensity; g = intensity/3; b = intensity;
          }
          
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.8)`;
          ctx.fillRect(cellX, cellY, cellSize - 1, cellSize - 1);
          
          // Highlight current position
          if (x === currentConvPosition.x && y === currentConvPosition.y) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(cellX - 1, cellY - 1, cellSize + 1, cellSize + 1);
          }
        }
      }
    }
  }

  // Animate pooling process
  function animatePoolingProcess() {
    const ctx = poolingCanvas.getContext('2d');
    ctx.clearRect(0, 0, poolingCanvas.width, poolingCanvas.height);
    
    // Draw pooling information
    drawPoolingInfo();
    
    // Draw all convolution results and their pooled versions
    drawPoolingVisualization();
    
    // Auto-advance after showing pooling
    setTimeout(() => {
      currentStage = 'flatten';
      animationStep = 0;
    }, 4000);
  }

  // Draw pooling information panel
  function drawPoolingInfo() {
    const ctx = poolingCanvas.getContext('2d');
    
    const panelX = 20;
    const panelY = 20;
    const panelWidth = 300;
    const panelHeight = 80;
    
    // Background
    ctx.fillStyle = 'rgba(10, 15, 28, 0.9)';
    ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    ctx.strokeStyle = '#00aaff';
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
    
    // Title
    ctx.fillStyle = '#00aaff';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('Max Pooling Layer', panelX + 10, panelY + 25);
    
    // Description
    ctx.fillStyle = '#cccccc';
    ctx.font = '12px monospace';
    ctx.fillText(`${POOL_SIZE}x${POOL_SIZE} pooling reduces spatial dimensions`, panelX + 10, panelY + 45);
    ctx.fillText('Preserves most important features', panelX + 10, panelY + 65);
  }

  // Draw pooling visualization
  function drawPoolingVisualization() {
    const ctx = poolingCanvas.getContext('2d');
    
    const startX = 50;
    const startY = 120;
    const spacing = 120;
    
    // Process each convolution result
    for (let filterIndex = 0; filterIndex < NUM_FILTERS; filterIndex++) {
      if (!convolutionResults[filterIndex]) continue;
      
      const filter = cnnFilters[filterIndex];
      const convResult = convolutionResults[filterIndex];
      const outputSize = INPUT_SIZE - FILTER_SIZE + 1;
      const pooledSize = Math.floor(outputSize / POOL_SIZE);
      
      const filterX = startX + (filterIndex % 3) * spacing;
      const filterY = startY + Math.floor(filterIndex / 3) * 100;
      
      // Draw original feature map (smaller)
      ctx.fillStyle = filter.color;
      ctx.font = '10px monospace';
      ctx.fillText(`Filter ${filterIndex + 1}`, filterX, filterY - 5);
      
      const cellSize = 3;
      for (let y = 0; y < outputSize; y++) {
        for (let x = 0; x < outputSize; x++) {
          if (convResult[y] && convResult[y][x]) {
            const value = convResult[y][x].normalizedValue;
            const intensity = Math.min(255, value);
            
            ctx.fillStyle = `${filter.color}${Math.floor(intensity/16).toString(16).padStart(2, '0')}`;
            ctx.fillRect(filterX + x * cellSize, filterY + y * cellSize, cellSize - 1, cellSize - 1);
          }
        }
      }
      
      // Draw arrow
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(filterX + outputSize * cellSize + 5, filterY + outputSize * cellSize / 2);
      ctx.lineTo(filterX + outputSize * cellSize + 15, filterY + outputSize * cellSize / 2);
      ctx.stroke();
      
      // Draw pooled result
      const pooledX = filterX + outputSize * cellSize + 20;
      const pooledCellSize = 6;
      
      for (let y = 0; y < pooledSize; y++) {
        for (let x = 0; x < pooledSize; x++) {
          // Perform max pooling
          let maxValue = 0;
          for (let py = 0; py < POOL_SIZE; py++) {
            for (let px = 0; px < POOL_SIZE; px++) {
              const origY = y * POOL_SIZE + py;
              const origX = x * POOL_SIZE + px;
              if (convResult[origY] && convResult[origY][origX]) {
                maxValue = Math.max(maxValue, convResult[origY][origX].normalizedValue);
              }
            }
          }
          
          const intensity = Math.min(255, maxValue);
          ctx.fillStyle = `${filter.color}${Math.floor(intensity/16).toString(16).padStart(2, '0')}`;
          ctx.fillRect(pooledX + x * pooledCellSize, filterY + y * pooledCellSize, 
                      pooledCellSize - 1, pooledCellSize - 1);
        }
      }
      
      // Store pooled result
      if (!poolingResults[filterIndex]) {
        poolingResults[filterIndex] = [];
        for (let y = 0; y < pooledSize; y++) {
          const row = [];
          for (let x = 0; x < pooledSize; x++) {
            let maxValue = 0;
            for (let py = 0; py < POOL_SIZE; py++) {
              for (let px = 0; px < POOL_SIZE; px++) {
                const origY = y * POOL_SIZE + py;
                const origX = x * POOL_SIZE + px;
                if (convResult[origY] && convResult[origY][origX]) {
                  maxValue = Math.max(maxValue, convResult[origY][origX].value);
                }
              }
            }
            row.push(maxValue);
          }
          poolingResults[filterIndex].push(row);
        }
      }
    }
  }

  // Animate flatten process
  function animateFlattenProcess() {
    const ctx = flattenCanvas.getContext('2d');
    ctx.clearRect(0, 0, flattenCanvas.width, flattenCanvas.height);
    
    // Draw flatten information
    drawFlattenInfo();
    
    // Animate the flattening process
    drawFlattenVisualization();
    
    setTimeout(() => {
      currentStage = 'dense';
      animationStep = 0;
    }, 3000);
  }

  // Draw flatten information
  function drawFlattenInfo() {
    const ctx = flattenCanvas.getContext('2d');
    
    const panelX = 20;
    const panelY = 20;
    const panelWidth = 350;
    const panelHeight = 80;
    
    // Background
    ctx.fillStyle = 'rgba(10, 15, 28, 0.9)';
    ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    ctx.strokeStyle = '#ff6b9d';
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
    
    // Title
    ctx.fillStyle = '#ff6b9d';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('Flatten Layer', panelX + 10, panelY + 25);
    
    // Description
    ctx.fillStyle = '#cccccc';
    ctx.font = '12px monospace';
    ctx.fillText('Converting 2D feature maps to 1D vector', panelX + 10, panelY + 45);
    
    // Calculate total elements
    let totalElements = 0;
    poolingResults.forEach(result => {
      if (result && result.length > 0) {
        totalElements += result.length * result[0].length;
      }
    });
    
    ctx.fillText(`Total features: ${totalElements}`, panelX + 10, panelY + 65);
  }

  // Draw flatten visualization
  function drawFlattenVisualization() {
    const ctx = flattenCanvas.getContext('2d');
    
    const startX = 50;
    const startY = 120;
    
    // Flatten all pooling results into a single vector
    flattenedVector = [];
    
    // Draw pooled feature maps
    for (let filterIndex = 0; filterIndex < NUM_FILTERS; filterIndex++) {
      if (!poolingResults[filterIndex]) continue;
      
      const filter = cnnFilters[filterIndex];
      const pooledResult = poolingResults[filterIndex];
      const pooledSize = pooledResult.length;
      
      const mapX = startX + (filterIndex % 3) * 80;
      const mapY = startY + Math.floor(filterIndex / 3) * 80;
      
      // Draw feature map
      ctx.fillStyle = filter.color;
      ctx.font = '10px monospace';
      ctx.fillText(`Map ${filterIndex + 1}`, mapX, mapY - 5);
      
      const cellSize = 8;
      for (let y = 0; y < pooledSize; y++) {
        for (let x = 0; x < pooledSize; x++) {
          const value = pooledResult[y][x];
          const intensity = Math.min(255, Math.abs(value) / 10);
          
          ctx.fillStyle = `${filter.color}${Math.floor(intensity/16).toString(16).padStart(2, '0')}`;
          ctx.fillRect(mapX + x * cellSize, mapY + y * cellSize, cellSize - 1, cellSize - 1);
          
          // Add to flattened vector
          flattenedVector.push({
            value: value,
            color: filter.color,
            filterIndex: filterIndex
          });
        }
      }
    }
    
    // Draw flattened vector
    const vectorX = 400;
    const vectorY = 120;
    const vectorWidth = 300;
    const vectorHeight = 20;
    
    ctx.fillStyle = 'rgba(10, 15, 28, 0.9)';
    ctx.fillRect(vectorX - 10, vectorY - 10, vectorWidth + 20, vectorHeight + 20);
    ctx.strokeStyle = '#ff6b9d';
    ctx.lineWidth = 2;
    ctx.strokeRect(vectorX - 10, vectorY - 10, vectorWidth + 20, vectorHeight + 20);
    
    ctx.fillStyle = '#ff6b9d';
    ctx.font = '12px monospace';
    ctx.fillText('Flattened Vector', vectorX, vectorY - 15);
    
    // Draw vector elements
    const elementWidth = vectorWidth / flattenedVector.length;
    
    flattenedVector.forEach((element, index) => {
      const x = vectorX + index * elementWidth;
      const intensity = Math.min(255, Math.abs(element.value) / 10);
      
      ctx.fillStyle = `${element.color}${Math.floor(intensity/16).toString(16).padStart(2, '0')}`;
      ctx.fillRect(x, vectorY, elementWidth - 1, vectorHeight);
    });
  }

  // Animate dense layer process
  function animateDenseProcess() {
    const ctx = denseCanvas.getContext('2d');
    ctx.clearRect(0, 0, denseCanvas.width, denseCanvas.height);
    
    // Draw dense network
    drawDenseNetwork();
    
    setTimeout(() => {
      currentStage = 'prediction';
      generatePredictions();
    }, 4000);
  }

  // Draw dense network visualization
  function drawDenseNetwork() {
    const ctx = denseCanvas.getContext('2d');
    
    // Dense layer architecture
    const layers = [
      { neurons: Math.min(flattenedVector.length, 50), x: 100, color: '#74b9ff', name: 'Input' },
      { neurons: 32, x: 250, color: '#55a3ff', name: 'Hidden 1' },
      { neurons: 16, x: 400, color: '#fd79a8', name: 'Hidden 2' },
      { neurons: 3, x: 550, color: '#fdcb6e', name: 'Output' }
    ];
    
    // Draw network info
    ctx.fillStyle = 'rgba(10, 15, 28, 0.9)';
    ctx.fillRect(20, 20, 300, 60);
    ctx.strokeStyle = '#74b9ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, 300, 60);
    
    ctx.fillStyle = '#74b9ff';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('Dense Neural Network', 30, 40);
    
    ctx.fillStyle = '#cccccc';
    ctx.font = '12px monospace';
    ctx.fillText('Fully connected layers for classification', 30, 60);
    
    // Draw layers
    layers.forEach((layer, layerIndex) => {
      const spacing = 200 / Math.max(layer.neurons, 1);
      const startY = 150;
      
      // Draw neurons
      for (let i = 0; i < Math.min(layer.neurons, 20); i++) {
        const y = startY + i * spacing;
        const size = layerIndex === layers.length - 1 ? 8 : 5;
        
        ctx.beginPath();
        ctx.arc(layer.x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = layer.color;
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Draw connections to next layer
        if (layerIndex < layers.length - 1) {
          const nextLayer = layers[layerIndex + 1];
          const nextSpacing = 200 / Math.max(nextLayer.neurons, 1);
          
          for (let j = 0; j < Math.min(nextLayer.neurons, 20); j++) {
            const nextY = startY + j * nextSpacing;
            
            ctx.beginPath();
            ctx.moveTo(layer.x + size, y);
            ctx.lineTo(nextLayer.x - size, nextY);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      
      // Layer labels
      ctx.fillStyle = layer.color;
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(layer.name, layer.x, startY + 220);
      ctx.fillText(`(${layer.neurons})`, layer.x, startY + 235);
      ctx.textAlign = 'left';
    });
  }

  // Generate prediction results
  function generatePredictions() {
    // Simulate prediction based on flattened vector
    const totalActivation = flattenedVector.reduce((sum, element) => sum + Math.abs(element.value), 0);
    
    // Generate realistic-looking probabilities
    const goldProb = Math.min(0.95, Math.max(0.1, (totalActivation / flattenedVector.length) / 300 + Math.random() * 0.3));
    const copperProb = Math.min(0.9, Math.max(0.05, goldProb * 0.6 + Math.random() * 0.2));
    const ironProb = Math.min(0.8, Math.max(0.02, copperProb * 0.5 + Math.random() * 0.15));
    
    predictionResults = [
      { type: 'Gold', probability: goldProb, color: '#FFD700' },
      { type: 'Copper', probability: copperProb, color: '#B87333' },
      { type: 'Iron', probability: ironProb, color: '#CD5C5C' }
    ];
  }

  // Show prediction results
  function showPredictionResults() {
    const ctx = denseCanvas.getContext('2d');
    
    if (!predictionResults) return;
    
    // Clear and redraw dense network
    drawDenseNetwork();
    
    // Draw prediction panel
    const panelX = 600;
    const panelY = 100;
    const panelWidth = 180;
    const panelHeight = 200;
    
    ctx.fillStyle = 'rgba(10, 15, 28, 0.95)';
    ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    ctx.strokeStyle = '#fdcb6e';
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
    
    // Title
    ctx.fillStyle = '#fdcb6e';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Predictions', panelX + panelWidth/2, panelY + 25);
    ctx.textAlign = 'left';
    
    // Draw predictions
    predictionResults.forEach((mineral, i) => {
      const y = panelY + 50 + i * 45;
      
      // Mineral name
      ctx.fillStyle = mineral.color;
      ctx.font = '12px monospace';
      ctx.fillText(mineral.type, panelX + 10, y);
      
      // Probability bar
      const barWidth = panelWidth - 40;
      const barHeight = 12;
      const barX = panelX + 10;
      const barY = y + 5;
      
      // Background bar
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      
      // Probability bar
      ctx.fillStyle = mineral.color;
      ctx.fillRect(barX, barY, barWidth * mineral.probability, barHeight);
      
      // Percentage text
      ctx.fillStyle = '#ffffff';
      ctx.font = '11px monospace';
      ctx.fillText(`${Math.round(mineral.probability * 100)}%`, barX + barWidth + 5, barY + 9);
    });
  }
});