document.addEventListener('DOMContentLoaded', function() {
    const titles = [
        "Data Scientist",
        "Data Geoscientist",
        "Machine Learning Engineer",
        "Fullstack Developer",
        "Professional Geologist"
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
            // Special handling for Data Geoscientist when deleting
            if (currentIndex === 1) {
                if (charIndex > 8) {
                    // If we're deleting after "Geo", keep the styling
                    text = text.substring(0, 5) + "<span style='color:#A4A155;'>Geo</span>" + titleToUse.substring(8, charIndex - 1);
                } else if (charIndex === 8) {
                    // When "scientist" is completely deleted
                    text = text.substring(0, 5) + "<span style='color:#A4A155;'>Geo</span>";
                } else if (charIndex === 7) {
                    // When deleting "Geo" -> "Ge"
                    text = text.substring(0, 5) + "<span style='color:#A4A155;'>Ge</span>";
                } else if (charIndex === 6) {
                    // When deleting "Ge" -> "G"
                    text = text.substring(0, 5) + "<span style='color:#A4A155;'>G</span>";
                } else if (charIndex === 5) {
                    // When deleting "G" (moving to just "Data ")
                    text = "Data ";
                } else {
                    // Regular deletion for "Data "
                    text = text.substring(0, text.length - 1);
                }
            } else {
                // Regular deletion for other titles
                text = text.substring(0, text.length - 1);
            }
            charIndex--;
        } else {
            // Add a character
            if (currentIndex === 1 && charIndex >= 5 && charIndex <= 7) {
                // For "Geo" in "Data Geoscientist", handle specially
                const nextChar = titleToUse.charAt(charIndex);
                
                // If we're adding a character from "Geo", style it
                if (charIndex === 5) {
                    text = text.substring(0, 5) + "<span style='color:#A4A155;'>G</span>";
                } else if (charIndex === 6) {
                    text = text.substring(0, 5) + "<span style='color:#A4A155;'>Ge</span>";
                } else if (charIndex === 7) {
                    text = text.substring(0, 5) + "<span style='color:#A4A155;'>Geo</span>";
                }
            } else if (currentIndex === 1 && charIndex > 7) {
                // For letters after "Geo", preserve the styling
                const nextChar = titleToUse.charAt(charIndex);
                text = text.substring(0, 5) + "<span style='color:#A4A155;'>Geo</span>" + titleToUse.substring(8, charIndex + 1);
            } else {
                // Regular typing for other parts
                text = titleToUse.substring(0, charIndex + 1);
            }
            charIndex++;
        }
        
        // Update the display text
        if (currentIndex === 1) {
            // For "Data Geoscientist" with special styling
            dynamicTitleElement.innerHTML = text;
        } else {
            // For regular text
            dynamicTitleElement.textContent = text;
        }
        
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