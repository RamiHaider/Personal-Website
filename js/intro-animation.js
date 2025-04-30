document.addEventListener('DOMContentLoaded', function() {
    const titles = [
        "Machine Learning Engineer",
        "Fullstack Developer",
        "Data Scientist"
    ];
    
    const dynamicTitleElement = document.getElementById('dynamic-title');
    const cursorElement = document.querySelector('.cursor');
    
    let currentIndex = 0;
    let isDeleting = false;
    let text = '';
    let charIndex = 0;
    
    function typeEffect() {
        const currentTitle = titles[currentIndex];
        const titleToUse = currentTitle;
        
        // Determine if we're adding or removing characters
        if (isDeleting) {
            text = titleToUse.substring(0, text.length - 1);
            charIndex--;
        } else {
            text = titleToUse.substring(0, charIndex + 1);
            charIndex++;
        }
        
        // Update the display text
        dynamicTitleElement.textContent = text;
        
        // Calculate typing speed with randomization for realism
        let typeSpeed = isDeleting ? 30 : 80; // Faster overall
        
        // Add randomization to typing speed (±30%)
        const randomFactor = Math.random() * 0.6 + 0.7; // 0.7 to 1.3
        typeSpeed = Math.floor(typeSpeed * randomFactor);
        
        // Check if word is complete or empty
        if (!isDeleting && charIndex === titleToUse.length) {
            // Word is complete, wait before starting to delete
            typeSpeed = 1200; // Wait 1.2 seconds
            isDeleting = true;
        } else if (isDeleting && text.length === 0) {
            // Word is deleted, move to next word
            isDeleting = false;
            currentIndex = (currentIndex + 1) % titles.length;
            charIndex = 0;
            // Shorter pause between words
            typeSpeed = 300;
        }
        
        // Continue the animation
        setTimeout(typeEffect, typeSpeed);
    }
    
    // Start the typing effect
    if (dynamicTitleElement) {
        setTimeout(typeEffect, 500); // Start after 0.5 seconds
    } else {
        console.error("Element with ID 'dynamic-title' not found.");
    }
}); 