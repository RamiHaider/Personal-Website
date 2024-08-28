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

    const rootPath = window.location.pathname.startsWith('/blog') ? '../' : './';
    loadComponent('header', `${rootPath}components/header.html`);
});