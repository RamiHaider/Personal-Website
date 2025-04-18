document.addEventListener('DOMContentLoaded', function() {
    // Target the white content area to exclude it
    const contentArea = document.querySelector('.main-content-wrapper'); 
    const stars = [];
    let lastMouseX = 0;
    let lastMouseY = 0;

    // Debug: Log the content area position
    if (contentArea) {
        console.log('Content Area (to exclude) position:', contentArea.getBoundingClientRect());
    } else {
        console.error('.main-content-wrapper element not found!');
    }

    function createStar(x, y) {
        // Create multiple stars in a wider radius around the mouse
        const numStars = Math.floor(Math.random() * 5) + 4; // 4-8 stars per movement
        for (let i = 0; i < numStars; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            
            // Randomly assign a shape and color
            const shapes = ['shape1', 'shape2', 'shape3', 'shape4', 'shape5'];
            const colors = ['color1', 'color2', 'color3', 'color4', 'color5'];
            star.classList.add(shapes[Math.floor(Math.random() * shapes.length)]);
            star.classList.add(colors[Math.floor(Math.random() * colors.length)]);
            
            // Increased random offset from mouse position (within 40px radius)
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 40; 
            const offsetX = Math.cos(angle) * radius;
            const offsetY = Math.sin(angle) * radius;
            
            // Position the star
            star.style.left = `${x + offsetX}px`;
            star.style.top = `${y + offsetY}px`;
            
            // Random rotation
            star.style.transform = `rotate(${Math.random() * 360}deg)`;
            
            document.body.appendChild(star);
            stars.push(star);
            
            // Fade in
            setTimeout(() => {
                star.classList.add('visible');
            }, 10);
            
            // Remove star after animation
            setTimeout(() => {
                star.classList.remove('visible');
                setTimeout(() => {
                    star.remove();
                    stars.splice(stars.indexOf(star), 1);
                }, 500);
            }, 800);
        }
    }

    function isInBackground(x, y) {
        if (!contentArea) return true; // If content area not found, assume background
        
        const rect = contentArea.getBoundingClientRect();
        // Return true if the point (x, y) is *outside* the content area rectangle
        return x < rect.left || x > rect.right || y < rect.top || y > rect.bottom;
    }

    // Generate random stars every 200ms in the background
    setInterval(() => {
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        if (isInBackground(x, y)) {
            createStar(x, y);
        }
    }, 200);

    document.addEventListener('mousemove', (e) => {
        if (isInBackground(e.clientX, e.clientY)) {
            // Calculate distance from last star
            const distance = Math.sqrt(
                Math.pow(e.clientX - lastMouseX, 2) + 
                Math.pow(e.clientY - lastMouseY, 2)
            );
            
            // Create stars based on mouse movement speed
            if (distance > 5) {
                createStar(e.clientX, e.clientY);
                lastMouseX = e.clientX;
                lastMouseY = e.clientY;
            }
        }
    });
}); 