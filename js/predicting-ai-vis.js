import React, { useState, useEffect, useRef } from 'react';
import { Map, Cpu, Database, AlertCircle } from 'lucide-react';

const GeoMineralImproved = () => {
  const [predictionStage, setPredictionStage] = useState(0);
  const [selectionBox, setSelectionBox] = useState({ x: 240, y: 120, width: 60, height: 60 });
  const [predictionResults, setPredictionResults] = useState(null);
  const [gridData, setGridData] = useState([]);
  const [resetKey, setResetKey] = useState(0);
  const [backgroundPixels, setBackgroundPixels] = useState([]);
  const [activeNeuronIndices, setActiveNeuronIndices] = useState({
    input: -1,
    conv1: -1,
    conv2: -1,
    conv3: -1,
    fc: -1,
    output: -1
  });
  
  const mapCanvasRef = useRef(null);
  const gridCanvasRef = useRef(null);
  const vectorCanvasRef = useRef(null);
  const neuralNetworkCanvasRef = useRef(null);
  
  // Generate geographical background pixels
  useEffect(() => {
    // Generate a grid of geographic-looking pixels
    const canvasWidth = 800;
    const canvasHeight = 500;
    const pixelSize = 10; // Size of each "pixel" in our geo image
    
    const generateGeoPixels = () => {
      const pixels = [];
      
      // Create different geographical regions - water, land, mountains, etc.
      // Regional base colors
      const regions = [
        { type: 'water', baseColor: { r: 30, g: 60, b: 120 }, variance: 20 },
        { type: 'plains', baseColor: { r: 100, g: 160, b: 90 }, variance: 30 },
        { type: 'desert', baseColor: { r: 210, g: 180, b: 140 }, variance: 25 },
        { type: 'mountains', baseColor: { r: 120, g: 100, b: 90 }, variance: 40 },
        { type: 'forest', baseColor: { r: 40, g: 100, b: 50 }, variance: 35 }
      ];
      
      // Create large regional blobs
      const regionMap = Array(Math.ceil(canvasHeight / pixelSize))
        .fill()
        .map(() => Array(Math.ceil(canvasWidth / pixelSize)).fill(0));
      
      // Generate some random region centers
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
      
      // Create pixels based on regionMap with appropriate colors
      for (let y = 0; y < canvasHeight; y += pixelSize) {
        const row = [];
        for (let x = 0; x < canvasWidth; x += pixelSize) {
          const regionIdx = regionMap[Math.floor(y / pixelSize)][Math.floor(x / pixelSize)];
          const region = regions[regionIdx];
          
          // Add some noise/variance to make it look more natural
          const color = {
            r: Math.min(255, Math.max(0, region.baseColor.r + (Math.random() * region.variance * 2 - region.variance))),
            g: Math.min(255, Math.max(0, region.baseColor.g + (Math.random() * region.variance * 2 - region.variance))),
            b: Math.min(255, Math.max(0, region.baseColor.b + (Math.random() * region.variance * 2 - region.variance)))
          };
          
          // Add terrain features based on neighboring pixels
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
    };
    
    setBackgroundPixels(generateGeoPixels());
  }, [resetKey]);
  
  // Draw background pixels on canvas
  useEffect(() => {
    if (!mapCanvasRef.current || backgroundPixels.length === 0) return;
    
    const canvas = mapCanvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw all background pixels
    backgroundPixels.forEach(row => {
      row.forEach(pixel => {
        ctx.fillStyle = `rgb(${pixel.color.r}, ${pixel.color.g}, ${pixel.color.b})`;
        ctx.fillRect(pixel.x, pixel.y, pixel.width, pixel.height);
      });
    });
  }, [backgroundPixels]);
  
  // Update stages in sequence
  useEffect(() => {
    let timeouts = [];
    
    const runDemo = () => {
      // Reset everything
      setPredictionStage(0);
      setPredictionResults(null);
      setGridData([]);
      setActiveNeuronIndices({
        input: -1,
        conv1: -1,
        conv2: -1,
        conv3: -1,
        fc: -1,
        output: -1
      });
      
      // Generate random position
      const newX = 100 + Math.floor(Math.random() * 500);
      const newY = 50 + Math.floor(Math.random() * 300);
      setSelectionBox({ x: newX, y: newY, width: 60, height: 60 });
      
      // Schedule stages
      timeouts.push(setTimeout(() => setPredictionStage(1), 2000));
      timeouts.push(setTimeout(() => setPredictionStage(2), 4000));
      
      // Neural network processing with neuron activity
      timeouts.push(setTimeout(() => {
        setPredictionStage(3);
        
        // Animate data flowing through the neural network
        const layerNames = ['input', 'conv1', 'conv2', 'conv3', 'fc', 'output'];
        const layerSizes = [10, 6, 6, 6, 8, 3];
        
        layerNames.forEach((layer, layerIdx) => {
          // For each neuron in the layer
          for (let i = 0; i < layerSizes[layerIdx]; i++) {
            timeouts.push(setTimeout(() => {
              setActiveNeuronIndices(prev => ({
                ...prev,
                [layer]: i
              }));
              
              // If we're at the last neuron of the last layer, proceed to prediction
              if (layer === 'output' && i === layerSizes[layerIdx] - 1) {
                timeouts.push(setTimeout(() => {
                  setPredictionStage(4);
                  setPredictionResults([
                    { type: 'Gold', probability: 0.82, color: '#FFD700' },
                    { type: 'Copper', probability: 0.47, color: '#B87333' },
                    { type: 'Iron', probability: 0.23, color: '#a52a2a' }
                  ]);
                }, 500));
              }
            }, (layerIdx * 1500) + (i * 300)));
          }
        });
      }, 8000));
      
      // Reset and run the second cycle
      timeouts.push(setTimeout(() => {
        setPredictionStage(0);
        setPredictionResults(null);
        setActiveNeuronIndices({
          input: -1,
          conv1: -1,
          conv2: -1,
          conv3: -1,
          fc: -1,
          output: -1
        });
        
        const newX = 150 + Math.floor(Math.random() * 450);
        const newY = 75 + Math.floor(Math.random() * 250);
        setSelectionBox({ x: newX, y: newY, width: 60, height: 60 });
        
        timeouts.push(setTimeout(() => setPredictionStage(1), 2000));
        timeouts.push(setTimeout(() => setPredictionStage(2), 4000));
        
        // Second run through neural network
        timeouts.push(setTimeout(() => {
          setPredictionStage(3);
          
          // Animate data flowing through the neural network again
          const layerNames = ['input', 'conv1', 'conv2', 'conv3', 'fc', 'output'];
          const layerSizes = [10, 6, 6, 6, 8, 3];
          
          layerNames.forEach((layer, layerIdx) => {
            // For each neuron in the layer
            for (let i = 0; i < layerSizes[layerIdx]; i++) {
              timeouts.push(setTimeout(() => {
                setActiveNeuronIndices(prev => ({
                  ...prev,
                  [layer]: i
                }));
                
                // If we're at the last neuron of the last layer, proceed to prediction
                if (layer === 'output' && i === layerSizes[layerIdx] - 1) {
                  timeouts.push(setTimeout(() => {
                    setPredictionStage(4);
                    setPredictionResults([
                      { type: 'Gold', probability: 0.31, color: '#FFD700' },
                      { type: 'Copper', probability: 0.76, color: '#B87333' },
                      { type: 'Iron', probability: 0.59, color: '#a52a2a' }
                    ]);
                  }, 500));
                }
              }, (layerIdx * 1500) + (i * 300)));
            }
          });
        }, 7000));
        
        // Restart the demo
        timeouts.push(setTimeout(() => {
          setResetKey(prev => prev + 1);
        }, 20000));
      }, 18000));
    };
    
    runDemo();
    
    return () => {
      timeouts.forEach(t => clearTimeout(t));
    };
  }, [resetKey]);
  
  // Extract grid data from actual background pixels
  useEffect(() => {
    if (predictionStage === 1 && backgroundPixels.length > 0) {
      const cellSize = 10; // Match the background pixel size
      
      // Find the pixels that fall within our selection box
      const newGridData = [];
      
      backgroundPixels.forEach(row => {
        const rowData = [];
        
        row.forEach(pixel => {
          // Check if pixel is inside selection box
          if (
            pixel.x >= selectionBox.x && 
            pixel.x < selectionBox.x + selectionBox.width &&
            pixel.y >= selectionBox.y && 
            pixel.y < selectionBox.y + selectionBox.height
          ) {
            rowData.push({
              ...pixel,
              inSelection: true
            });
          }
        });
        
        if (rowData.length > 0) {
          newGridData.push(rowData);
        }
      });
      
      setGridData(newGridData);
    }
  }, [predictionStage, selectionBox, backgroundPixels]);
  
  // Draw selection on grid canvas
  useEffect(() => {
    if (!gridCanvasRef.current || predictionStage !== 1) return;
    
    const canvas = gridCanvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Highlight the selection area
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      selectionBox.x - 1, 
      selectionBox.y - 1, 
      selectionBox.width + 2, 
      selectionBox.height + 2
    );
    
    // Highlight each cell in selection with a border
    if (gridData.length > 0) {
      gridData.forEach(row => {
        row.forEach(cell => {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.lineWidth = 1;
          ctx.strokeRect(cell.x, cell.y, cell.width, cell.height);
        });
      });
    }
  }, [predictionStage, gridData, selectionBox]);
  
  // Draw matrix-to-vector animation
  useEffect(() => {
    if (!vectorCanvasRef.current || predictionStage < 2 || gridData.length === 0) return;
    
    const canvas = vectorCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    let frameCount = 0;
    let animationId;
    let startTime = Date.now();
    
    const drawFrame = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Animation progress (0 to 1) over 5 seconds (slower animation)
      const elapsed = Date.now() - startTime;
      const transitionProgress = Math.min(1, elapsed / 5000);
      
      // Calculate vector cells size and spacing
      const vectorCellHeight = 6;
      const vectorCellWidth = canvas.width - 20;
      const vectorCellSpacing = 2;
      
      // Flatten grid data for easier processing
      const flattenedCells = [];
      gridData.forEach(row => {
        row.forEach(cell => {
          flattenedCells.push(cell);
        });
      });
      
      // Sort by y then x position to ensure row-by-row unwrapping
      flattenedCells.sort((a, b) => {
        if (a.y === b.y) return a.x - b.x;
        return a.y - b.y;
      });
      
      // Calculate total cells
      const totalCells = flattenedCells.length;
      
      // Row-by-row unwrapping animation
      flattenedCells.forEach((cell, cellIndex) => {
        // Current cell's progress in the animation (0 to 1)
        const cellOrderProgress = cellIndex / totalCells;
        const cellAnimationProgress = Math.max(0, Math.min(1, 
          (transitionProgress - cellOrderProgress * 0.5) / 0.5
        ));
        
        if (cellAnimationProgress <= 0) return;
        
        // Calculate vector position
        const vectorY = 10 + cellIndex * (vectorCellHeight + vectorCellSpacing);
        
        // Start position (from grid)
        const startX = cell.x;
        const startY = cell.y;
        const startWidth = cell.width;
        const startHeight = cell.height;
        
        // End position (in vector)
        const endX = 10;
        const endY = vectorY;
        const endWidth = vectorCellWidth;
        const endHeight = vectorCellHeight;
        
        // Interpolate position
        const currentX = startX + (endX - startX) * cellAnimationProgress;
        const currentY = startY + (endY - startY) * cellAnimationProgress;
        const currentWidth = startWidth + (endWidth - startWidth) * cellAnimationProgress;
        const currentHeight = startHeight + (endHeight - startHeight) * cellAnimationProgress;
        
        // Draw cell with its color
        ctx.fillStyle = `rgba(${cell.color.r}, ${cell.color.g}, ${cell.color.b}, ${0.5 + cellAnimationProgress * 0.5})`;
        ctx.fillRect(currentX, currentY, currentWidth, currentHeight);
        
        // Add grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.strokeRect(currentX, currentY, currentWidth, currentHeight);
      });
      
      // Add label for feature vector
      if (transitionProgress > 0.95) {
        ctx.fillStyle = 'rgba(34, 211, 238, 0.9)';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Feature Vector (${totalCells} elements)`, canvas.width / 2, canvas.height - 10);
      }
      
      if (predictionStage === 2 && transitionProgress < 1) {
        animationId = requestAnimationFrame(drawFrame);
      }
    };
    
    animationId = requestAnimationFrame(drawFrame);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [predictionStage, gridData]);
  
  // Draw neural network with data flow
  useEffect(() => {
    if (!neuralNetworkCanvasRef.current || predictionStage < 3) return;
    
    const canvas = neuralNetworkCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    let animationFrame;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Define layers
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
        
        // Draw connections from all neurons in previous layer to all neurons in this layer
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
          
          // Calculate neuron size (larger if active)
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
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [predictionStage, activeNeuronIndices]);
  
  return (
    <div className="relative w-full max-w-4xl bg-gray-900 rounded-lg overflow-hidden shadow-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Map className="text-cyan-400 w-5 h-5" />
          <h3 className="text-lg font-bold text-white">GeoMineral AI Prediction</h3>
        </div>
        <div className="text-sm font-medium text-white bg-gray-800 px-3 py-1 rounded-full">
          Deep Learning for Mineral Discovery
        </div>
      </div>
      
      {/* Main visualization area */}
      <div className="relative bg-gray-800 rounded-lg overflow-hidden" style={{ height: "360px" }}>
        {/* Geospatial background with pixels */}
        <div className="absolute inset-0 w-full h-full transition-all duration-500"
          style={{ 
            opacity: predictionStage > 1 ? 0.5 : 1,
          }}
        >
          {/* Canvas for background pixels */}
          <canvas 
            ref={mapCanvasRef} 
            width={800} 
            height={500} 
            className="absolute inset-0 w-full h-full"
          />
          
          {/* Canvas for grid visualization */}
          <canvas 
            ref={gridCanvasRef} 
            width={800} 
            height={500} 
            className="absolute inset-0 w-full h-full pointer-events-none"
          />
          
          {/* Selection box that follows animation stages */}
          {predictionStage <= 1 && (
            <div 
              className={`absolute border-2 border-cyan-400 ${predictionStage === 1 ? 'border-dashed' : ''}`}
              style={{
                left: selectionBox.x,
                top: selectionBox.y,
                width: selectionBox.width,
                height: selectionBox.height,
                boxShadow: predictionStage === 1 ? '0 0 10px rgba(34, 211, 238, 0.5)' : 'none',
                transition: 'all 0.5s ease-in-out',
                animation: predictionStage === 1 ? 'pulse 1.5s infinite alternate' : 'none',
              }}
            />
          )}
        </div>
        
        {/* Data processing visualization */}
        {predictionStage >= 2 && (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl h-full flex">
              {/* Vector representation */}
              <div 
                className="w-1/5 bg-gray-900 rounded-l-lg p-2 transition-all duration-500"
                style={{
                  transform: predictionStage >= 2 ? 'translateX(0)' : 'translateX(-100%)',
                  opacity: predictionStage >= 2 ? 1 : 0
                }}
              >
                <div className="text-xs text-center mb-2 text-cyan-400">Feature Vector</div>
                <canvas 
                  ref={vectorCanvasRef}
                  width={100}
                  height={400}
                  className="w-full h-full"
                />
              </div>
              
              {/* CNN visualization with data flow */}
              <div 
                className="w-3/5 bg-gray-900 p-4 flex flex-col justify-center items-center transition-all duration-500"
                style={{
                  opacity: predictionStage >= 3 ? 1 : 0,
                  transform: predictionStage >= 3 ? 'scale(1)' : 'scale(0.95)'
                }}
              >
                <div className="text-xs text-center mb-2 text-cyan-400">Neural Network Data Flow</div>
                <canvas
                  ref={neuralNetworkCanvasRef}
                  width={600}
                  height={240}
                  className="w-full h-full"
                />
                <div className="text-xs mt-2 text-gray-400 flex items-center justify-center gap-2">
                  <Cpu className="w-3 h-3 text-cyan-400" />
                  <span>CNN for Geospatial Analysis</span>
                </div>
              </div>
              
              {/* Prediction results */}
              <div 
                className="w-1/5 bg-gray-900 rounded-r-lg p-4 transition-all duration-500"
                style={{
                  transform: predictionStage >= 4 ? 'translateX(0)' : 'translateX(100%)',
                  opacity: predictionStage >= 4 ? 1 : 0
                }}
              >
                <div className="text-xs text-center mb-2 text-cyan-400">Prediction Results</div>
                
                {predictionResults && (
                  <div className="space-y-3 mt-4">
                    {predictionResults.map((mineral, i) => (
                      <div key={i} className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: mineral.color }}
                          />
                          <span className="text-sm text-white">{mineral.type}</span>
                        </div>
                        <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-1000"
                            style={{ 
                              width: `${mineral.probability * 100}%`,
                              backgroundColor: mineral.color,
                              opacity: 0.8
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium text-right mt-1 text-gray-300">
                          {Math.round(mineral.probability * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Stage indicators */}
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex items-center gap-2">
          {['Select Region', 'Extract Data', 'Vectorize', 'Process', 'Predict'].map((label, i) => (
            <div 
              key={i}
              className={`px-3 py-1 rounded-full text-xs ${predictionStage === i ? 'bg-cyan-800 text-white' : 'bg-gray-700 text-gray-400'}`}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-4 text-xs text-gray-400 flex justify-between items-center">
        <div>Geospatial Analysis • Deep Learning</div>
        <div>Convolutional Neural Network Architecture</div>
      </div>
      
      <style jsx>{`
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
      `}</style>
    </div>
  );
};

export default GeoMineralImproved;