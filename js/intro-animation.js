document.addEventListener('DOMContentLoaded', function() {
    const titles = [
        { text: "Data Engineer", deleteToPrefix: "Data " },
        { text: "Data Scientist", deleteToPrefix: "" }, // Delete completely
        { text: "Machine Learning Engineer", deleteToPrefix: "" }, // Delete completely
        { text: "Fullstack Developer", deleteToPrefix: "" } // Delete completely
    ];
    
    const dynamicTitleElement = document.getElementById('dynamic-title');
    // const cursorElement = document.querySelector('.cursor'); // Cursor element not explicitly used in this logic for now

    let titleIndex = 0;
    let charIndex = 0; // Represents the length of the string currently displayed from the full text
    let isDeleting = false;
    let isPaused = false; // To handle pause after typing/deleting before switching

    function typeEffect() {
        if (isPaused) return;

        const currentTitleObject = titles[titleIndex];
        const fullText = currentTitleObject.text;
        const deleteToPrefixText = currentTitleObject.deleteToPrefix;

        let currentVisibleText = dynamicTitleElement.textContent;

        if (isDeleting) {
            // Deleting characters
            currentVisibleText = fullText.substring(0, charIndex - 1);
            charIndex--;
            dynamicTitleElement.textContent = currentVisibleText;

            if (currentVisibleText === deleteToPrefixText) {
                // Finished deleting to the target prefix (or empty)
                isDeleting = false;
                isPaused = true;
                setTimeout(() => {
                    titleIndex = (titleIndex + 1) % titles.length;
                    const nextTitleObject = titles[titleIndex];
                    // Setup for the next title
                    // If next title starts with the prefix we just deleted to, charIndex should be its length
                    if (nextTitleObject.text.startsWith(deleteToPrefixText) && deleteToPrefixText !== "") {
                        charIndex = deleteToPrefixText.length;
                        dynamicTitleElement.textContent = deleteToPrefixText;
                    } else {
                        charIndex = 0; // Start typing from scratch
                        dynamicTitleElement.textContent = ""; // Clear display if no common prefix
                    }
                    isPaused = false;
                    typeEffect(); // Continue with the next title
                }, 700); // Pause after deleting before starting next
                return;
            }
        } else {
            // Typing characters
            // If charIndex is 0 and deleteToPrefixText is not empty, and we're at a "Data X" stage, start with "Data "
            if (charIndex === 0 && dynamicTitleElement.textContent === "" && fullText.startsWith(deleteToPrefixText) && deleteToPrefixText !== "") {
                 dynamicTitleElement.textContent = deleteToPrefixText;
                 charIndex = deleteToPrefixText.length;
            }


            currentVisibleText = fullText.substring(0, charIndex + 1);
            charIndex++;
            dynamicTitleElement.textContent = currentVisibleText;

            if (currentVisibleText === fullText) {
                // Finished typing the full text
                isDeleting = true;
                isPaused = true;
                setTimeout(() => {
                    isPaused = false;
                    typeEffect(); // Start deleting after pause
                }, 1500); // Pause after typing full title
                return;
            }
        }

        let typeSpeed = isDeleting ? 60 : 110;
        const randomFactor = Math.random() * 0.5 + 0.75;
        typeSpeed = Math.floor(typeSpeed * randomFactor);

        setTimeout(typeEffect, typeSpeed);
    }

    if (dynamicTitleElement) {
        // Initial setup: If first title is "Data Engineer", start with "Data " displayed
        if (titles.length > 0 && titles[0].text === "Data Engineer") {
            dynamicTitleElement.textContent = "Data ";
            charIndex = "Data ".length;
        }
        setTimeout(typeEffect, 500); // Initial delay
    } else {
        console.error("Element with ID 'dynamic-title' not found.");
    }
}); 