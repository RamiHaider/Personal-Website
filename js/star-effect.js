document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.container');
    const stars = [];
    let lastMouseX = 0;
    let lastMouseY = 0;

    function createStar(x, y) {
        // Create multiple stars in a small radius around the mouse
        const numStars = Math.floor(Math.random() * 5) + 4; // 4-8 stars per movement
        for (let i = 0; i < numStars; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            
            // Randomly assign a shape and color
            const shapes = ['shape1', 'shape2', 'shape3', 'shape4', 'shape5'];
            const colors = ['color1', 'color2', 'color3', 'color4', 'color5'];
            star.classList.add(shapes[Math.floor(Math.random() * shapes.length)]);
            star.classList.add(colors[Math.floor(Math.random() * colors.length)]);
            
            // Random offset from mouse position (within 20px radius)
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 20;
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

    function isOutsideContainer(x, y) {
        const rect = container.getBoundingClientRect();
        return x < rect.left || x > rect.right || y < rect.top || y > rect.bottom;
    }

    // Generate random stars every 200ms
    setInterval(() => {
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        if (isOutsideContainer(x, y)) {
            createStar(x, y);
        }
    }, 200);

    document.addEventListener('mousemove', (e) => {
        if (isOutsideContainer(e.clientX, e.clientY)) {
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