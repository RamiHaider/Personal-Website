document.addEventListener('DOMContentLoaded', function() {
  // Get the container element
  const container = document.querySelector('#laundry-dashboard-viz');
  if (!container) return;

  // Create canvas elements for different layers
  const backgroundCanvas = document.createElement('canvas');
  const connectionCanvas = document.createElement('canvas');
  const particleCanvas = document.createElement('canvas');
  
  // Set canvas properties
  [backgroundCanvas, connectionCanvas, particleCanvas].forEach(canvas => {
    canvas.width = container.clientWidth || 800;
    canvas.height = container.clientHeight || 300;
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
  });
  
  // Make container relative for absolute positioning
  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  container.style.backgroundColor = '#111827'; // dark background
  container.style.borderRadius = '0.5rem';
  
  // Append canvases to container
  container.appendChild(backgroundCanvas);
  container.appendChild(connectionCanvas);
  container.appendChild(particleCanvas);
  
  // Get contexts
  const bgCtx = backgroundCanvas.getContext('2d');
  const connCtx = connectionCanvas.getContext('2d');
  const particleCtx = particleCanvas.getContext('2d');
  
  // Responsive handling
  function resizeCanvases() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    [backgroundCanvas, connectionCanvas, particleCanvas].forEach(canvas => {
      canvas.width = width;
      canvas.height = height;
    });
    
    // Redraw background
    drawBackground();
  }
  
  window.addEventListener('resize', resizeCanvases);
  
  // Data source configuration
  const dataSources = [
    { name: 'Payroll API', color: '#F59E0B', emoji: '💰', position: 'top-left' },
    { name: 'Web Analytics', color: '#3B82F6', emoji: '📊', position: 'top-right' },
    { name: 'Revenue API', color: '#10B981', emoji: '💵', position: 'bottom-left' },
    { name: 'Appointments', color: '#8B5CF6', emoji: '📅', position: 'bottom-right' }
  ];
  
  // Dashboard data for visualization
  const dashboardData = {
    revenue: {
      data: [3200, 4100, 3800, 5200, 4700, 6100],
      growthRate: 0.15,
      color: '#10B981'
    },
    webTraffic: {
      data: [120, 150, 180, 210, 190, 230],
      growthRate: 0.2,
      color: '#3B82F6'
    },
    appointments: {
      data: [42, 38, 45, 53, 48, 56],
      growthRate: 0.18,
      color: '#8B5CF6'
    },
    payroll: {
      data: [25, 30, 15, 20, 10],
      labels: ['Admin', 'Sales', 'IT', 'Marketing', 'Support'],
      color: '#F59E0B'
    }
  };
  
  // Calculate positions
  let warehousePos = { x: 0, y: 0 };
  let dashboardPos = { x: 0, y: 0 };
  let sourcePositions = [];
  
  function calculatePositions() {
    const width = backgroundCanvas.width;
    const height = backgroundCanvas.height;
    
    // Warehouse position (middle-left)
    warehousePos = {
      x: width * 0.25,
      y: height * 0.5
    };
    
    // Dashboard position (right side)
    dashboardPos = {
      x: width * 0.75,
      y: height * 0.5
    };
    
    // Data source positions in four corners
    sourcePositions = dataSources.map(source => {
      let pos = { x: 0, y: 0 };
      
      switch(source.position) {
        case 'top-left':
          pos = { x: width * 0.1, y: height * 0.2 };
          break;
        case 'top-right':
          pos = { x: width * 0.4, y: height * 0.2 };
          break;
        case 'bottom-left':
          pos = { x: width * 0.1, y: height * 0.8 };
          break;
        case 'bottom-right':
          pos = { x: width * 0.4, y: height * 0.8 };
          break;
      }
      
      return {
        ...source,
        x: pos.x,
        y: pos.y
      };
    });
  }
  
  // Draw static background
  function drawBackground() {
    calculatePositions();
    
    bgCtx.clearRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
    
    // Draw warehouse
    drawWarehouse(bgCtx, warehousePos.x, warehousePos.y);
    
    // Draw data sources
    sourcePositions.forEach(source => {
      drawDataSource(bgCtx, source);
    });
    
    // Draw dashboard
    drawDashboard(bgCtx, dashboardPos.x, dashboardPos.y);
  }
  
  // Draw data source
  function drawDataSource(ctx, source) {
    // Background circle
    ctx.beginPath();
    ctx.arc(source.x, source.y, 20, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(source.color, 0.2);
    ctx.fill();
    
    // Border
    ctx.beginPath();
    ctx.arc(source.x, source.y, 20, 0, Math.PI * 2);
    ctx.strokeStyle = source.color;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Emoji icon
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(source.emoji, source.x, source.y);
    
    // Label
    ctx.font = '10px Inter, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(source.name, source.x, source.y + 30);
  }
  
  // Draw warehouse
  function drawWarehouse(ctx, x, y) {
    const size = 40;
    
    // Glow effect
    const gradient = ctx.createRadialGradient(x, y, size/2, x, y, size * 1.5);
    gradient.addColorStop(0, hexToRgba('#60A5FA', 0.3));
    gradient.addColorStop(1, hexToRgba('#60A5FA', 0));
    ctx.beginPath();
    ctx.arc(x, y, size * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Main circle
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba('#60A5FA', 0.2);
    ctx.fill();
    
    // Border
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.strokeStyle = '#60A5FA';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Database icon - 3 stacked cylinders
    const iconSize = size * 0.6;
    
    // Top ellipse
    ctx.beginPath();
    ctx.ellipse(x, y - iconSize/3, iconSize/2, iconSize/6, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    
    // Bottom ellipse
    ctx.beginPath();
    ctx.ellipse(x, y + iconSize/3, iconSize/2, iconSize/6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Connecting lines
    ctx.beginPath();
    ctx.moveTo(x - iconSize/2, y - iconSize/3);
    ctx.lineTo(x - iconSize/2, y + iconSize/3);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x + iconSize/2, y - iconSize/3);
    ctx.lineTo(x + iconSize/2, y + iconSize/3);
    ctx.stroke();
    
    // Label
    ctx.font = '12px Inter, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText('Data Warehouse', x, y + size + 15);
  }
  
  // Draw dashboard
  function drawDashboard(ctx, x, y) {
    const width = 140;
    const height = 120;
    
    // Dashboard background
    ctx.fillStyle = hexToRgba('#1E293B', 0.8);
    ctx.strokeStyle = '#4B5563';
    ctx.lineWidth = 1;
    roundRect(ctx, x - width/2, y - height/2, width, height, 5, true, true);
    
    // Dashboard header
    ctx.fillStyle = hexToRgba('#374151', 0.9);
    roundRect(ctx, x - width/2, y - height/2, width, 20, { tl: 5, tr: 5, br: 0, bl: 0 }, true, false);
    
    // Header text
    ctx.font = '10px Inter, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText('Business Intelligence', x, y - height/2 + 13);
    
    // Draw mini charts
    const chartArea = {
      x: x - width/2 + 10,
      y: y - height/2 + 30,
      width: width - 20,
      height: height - 40
    };
    
    // Draw 2x2 grid of mini visualizations
    const halfWidth = chartArea.width / 2 - 4;
    const halfHeight = chartArea.height / 2 - 4;
    
    // Top left - Line chart (Revenue)
    drawMiniLineChart(ctx, 
      chartArea.x, 
      chartArea.y, 
      halfWidth, 
      halfHeight, 
      dashboardData.revenue.data,
      dashboardData.revenue.color,
      'Revenue'
    );
    
    // Top right - Bar chart (Web Traffic)
    drawMiniBarChart(ctx, 
      chartArea.x + halfWidth + 8, 
      chartArea.y, 
      halfWidth, 
      halfHeight, 
      dashboardData.webTraffic.data,
      dashboardData.webTraffic.color,
      'Traffic'
    );
    
    // Bottom left - Line chart (Appointments)
    drawMiniLineChart(ctx, 
      chartArea.x, 
      chartArea.y + halfHeight + 8, 
      halfWidth, 
      halfHeight, 
      dashboardData.appointments.data,
      dashboardData.appointments.color,
      'Appointments'
    );
    
    // Bottom right - Pie chart (Payroll)
    drawMiniPieChart(ctx, 
      chartArea.x + halfWidth + 8, 
      chartArea.y + halfHeight + 8, 
      halfWidth, 
      halfHeight, 
      dashboardData.payroll.data,
      dashboardData.payroll.color,
      'Payroll'
    );
  }
  
  // Draw mini line chart
  function drawMiniLineChart(ctx, x, y, width, height, data, color, label) {
    // Background
    ctx.fillStyle = hexToRgba('#111827', 0.6);
    roundRect(ctx, x, y, width, height, 3, true, false);
    
    // Label
    ctx.font = '8px Inter, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.fillText(label, x + 4, y + 10);
    
    // Chart area
    const chartX = x + 4;
    const chartY = y + 14;
    const chartWidth = width - 8;
    const chartHeight = height - 18;
    
    // Find min/max values
    const max = Math.max(...data) * 1.1;
    
    // Draw line
    ctx.beginPath();
    ctx.moveTo(chartX, chartY + chartHeight - (data[0] / max * chartHeight));
    
    for (let i = 1; i < data.length; i++) {
      const pointX = chartX + (i / (data.length - 1)) * chartWidth;
      const pointY = chartY + chartHeight - (data[i] / max * chartHeight);
      ctx.lineTo(pointX, pointY);
    }
    
    // Stroke the line
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Fill area under the line
    ctx.lineTo(chartX + chartWidth, chartY + chartHeight);
    ctx.lineTo(chartX, chartY + chartHeight);
    ctx.closePath();
    
    const gradient = ctx.createLinearGradient(chartX, chartY, chartX, chartY + chartHeight);
    gradient.addColorStop(0, hexToRgba(color, 0.2));
    gradient.addColorStop(1, hexToRgba(color, 0));
    ctx.fillStyle = gradient;
    ctx.fill();
  }
  
  // Draw mini bar chart
  function drawMiniBarChart(ctx, x, y, width, height, data, color, label) {
    // Background
    ctx.fillStyle = hexToRgba('#111827', 0.6);
    roundRect(ctx, x, y, width, height, 3, true, false);
    
    // Label
    ctx.font = '8px Inter, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.fillText(label, x + 4, y + 10);
    
    // Chart area
    const chartX = x + 4;
    const chartY = y + 14;
    const chartWidth = width - 8;
    const chartHeight = height - 18;
    
    // Find max value
    const max = Math.max(...data) * 1.1;
    
    // Bar width with spacing
    const barWidth = chartWidth / data.length * 0.7;
    const spacing = chartWidth / data.length * 0.3;
    
    // Draw bars
    for (let i = 0; i < data.length; i++) {
      const barHeight = (data[i] / max) * chartHeight;
      const barX = chartX + (i * (barWidth + spacing));
      const barY = chartY + chartHeight - barHeight;
      
      // Gradient fill
      const gradient = ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, hexToRgba(color, 0.5));
      
      ctx.fillStyle = gradient;
      roundRect(ctx, barX, barY, barWidth, barHeight, { tl: 2, tr: 2, bl: 0, br: 0 }, true, false);
    }
  }
  
  // Draw mini pie chart
  function drawMiniPieChart(ctx, x, y, width, height, data, color, label) {
    // Background
    ctx.fillStyle = hexToRgba('#111827', 0.6);
    roundRect(ctx, x, y, width, height, 3, true, false);
    
    // Label
    ctx.font = '8px Inter, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.fillText(label, x + 4, y + 10);
    
    // Pie center and radius
    const centerX = x + width / 2;
    const centerY = y + height / 2 + 5;
    const radius = Math.min(width, height) / 2 - 8;
    
    // Calculate total
    const total = data.reduce((sum, value) => sum + value, 0);
    
    // Draw pie slices
    let startAngle = -Math.PI / 2; // Start at top
    
    for (let i = 0; i < data.length; i++) {
      const sliceAngle = (data[i] / total) * Math.PI * 2;
      const endAngle = startAngle + sliceAngle;
      
      // Vary the color for each slice
      const opacity = 1 - (i * 0.15);
      ctx.fillStyle = hexToRgba(color, opacity);
      
      // Draw slice
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fill();
      
      startAngle = endAngle;
    }
  }
  
  // Particle system
  const particles = [];
  const maxParticles = 500;
  
  class Particle {
    constructor(source, target, color) {
      this.source = source;
      this.target = target;
      this.color = color;
      this.x = source.x;
      this.y = source.y;
      this.size = Math.random() * 2 + 1;
      this.speed = Math.random() * 1 + 0.5;
      this.progress = 0;
      this.opacity = Math.random() * 0.5 + 0.3;
      this.reachedTarget = false;
      this.nextTarget = null;
      this.pulseEffect = Math.random() > 0.7; // Some particles will have pulse effect
      this.pulseSize = this.size * (Math.random() * 0.5 + 1.5);
      this.pulseCycle = Math.random() * Math.PI * 2; // Random start in pulse cycle
    }
    
    update() {
      // If particle has reached target but has next target, reset to continue
      if (this.reachedTarget && this.nextTarget) {
        this.source = this.target;
        this.target = this.nextTarget;
        this.nextTarget = null;
        this.progress = 0;
        this.reachedTarget = false;
      }
      
      // Update progress
      this.progress += this.speed / 100;
      
      if (this.progress >= 1) {
        this.progress = 1;
        this.reachedTarget = true;
      }
      
      // Calculate position using bezier curve for more natural flow
      const p = this.progress;
      
      // Control point for curve (offset to create arc)
      const cpX = (this.source.x + this.target.x) / 2;
      const cpY = (this.source.y + this.target.y) / 2;
      
      // Add some randomness to control point
      const randomOffsetX = (Math.random() - 0.5) * 50;
      const randomOffsetY = (Math.random() - 0.5) * 50;
      
      // Bezier curve calculation
      const p1 = 1 - p;
      this.x = p1 * p1 * this.source.x + 2 * p1 * p * (cpX + randomOffsetX) + p * p * this.target.x;
      this.y = p1 * p1 * this.source.y + 2 * p1 * p * (cpY + randomOffsetY) + p * p * this.target.y;
      
      // Pulse effect
      if (this.pulseEffect) {
        this.pulseCycle += 0.1;
        this.currentSize = this.size + Math.sin(this.pulseCycle) * 1;
      } else {
        this.currentSize = this.size;
      }
    }
    
    draw(ctx) {
      // Create gradient for trail effect
      const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.currentSize * 2);
      gradient.addColorStop(0, hexToRgba(this.color, this.opacity));
      gradient.addColorStop(1, hexToRgba(this.color, 0));
      
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.currentSize, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }
  }
  
  // Create particles
  function createParticles() {
    // First, check if we need more particles
    if (particles.length >= maxParticles) return;
    
    // For each data source, create particles flowing to warehouse
    sourcePositions.forEach(source => {
      if (Math.random() > 0.85) { // Control rate of creation
        const particle = new Particle(source, warehousePos, source.color);
        
        // Set dashboard as next target for 70% of particles
        if (Math.random() > 0.3) {
          particle.nextTarget = dashboardPos;
        }
        
        particles.push(particle);
      }
    });
  }
  
  // Update and draw all particles
  function updateParticles() {
    particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    
    // Create new particles
    createParticles();
    
    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
      particles[i].draw(particleCtx);
      
      // Remove particles that have completed their journey
      if (particles[i].reachedTarget && !particles[i].nextTarget) {
        particles.splice(i, 1);
      }
    }
  }
  
  // Draw connections between nodes
  function drawConnections() {
    connCtx.clearRect(0, 0, connectionCanvas.width, connectionCanvas.height);
    
    // Draw connections from data sources to warehouse
    sourcePositions.forEach(source => {
      // Create gradient for connection
      const gradient = connCtx.createLinearGradient(source.x, source.y, warehousePos.x, warehousePos.y);
      gradient.addColorStop(0, hexToRgba(source.color, 0.4));
      gradient.addColorStop(1, hexToRgba('#60A5FA', 0.4));
      
      // Draw the connection line
      connCtx.beginPath();
      connCtx.moveTo(source.x, source.y);
      connCtx.lineTo(warehousePos.x, warehousePos.y);
      connCtx.strokeStyle = gradient;
      connCtx.lineWidth = 1;
      connCtx.stroke();
    });
    
    // Draw connection from warehouse to dashboard
    const gradient = connCtx.createLinearGradient(warehousePos.x, warehousePos.y, dashboardPos.x, dashboardPos.y);
    gradient.addColorStop(0, hexToRgba('#60A5FA', 0.4));
    gradient.addColorStop(1, hexToRgba('#FFFFFF', 0.4));
    
    connCtx.beginPath();
    connCtx.moveTo(warehousePos.x, warehousePos.y);
    connCtx.lineTo(dashboardPos.x, dashboardPos.y);
    connCtx.strokeStyle = gradient;
    connCtx.lineWidth = 2;
    connCtx.stroke();
  }
  
  // Update charts with dynamic data
  function updateCharts() {
    // Update revenue data
    if (Math.random() > 0.7) {
      const lastValue = dashboardData.revenue.data[dashboardData.revenue.data.length - 1];
      const change = lastValue * dashboardData.revenue.growthRate * (Math.random() - 0.3);
      const newValue = Math.max(lastValue + change, lastValue * 0.9);
      
      dashboardData.revenue.data.push(newValue);
      dashboardData.revenue.data.shift();
    }
    
    // Update web traffic data
    if (Math.random() > 0.6) {
      const lastValue = dashboardData.webTraffic.data[dashboardData.webTraffic.data.length - 1];
      const change = lastValue * dashboardData.webTraffic.growthRate * (Math.random() - 0.3);
      const newValue = Math.max(lastValue + change, lastValue * 0.85);
      
      dashboardData.webTraffic.data.push(newValue);
      dashboardData.webTraffic.data.shift();
    }
    
    // Update appointments data
    if (Math.random() > 0.75) {
      const lastValue = dashboardData.appointments.data[dashboardData.appointments.data.length - 1];
      const change = lastValue * dashboardData.appointments.growthRate * (Math.random() - 0.4);
      const newValue = Math.max(lastValue + change, lastValue * 0.9);
      
      dashboardData.appointments.data.push(newValue);
      dashboardData.appointments.data.shift();
    }
    
    // Update payroll data
    if (Math.random() > 0.9) {
      // Shuffle the payroll data slightly
      const index1 = Math.floor(Math.random() * dashboardData.payroll.data.length);
      const index2 = Math.floor(Math.random() * dashboardData.payroll.data.length);
      
      if (index1 !== index2) {
        const temp = dashboardData.payroll.data[index1];
        dashboardData.payroll.data[index1] = dashboardData.payroll.data[index2];
        dashboardData.payroll.data[index2] = temp;
      }
    }
    
    // Redraw background with updated charts
    drawBackground();
  }
  
  // Helper function for rounded rectangles
  function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
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
      ctx.fill();
    }
    if (stroke) {
      ctx.stroke();
    }
  }
  
  // Helper function to convert hex color to rgba
  function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  
  // Animation loop
  function animate() {
    drawConnections();
    updateParticles();
    
    // Update charts occasionally
    if (Math.random() > 0.95) {
      updateCharts();
    }
    
    requestAnimationFrame(animate);
  }
  
  // Initial draw
  resizeCanvases();
  drawBackground();
  
  // Start animation
  animate();
});