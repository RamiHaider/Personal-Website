// Simple Output Prediction Static Visualization
function drawOutputPrediction() {
    const canvas = document.getElementById('outputPredictionCanvas');
    if (!canvas) {
        console.error('Output prediction canvas not found');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    
    // Layout parameters
    const hidden3X = 100;
    const outputX = 400;
    const startY = 50;
    const endY = height - 50;
    
    // Hidden 3 layer positions (8 neurons)
    const hidden3Positions = [];
    const hidden3Spacing = (endY - startY) / 7; // 8 neurons, 7 gaps
    for (let i = 0; i < 8; i++) {
        hidden3Positions.push({
            x: hidden3X,
            y: startY + i * hidden3Spacing,
            radius: 8
        });
    }
    
    // Output layer positions (3 neurons)
    const outputPositions = [];
    const outputSpacing = (endY - startY) / 2; // 3 neurons, 2 gaps
    const minerals = ['Gold', 'Copper', 'Silver'];
    const scores = [0.78, 0.52, 0.31];
    
    for (let i = 0; i < 3; i++) {
        outputPositions.push({
            x: outputX,
            y: startY + i * outputSpacing,
            radius: 12,
            label: minerals[i],
            score: scores[i]
        });
    }
    
    // Draw connections
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.7)';
    ctx.lineWidth = 1;
    
    hidden3Positions.forEach(hidden => {
        outputPositions.forEach(output => {
            ctx.beginPath();
            ctx.moveTo(hidden.x + hidden.radius, hidden.y);
            ctx.lineTo(output.x - output.radius, output.y);
            ctx.stroke();
        });
    });
    
    // Draw Hidden 3 neurons
    ctx.fillStyle = 'rgba(200, 200, 200, 0.8)';
    ctx.strokeStyle = '#999999';
    ctx.lineWidth = 1;
    
    hidden3Positions.forEach(pos => {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, pos.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    });
    
    // Hidden 3 label
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Hidden 3', hidden3X, height - 15);
    ctx.font = '10px Arial';
    ctx.fillText('(8)', hidden3X, height - 3);
    
    // Draw Output neurons
    outputPositions.forEach((pos, i) => {
        // Neuron circle
        ctx.fillStyle = 'rgba(200, 200, 200, 0.8)';
        ctx.strokeStyle = '#999999';
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, pos.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Mineral label
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(pos.label, pos.x + pos.radius + 15, pos.y + 5);
        
        // Score
        ctx.fillStyle = '#666666';
        ctx.font = '12px Arial';
        ctx.fillText(`${(pos.score * 100).toFixed(0)}%`, pos.x + pos.radius + 15, pos.y + 20);
    });
    
    // Output label
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Output', outputX, height - 15);
    ctx.font = '10px Arial';
    ctx.fillText('(3)', outputX, height - 3);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    drawOutputPrediction();
}); 