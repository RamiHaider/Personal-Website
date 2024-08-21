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

    const rootPath = window.location.pathname.startsWith('/data-science') ||
                     window.location.pathname.startsWith('/programming') ||
                     window.location.pathname.startsWith('/math') ||
                     window.location.pathname.startsWith('/ux-ui')
        ? '../'
        : './';

    loadComponent('header', `${rootPath}components/header.html`);
    loadComponent('recent', `${rootPath}components/recent.html`);
});