document.addEventListener('DOMContentLoaded', function() {
  // Get the container element
  const container = document.querySelector('#laundry-dashboard-viz');
  if (!container) return;

  // Set up canvas layers for better performance
  const layers = {
    background: document.createElement('canvas'),  // Static elements and grid
    connections: document.createElement('canvas'),  // Data flow paths
    particles: document.createElement('canvas'),    // Moving data particles
    dashboard: document.createElement('canvas')     // Dashboard elements
  };
  
  // Set canvas properties
  Object.values(layers).forEach(canvas => {
    canvas.width = container.clientWidth || 800;
    canvas.height = container.clientHeight || 300;
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
  });
  
  // Configure container
  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  container.style.backgroundColor = 'transparent';
  container.style.borderRadius = '0.5rem';
  
  // Append canvases in correct order
  Object.values(layers).forEach(canvas => {
    container.appendChild(canvas);
  });
  
  // Get contexts
  const contexts = {};
  Object.entries(layers).forEach(([name, canvas]) => {
    contexts[name] = canvas.getContext('2d');
  });
  
  // Responsive handling with debounce
  let resizeTimeout;
  function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      
      Object.values(layers).forEach(canvas => {
        canvas.width = width;
        canvas.height = height;
      });
      
      calculatePositions();
      drawStaticElements();
    }, 200);
  }
  
  window.addEventListener('resize', handleResize);
  
  // System state (simplified)
  let systemState = {
    processingLoad: 0.5,
    dataFlowRate: 0.7,
    systemStatus: 'operational'
  };
  
  // Color palette (simplified)
  const colors = {
    payroll: {
      main: '#ff9d00',
      light: '#ffb84d'
    },
    analytics: {
      main: '#0074e0',
      light: '#3498ff'
    },
    revenue: {
      main: '#00c49a',
      light: '#4adfc1'
    },
    appointments: {
      main: '#845ef7',
      light: '#a78bfa'
    },
    background: {
      grid: 'rgba(90, 105, 150, 0.07)',
      gridBright: 'rgba(90, 105, 150, 0.12)'
    },
    warehouse: {
      main: '#4d84ff',
      pulse: '#8cbaff'
    },
    dashboard: {
      panel: 'rgba(17, 25, 40, 0.7)',
      border: 'rgba(74, 85, 104, 0.3)'
    },
    text: {
      primary: 'rgba(247, 250, 252, 0.92)',
      secondary: 'rgba(203, 213, 224, 0.8)'
    }
  };
  
  // Data source configuration (simplified)
  const dataSources = [
    { 
      id: 'payroll',
      name: 'Payroll API', 
      colors: colors.payroll,
      symbol: '💰',
      position: 'top-left',
      flowRate: 0.7
    },
    { 
      id: 'analytics',
      name: 'Web Analytics', 
      colors: colors.analytics, 
      symbol: '📊',
      position: 'top-right',
      flowRate: 0.9
    },
    { 
      id: 'revenue',
      name: 'Revenue API', 
      colors: colors.revenue, 
      symbol: '💵',
      position: 'bottom-left',
      flowRate: 0.6
    },
    { 
      id: 'appointments',
      name: 'Appointments', 
      colors: colors.appointments, 
      symbol: '📅',
      position: 'bottom-right',
      flowRate: 0.5
    }
  ];
  
  // Position variables
  let warehousePos = { x: 0, y: 0 };
  let dashboardPos = { x: 0, y: 0 };
  let sourcePositions = [];
  let connectionPaths = [];
  
  // Calculate positions of elements
  function calculatePositions() {
    const width = layers.background.width;
    const height = layers.background.height;
    
    // Warehouse position (middle-left)
    warehousePos = {
      x: width * 0.28,
      y: height * 0.5
    };
    
    // Dashboard position (right side)
    dashboardPos = {
      x: width * 0.78,
      y: height * 0.5
    };
    
    // Data source positions
    sourcePositions = dataSources.map(source => {
      let pos = { x: 0, y: 0 };
      
      switch(source.position) {
        case 'top-left':
          pos = { x: width * 0.08, y: height * 0.25 };
          break;
        case 'top-right':
          pos = { x: width * 0.22, y: height * 0.25 };
          break;
        case 'bottom-left':
          pos = { x: width * 0.08, y: height * 0.75 };
          break;
        case 'bottom-right':
          pos = { x: width * 0.22, y: height * 0.75 };
          break;
      }
      
      return {
        ...source,
        x: pos.x,
        y: pos.y,
        radius: Math.min(width, height) * 0.035
      };
    });
    
    // Simple connection path from warehouse to dashboard
    connectionPaths = {
      warehouseToDashboard: [
        {
          x: warehousePos.x + (dashboardPos.x - warehousePos.x) * 0.33,
          y: warehousePos.y - 20
        },
        {
          x: warehousePos.x + (dashboardPos.x - warehousePos.x) * 0.66,
          y: dashboardPos.y + 20
        }
      ]
    };
  }
  
  // Draw static elements (grid, connections, source and destination nodes)
  function drawStaticElements() {
    // Clear all canvases
    Object.values(contexts).forEach(ctx => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    });
    
    // 1. Draw background grid
    drawBackgroundGrid();
    
    // 2. Draw connection paths
    drawConnectionPaths();
    
    // 3. Draw data sources
    sourcePositions.forEach(source => {
      drawDataSource(contexts.background, source);
    });
    
    // 4. Draw warehouse
    drawWarehouse(contexts.background, warehousePos);
    
    // 5. Draw dashboard base
    drawDashboardBase(contexts.dashboard, dashboardPos);
    
    // 6. Draw system status
    drawSystemStatus();
  }
  
  // Draw background with subtle grid pattern
  function drawBackgroundGrid() {
    const ctx = contexts.background;
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Draw grid lines
    ctx.strokeStyle = colors.background.grid;
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let x = 0; x <= width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y <= height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Draw accent lines (less frequent)
    ctx.strokeStyle = colors.background.gridBright;
    
    // Vertical accent lines
    for (let x = 0; x <= width; x += 200) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Horizontal accent lines
    for (let y = 0; y <= height; y += 200) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }
  
  // Draw connection paths (between nodes)
  function drawConnectionPaths() {
    const ctx = contexts.connections;
    
    // Draw paths from sources to warehouse
    sourcePositions.forEach(source => {
      // Draw curved path
      const gradient = ctx.createLinearGradient(source.x, source.y, warehousePos.x, warehousePos.y);
      gradient.addColorStop(0, hexToRgba(source.colors.main, 0.15));
      gradient.addColorStop(1, hexToRgba(colors.warehouse.main, 0.15));
      
      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      
      // Control points for curve
      const dx = warehousePos.x - source.x;
      const dy = warehousePos.y - source.y;
      const cp1x = source.x + dx * 0.3;
      const cp1y = source.y + dy * 0.1;
      const cp2x = source.x + dx * 0.6;
      const cp2y = source.y + dy * 0.9;
      
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, warehousePos.x, warehousePos.y);
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
    
    // Draw path from warehouse to dashboard
    const whDbPath = connectionPaths.warehouseToDashboard;
    if (whDbPath) {
      const gradient = ctx.createLinearGradient(warehousePos.x, warehousePos.y, dashboardPos.x, dashboardPos.y);
      gradient.addColorStop(0, hexToRgba(colors.warehouse.main, 0.2));
      gradient.addColorStop(1, hexToRgba('#ffffff', 0.15));
      
      ctx.beginPath();
      ctx.moveTo(warehousePos.x, warehousePos.y);
      
      ctx.bezierCurveTo(
        whDbPath[0].x, whDbPath[0].y,
        whDbPath[1].x, whDbPath[1].y,
        dashboardPos.x, dashboardPos.y
      );
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }
  
  // Draw data source node
  function drawDataSource(ctx, source) {
    const x = source.x;
    const y = source.y;
    const radius = source.radius;
    
    // Outer ring
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(source.colors.main, 0.2);
    ctx.fill();
    
    // Ring border
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = source.colors.main;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Inner circle
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(source.colors.light, 0.3);
    ctx.fill();
    
    // Source icon
    ctx.font = `${radius * 0.9}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText(source.symbol, x, y);
    
    // Source label
    ctx.font = '10px Arial, sans-serif';
    ctx.fillStyle = colors.text.primary;
    ctx.fillText(source.name, x, y + radius * 1.5);
  }
  
  // Draw data warehouse
  function drawWarehouse(ctx, position) {
    const x = position.x;
    const y = position.y;
    const radius = Math.min(ctx.canvas.width, ctx.canvas.height) * 0.06;
    
    // Main circle
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(colors.warehouse.main, 0.2);
    ctx.fill();
    
    // Main circle border
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = colors.warehouse.main;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Inner ring
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.75, 0, Math.PI * 2);
    ctx.strokeStyle = hexToRgba(colors.warehouse.main, 0.6);
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Database icon
    drawDatabaseIcon(ctx, x, y, radius * 0.6);
    
    // Label
    ctx.font = '12px Arial, sans-serif';
    ctx.fillStyle = colors.text.primary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText("Data Warehouse", x, y + radius * 1.4);
  }
  
  // Draw dashboard base
  function drawDashboardBase(ctx, position) {
    const x = position.x;
    const y = position.y;
    const width = ctx.canvas.width * 0.35;
    const height = ctx.canvas.height * 0.75;
    
    // Dashboard background
    roundRect(
      ctx,
      x - width/2,
      y - height/2,
      width,
      height,
      8,
      true,
      false,
      'rgba(26, 32, 44, 0.8)'
    );
    
    // Dashboard border
    roundRect(
      ctx,
      x - width/2,
      y - height/2,
      width,
      height,
      8,
      false,
      true,
      null,
      'rgba(74, 85, 104, 0.3)'
    );
    
    // Header
    const headerHeight = 30;
    roundRect(
      ctx,
      x - width/2,
      y - height/2,
      width,
      headerHeight,
      { tl: 8, tr: 8, bl: 0, br: 0 },
      true,
      false,
      'rgba(45, 55, 72, 0.95)'
    );
    
    // Header text
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.fillStyle = colors.text.primary;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Business Intelligence Dashboard', x - width/2 + 15, y - height/2 + headerHeight/2);
    
    // Add header buttons
    const buttonY = y - height/2 + headerHeight/2;
    const buttonRadius = 4;
    const buttonSpacing = 12;
    let buttonX = x + width/2 - 15;
    
    // Close button
    ctx.beginPath();
    ctx.arc(buttonX, buttonY, buttonRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#FC8181';
    ctx.fill();
    
    buttonX -= buttonSpacing;
    
    // Minimize button
    ctx.beginPath();
    ctx.arc(buttonX, buttonY, buttonRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#F6AD55';
    ctx.fill();
    
    buttonX -= buttonSpacing;
    
    // Expand button
    ctx.beginPath();
    ctx.arc(buttonX, buttonY, buttonRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#68D391';
    ctx.fill();
    
    // Draw panels for each chart
    const panelWidth = width * 0.44;
    const panelHeight = (height - headerHeight - 45) / 2;
    const panelSpacing = 15;
    
    // Calculate positions for 4 panels
    const panelPositions = [
      // Top left
      {
        x: x - width/2 + panelWidth/2 + panelSpacing,
        y: y - height/2 + headerHeight + panelHeight/2 + panelSpacing,
        width: panelWidth,
        height: panelHeight
      },
      // Top right
      {
        x: x + width/2 - panelWidth/2 - panelSpacing,
        y: y - height/2 + headerHeight + panelHeight/2 + panelSpacing,
        width: panelWidth,
        height: panelHeight
      },
      // Bottom left
      {
        x: x - width/2 + panelWidth/2 + panelSpacing,
        y: y + height/2 - panelHeight/2 - panelSpacing,
        width: panelWidth,
        height: panelHeight
      },
      // Bottom right
      {
        x: x + width/2 - panelWidth/2 - panelSpacing,
        y: y + height/2 - panelHeight/2 - panelSpacing,
        width: panelWidth,
        height: panelHeight
      }
    ];
    
    // Draw each panel
    panelPositions.forEach((panel, index) => {
      drawDashboardPanel(ctx, panel, index);
    });
    
    return panelPositions;
  }
  
  // Draw individual dashboard panel
  function drawDashboardPanel(ctx, panel, index) {
    // Panel background
    roundRect(
      ctx,
      panel.x - panel.width/2,
      panel.y - panel.height/2,
      panel.width,
      panel.height,
      6,
      true,
      false,
      colors.dashboard.panel
    );
    
    // Panel border
    roundRect(
      ctx,
      panel.x - panel.width/2,
      panel.y - panel.height/2,
      panel.width,
      panel.height,
      6,
      false,
      true,
      null,
      colors.dashboard.border
    );
    
    // Panel header
    const headerHeight = 24;
    roundRect(
      ctx,
      panel.x - panel.width/2,
      panel.y - panel.height/2,
      panel.width,
      headerHeight,
      { tl: 6, tr: 6, bl: 0, br: 0 },
      true,
      false,
      'rgba(45, 55, 72, 0.8)'
    );
    
    // Panel title based on index
    let title = "";
    let chartColor = "";
    
    switch(index) {
      case 0:
        title = "Revenue Trends";
        chartColor = colors.revenue.main;
        drawSimpleLineChart(ctx, panel, chartColor);
        break;
      case 1:
        title = "Web Traffic Analysis";
        chartColor = colors.analytics.main;
        drawSimpleBarChart(ctx, panel, chartColor);
        break;
      case 2:
        title = "Appointment Distribution";
        chartColor = colors.appointments.main;
        drawSimplePieChart(ctx, panel, chartColor);
        break;
      case 3:
        title = "Payroll Allocation";
        chartColor = colors.payroll.main;
        drawSimpleDoughnutChart(ctx, panel, chartColor);
        break;
    }
    
    // Panel title
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.fillStyle = colors.text.primary;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, panel.x - panel.width/2 + 10, panel.y - panel.height/2 + headerHeight/2);
    
    // Add color indicator
    ctx.beginPath();
    ctx.arc(panel.x + panel.width/2 - 12, panel.y - panel.height/2 + headerHeight/2, 4, 0, Math.PI * 2);
    ctx.fillStyle = chartColor;
    ctx.fill();
  }
  
  // Simple chart drawing functions
  function drawSimpleLineChart(ctx, panel, color) {
    const chartX = panel.x - panel.width/2 + 15;
    const chartY = panel.y - panel.height/2 + 35;
    const chartWidth = panel.width - 30;
    const chartHeight = panel.height - 50;
    
    // Draw axes
    ctx.strokeStyle = colors.dashboard.border;
    ctx.lineWidth = 1;
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(chartX, chartY + chartHeight);
    ctx.lineTo(chartX + chartWidth, chartY + chartHeight);
    ctx.stroke();
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(chartX, chartY);
    ctx.lineTo(chartX, chartY + chartHeight);
    ctx.stroke();
    
    // Generate random points for line
    ctx.beginPath();
    const points = 8;
    
    for (let i = 0; i < points; i++) {
      const x = chartX + (i / (points - 1)) * chartWidth;
      // Generate a smooth random value
      const val = Math.sin(i * 0.5 + Date.now() * 0.001) * 0.25 + 0.5;
      const y = chartY + chartHeight - val * chartHeight;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    // Style and stroke line
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Fill area below line
    ctx.lineTo(chartX + chartWidth, chartY + chartHeight);
    ctx.lineTo(chartX, chartY + chartHeight);
    ctx.closePath();
    
    const fillGradient = ctx.createLinearGradient(chartX, chartY, chartX, chartY + chartHeight);
    fillGradient.addColorStop(0, hexToRgba(color, 0.2));
    fillGradient.addColorStop(1, hexToRgba(color, 0.01));
    
    ctx.fillStyle = fillGradient;
    ctx.fill();
  }
  
  function drawSimpleBarChart(ctx, panel, color) {
    const chartX = panel.x - panel.width/2 + 15;
    const chartY = panel.y - panel.height/2 + 35;
    const chartWidth = panel.width - 30;
    const chartHeight = panel.height - 50;
    
    // Draw baseline
    ctx.beginPath();
    ctx.moveTo(chartX, chartY + chartHeight);
    ctx.lineTo(chartX + chartWidth, chartY + chartHeight);
    ctx.strokeStyle = colors.dashboard.border;
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw bars
    const barCount = 7;
    const barWidth = chartWidth / barCount * 0.6;
    const spacing = chartWidth / barCount * 0.4;
    
    for (let i = 0; i < barCount; i++) {
      // Generate a random, but smoothly changing height
      const val = Math.sin(i * 0.8 + Date.now() * 0.001) * 0.3 + 0.6;
      const barHeight = val * chartHeight;
      const barX = chartX + i * (barWidth + spacing);
      const barY = chartY + chartHeight - barHeight;
      
      // Create gradient for bar
      const gradient = ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, hexToRgba(color, 0.4));
      
      // Draw bar
      roundRect(
        ctx, 
        barX, 
        barY, 
        barWidth, 
        barHeight, 
        { tl: 3, tr: 3, bl: 0, br: 0 },
        true,
        false,
        gradient
      );
    }
  }
  
  function drawSimplePieChart(ctx, panel, color) {
    const centerX = panel.x;
    const centerY = panel.y + 10;
    const radius = Math.min(panel.width, panel.height) * 0.35;
    
    // Generate 4-5 segments with random but consistent sizes
    const segments = [];
    const segmentCount = 4;
    let total = 0;
    
    for (let i = 0; i < segmentCount; i++) {
      // Use sine wave to get smooth animation
      const val = Math.sin(i * 1.5 + Date.now() * 0.0003) * 0.2 + 0.8;
      segments.push(val);
      total += val;
    }
    
    // Normalize segments
    for (let i = 0; i < segments.length; i++) {
      segments[i] = segments[i] / total;
    }
    
    // Draw segments
    let startAngle = -Math.PI / 2;
    for (let i = 0; i < segments.length; i++) {
      const sliceAngle = Math.PI * 2 * segments[i];
      const endAngle = startAngle + sliceAngle;
      
      // Vary colors slightly for each segment
      const segmentColor = i % 2 === 0 ? color : lightenColor(color, 15);
      
      // Draw segment
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = hexToRgba(segmentColor, 0.8);
      ctx.fill();
      
      // Segment border
      ctx.strokeStyle = hexToRgba('#ffffff', 0.1);
      ctx.lineWidth = 1;
      ctx.stroke();
      
      startAngle = endAngle;
    }
  }
  
  function drawSimpleDoughnutChart(ctx, panel, color) {
    const centerX = panel.x;
    const centerY = panel.y + 10;
    const outerRadius = Math.min(panel.width, panel.height) * 0.35;
    const innerRadius = outerRadius * 0.5;
    
    // Generate segments
    const segments = [];
    const segmentCount = 5;
    let total = 0;
    
    for (let i = 0; i < segmentCount; i++) {
      // Use cosine wave to get smooth animation (different from pie chart)
      const val = Math.cos(i * 1.2 + Date.now() * 0.0004) * 0.2 + 0.8;
      segments.push(val);
      total += val;
    }
    
    // Normalize segments
    for (let i = 0; i < segments.length; i++) {
      segments[i] = segments[i] / total;
    }
    
    // Draw segments
    let startAngle = -Math.PI / 2;
    for (let i = 0; i < segments.length; i++) {
      const sliceAngle = Math.PI * 2 * segments[i];
      const endAngle = startAngle + sliceAngle;
      
      // Different color for each segment
      let segmentColor;
      switch(i % 5) {
        case 0: segmentColor = color; break;
        case 1: segmentColor = lightenColor(color, 10); break;
        case 2: segmentColor = lightenColor(color, 20); break;
        case 3: segmentColor = lightenColor(color, 30); break;
        case 4: segmentColor = lightenColor(color, 40); break;
      }
      
      // Draw segment
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
      ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = hexToRgba(segmentColor, 0.8);
      ctx.fill();
      
      // Segment border
      ctx.strokeStyle = hexToRgba('#ffffff', 0.1);
      ctx.lineWidth = 1;
      ctx.stroke();
      
      startAngle = endAngle;
    }
    
    // Draw inner circle for donut hole
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    ctx.fillStyle = colors.dashboard.panel;
    ctx.fill();
  }
  
  // Draw database icon
  function drawDatabaseIcon(ctx, x, y, size) {
    const ellipseHeight = size * 0.2;
    
    // Top ellipse
    ctx.beginPath();
    ctx.ellipse(x, y - size/2 + ellipseHeight, size/2, ellipseHeight, 0, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(colors.warehouse.pulse, 0.5);
    ctx.fill();
    ctx.strokeStyle = colors.warehouse.main;
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Bottom ellipse
    ctx.beginPath();
    ctx.ellipse(x, y + size/2 - ellipseHeight, size/2, ellipseHeight, 0, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(colors.warehouse.pulse, 0.3);
    ctx.fill();
    ctx.stroke();
    
    // Side lines
    ctx.beginPath();
    ctx.moveTo(x - size/2, y - size/2 + ellipseHeight);
    ctx.lineTo(x - size/2, y + size/2 - ellipseHeight);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x + size/2, y - size/2 + ellipseHeight);
    ctx.lineTo(x + size/2, y + size/2 - ellipseHeight);
    ctx.stroke();
    
    // Middle division line
    ctx.beginPath();
    ctx.ellipse(x, y, size/2, ellipseHeight, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  // Draw system status
  function drawSystemStatus() {
    const ctx = contexts.background;
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Status indicators at bottom
    const statusX = 10;
    const statusY = height - 25;
    
    // System status indicator
    ctx.font = '10px Arial, sans-serif';
    ctx.fillStyle = colors.text.secondary;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    
    let statusColor = '#68D391'; // Green for operational
    
    // Status dot
    ctx.beginPath();
    ctx.arc(statusX, statusY, 4, 0, Math.PI * 2);
    ctx.fillStyle = statusColor;
    ctx.fill();
    
    // Status text
    ctx.fillText(`System: ${systemState.systemStatus}`, statusX + 10, statusY);
    
    // Data flow rate
    const flowX = statusX + 120;
    ctx.fillText(`Flow: ${Math.round(systemState.dataFlowRate * 100)}%`, flowX, statusY);
    
    // Processing load
    const loadX = flowX + 80;
    ctx.fillText(`Load: ${Math.round(systemState.processingLoad * 100)}%`, loadX, statusY);
    
    // Time
    const timeX = width - 10;
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    
    ctx.textAlign = 'right';
    ctx.fillText(timeString, timeX, statusY);
  }
  
  // Particle system
  class Particle {
    constructor(startX, startY, targetX, targetY, options = {}) {
      this.x = startX;
      this.y = startY;
      this.startX = startX;
      this.startY = startY;
      this.targetX = targetX;
      this.targetY = targetY;
      this.size = options.size || (Math.random() * 2 + 1);
      this.color = options.color || '#ffffff';
      this.opacity = options.opacity || (Math.random() * 0.5 + 0.5);
      this.speed = options.speed || (Math.random() * 0.01 + 0.005);
      this.progress = 0;
      this.dead = false;
      
      // Control points for curved path
      this.controlPoints = options.controlPoints || [];
    }
    
    update(deltaTime) {
      // Update progress
      this.progress += this.speed * deltaTime;
      if (this.progress >= 1) {
        this.progress = 1;
        this.dead = true;
      }
      
      // Calculate position on curve
      this.calculatePosition();
    }
    
    calculatePosition() {
      if (this.controlPoints.length === 0) {
        // Linear path
        const t = this.progress;
        this.x = this.startX + (this.targetX - this.startX) * t;
        this.y = this.startY + (this.targetY - this.startY) * t;
        return;
      }
      
      // Bezier curve with control points
      if (this.controlPoints.length >= 2) {
        const t = this.progress;
        const mt = 1 - t;
        
        const cp1 = this.controlPoints[0];
        const cp2 = this.controlPoints[1];
        
        this.x = mt*mt*mt * this.startX + 
                3*mt*mt*t * cp1.x + 
                3*mt*t*t * cp2.x + 
                t*t*t * this.targetX;
                
        this.y = mt*mt*mt * this.startY + 
                3*mt*mt*t * cp1.y + 
                3*mt*t*t * cp2.y + 
                t*t*t * this.targetY;
      }
    }
    
    draw(ctx) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(this.color, this.opacity);
      ctx.fill();
    }
  }
  
  // Particle systems
  const particleSystems = {
    sourcesToWarehouse: [],
    warehouseToDashboard: []
  };
  
  // Initialize particle systems
  function initParticleSystems() {
    // Create particles from data sources to warehouse
    sourcePositions.forEach(source => {
      particleSystems.sourcesToWarehouse.push({
        sourceId: source.id,
        particles: [],
        maxParticles: 30,
        flowRate: source.flowRate,
        nextEmit: 0
      });
    });
    
    // Create warehouse to dashboard particle system
    particleSystems.warehouseToDashboard = {
      particles: [],
      maxParticles: 40,
      flowRate: 0.75,
      nextEmit: 0
    };
  }
  
  // Emit particles from sources to warehouse
  function emitSourceParticles(deltaTime) {
    sourcePositions.forEach((source, index) => {
      const system = particleSystems.sourcesToWarehouse[index];
      if (!system) return;
      
      // Update emission timer
      system.nextEmit -= deltaTime;
      
      // Emit particles
      if (system.nextEmit <= 0) {
        // Reset timer
        system.nextEmit = 100 + Math.random() * 200;
        
        // Create particles
        if (system.particles.length < system.maxParticles) {
          // Control points for curve
          const dx = warehousePos.x - source.x;
          const dy = warehousePos.y - source.y;
          
          const cp1 = {
            x: source.x + dx * 0.3,
            y: source.y + dy * 0.1
          };
          
          const cp2 = {
            x: source.x + dx * 0.6,
            y: source.y + dy * 0.9
          };
          
          // Create particle
          const particle = new Particle(
            source.x,
            source.y,
            warehousePos.x,
            warehousePos.y,
            {
              color: source.colors.main,
              controlPoints: [cp1, cp2],
              speed: 0.003 + Math.random() * 0.002
            }
          );
          
          system.particles.push(particle);
        }
      }
    });
  }
  
  // Emit particles from warehouse to dashboard
  function emitWarehouseParticles(deltaTime) {
    const system = particleSystems.warehouseToDashboard;
    
    // Update emission timer
    system.nextEmit -= deltaTime;
    
    // Emit particles
    if (system.nextEmit <= 0) {
      // Reset timer
      system.nextEmit = 100 + Math.random() * 150;
      
      // Create particles
      if (system.particles.length < system.maxParticles) {
        // Control points
        const controlPoints = connectionPaths.warehouseToDashboard || [];
        
        // Choose random color
        const colorIndex = Math.floor(Math.random() * 4);
        let color;
        
        switch(colorIndex) {
          case 0: color = colors.revenue.main; break;
          case 1: color = colors.analytics.main; break;
          case 2: color = colors.appointments.main; break;
          case 3: color = colors.payroll.main; break;
        }
        
        // Create particle
        const particle = new Particle(
          warehousePos.x,
          warehousePos.y,
          dashboardPos.x,
          dashboardPos.y,
          {
            color: color,
            controlPoints: controlPoints,
            speed: 0.003 + Math.random() * 0.002
          }
        );
        
        system.particles.push(particle);
      }
    }
  }
  
  // Update particle systems
  function updateParticles(deltaTime) {
    // Source to warehouse particles
    particleSystems.sourcesToWarehouse.forEach(system => {
      for (let i = system.particles.length - 1; i >= 0; i--) {
        const particle = system.particles[i];
        
        particle.update(deltaTime);
        
        if (particle.dead) {
          system.particles.splice(i, 1);
        }
      }
    });
    
    // Warehouse to dashboard particles
    const whToDashboard = particleSystems.warehouseToDashboard;
    for (let i = whToDashboard.particles.length - 1; i >= 0; i--) {
      const particle = whToDashboard.particles[i];
      
      particle.update(deltaTime);
      
      if (particle.dead) {
        whToDashboard.particles.splice(i, 1);
      }
    }
    
    // Emit new particles
    emitSourceParticles(deltaTime);
    emitWarehouseParticles(deltaTime);
    
    // Randomly vary system state
    if (Math.random() > 0.99) {
      systemState.dataFlowRate = 0.4 + Math.random() * 0.6;
      systemState.processingLoad = 0.3 + Math.random() * 0.7;
    }
  }
  
  // Draw all particles
  function drawParticles() {
    const ctx = contexts.particles;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Draw source to warehouse particles
    particleSystems.sourcesToWarehouse.forEach(system => {
      system.particles.forEach(particle => {
        particle.draw(ctx);
      });
    });
    
    // Draw warehouse to dashboard particles
    particleSystems.warehouseToDashboard.particles.forEach(particle => {
      particle.draw(ctx);
    });
  }
  
  // Helper functions
  
  // Draw rounded rectangle
  function roundRect(ctx, x, y, width, height, radius, fill, stroke, fillStyle, strokeStyle) {
    if (typeof radius === 'number') {
      radius = { tl: radius, tr: radius, br: radius, bl: radius };
    } else {
      radius = { ...{ tl: 0, tr: 0, br: 0, bl: 0 }, ...radius };
    }
    
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    
    if (fill) {
      ctx.fillStyle = fillStyle || ctx.fillStyle;
      ctx.fill();
    }
    
    if (stroke) {
      ctx.strokeStyle = strokeStyle || ctx.strokeStyle;
      ctx.stroke();
    }
  }
  
  // Convert hex color to rgba
  function hexToRgba(hex, alpha) {
    // Handle shorthand hex (e.g. #FFF)
    if (hex.length === 4) {
      hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    }
    
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  
  // Lighten a hex color
  function lightenColor(hex, percent) {
    // Handle shorthand hex (e.g. #FFF)
    if (hex.length === 4) {
      hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    }
    
    // Convert hex to RGB
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    
    // Lighten
    r = Math.min(255, r + Math.floor(percent / 100 * 255));
    g = Math.min(255, g + Math.floor(percent / 100 * 255));
    b = Math.min(255, b + Math.floor(percent / 100 * 255));
    
    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  
  // Animation variables
  let lastFrameTime = 0;
  let animationId;
  
  // Main animation loop
  function animate(timestamp) {
    // Calculate delta time
    const deltaTime = timestamp - lastFrameTime;
    lastFrameTime = timestamp;
    
    // Only update if delta is reasonable
    const validDelta = deltaTime < 1000 ? deltaTime : 16;
    
    // Update particles
    updateParticles(validDelta);
    
    // Draw particles
    drawParticles();
    
    // Update dashboard charts (they animate based on time)
    drawStaticElements();
    
    // Continue animation
    animationId = requestAnimationFrame(animate);
  }
  
  // Initialize and start animation
  function initialize() {
    // Calculate positions
    calculatePositions();
    
    // Draw static elements
    drawStaticElements();
    
    // Initialize particle systems
    initParticleSystems();
    
    // Start animation
    lastFrameTime = performance.now();
    animationId = requestAnimationFrame(animate);
  }
  
  // Cleanup function
  function cleanup() {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    
    window.removeEventListener('resize', handleResize);
  }
  
  // Attach cleanup to window unload
  window.addEventListener('unload', cleanup);
  
  // Start visualization
  initialize();
});