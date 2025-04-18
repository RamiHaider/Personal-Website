document.addEventListener('DOMContentLoaded', function() {
    const titles = [
        "Data Scientist",
        "Data Geoscientist",
        "Machine Learning Engineer",
        "Fullstack Developer"
    ];
    
    const dynamicTitleElement = document.getElementById('dynamic-title');
    const cursorElement = document.querySelector('.cursor');
    
    let currentIndex = 0;
    let isDeleting = false;
    let text = '';
    let charIndex = 0;
    
    function typeEffect() {
        const currentTitle = titles[currentIndex];
        
        // Determine if we're adding or removing characters
        if (isDeleting) {
            // Remove a character
            text = currentTitle.substring(0, charIndex - 1);
            charIndex--;
        } else {
            // Add a character
            text = currentTitle.substring(0, charIndex + 1);
            charIndex++;
        }
        
        // Update the text
        dynamicTitleElement.textContent = text;
        
        // Calculate typing speed with randomization for realism
        let typeSpeed = isDeleting ? 50 : 120; // Faster when deleting
        
        // Add randomization to typing speed (±30%)
        const randomFactor = Math.random() * 0.6 + 0.7; // 0.7 to 1.3
        typeSpeed = Math.floor(typeSpeed * randomFactor);
        
        // Check if word is complete or empty
        if (!isDeleting && charIndex === currentTitle.length) {
            // Word is complete, wait longer before starting to delete
            typeSpeed = 1500; // Wait 1.5 seconds
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            // Word is deleted, move to next word
            isDeleting = false;
            currentIndex = (currentIndex + 1) % titles.length;
            // Longer pause between words
            typeSpeed = 500;
        }
        
        // Continue the animation
        setTimeout(typeEffect, typeSpeed);
    }
    
    // Start the typing effect
    if (dynamicTitleElement) {
        setTimeout(typeEffect, 1000); // Start after 1 second
    } else {
        console.error("Element with ID 'dynamic-title' not found.");
    }
}); 