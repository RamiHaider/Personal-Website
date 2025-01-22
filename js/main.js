document.addEventListener('DOMContentLoaded', function() {
    function loadComponent(id, url) {
        const element = document.getElementById(id);
        if (element) {
            fetch(url)
                .then(response => response.text())
                .then(data => {
                    element.innerHTML = data;
                })
                .catch(error => {
                    console.error('Error loading component:', error);
                    element.innerHTML = `Error loading ${id}. Please refresh the page.`;
                });
        }
    }

    // Update path resolution to handle both blog and portfolio directories
    const rootPath = window.location.pathname.includes('/blog/') || window.location.pathname.includes('/portfolio/') ? '../' : './';
    loadComponent('header', `${rootPath}components/header.html`);
});