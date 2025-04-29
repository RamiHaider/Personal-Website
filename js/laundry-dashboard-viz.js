document.addEventListener('DOMContentLoaded', function() {
  // Get the container element - match your existing ID
  const container = document.querySelector('#laundry-dashboard-viz');
  if (!container) return;

  // Set up multiple canvas layers for better performance and visual effects
  const layers = {
    background: document.createElement('canvas'),  // Static elements and grid
    connections: document.createElement('canvas'),  // Data flow paths
    particles: document.createElement('canvas'),    // Moving data particles
    overlay: document.createElement('canvas'),      // Glow effects and highlights
    dashboard: document.createElement('canvas')     // Live dashboard elements
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
  container.style.backgroundColor = '#0B1120'; // Darker, more professional background
  container.style.borderRadius = '0.5rem';
  
  // Append canvases in correct order (bottom to top)
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
  
  // System state
  let systemState = {
    processingLoad: 0.5,        // 0-1 scale of current system load
    dataFlowRate: 0.7,          // 0-1 scale of data velocity
    lastNetworkPulse: 0,        // Timestamp of last network activity burst
    systemStatus: 'operational', // Status message
    alerts: [],                 // Any system alerts/messages
    lastTransformation: 0       // Timestamp of last data transformation
  };
  
  // Color palette (more sophisticated)
  const colors = {
    payroll: {
      main: '#ff9d00',
      dark: '#e67e00', 
      light: '#ffb84d',
      ultraLight: '#fff2d1'
    },
    analytics: {
      main: '#0074e0',
      dark: '#0062bd',
      light: '#3498ff',
      ultraLight: '#e3f2ff'
    },
    revenue: {
      main: '#00c49a',
      dark: '#00a57f',
      light: '#4adfc1',
      ultraLight: '#e6fff9'
    },
    appointments: {
      main: '#845ef7',
      dark: '#6741d9',
      light: '#a78bfa',
      ultraLight: '#f1ecff'
    },
    background: {
      grid: 'rgba(90, 105, 150, 0.07)',
      gridBright: 'rgba(90, 105, 150, 0.12)',
      accent: 'rgba(111, 134, 181, 0.15)'
    },
    warehouse: {
      main: '#4d84ff',
      pulse: '#8cbaff',
      dark: '#2d5bd9',
      glow: 'rgba(77, 132, 255, 0.15)'
    },
    dashboard: {
      bg: 'rgba(26, 32, 44, 0.8)',
      panel: 'rgba(17, 25, 40, 0.7)',
      border: 'rgba(74, 85, 104, 0.3)',
      highlight: 'rgba(113, 128, 150, 0.4)'
    },
    text: {
      primary: 'rgba(247, 250, 252, 0.92)',
      secondary: 'rgba(203, 213, 224, 0.8)',
      muted: 'rgba(160, 174, 192, 0.6)'
    }
  };
  
  // Data source configuration
  const dataSources = [
    { 
      id: 'payroll',
      name: 'Payroll API', 
      colors: colors.payroll,
      symbol: '💰',
      position: 'top-left',
      flowRate: 0.7,
      packetSize: 2.2,
      burstFrequency: 8000,  // Occasional data bursts
      streamPattern: 'intermittent',
      processingIntensity: 0.6
    },
    { 
      id: 'analytics',
      name: 'Web Analytics', 
      colors: colors.analytics, 
      symbol: '📊',
      position: 'top-right',
      flowRate: 0.9,
      packetSize: 1.4,
      burstFrequency: 6000,
      streamPattern: 'steady',
      processingIntensity: 0.8
    },
    { 
      id: 'revenue',
      name: 'Revenue API', 
      colors: colors.revenue, 
      symbol: '💵',
      position: 'bottom-left',
      flowRate: 0.6,
      packetSize: 2.5,
      burstFrequency: 10000,
      streamPattern: 'bursty',
      processingIntensity: 0.7
    },
    { 
      id: 'appointments',
      name: 'Appointments', 
      colors: colors.appointments, 
      symbol: '📅',
      position: 'bottom-right',
      flowRate: 0.5,
      packetSize: 1.8,
      burstFrequency: 7500,
      streamPattern: 'regular',
      processingIntensity: 0.5
    }
  ];
  
  // Calculate positions
  let warehousePos = { x: 0, y: 0 };
  let dashboardPos = { x: 0, y: 0 };
  let sourcePositions = [];
  let connectionPaths = [];
  let connectionControlPoints = [];
  
  function calculatePositions() {
    const width = layers.background.width;
    const height = layers.background.height;
    
    // Warehouse position (middle-left with slight offset)
    warehousePos = {
      x: width * 0.28,
      y: height * 0.5
    };
    
    // Dashboard position (right side, slightly above center)
    dashboardPos = {
      x: width * 0.78,
      y: height * 0.5
    };
    
    // Data source positions with better placement
    sourcePositions = dataSources.map(source => {
      let pos = { x: 0, y: 0 };
      const offset = width * 0.05;
      
      switch(source.position) {
        case 'top-left':
          pos = { 
            x: width * 0.08, 
            y: height * 0.25 
          };
          break;
        case 'top-right':
          pos = { 
            x: width * 0.16, 
            y: height * 0.25 
          };
          break;
        case 'bottom-left':
          pos = { 
            x: width * 0.08, 
            y: height * 0.75 
          };
          break;
        case 'bottom-right':
          pos = { 
            x: width * 0.16, 
            y: height * 0.75 
          };
          break;
      }
      
      return {
        ...source,
        x: pos.x,
        y: pos.y,
        radius: Math.min(width, height) * 0.035
      };
    });
    
    // Calculate natural-looking curve control points for each connection
    connectionControlPoints = [];
    sourcePositions.forEach(source => {
      // Calculate natural curve control points
      const dx = warehousePos.x - source.x;
      const dy = warehousePos.y - source.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Create multiple control points for more natural curves
      const numPoints = 3;
      const points = [];
      
      for (let i = 0; i < numPoints; i++) {
        const t = (i + 1) / (numPoints + 1);
        const cpX = source.x + dx * t;
        const cpY = source.y + dy * t;
        
        // Add some natural looking variation
        const perpX = -dy / distance * 30 * (i % 2 === 0 ? 1 : -1);
        const perpY = dx / distance * 30 * (i % 2 === 0 ? 1 : -1);
        
        points.push({
          x: cpX + perpX,
          y: cpY + perpY
        });
      }
      
      connectionControlPoints.push({
        source: source.id,
        points: points
      });
    });
    
    // Create connection path from warehouse to dashboard (with slight curve)
    const whToDbCP1 = {
      x: warehousePos.x + (dashboardPos.x - warehousePos.x) * 0.33,
      y: warehousePos.y - 20
    };
    
    const whToDbCP2 = {
      x: warehousePos.x + (dashboardPos.x - warehousePos.x) * 0.66,
      y: dashboardPos.y + 20
    };
    
    connectionPaths = {
      warehouseToDashboard: [whToDbCP1, whToDbCP2]
    };
  }
  
  // Sophisticated dynamic data for visualizations
  const dashboardData = {
    revenue: {
      data: generateSmoothedTimeSeries(12, 4000, 6000, 0.3),
      format: value => `$${Math.round(value).toLocaleString()}`,
      currentGrowth: 0.08,
      targetGrowth: 0.15,
      sparkline: {
        width: 100,
        height: 30,
        data: []
      },
      anomalies: [],
      color: colors.revenue.main,
      forecast: []
    },
    traffic: {
      data: generateSmoothedTimeSeries(14, 400, 1200, 0.5),
      format: value => `${Math.round(value).toLocaleString()}`,
      segments: [
        { name: 'Organic', value: 0.42, color: colors.analytics.main },
        { name: 'Direct', value: 0.28, color: colors.analytics.light },
        { name: 'Social', value: 0.22, color: colors.analytics.dark },
        { name: 'Other', value: 0.08, color: '#6A8CCC' }
      ],
      previousPeriod: 960,
      color: colors.analytics.main,
      forecast: []
    },
    appointments: {
      data: generateSmoothedTimeSeries(7, 40, 70, 0.2),
      byDay: [
        { day: 'Mon', value: 52 },
        { day: 'Tue', value: 68 },
        { day: 'Wed', value: 79 },
        { day: 'Thu', value: 57 },
        { day: 'Fri', value: 43 },
        { day: 'Sat', value: 38 },
        { day: 'Sun', value: 24 }
      ],
      completionRate: 0.92,
      color: colors.appointments.main,
      trends: []
    },
    payroll: {
      total: 342500,
      departments: [
        { name: 'Operations', value: 0.35, color: colors.payroll.main },
        { name: 'Admin', value: 0.25, color: colors.payroll.light },
        { name: 'Marketing', value: 0.18, color: colors.payroll.dark },
        { name: 'Support', value: 0.15, color: '#DAA03D' },
        { name: 'Other', value: 0.07, color: '#BB8425' }
      ],
      averageSalary: 68500,
      color: colors.payroll.main,
      history: generateSmoothedTimeSeries(6, 320000, 360000, 0.1)
    }
  };
  
  // Create forecasts for each metric
  dashboardData.revenue.forecast = forecastData(dashboardData.revenue.data, 4, 0.2);
  dashboardData.traffic.forecast = forecastData(dashboardData.traffic.data, 4, 0.3);
  dashboardData.appointments.trends = calculateTrends(dashboardData.appointments.data, 3);
  
  // Create particle systems
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
        maxParticles: 100,
        flowRate: source.flowRate,
        nextEmit: 0,
        burstProbability: 0.05,
        burstSize: 10,
        burstSpeed: 1.5,
        lastBurst: 0
      });
    });
    
    // Create warehouse to dashboard particle system
    particleSystems.warehouseToDashboard = {
      particles: [],
      maxParticles: 150,
      flowRate: 0.75,
      nextEmit: 0,
      burstProbability: 0.05,
      burstSize: 15,
      burstSpeed: 1.3,
      lastBurst: 0
    };
  }
  
  // Particles classes
  class BaseParticle {
    constructor(x, y, options = {}) {
      this.x = x;
      this.y = y;
      this.size = options.size || (Math.random() * 2 + 1.5);
      this.baseSize = this.size;
      this.color = options.color || '#ffffff';
      this.speed = options.speed || (Math.random() * 0.5 + 0.2);
      this.opacity = options.opacity || (Math.random() * 0.5 + 0.5);
      this.baseOpacity = this.opacity;
      this.life = 1;
      this.decay = options.decay || 0.003;
      this.dead = false;
      
      // Effects
      this.pulse = Math.random() > 0.6;
      this.pulseSpeed = Math.random() * 0.05 + 0.02;
      this.pulseAmplitude = Math.random() * 0.5 + 0.5;
      this.pulsePhase = Math.random() * Math.PI * 2;
      
      // Trail effect
      this.hasTrail = options.hasTrail || (Math.random() > 0.7);
      this.trail = [];
      this.trailLength = options.trailLength || Math.floor(Math.random() * 5) + 3;
      
      // Shimmer effect
      this.shimmer = Math.random() > 0.7;
      this.shimmerSpeed = Math.random() * 0.1 + 0.05;
      this.shimmerIntensity = Math.random() * 0.3 + 0.7;
      this.shimmerPhase = Math.random() * Math.PI * 2;
    }
    
    update(deltaTime) {
      // Basic life decay
      this.life -= this.decay * deltaTime;
      if (this.life <= 0) {
        this.dead = true;
        return;
      }
      
      // Pulse effect
      if (this.pulse) {
        this.pulsePhase += this.pulseSpeed * deltaTime;
        const pulseFactor = Math.sin(this.pulsePhase) * this.pulseAmplitude + 1;
        this.size = this.baseSize * pulseFactor;
      }
      
      // Shimmer effect
      if (this.shimmer) {
        this.shimmerPhase += this.shimmerSpeed * deltaTime;
        const shimmerFactor = Math.sin(this.shimmerPhase) * this.shimmerIntensity + 0.9;
        this.opacity = this.baseOpacity * shimmerFactor * this.life;
      } else {
        this.opacity = this.baseOpacity * this.life;
      }
      
      // Store position for trail
      if (this.hasTrail) {
        this.trail.push({ x: this.x, y: this.y, size: this.size, opacity: this.opacity });
        if (this.trail.length > this.trailLength) {
          this.trail.shift();
        }
      }
    }
    
    draw(ctx) {
      // Draw trail
      if (this.hasTrail && this.trail.length > 0) {
        for (let i = 0; i < this.trail.length; i++) {
          const point = this.trail[i];
          const trailOpacity = point.opacity * (i / this.trail.length) * 0.6;
          
          ctx.beginPath();
          ctx.arc(point.x, point.y, point.size * 0.6, 0, Math.PI * 2);
          ctx.fillStyle = hexToRgba(this.color, trailOpacity);
          ctx.fill();
        }
      }
      
      // Draw particle
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      
      // Create gradient for better glow
      const gradient = ctx.createRadialGradient(
        this.x, this.y, 0,
        this.x, this.y, this.size * 2
      );
      gradient.addColorStop(0, hexToRgba(this.color, this.opacity));
      gradient.addColorStop(1, hexToRgba(this.color, 0));
      
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Center glow
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(lightenColor(this.color, 50), this.opacity * 0.7);
      ctx.fill();
    }
  }
  
  class PathParticle extends BaseParticle {
    constructor(source, target, options = {}) {
      super(source.x, source.y, options);
      
      this.source = source;
      this.target = target;
      this.controlPoints = options.controlPoints || [];
      this.progress = 0;
      this.speed = options.speed || (Math.random() * 0.0008 + 0.0005);
      
      // Data packet effect
      this.isDataPacket = options.isDataPacket || false;
      if (this.isDataPacket) {
        this.size = options.size || (Math.random() * 3 + 4);
        this.baseSize = this.size;
        this.hasTrail = true;
        this.trailLength = 10;
        this.dataType = options.dataType || 'generic';
      }
      
      // Transformation effect (morphing)
      this.transforming = false;
      this.transformationProgress = 0;
      this.transformationSpeed = 0.03;
      this.originalColor = this.color;
      this.targetColor = options.targetColor || this.color;
      
      // Variable speed
      this.baseSpeed = this.speed;
      this.speedVariation = Math.random() * 0.0004;
      this.speedPhase = Math.random() * Math.PI * 2;
    }
    
    update(deltaTime) {
      super.update(deltaTime);
      
      // Variable speed
      this.speedPhase += 0.01 * deltaTime;
      this.speed = this.baseSpeed + Math.sin(this.speedPhase) * this.speedVariation;
      
      // Update progress along path
      this.progress += this.speed * deltaTime;
      if (this.progress >= 1) {
        this.progress = 1;
        this.life = Math.min(this.life, 0.1); // Start fading out
      }
      
      // Data transformation effect
      if (this.progress > 0.7 && !this.transforming && Math.random() > 0.7) {
        this.transforming = true;
      }
      
      if (this.transforming) {
        this.transformationProgress += this.transformationSpeed * deltaTime;
        if (this.transformationProgress > 1) this.transformationProgress = 1;
        
        // Blend colors during transformation
        this.color = blendColors(this.originalColor, this.targetColor, this.transformationProgress);
        
        // Pulsate during transformation
        if (this.transformationProgress < 0.8) {
          this.size = this.baseSize * (1 + Math.sin(this.transformationProgress * Math.PI * 10) * 0.3);
        }
      }
      
      // Calculate position on curve based on progress
      this.calculatePositionOnPath();
    }
    
    calculatePositionOnPath() {
      if (this.controlPoints.length === 0) {
        // Simple linear path
        this.x = this.source.x + (this.target.x - this.source.x) * this.progress;
        this.y = this.source.y + (this.target.y - this.source.y) * this.progress;
        return;
      }
      
      // Complex curve path using control points
      if (this.controlPoints.length === 1) {
        // Quadratic bezier
        const cp = this.controlPoints[0];
        const t = this.progress;
        const mt = 1 - t;
        
        this.x = mt * mt * this.source.x + 2 * mt * t * cp.x + t * t * this.target.x;
        this.y = mt * mt * this.source.y + 2 * mt * t * cp.y + t * t * this.target.y;
      } else if (this.controlPoints.length >= 2) {
        // Cubic bezier
        const cp1 = this.controlPoints[0];
        const cp2 = this.controlPoints[1];
        const t = this.progress;
        const mt = 1 - t;
        
        this.x = mt * mt * mt * this.source.x + 
                3 * mt * mt * t * cp1.x + 
                3 * mt * t * t * cp2.x + 
                t * t * t * this.target.x;
                
        this.y = mt * mt * mt * this.source.y + 
                3 * mt * mt * t * cp1.y + 
                3 * mt * t * t * cp2.y + 
                t * t * t * this.target.y;
      }
    }
    
    draw(ctx) {
      // Special drawing for data packets
      if (this.isDataPacket) {
        // Draw data packet with specific styling
        if (this.hasTrail && this.trail.length > 0) {
          for (let i = 0; i < this.trail.length; i++) {
            const point = this.trail[i];
            const trailOpacity = point.opacity * (i / this.trail.length) * 0.5;
            
            ctx.beginPath();
            ctx.arc(point.x, point.y, point.size * 0.7, 0, Math.PI * 2);
            ctx.fillStyle = hexToRgba(this.color, trailOpacity);
            ctx.fill();
          }
        }
        
        // Draw packet body
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        
        // Gradient for glow
        const gradient = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, this.size * 2.5
        );
        gradient.addColorStop(0, hexToRgba(this.color, this.opacity * 0.9));
        gradient.addColorStop(0.5, hexToRgba(this.color, this.opacity * 0.3));
        gradient.addColorStop(1, hexToRgba(this.color, 0));
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Inner glow
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(lightenColor(this.color, 40), this.opacity * 0.9);
        ctx.fill();
        
        // Center highlight
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba('#ffffff', this.opacity * 0.9);
        ctx.fill();
        
        // Add tiny data symbol based on type
        ctx.font = `${this.size * 0.8}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = hexToRgba('#ffffff', this.opacity * 0.9);
        
        let symbol = '';
        switch(this.dataType) {
          case 'payroll': symbol = '$'; break;
          case 'analytics': symbol = '#'; break;
          case 'revenue': symbol = '¢'; break;
          case 'appointments': symbol = '@'; break;
          default: symbol = '•';
        }
        
        if (this.size > 3) {
          ctx.fillText(symbol, this.x, this.y);
        }
      } else {
        // Normal particle drawing
        super.draw(ctx);
      }
    }
  }
  
  class DashboardParticle extends BaseParticle {
    constructor(x, y, targetChart, options = {}) {
      super(x, y, options);
      
      this.targetChart = targetChart;
      this.targetX = options.targetX || x;
      this.targetY = options.targetY || y;
      this.progress = 0;
      this.speed = options.speed || (Math.random() * 0.01 + 0.005);
      this.arrived = false;
      this.lifetime = options.lifetime || (Math.random() * 1000 + 2000);
      this.age = 0;
      
      // Chart-specific rendering properties
      this.chartType = options.chartType || 'generic';
      this.dataValue = options.dataValue;
      this.index = options.index || 0;
    }
    
    update(deltaTime) {
      if (!this.arrived) {
        // Move toward target
        this.progress += this.speed * deltaTime;
        if (this.progress >= 1) {
          this.progress = 1;
          this.arrived = true;
        }
        
        // Calculate position
        this.x = this.x + (this.targetX - this.x) * (this.progress * this.progress); // Ease out
        this.y = this.y + (this.targetY - this.y) * (this.progress * this.progress);
        
        super.update(deltaTime);
      } else {
        // Particle has arrived at chart - special behavior
        this.age += deltaTime;
        if (this.age > this.lifetime) {
          this.dead = true;
        }
        
        // Specific behavior based on chart type
        switch(this.chartType) {
          case 'line':
            // Pulsate with reducing intensity
            this.pulsePhase += 0.03 * deltaTime;
            const ageFactor = 1 - (this.age / this.lifetime);
            this.size = this.baseSize * (1 + Math.sin(this.pulsePhase) * 0.5 * ageFactor);
            this.opacity = this.baseOpacity * ageFactor;
            break;
            
          case 'bar':
            // Slow fade
            this.opacity = this.baseOpacity * (1 - (this.age / this.lifetime));
            break;
            
          case 'pie':
            // Orbit slightly around target
            const orbitRadius = 3;
            const orbitSpeed = 0.001 * deltaTime;
            this.x = this.targetX + Math.cos(this.age * orbitSpeed) * orbitRadius;
            this.y = this.targetY + Math.sin(this.age * orbitSpeed) * orbitRadius;
            this.opacity = this.baseOpacity * (1 - (this.age / this.lifetime));
            break;
            
          default:
            this.opacity = this.baseOpacity * (1 - (this.age / this.lifetime));
        }
      }
    }
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
    
    // 6. Draw system status badges
    drawSystemStatus();
  }
  
  // Draw background with subtle grid pattern
  function drawBackgroundGrid() {
    const ctx = contexts.background;
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Draw darker grid lines first
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
    
    // Draw brighter accent lines (less frequent)
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
    
    // Add subtle gradient overlay
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, 'rgba(23, 25, 35, 0.1)');
    gradient.addColorStop(0.5, 'rgba(18, 20, 30, 0)');
    gradient.addColorStop(1, 'rgba(23, 25, 35, 0.1)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add vignette effect
    const radial = ctx.createRadialGradient(
      width/2, height/2, height * 0.2,
      width/2, height/2, height * 0.9
    );
    radial.addColorStop(0, 'rgba(10, 12, 22, 0)');
    radial.addColorStop(1, 'rgba(10, 12, 22, 0.3)');
    
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, width, height);
  }
  
  // Draw connection paths (between nodes)
  function drawConnectionPaths() {
    const ctx = contexts.connections;
    
    // Draw paths from sources to warehouse
    sourcePositions.forEach(source => {
      const controls = connectionControlPoints.find(cp => cp.source === source.id);
      
      if (controls && controls.points.length > 0) {
        // Draw curve path with gradient
        const gradient = ctx.createLinearGradient(source.x, source.y, warehousePos.x, warehousePos.y);
        gradient.addColorStop(0, hexToRgba(source.colors.main, 0.15));
        gradient.addColorStop(1, hexToRgba(colors.warehouse.main, 0.15));
        
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        
        if (controls.points.length === 1) {
          // Quadratic curve
          ctx.quadraticCurveTo(
            controls.points[0].x, controls.points[0].y,
            warehousePos.x, warehousePos.y
          );
        } else if (controls.points.length >= 2) {
          // Cubic curve (or more complex path)
          ctx.bezierCurveTo(
            controls.points[0].x, controls.points[0].y,
            controls.points[1].x, controls.points[1].y,
            warehousePos.x, warehousePos.y
          );
        }
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Add glow effect
        ctx.shadowColor = hexToRgba(source.colors.main, 0.3);
        ctx.shadowBlur = 5;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    });
    
    // Draw path from warehouse to dashboard
    const whDbPath = connectionPaths.warehouseToDashboard;
    if (whDbPath) {
      const gradient = ctx.createLinearGradient(warehousePos.x, warehousePos.y, dashboardPos.x, dashboardPos.y);
      gradient.addColorStop(0, hexToRgba(colors.warehouse.main, 0.2));
      gradient.addColorStop(1, hexToRgba('#ffffff', 0.15));
      
      ctx.beginPath();
      ctx.moveTo(warehousePos.x, warehousePos.y);
      
      if (whDbPath.length >= 2) {
        ctx.bezierCurveTo(
          whDbPath[0].x, whDbPath[0].y,
          whDbPath[1].x, whDbPath[1].y,
          dashboardPos.x, dashboardPos.y
        );
      } else if (whDbPath.length === 1) {
        ctx.quadraticCurveTo(
          whDbPath[0].x, whDbPath[0].y,
          dashboardPos.x, dashboardPos.y
        );
      } else {
        ctx.lineTo(dashboardPos.x, dashboardPos.y);
      }
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 4;
      ctx.stroke();
      
      // Add glow effect
      ctx.shadowColor = hexToRgba(colors.warehouse.main, 0.4);
      ctx.shadowBlur = 8;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }
  
  // Draw data source node
  function drawDataSource(ctx, source) {
    const x = source.x;
    const y = source.y;
    const radius = source.radius;
    
    // Outer glow
    const glowGradient = ctx.createRadialGradient(x, y, radius * 0.8, x, y, radius * 2.5);
    glowGradient.addColorStop(0, hexToRgba(source.colors.main, 0.3));
    glowGradient.addColorStop(1, hexToRgba(source.colors.main, 0));
    
    ctx.beginPath();
    ctx.arc(x, y, radius * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = glowGradient;
    ctx.fill();
    
    // Outer ring
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    
    // Ring gradient
    const ringGradient = ctx.createRadialGradient(x, y, radius * 0.7, x, y, radius);
    ringGradient.addColorStop(0, hexToRgba(source.colors.main, 0.3));
    ringGradient.addColorStop(1, hexToRgba(source.colors.main, 0.1));
    
    ctx.fillStyle = ringGradient;
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
    
    // Inner gradient
    const innerGradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 0.7);
    innerGradient.addColorStop(0, hexToRgba(source.colors.light, 0.4));
    innerGradient.addColorStop(1, hexToRgba(source.colors.main, 0.2));
    
    ctx.fillStyle = innerGradient;
    ctx.fill();
    
    // Source icon
    ctx.font = `${radius * 0.9}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = hexToRgba(source.colors.ultraLight, 0.9);
    ctx.fillText(source.symbol, x, y);
    
    // Source label
    ctx.font = '10px Inter, sans-serif';
    ctx.fillStyle = colors.text.primary;
    ctx.fillText(source.name, x, y + radius * 1.5);
  }
  
  // Draw data warehouse
  function drawWarehouse(ctx, position) {
    const x = position.x;
    const y = position.y;
    const radius = Math.min(ctx.canvas.width, ctx.canvas.height) * 0.06;
    
    // Outer glow effect
    const glowGradient = ctx.createRadialGradient(x, y, radius * 0.8, x, y, radius * 3);
    glowGradient.addColorStop(0, hexToRgba(colors.warehouse.main, 0.2));
    glowGradient.addColorStop(1, hexToRgba(colors.warehouse.main, 0));
    
    ctx.beginPath();
    ctx.arc(x, y, radius * 3, 0, Math.PI * 2);
    ctx.fillStyle = glowGradient;
    ctx.fill();
    
    // Larger outer ring
    ctx.beginPath();
    ctx.arc(x, y, radius * 1.2, 0, Math.PI * 2);
    
    const outerRingGradient = ctx.createRadialGradient(x, y, radius * 0.8, x, y, radius * 1.2);
    outerRingGradient.addColorStop(0, hexToRgba(colors.warehouse.main, 0.05));
    outerRingGradient.addColorStop(1, hexToRgba(colors.warehouse.main, 0.02));
    
    ctx.fillStyle = outerRingGradient;
    ctx.fill();
    
    // Main circle with gradient fill
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    
    const mainGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    mainGradient.addColorStop(0, hexToRgba(colors.warehouse.main, 0.4));
    mainGradient.addColorStop(0.7, hexToRgba(colors.warehouse.main, 0.2));
    mainGradient.addColorStop(1, hexToRgba(colors.warehouse.main, 0.1));
    
    ctx.fillStyle = mainGradient;
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
    
    // Label with background
    const labelText = "Data Warehouse";
    ctx.font = '12px Inter, sans-serif';
    const textWidth = ctx.measureText(labelText).width;
    
    // Label background
    roundRect(
      ctx,
      x - textWidth / 2 - 10,
      y + radius * 1.4,
      textWidth + 20,
      20,
      10,
      true,
      false,
      hexToRgba('#1A2233', 0.7)
    );
    
    // Label text
    ctx.fillStyle = colors.text.primary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, x, y + radius * 1.4 + 10);
  }
  
  // Draw dashboard base
  function drawDashboardBase(ctx, position) {
    const x = position.x;
    const y = position.y;
    const width = ctx.canvas.width * 0.35;
    const height = ctx.canvas.height * 0.75;
    
    // Dashboard background with glass effect
    const bgGradient = ctx.createLinearGradient(x - width/2, y - height/2, x + width/2, y + height/2);
    bgGradient.addColorStop(0, hexToRgba('#1E293B', 0.85));
    bgGradient.addColorStop(1, hexToRgba('#111827', 0.9));
    
    // Main background
    roundRect(
      ctx,
      x - width/2,
      y - height/2,
      width,
      height,
      8,
      true,
      false,
      bgGradient
    );
    
    // Subtle border glow
    ctx.shadowColor = hexToRgba('#3B82F6', 0.3);
    ctx.shadowBlur = 10;
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
      hexToRgba('#3B82F6', 0.2)
    );
    ctx.shadowBlur = 0;
    
    // Header
    const headerHeight = 30;
    const headerGradient = ctx.createLinearGradient(
      x - width/2,
      y - height/2,
      x - width/2,
      y - height/2 + headerHeight
    );
    headerGradient.addColorStop(0, hexToRgba('#2D3748', 0.95));
    headerGradient.addColorStop(1, hexToRgba('#1A202C', 0.95));
    
    roundRect(
      ctx,
      x - width/2,
      y - height/2,
      width,
      headerHeight,
      { tl: 8, tr: 8, bl: 0, br: 0 },
      true,
      false,
      headerGradient
    );
    
    // Header text
    ctx.font = 'bold 14px Inter, sans-serif';
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
    // Panel background with glass effect
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
    const headerGradient = ctx.createLinearGradient(
      panel.x - panel.width/2,
      panel.y - panel.height/2,
      panel.x - panel.width/2,
      panel.y - panel.height/2 + headerHeight
    );
    headerGradient.addColorStop(0, hexToRgba('#2D3748', 0.8));
    headerGradient.addColorStop(1, hexToRgba('#1A202C', 0.8));
    
    roundRect(
      ctx,
      panel.x - panel.width/2,
      panel.y - panel.height/2,
      panel.width,
      headerHeight,
      { tl: 6, tr: 6, bl: 0, br: 0 },
      true,
      false,
      headerGradient
    );
    
    // Panel title based on index
    let title = "";
    let chartColor = "";
    
    switch(index) {
      case 0:
        title = "Revenue Trends";
        chartColor = colors.revenue.main;
        drawRevenueChart(ctx, panel);
        break;
      case 1:
        title = "Web Traffic Analysis";
        chartColor = colors.analytics.main;
        drawTrafficChart(ctx, panel);
        break;
      case 2:
        title = "Appointment Distribution";
        chartColor = colors.appointments.main;
        drawAppointmentsChart(ctx, panel);
        break;
      case 3:
        title = "Payroll Allocation";
        chartColor = colors.payroll.main;
        drawPayrollChart(ctx, panel);
        break;
    }
    
    // Panel title
    ctx.font = 'bold 11px Inter, sans-serif';
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
  
  // Draw specific chart types
  function drawRevenueChart(ctx, panel) {
    const data = dashboardData.revenue.data;
    const forecast = dashboardData.revenue.forecast;
    
    // Chart dimensions
    const chartX = panel.x - panel.width/2 + 15;
    const chartY = panel.y - panel.height/2 + 35;
    const chartWidth = panel.width - 30;
    const chartHeight = panel.height - 50;
    
    // Scale data
    const maxValue = Math.max(...data, ...forecast) * 1.1;
    
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
    
    // Plot historical data
    ctx.beginPath();
    
    data.forEach((value, i) => {
      const x = chartX + (i / (data.length - 1)) * chartWidth * 0.7; // Only use 70% for historical data
      const y = chartY + chartHeight - (value / maxValue) * chartHeight;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    // Style and stroke historical line
    ctx.strokeStyle = colors.revenue.main;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Fill area below line
    ctx.lineTo(chartX + chartWidth * 0.7, chartY + chartHeight);
    ctx.lineTo(chartX, chartY + chartHeight);
    ctx.closePath();
    
    const fillGradient = ctx.createLinearGradient(chartX, chartY, chartX, chartY + chartHeight);
    fillGradient.addColorStop(0, hexToRgba(colors.revenue.main, 0.2));
    fillGradient.addColorStop(1, hexToRgba(colors.revenue.main, 0.01));
    
    ctx.fillStyle = fillGradient;
    ctx.fill();
    
    // Plot forecast data with dotted line
    ctx.beginPath();
    ctx.setLineDash([3, 3]);
    
    // Connect to the last historical point
    const lastHistoricalX = chartX + ((data.length - 1) / (data.length - 1)) * chartWidth * 0.7;
    const lastHistoricalY = chartY + chartHeight - (data[data.length - 1] / maxValue) * chartHeight;
    ctx.moveTo(lastHistoricalX, lastHistoricalY);
    
    forecast.forEach((value, i) => {
      const x = chartX + chartWidth * 0.7 + (i / (forecast.length - 1)) * chartWidth * 0.3;
      const y = chartY + chartHeight - (value / maxValue) * chartHeight;
      ctx.lineTo(x, y);
    });
    
    ctx.strokeStyle = hexToRgba(colors.revenue.main, 0.6);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Add data labels
    ctx.font = '10px Inter, sans-serif';
    ctx.fillStyle = colors.text.secondary;
    ctx.textAlign = 'center';
    
    // X-axis labels (months)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const numLabels = 4;
    const labelStep = Math.ceil(data.length / numLabels);
    
    for (let i = 0; i < data.length; i += labelStep) {
      const x = chartX + (i / (data.length - 1)) * chartWidth * 0.7;
      ctx.fillText(months[i % 12], x, chartY + chartHeight + 15);
    }
    
    // Add "Forecast" label
    ctx.fillStyle = hexToRgba(colors.revenue.main, 0.8);
    ctx.textAlign = 'left';
    ctx.fillText("Forecast", chartX + chartWidth * 0.72, chartY + 15);
    
    // Add current value
    const currentValue = data[data.length - 1];
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillStyle = colors.text.primary;
    ctx.textAlign = 'left';
    ctx.fillText(`$${Math.round(currentValue).toLocaleString()}`, chartX, chartY + 16);
    
    // Add growth indicator
    const growth = ((currentValue / data[0]) - 1) * 100;
    const growthText = `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`;
    
    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = growth > 0 ? colors.revenue.main : '#FC8181';
    ctx.fillText(growthText, chartX + 120, chartY + 16);
  }
  
  function drawTrafficChart(ctx, panel) {
    const data = dashboardData.traffic.data;
    const segments = dashboardData.traffic.segments;
    
    // Chart dimensions
    const chartX = panel.x - panel.width/2 + 15;
    const chartY = panel.y - panel.height/2 + 35;
    const chartWidth = panel.width - 30;
    const chartHeight = panel.height - 60;
    
    // Draw bar chart
    const barWidth = chartWidth / data.length * 0.6;
    const spacing = chartWidth / data.length * 0.4;
    const maxValue = Math.max(...data) * 1.1;
    
    // Draw bars
    data.forEach((value, i) => {
      const barHeight = (value / maxValue) * chartHeight;
      const barX = chartX + i * (barWidth + spacing);
      const barY = chartY + chartHeight - barHeight;
      
      // Create gradient for bar
      const gradient = ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
      gradient.addColorStop(0, colors.analytics.main);
      gradient.addColorStop(1, hexToRgba(colors.analytics.main, 0.4));
      
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
      
      // Add highlight
      ctx.fillStyle = hexToRgba('#ffffff', 0.1);
      ctx.fillRect(barX + 2, barY, barWidth / 3, barHeight);
    });
    
    // Draw baseline
    ctx.beginPath();
    ctx.moveTo(chartX, chartY + chartHeight);
    ctx.lineTo(chartX + chartWidth, chartY + chartHeight);
    ctx.strokeStyle = colors.dashboard.border;
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Add traffic segmentation
    const segmentationY = chartY + chartHeight + 15;
    const segmentHeight = 12;
    let segmentX = chartX;
    
    // Draw segment bars
    segments.forEach(segment => {
      const segmentWidth = chartWidth * segment.value;
      
      // Segment bar
      ctx.fillStyle = segment.color;
      ctx.fillRect(segmentX, segmentationY, segmentWidth, segmentHeight);
      
      // Segment label (if space allows)
      if (segmentWidth > 30) {
        ctx.fillStyle = hexToRgba('#ffffff', 0.9);
        ctx.font = '9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(segment.name, segmentX + segmentWidth/2, segmentationY + segmentHeight/2);
      }
      
      segmentX += segmentWidth;
    });
    
    // Add current value and change indicator
    const currentValue = data[data.length - 1];
    const previousValue = dashboardData.traffic.previousPeriod;
    const change = ((currentValue / previousValue) - 1) * 100;
    
    // Current value
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillStyle = colors.text.primary;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(Math.round(currentValue).toLocaleString(), chartX, chartY);
    
    // Change indicator
    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = change >= 0 ? colors.analytics.main : '#FC8181';
    ctx.fillText(`${change >= 0 ? '+' : ''}${change.toFixed(1)}%`, chartX + 80, chartY);
    
    // "vs prev period" label
    ctx.font = '9px Inter, sans-serif';
    ctx.fillStyle = colors.text.muted;
    ctx.fillText('vs prev period', chartX + 130, chartY + 2);
  }
  
  function drawAppointmentsChart(ctx, panel) {
    const data = dashboardData.appointments.byDay;
    
    // Chart dimensions
    const chartX = panel.x - panel.width/2 + 15;
    const chartY = panel.y - panel.height/2 + 40;
    const chartWidth = panel.width - 30;
    const chartHeight = panel.height - 70;
    
    // Find max value
    const values = data.map(d => d.value);
    const maxValue = Math.max(...values) * 1.1;
    
    // Draw bars with curved top and gradient fill
    data.forEach((day, i) => {
      const barWidth = chartWidth / data.length * 0.7;
      const spacing = chartWidth / data.length * 0.3;
      const barHeight = (day.value / maxValue) * chartHeight;
      const barX = chartX + i * (barWidth + spacing);
      const barY = chartY + chartHeight - barHeight;
      
      // Create gradient for bar
      const gradient = ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
      
      // Alternate colors for better visualization
      if (i % 2 === 0) {
        gradient.addColorStop(0, colors.appointments.main);
        gradient.addColorStop(1, hexToRgba(colors.appointments.main, 0.4));
      } else {
        gradient.addColorStop(0, colors.appointments.light);
        gradient.addColorStop(1, hexToRgba(colors.appointments.light, 0.4));
      }
      
      // Draw bar with rounded top
      roundRect(
        ctx,
        barX,
        barY,
        barWidth,
        barHeight,
        { tl: 4, tr: 4, bl: 0, br: 0 },
        true,
        false,
        gradient
      );
      
      // Day label
      ctx.font = '10px Inter, sans-serif';
      ctx.fillStyle = colors.text.secondary;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(day.day, barX + barWidth/2, chartY + chartHeight + 5);
      
      // Value label (if bar is tall enough)
      if (barHeight > 25) {
        ctx.fillStyle = colors.text.primary;
        ctx.textBaseline = 'bottom';
        ctx.fillText(day.value.toString(), barX + barWidth/2, barY - 3);
      }
    });
    
    // Draw baseline
    ctx.beginPath();
    ctx.moveTo(chartX, chartY + chartHeight);
    ctx.lineTo(chartX + chartWidth, chartY + chartHeight);
    ctx.strokeStyle = colors.dashboard.border;
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Completion rate indicator
    const completionRate = dashboardData.appointments.completionRate;
    const circleX = panel.x + panel.width/2 - 50;
    const circleY = panel.y - panel.height/2 + 55;
    const radius = 20;
    
    // Outer circle (background)
    ctx.beginPath();
    ctx.arc(circleX, circleY, radius, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(colors.appointments.main, 0.1);
    ctx.fill();
    
    // Progress arc
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (Math.PI * 2 * completionRate);
    
    ctx.beginPath();
    ctx.arc(circleX, circleY, radius, startAngle, endAngle);
    ctx.lineTo(circleX, circleY);
    ctx.closePath();
    
    const arcGradient = ctx.createRadialGradient(circleX, circleY, 0, circleX, circleY, radius);
    arcGradient.addColorStop(0, hexToRgba(colors.appointments.light, 0.9));
    arcGradient.addColorStop(1, colors.appointments.main);
    
    ctx.fillStyle = arcGradient;
    ctx.fill();
    
    // Percentage text
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.fillStyle = colors.text.primary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.round(completionRate * 100)}%`, circleX, circleY);
    
    // Completion rate label
    ctx.font = '9px Inter, sans-serif';
    ctx.fillStyle = colors.text.secondary;
    ctx.fillText('Completion', circleX, circleY - radius - 10);
    
    // Trend indicators
    const trends = dashboardData.appointments.trends;
    if (trends && trends.length > 0) {
      const trendY = panel.y - panel.height/2 + 25;
      
      ctx.font = '9px Inter, sans-serif';
      ctx.fillStyle = colors.text.secondary;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText('Trend:', panel.x - 40, trendY);
      
      // Trend direction indicator
      const trendValue = trends[trends.length - 1];
      const trendColor = trendValue >= 0 ? colors.appointments.main : '#FC8181';
      
      ctx.font = '10px Inter, sans-serif';
      ctx.fillStyle = trendColor;
      ctx.textAlign = 'left';
      
      const trendIcon = trendValue >= 0 ? '↗' : '↘';
      const trendText = `${trendIcon} ${Math.abs(trendValue).toFixed(1)}%`;
      ctx.fillText(trendText, panel.x - 30, trendY);
    }
  }
  
  function drawPayrollChart(ctx, panel) {
    const departments = dashboardData.payroll.departments;
    const total = dashboardData.payroll.total;
    
    // Chart dimensions
    const centerX = panel.x;
    const centerY = panel.y + 5;
    const outerRadius = Math.min(panel.width, panel.height) * 0.3;
    const innerRadius = outerRadius * 0.5; // For donut chart
    
    // Draw pie/donut chart
    let startAngle = -Math.PI / 2; // Start at top
    
    // Draw the slices
    departments.forEach((dept, i) => {
      const sliceAngle = Math.PI * 2 * dept.value;
      const endAngle = startAngle + sliceAngle;
      
      // Slice path
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
      ctx.closePath();
      
      // Gradient fill
      const midAngle = startAngle + sliceAngle / 2;
      const gradientX = centerX + Math.cos(midAngle) * outerRadius * 0.5;
      const gradientY = centerY + Math.sin(midAngle) * outerRadius * 0.5;
      
      const gradient = ctx.createRadialGradient(
        gradientX, gradientY, 0,
        centerX, centerY, outerRadius
      );
      gradient.addColorStop(0, dept.color);
      gradient.addColorStop(1, hexToRgba(dept.color, 0.7));
      
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Slice border
      ctx.strokeStyle = hexToRgba('#ffffff', 0.1);
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Add label line and text if slice is large enough
      if (dept.value > 0.08) {
        const labelRadius = outerRadius * 1.2;
        const labelX = centerX + Math.cos(midAngle) * labelRadius;
        const labelY = centerY + Math.sin(midAngle) * labelRadius;
        
        // Line from slice to label
        ctx.beginPath();
        ctx.moveTo(centerX + Math.cos(midAngle) * outerRadius, centerY + Math.sin(midAngle) * outerRadius);
        ctx.lineTo(labelX, labelY);
        ctx.strokeStyle = hexToRgba(dept.color, 0.6);
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Label text
        ctx.font = '9px Inter, sans-serif';
        ctx.fillStyle = colors.text.secondary;
        ctx.textAlign = midAngle < Math.PI ? 'left' : 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(dept.name, labelX + (midAngle < Math.PI ? 5 : -5), labelY);
        
        // Percentage
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillStyle = colors.text.primary;
        ctx.fillText(`${Math.round(dept.value * 100)}%`, labelX + (midAngle < Math.PI ? 5 : -5), labelY + 12);
      }
      
      startAngle = endAngle;
    });
    
    // Draw inner circle for donut hole
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    ctx.fillStyle = colors.dashboard.panel;
    ctx.fill();
    
    // Total payroll text in center
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillStyle = colors.text.primary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`$${Math.round(total/1000)}K`, centerX, centerY - 6);
    
    // "Total" label
    ctx.font = '9px Inter, sans-serif';
    ctx.fillStyle = colors.text.secondary;
    ctx.fillText('Total', centerX, centerY + 8);
    
    // Add legend for departments too small to label directly
    const smallDepts = departments.filter(d => d.value <= 0.08);
    if (smallDepts.length > 0) {
      const legendX = panel.x - panel.width/2 + 15;
      let legendY = panel.y + panel.height/2 - 30;
      
      smallDepts.forEach(dept => {
        // Color box
        ctx.fillStyle = dept.color;
        ctx.fillRect(legendX, legendY, 8, 8);
        
        // Department name
        ctx.font = '9px Inter, sans-serif';
        ctx.fillStyle = colors.text.secondary;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(dept.name, legendX + 12, legendY + 4);
        
        // Percentage
        ctx.font = '9px Inter, sans-serif';
        ctx.fillStyle = colors.text.muted;
        ctx.textAlign = 'left';
        ctx.fillText(`${Math.round(dept.value * 100)}%`, legendX + 60, legendY + 4);
        
        legendY += 12;
      });
    }
  }
  
  // Draw system status information
  function drawSystemStatus() {
    const ctx = contexts.overlay;
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Status indicators (subtle)
    const statusX = 10;
    const statusY = height - 25;
    
    // System status indicator
    ctx.font = '10px Inter, sans-serif';
    ctx.fillStyle = colors.text.muted;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    
    let statusColor;
    switch(systemState.systemStatus) {
      case 'operational':
        statusColor = '#68D391';
        break;
      case 'degraded':
        statusColor = '#F6AD55';
        break;
      case 'error':
        statusColor = '#FC8181';
        break;
      default:
        statusColor = '#A0AEC0';
    }
    
    // Status dot
    ctx.beginPath();
    ctx.arc(statusX, statusY, 4, 0, Math.PI * 2);
    ctx.fillStyle = statusColor;
    ctx.fill();
    
    // Status text
    ctx.fillStyle = colors.text.muted;
    ctx.fillText(`System: ${systemState.systemStatus}`, statusX + 10, statusY);
    
    // Data flow rate
    const flowX = statusX + 120;
    ctx.fillText(`Flow: ${Math.round(systemState.dataFlowRate * 100)}%`, flowX, statusY);
    
    // Processing load
    const loadX = flowX + 80;
    ctx.fillText(`Load: ${Math.round(systemState.processingLoad * 100)}%`, loadX, statusY);
    
    // Time indicator
    const timeX = width - 10;
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    
    ctx.textAlign = 'right';
    ctx.fillText(timeString, timeX, statusY);
    
    // Display any system alerts
    if (systemState.alerts.length > 0) {
      const alertY = statusY - 20;
      
      ctx.fillStyle = '#FC8181';
      ctx.textAlign = 'left';
      ctx.fillText(systemState.alerts[0], statusX, alertY);
    }
  }
  
  // Draw a specialized database icon
  function drawDatabaseIcon(ctx, x, y, size) {
    // Draw database cylinder
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
    
    // Data glow effect in center
    const glowRadius = size * 0.2;
    
    ctx.beginPath();
    ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
    
    const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
    glowGradient.addColorStop(0, hexToRgba(colors.warehouse.pulse, 0.8));
    glowGradient.addColorStop(1, hexToRgba(colors.warehouse.pulse, 0));
    
    ctx.fillStyle = glowGradient;
    ctx.fill();
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
  
  // Blend two colors
  function blendColors(color1, color2, ratio) {
    // Convert hex to RGB
    const r1 = parseInt(color1.slice(1, 3), 16);
    const g1 = parseInt(color1.slice(3, 5), 16);
    const b1 = parseInt(color1.slice(5, 7), 16);
    
    const r2 = parseInt(color2.slice(1, 3), 16);
    const g2 = parseInt(color2.slice(3, 5), 16);
    const b2 = parseInt(color2.slice(5, 7), 16);
    
    // Blend colors
    const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
    const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
    const b = Math.round(b1 * (1 - ratio) + b2 * ratio);
    
    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  
  // Generate smoothed time series data
  function generateSmoothedTimeSeries(count, min, max, volatility) {
    const data = [];
    let value = min + Math.random() * (max - min) * 0.5;
    
    for (let i = 0; i < count; i++) {
      // Add random change with volatility factor
      const change = (Math.random() - 0.5) * volatility * (max - min);
      value = Math.max(min, Math.min(max, value + change));
      data.push(value);
    }
    
    return data;
  }
  
  // Forecast data based on existing trends
  function forecastData(data, periods, uncertainty) {
    if (!data || data.length < 2) return [];
    
    const forecast = [];
    const lastValue = data[data.length - 1];
    
    // Calculate average change over recent periods
    let totalChange = 0;
    for (let i = 1; i < Math.min(data.length, 4); i++) {
      totalChange += (data[data.length - i] / data[data.length - i - 1]) - 1;
    }
    const avgChange = totalChange / Math.min(data.length - 1, 3);
    
    // Generate forecast points
    let forecastValue = lastValue;
    for (let i = 0; i < periods; i++) {
      // Add trend with increasing uncertainty
      const periodUncertainty = uncertainty * (i + 1) / periods;
      const randomFactor = 1 + (Math.random() - 0.5) * periodUncertainty * 2;
      const trendFactor = 1 + avgChange;
      
      forecastValue *= trendFactor * randomFactor;
      forecast.push(forecastValue);
    }
    
    return forecast;
  }
  
  // Calculate trend percentages from data series
  function calculateTrends(data, periods) {
    if (!data || data.length < periods + 1) return [];
    
    const trends = [];
    
    // Calculate trend percentages for recent periods
    for (let i = 0; i < periods; i++) {
      const current = data[data.length - 1 - i];
      const previous = data[data.length - 2 - i];
      
      if (previous !== 0) {
        const change = ((current / previous) - 1) * 100;
        trends.push(change);
      } else {
        trends.push(0);
      }
    }
    
    return trends;
  }
  
  // Emit particles from source to warehouse
  function emitSourceParticles(deltaTime) {
    sourcePositions.forEach((source, index) => {
      const system = particleSystems.sourcesToWarehouse[index];
      if (!system) return;
      
      // Update emission timer
      system.nextEmit -= deltaTime;
      
      // Normal emission
      if (system.nextEmit <= 0) {
        // Reset timer with some variability
        const emissionRate = 100 + Math.random() * 50;
        system.nextEmit = emissionRate * (1 - system.flowRate * 0.8);
        
        // Create regular particles
        if (system.particles.length < system.maxParticles) {
          // Find connection control points
          const controls = connectionControlPoints.find(cp => cp.source === source.id);
          const controlPoints = controls ? controls.points : [];
          
          // Create new particle
          const particle = new PathParticle(
            source,
            warehousePos,
            {
              color: source.colors.main,
              controlPoints: controlPoints,
              speed: 0.0006 + Math.random() * 0.0004,
              size: 1.5 + Math.random(),
              opacity: 0.7 + Math.random() * 0.3,
              hasTrail: Math.random() > 0.6,
              dataType: source.id,
              targetColor: colors.warehouse.main
            }
          );
          
          system.particles.push(particle);
        }
      }
      
      // Occasional data packet burst
      if (Date.now() - system.lastBurst > source.burstFrequency * (1 + Math.random())) {
        if (Math.random() < system.burstProbability) {
          system.lastBurst = Date.now();
          
          // Find connection control points
          const controls = connectionControlPoints.find(cp => cp.source === source.id);
          const controlPoints = controls ? controls.points : [];
          
          // Create burst of data packets
          const burstSize = Math.floor(system.burstSize * (0.5 + Math.random()));
          for (let i = 0; i < burstSize; i++) {
            const delay = i * (100 + Math.random() * 50);
            
            setTimeout(() => {
              if (system.particles.length < system.maxParticles) {
                const packet = new PathParticle(
                  source,
                  warehousePos,
                  {
                    color: source.colors.main,
                    controlPoints: controlPoints,
                    speed: (0.001 + Math.random() * 0.0005) * system.burstSpeed,
                    size: 3 + Math.random() * 2,
                    isDataPacket: true,
                    dataType: source.id,
                    targetColor: colors.warehouse.main
                  }
                );
                
                system.particles.push(packet);
              }
            }, delay);
          }
          
          // Create system alert
          if (Math.random() > 0.7) {
            systemState.alerts.push(`Data burst detected from ${source.name}`);
            if (systemState.alerts.length > 3) {
              systemState.alerts.shift();
            }
          }
        }
      }
    });
  }
  
  // Emit particles from warehouse to dashboard
  function emitWarehouseParticles(deltaTime) {
    const system = particleSystems.warehouseToDashboard;
    
    // Update emission timer
    system.nextEmit -= deltaTime;
    
    // Regular emission
    if (system.nextEmit <= 0) {
      // Reset timer with some variability
      const emissionRate = 150 + Math.random() * 100;
      system.nextEmit = emissionRate * (1 - system.flowRate * 0.7);
      
      // Create regular particles
      if (system.particles.length < system.maxParticles) {
        // Get control points
        const controlPoints = connectionPaths.warehouseToDashboard || [];
        
        // Choose random color from data sources
        const colorSource = Math.random();
        let color;
        
        if (colorSource < 0.25) {
          color = colors.revenue.main;
        } else if (colorSource < 0.5) {
          color = colors.analytics.main;
        } else if (colorSource < 0.75) {
          color = colors.appointments.main;
        } else {
          color = colors.payroll.main;
        }
        
        // Create particle
        const particle = new PathParticle(
          warehousePos,
          dashboardPos,
          {
            color: colors.warehouse.main,
            controlPoints: controlPoints,
            speed: 0.0008 + Math.random() * 0.0004,
            size: 1.5 + Math.random(),
            opacity: 0.7 + Math.random() * 0.3,
            hasTrail: Math.random() > 0.4,
            targetColor: color
          }
        );
        
        system.particles.push(particle);
      }
    }
    
    // Occasional data packet burst
    if (Date.now() - system.lastBurst > 5000 * (1 + Math.random())) {
      if (Math.random() < system.burstProbability) {
        system.lastBurst = Date.now();
        
        // Get control points
        const controlPoints = connectionPaths.warehouseToDashboard || [];
        
        // Process data transformation
        systemState.lastTransformation = Date.now();
        
        // Create burst of data packets
        const burstSize = Math.floor(system.burstSize * (0.5 + Math.random()));
        for (let i = 0; i < burstSize; i++) {
          const delay = i * (80 + Math.random() * 40);
          
          setTimeout(() => {
            if (system.particles.length < system.maxParticles) {
              // Choose random chart type for data packet
              const chartTypes = ['revenue', 'analytics', 'appointments', 'payroll'];
              const chartType = chartTypes[Math.floor(Math.random() * chartTypes.length)];
              
              let color;
              switch(chartType) {
                case 'revenue': color = colors.revenue.main; break;
                case 'analytics': color = colors.analytics.main; break;
                case 'appointments': color = colors.appointments.main; break;
                case 'payroll': color = colors.payroll.main; break;
                default: color = '#ffffff';
              }
              
              const packet = new PathParticle(
                warehousePos,
                dashboardPos,
                {
                  color: colors.warehouse.main,
                  controlPoints: controlPoints,
                  speed: (0.0012 + Math.random() * 0.0008) * system.burstSpeed,
                  size: 3 + Math.random() * 2,
                  isDataPacket: true,
                  dataType: chartType,
                  targetColor: color
                }
              );
              
              system.particles.push(packet);
              
              // Also create destination particle for dashboard charts
              createDashboardParticle(packet, chartType);
            }
          }, delay);
        }
        
        // Update system state
        systemState.processingLoad = Math.min(1, systemState.processingLoad + 0.2);
        setTimeout(() => {
          systemState.processingLoad = Math.max(0.3, systemState.processingLoad - 0.2);
        }, 2000);
      }
    }
  }
  
  // Create particles specifically for dashboard visualization
  function createDashboardParticle(sourcePacket, chartType) {
    const width = contexts.dashboard.canvas.width;
    const height = contexts.dashboard.canvas.height;
    
    // Calculate dashboard dimensions
    const dashboardWidth = width * 0.35;
    const dashboardHeight = height * 0.75;
    
    // Target positions are based on panel locations in dashboard
    let targetX, targetY;
    let panelIndex;
    
    switch(chartType) {
      case 'revenue':
        panelIndex = 0; // top left
        break;
      case 'analytics':
        panelIndex = 1; // top right
        break;
      case 'appointments':
        panelIndex = 2; // bottom left
        break;
      case 'payroll':
        panelIndex = 3; // bottom right
        break;
      default:
        panelIndex = Math.floor(Math.random() * 4);
    }
    
    // Calculate panel position
    const panelWidth = dashboardWidth * 0.44;
    const panelHeight = (dashboardHeight - 30 - 45) / 2;
    const panelSpacing = 15;
    const headerHeight = 30;
    
    switch(panelIndex) {
      case 0: // top left
        targetX = dashboardPos.x - dashboardWidth/2 + panelWidth/2 + panelSpacing;
        targetY = dashboardPos.y - dashboardHeight/2 + headerHeight + panelHeight/2 + panelSpacing;
        break;
      case 1: // top right
        targetX = dashboardPos.x + dashboardWidth/2 - panelWidth/2 - panelSpacing;
        targetY = dashboardPos.y - dashboardHeight/2 + headerHeight + panelHeight/2 + panelSpacing;
        break;
      case 2: // bottom left
        targetX = dashboardPos.x - dashboardWidth/2 + panelWidth/2 + panelSpacing;
        targetY = dashboardPos.y + dashboardHeight/2 - panelHeight/2 - panelSpacing;
        break;
      case 3: // bottom right
        targetX = dashboardPos.x + dashboardWidth/2 - panelWidth/2 - panelSpacing;
        targetY = dashboardPos.y + dashboardHeight/2 - panelHeight/2 - panelSpacing;
        break;
    }
    
    // Add random position within chart area
    targetX += (Math.random() - 0.5) * panelWidth * 0.8;
    targetY += (Math.random() - 0.5) * panelHeight * 0.8;
    
    // Create chart particle
    let color;
    let chartTypeStr = 'generic';
    
    switch(chartType) {
      case 'revenue':
        color = colors.revenue.main;
        chartTypeStr = 'line';
        break;
      case 'analytics':
        color = colors.analytics.main;
        chartTypeStr = 'bar';
        break;
      case 'appointments':
        color = colors.appointments.main;
        chartTypeStr = 'line';
        break;
      case 'payroll':
        color = colors.payroll.main;
        chartTypeStr = 'pie';
        break;
      default:
        color = '#ffffff';
    }
    
    // Create particle with delay to match arrival time
    setTimeout(() => {
      const dashboardParticle = new DashboardParticle(
        dashboardPos.x,
        dashboardPos.y,
        chartType,
        {
          targetX: targetX,
          targetY: targetY,
          color: color,
          size: 2 + Math.random() * 1.5,
          opacity: 0.7 + Math.random() * 0.3,
          chartType: chartTypeStr,
          dataValue: Math.random() * 100,
          speed: 0.01 + Math.random() * 0.01,
          lifetime: 3000 + Math.random() * 2000
        }
      );
      
      // Add to chart-specific array
      if (!particleSystems.dashboardCharts) {
        particleSystems.dashboardCharts = [];
      }
      
      particleSystems.dashboardCharts.push(dashboardParticle);
      
      // Update chart data occasionally
      if (Math.random() > 0.7) {
        updateChartData(chartType);
      }
    }, 1200); // Delay for arrival at dashboard
  }
  
  // Update chart data (for real-time effect)
  function updateChartData(chartType) {
    switch(chartType) {
      case 'revenue':
        const revData = dashboardData.revenue.data;
        const lastRev = revData[revData.length - 1];
        const revChange = lastRev * 0.05 * (Math.random() - 0.5);
        revData.push(lastRev + revChange);
        revData.shift();
        dashboardData.revenue.forecast = forecastData(revData, 4, 0.2);
        break;
        
      case 'analytics':
        const trafData = dashboardData.traffic.data;
        const lastTraf = trafData[trafData.length - 1];
        const trafChange = lastTraf * 0.08 * (Math.random() - 0.4);
        trafData.push(lastTraf + trafChange);
        trafData.shift();
        
        // Occasionally update segments
        if (Math.random() > 0.8) {
          dashboardData.traffic.segments.forEach(segment => {
            segment.value += (Math.random() - 0.5) * 0.02;
            segment.value = Math.max(0.05, Math.min(0.5, segment.value));
          });
          
          // Normalize to ensure total is 1
          const total = dashboardData.traffic.segments.reduce((sum, seg) => sum + seg.value, 0);
          dashboardData.traffic.segments.forEach(segment => {
            segment.value = segment.value / total;
          });
        }
        break;
        
      case 'appointments':
        const apptData = dashboardData.appointments.byDay;
        apptData.forEach(day => {
          day.value += Math.floor((Math.random() - 0.5) * 6);
          day.value = Math.max(10, day.value);
        });
        
        dashboardData.appointments.completionRate += (Math.random() - 0.5) * 0.02;
        dashboardData.appointments.completionRate = Math.max(0.7, Math.min(0.98, dashboardData.appointments.completionRate));
        
        dashboardData.appointments.trends = calculateTrends(
          apptData.map(d => d.value),
          3
        );
        break;
        
      case 'payroll':
        // Occasionally update department allocations
        const depts = dashboardData.payroll.departments;
        
        depts.forEach(dept => {
          dept.value += (Math.random() - 0.5) * 0.02;
          dept.value = Math.max(0.05, Math.min(0.5, dept.value));
        });
        
        // Normalize to ensure total is 1
        const total = depts.reduce((sum, dept) => sum + dept.value, 0);
        depts.forEach(dept => {
          dept.value = dept.value / total;
        });
        
        // Update total payroll occasionally
        if (Math.random() > 0.7) {
          dashboardData.payroll.total += (Math.random() - 0.4) * 5000;
          dashboardData.payroll.total = Math.max(300000, dashboardData.payroll.total);
        }
        break;
    }
    
    // Redraw background with updated chart data
    drawStaticElements();
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
    
    // Dashboard chart particles
    if (particleSystems.dashboardCharts) {
      for (let i = particleSystems.dashboardCharts.length - 1; i >= 0; i--) {
        const particle = particleSystems.dashboardCharts[i];
        
        particle.update(deltaTime);
        
        if (particle.dead) {
          particleSystems.dashboardCharts.splice(i, 1);
        }
      }
    }
    
    // Emit new particles
    emitSourceParticles(deltaTime);
    emitWarehouseParticles(deltaTime);
  }
  
  // Draw all particles
  function drawParticles() {
    const ctx = contexts.particles;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Enable glow effects for particles
    ctx.shadowBlur = 5;
    ctx.globalCompositeOperation = 'lighter';
    
    // Draw source to warehouse particles
    particleSystems.sourcesToWarehouse.forEach(system => {
      system.particles.forEach(particle => {
        ctx.shadowColor = particle.color;
        particle.draw(ctx);
      });
    });
    
    // Draw warehouse to dashboard particles
    particleSystems.warehouseToDashboard.particles.forEach(particle => {
      ctx.shadowColor = particle.color;
      particle.draw(ctx);
    });
    
    // Draw dashboard chart particles
    if (particleSystems.dashboardCharts) {
      particleSystems.dashboardCharts.forEach(particle => {
        ctx.shadowColor = particle.color;
        particle.draw(ctx);
      });
    }
    
    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowBlur = 0;
  }
  
  // Draw warehouse pulse effect
  function drawWarehousePulse() {
    const ctx = contexts.overlay;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Get time-based pulse
    const pulseLevel = Math.sin(Date.now() * 0.002) * 0.5 + 0.5;
    const pulseSize = Math.sin(Date.now() * 0.001) * 0.3 + 0.7;
    
    // Draw pulse rings around warehouse
    const x = warehousePos.x;
    const y = warehousePos.y;
    const baseRadius = Math.min(ctx.canvas.width, ctx.canvas.height) * 0.06;
    
    // Outer pulse ring
    ctx.beginPath();
    ctx.arc(x, y, baseRadius * (1.5 + pulseSize), 0, Math.PI * 2);
    ctx.strokeStyle = hexToRgba(colors.warehouse.pulse, 0.1 * pulseLevel);
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Middle pulse ring
    ctx.beginPath();
    ctx.arc(x, y, baseRadius * (1.2 + pulseSize * 0.7), 0, Math.PI * 2);
    ctx.strokeStyle = hexToRgba(colors.warehouse.pulse, 0.2 * pulseLevel);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Inner glow
    ctx.beginPath();
    ctx.arc(x, y, baseRadius, 0, Math.PI * 2);
    
    const innerGlow = ctx.createRadialGradient(x, y, 0, x, y, baseRadius);
    innerGlow.addColorStop(0, hexToRgba(colors.warehouse.pulse, 0.1 + 0.1 * pulseLevel));
    innerGlow.addColorStop(1, hexToRgba(colors.warehouse.pulse, 0));
    
    ctx.fillStyle = innerGlow;
    ctx.fill();
    
    // Occasionally show data processing burst
    if (Date.now() - systemState.lastTransformation < 1000) {
      const burstProgress = 1 - (Date.now() - systemState.lastTransformation) / 1000;
      
      ctx.beginPath();
      ctx.arc(x, y, baseRadius * (1 + burstProgress * 2), 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(colors.warehouse.pulse, 0.2 * burstProgress);
      ctx.fill();
      
      // Add some particle burst effects
      const numParticles = 12;
      const angleStep = (Math.PI * 2) / numParticles;
      
      for (let i = 0; i < numParticles; i++) {
        const angle = i * angleStep;
        const distance = baseRadius * (1 + burstProgress * 3);
        
        const particleX = x + Math.cos(angle) * distance;
        const particleY = y + Math.sin(angle) * distance;
        const particleSize = (1 - burstProgress) * 4;
        
        ctx.beginPath();
        ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(colors.warehouse.pulse, burstProgress * 0.8);
        ctx.fill();
      }
    }
  }
  
  // Animation variables
  let lastFrameTime = 0;
  let animationId;
  
  // Main animation loop
  function animate(timestamp) {
    // Calculate delta time
    const deltaTime = timestamp - lastFrameTime;
    lastFrameTime = timestamp;
    
    // Only update if delta is reasonable (prevents huge jumps after tab switching)
    const validDelta = deltaTime < 1000 ? deltaTime : 16;
    
    // Update particles
    updateParticles(validDelta);
    
    // Draw particles
    drawParticles();
    
    // Draw warehouse pulse effects
    drawWarehousePulse();
    
    // Slowly decay system load and occasionally change
    systemState.processingLoad *= 0.999;
    if (Math.random() > 0.995) {
      systemState.processingLoad += (Math.random() - 0.5) * 0.1;
      systemState.processingLoad = Math.max(0.3, Math.min(0.9, systemState.processingLoad));
    }
    
    // Slowly adjust data flow rate occasionally
    if (Math.random() > 0.997) {
      systemState.dataFlowRate += (Math.random() - 0.5) * 0.15;
      systemState.dataFlowRate = Math.max(0.4, Math.min(0.95, systemState.dataFlowRate));
      
      // Update flow rates in particle systems
      particleSystems.sourcesToWarehouse.forEach(system => {
        system.flowRate = system.flowRate * 0.8 + systemState.dataFlowRate * 0.2;
      });
      
      particleSystems.warehouseToDashboard.flowRate = 
        particleSystems.warehouseToDashboard.flowRate * 0.8 + systemState.dataFlowRate * 0.2;
    }
    
    // Occasionally add/remove system alerts
    if (Math.random() > 0.998) {
      // 50/50 chance to add or remove alert
      if (Math.random() > 0.5 && systemState.alerts.length < 3) {
        const alertTypes = [
          "Data velocity increase detected",
          "Processing optimization complete",
          "Schema update applied",
          "ETL process completed",
          "API rate limit approaching",
          "Cache optimization applied"
        ];
        
        systemState.alerts.push(alertTypes[Math.floor(Math.random() * alertTypes.length)]);
      } else if (systemState.alerts.length > 0) {
        systemState.alerts.shift();
      }
    }
    
    // Update system status display
    drawSystemStatus();
    
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
  
  // Cleanup function for page unload or component unmount
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