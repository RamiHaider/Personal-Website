document.addEventListener('DOMContentLoaded', function() {
  // Get the container element
  const container = document.querySelector('.region-selector-container');
  if (!container) return;

  // Create canvas elements
  const mapCanvas = document.createElement('canvas');
  const gridCanvas = document.createElement('canvas');
  
  // Set canvas properties - crop to just the selected region (no labels needed)
  const regionWidth = 160; // Full size: 32 pixels * 5px each
  const regionHeight = 160; // Full size: 32 pixels * 5px each
  
  [mapCanvas, gridCanvas].forEach(canvas => {
    canvas.width = regionWidth;
    canvas.height = regionHeight;
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.width = '160px'; // Fixed width to prevent stretching
    canvas.style.height = '160px'; // Fixed height to prevent stretching
  });
  
  // Make container relative for absolute positioning - clean styling and centered
  container.style.position = 'relative';
  container.style.width = '160px'; // Fixed width
  container.style.height = '160px'; // Fixed height, perfectly square
  container.style.overflow = 'hidden';
  container.style.backgroundColor = '#ffffff';
  container.style.margin = '0 auto'; // Center the container
  
  // Append canvases to container
  container.appendChild(mapCanvas);
  container.appendChild(gridCanvas);
  
  // State variables
  let backgroundPixels = [];
  let backgroundImage = new Image();
  let imageLoaded = false;
  let animationStarted = false;
  
  // Hard-coded selection box (32x32 pixels at 5px each = 160x160 display)
  // Original position in full image
  const originalSelectionBox = { x: 240, y: 120, width: 160, height: 160 };
  // New position in cropped canvas (fills entire canvas)
  const selectionBox = { x: 0, y: 0, width: 160, height: 160 };
  
  // Load the geophysical image
  backgroundImage.onload = () => {
    console.log("Background image loaded for blog visualization");
    imageLoaded = true;
    extractPixelsFromImage();
    if (backgroundPixels.length > 0) {
      drawBackgroundPixels();
      // Start the animation after a brief delay
      setTimeout(() => {
        startRegionSelection();
      }, 1000);
    }
  };

  backgroundImage.onerror = () => {
    console.error("Failed to load background image");
    // Create fallback geophysical-like pattern
    createFallbackPattern();
    drawBackgroundPixels();
    setTimeout(() => {
      startRegionSelection();
    }, 1000);
  };
  
  // Set the image source to the geophysics image
  backgroundImage.src = '../assets/images/geophysics-image.png';
  
  // Function to extract pixel data from the loaded image
  function extractPixelsFromImage() {
    if (!imageLoaded) return;

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    
    // Set canvas size to match our display
    tempCanvas.width = 800;
    tempCanvas.height = 500;
    
    // Draw image to temp canvas
    tempCtx.drawImage(backgroundImage, 0, 0, 800, 500);
    
    // Extract pixel data only from the selected region (5x5 pixel blocks for full size)
    const originalPixelSize = 5;
    const newPixelSize = 5;
    backgroundPixels = [];
    
    // Only extract pixels from the original selection area
    for (let y = originalSelectionBox.y; y < originalSelectionBox.y + originalSelectionBox.height; y += originalPixelSize) {
      const row = [];
      for (let x = originalSelectionBox.x; x < originalSelectionBox.x + originalSelectionBox.width; x += originalPixelSize) {
        // Sample the center of each block
        const imageData = tempCtx.getImageData(x + originalPixelSize/2, y + originalPixelSize/2, 1, 1);
        const [r, g, b] = imageData.data;
        
        // Map to new position in cropped canvas (1:1 mapping, no scaling)
        const newX = x - originalSelectionBox.x;
        const newY = y - originalSelectionBox.y;
        
        row.push({
          x: newX,
          y: newY,
          width: newPixelSize,
          height: newPixelSize,
          color: { r, g, b }
        });
      }
      if (row.length > 0) {
        backgroundPixels.push(row);
      }
    }
    
    console.log(`Extracted ${backgroundPixels.length} rows of selected region pixels`);
  }
  
  // Fallback pattern if image fails to load
  function createFallbackPattern() {
    const newPixelSize = 5;
    backgroundPixels = [];
    
    // Create a geological-like pattern just for the selected region
    for (let y = 0; y < 160; y += newPixelSize) {
      const row = [];
      for (let x = 0; x < 160; x += newPixelSize) {
        // Create a geological-like pattern
        const intensity = (Math.sin(x * 0.01) + Math.cos(y * 0.01) + Math.sin((x + y) * 0.005)) * 50 + 128;
        const r = Math.max(0, Math.min(255, intensity + Math.random() * 40 - 20));
        const g = Math.max(0, Math.min(255, intensity * 0.8 + Math.random() * 30 - 15));
        const b = Math.max(0, Math.min(255, intensity * 0.6 + Math.random() * 20 - 10));
        
        row.push({
          x: x,
          y: y,
          width: newPixelSize,
          height: newPixelSize,
          color: { r: Math.floor(r), g: Math.floor(g), b: Math.floor(b) }
        });
      }
      backgroundPixels.push(row);
    }
  }
  
  // Function to draw the pixelated background
  function drawBackgroundPixels() {
    if (backgroundPixels.length === 0) return;
    
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
  
  // Main function to start the region selection visualization
  function startRegionSelection() {
    if (animationStarted) return;
    animationStarted = true;
    
    // Show only selected region on white background
    showSelectedRegionOnly();
  }
  
  // Function to show only selected region on white background
  function showSelectedRegionOnly() {
    const mapCtx = mapCanvas.getContext('2d');
    const width = mapCanvas.width;
    const height = mapCanvas.height;
    
    // Fill entire canvas with white
    mapCtx.fillStyle = '#ffffff';
    mapCtx.fillRect(0, 0, width, height);
    
    // Draw all the extracted pixels (they're already positioned correctly)
    backgroundPixels.forEach(row => {
      row.forEach(pixel => {
        mapCtx.fillStyle = `rgb(${pixel.color.r}, ${pixel.color.g}, ${pixel.color.b})`;
        mapCtx.fillRect(pixel.x, pixel.y, pixel.width, pixel.height);
      });
    });
  }
  

}); 