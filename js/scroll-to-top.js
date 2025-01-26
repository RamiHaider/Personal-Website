document.addEventListener('DOMContentLoaded', function() {
    // Get the button
    const scrollToTopButton = document.querySelector('.scroll-to-top');

    // Show button when user scrolls down 20px from top
    window.onscroll = function() {
        if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
            scrollToTopButton.style.display = "flex";
        } else {
            scrollToTopButton.style.display = "none";
        }
    };

    // Smooth scroll to top when button is clicked
    scrollToTopButton.addEventListener('click', function(e) {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}); 