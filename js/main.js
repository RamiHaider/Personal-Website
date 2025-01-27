document.addEventListener('DOMContentLoaded', function() {
    // Add debugging for path resolution
    console.log('=== Path Debug ===');
    console.log('Current Path:', window.location.pathname);
    console.log('Hostname:', window.location.hostname);
    
    function loadComponent(id, url) {
        const element = document.getElementById(id);
        if (element) {
            console.log(`Loading component: ${url}`);
            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.text();
                })
                .then(data => {
                    element.innerHTML = data;
                })
                .catch(error => {
                    console.error('Error:', error);
                    element.innerHTML = `Error loading ${id}. Please refresh.`;
                });
        }
    }

    // Get the current path
    const currentPath = window.location.pathname;
    
    // Determine the root path based on the current page
    const rootPath = currentPath.includes('/') && !currentPath.endsWith('index.html') 
        ? '../components/header.html' 
        : 'components/header.html';

    // Load the header component
    loadComponent('header', rootPath);
});