document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.time-series-container');
    if (!container) return;

    // Chart dimensions
    const margin = { top: 20, right: 30, bottom: 30, left: 50 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create SVG
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", width + margin.left + margin.right);
    svg.setAttribute("height", height + margin.top + margin.bottom);
    svg.setAttribute("class", "overflow-visible");
    
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${margin.left}, ${margin.top})`);
    svg.appendChild(g);
    container.appendChild(svg);

    // Generate mock data
    const generateData = () => {
        const points = 200;
        const data = [];
        const anomalies = [];
        
        for (let i = 0; i < points; i++) {
            const x = i;
            let y = Math.sin(i / 10) * 10 + Math.sin(i / 5) * 5;
            y += (Math.random() * 4) - 2;
            
            if (i === 80) {
                y += 25; // First anomaly: high point
                anomalies.push({ index: i, value: y });
            } else if (i === 150) {
                y -= 15; // Second anomaly: low point, half as steep
                anomalies.push({ index: i, value: y });
            }
            
            data.push({ x, y, isAnomaly: anomalies.some(a => a.index === i) });
        }
        
        return { data, anomalies };
    };

    // Animation variables
    let visibleData = [];
    let counter = 0;
    let isRunning = true;
    let animationFrame;

    // Scales
    const xScale = (x) => (x / 200) * width;
    const yScale = (y) => height - ((y + 40) / 80) * height;

    // Draw axes
    function drawAxes() {
        // X axis
        const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
        xAxis.setAttribute("x1", "0");
        xAxis.setAttribute("y1", height);
        xAxis.setAttribute("x2", width);
        xAxis.setAttribute("y2", height);
        xAxis.setAttribute("stroke", "#4B5563");
        xAxis.setAttribute("stroke-width", "1");
        g.appendChild(xAxis);

        // Y axis
        const yAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
        yAxis.setAttribute("x1", "0");
        yAxis.setAttribute("y1", "0");
        yAxis.setAttribute("x2", "0");
        yAxis.setAttribute("y2", height);
        yAxis.setAttribute("stroke", "#4B5563");
        yAxis.setAttribute("stroke-width", "1");
        g.appendChild(yAxis);

        // Grid lines
        [0, 0.25, 0.5, 0.75, 1].forEach(tick => {
            const gridY = document.createElementNS("http://www.w3.org/2000/svg", "line");
            gridY.setAttribute("x1", "0");
            gridY.setAttribute("y1", height * tick);
            gridY.setAttribute("x2", width);
            gridY.setAttribute("y2", height * tick);
            gridY.setAttribute("stroke", "#374151");
            gridY.setAttribute("stroke-width", "1");
            gridY.setAttribute("stroke-dasharray", "4,4");
            g.appendChild(gridY);

            const gridX = document.createElementNS("http://www.w3.org/2000/svg", "line");
            gridX.setAttribute("x1", width * tick);
            gridX.setAttribute("y1", "0");
            gridX.setAttribute("x2", width * tick);
            gridX.setAttribute("y2", height);
            gridX.setAttribute("stroke", "#374151");
            gridX.setAttribute("stroke-width", "1");
            gridX.setAttribute("stroke-dasharray", "4,4");
            g.appendChild(gridX);
        });
    }

    // Draw data points
    function drawData() {
        // Clear previous data
        const existingData = g.querySelectorAll('.data-point, .anomaly-point, .line-path');
        existingData.forEach(el => el.remove());

        if (visibleData.length === 0) return;

        // Draw line
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const pathData = visibleData.map((point, i) => {
            const x = xScale(point.x);
            const y = yScale(point.y);
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');
        
        path.setAttribute("d", pathData);
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "#3B82F6");
        path.setAttribute("stroke-width", "2");
        path.setAttribute("class", "line-path");
        g.appendChild(path);

        // Draw points
        visibleData.forEach((point, i) => {
            if (point.isAnomaly) {
                // Anomaly point
                const anomaly = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                anomaly.setAttribute("cx", xScale(point.x));
                anomaly.setAttribute("cy", yScale(point.y));
                anomaly.setAttribute("r", "6");
                anomaly.setAttribute("fill", "#EF4444");
                anomaly.setAttribute("stroke", "#FFFFFF");
                anomaly.setAttribute("stroke-width", "2");
                anomaly.setAttribute("class", "anomaly-point");
                g.appendChild(anomaly);
            } else {
                // Normal point
                const normalPoint = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                normalPoint.setAttribute("cx", xScale(point.x));
                normalPoint.setAttribute("cy", yScale(point.y));
                normalPoint.setAttribute("r", "2");
                normalPoint.setAttribute("fill", "#60A5FA");
                normalPoint.setAttribute("opacity", "0.7");
                normalPoint.setAttribute("class", "data-point");
                g.appendChild(normalPoint);
            }
        });
    }

    // Animation loop
    function animate() {
        if (!isRunning) return;

        const { data } = generateData();
        
        if (counter < data.length) {
            visibleData.push(data[counter]);
            counter++;
            drawData();
            // Slow down the animation by reducing the frame rate
            setTimeout(() => {
                animationFrame = requestAnimationFrame(animate);
            }, 50); // Added delay between frames
        } else {
            // Reset and restart
            visibleData = [];
            counter = 0;
            drawData();
            setTimeout(() => {
                animate();
            }, 50);
        }
    }

    // Initialize
    drawAxes();
    animate();

    // Add controls
    const controls = document.createElement('div');
    controls.className = 'flex justify-between items-center mt-4 text-xs text-gray-400';
    controls.innerHTML = `
        <div>High-Frequency Data Analysis • Deep Learning</div>
        <div>LSTM Neural Network Model</div>
    `;
    container.appendChild(controls);
}); 