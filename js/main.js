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

    // Determine if we're in a subdirectory by checking path segments
    // Remove leading slash and split by '/'
    const pathSegments = currentPath.replace(/^\//, '').split('/').filter(Boolean);

    // If we have more than one segment (e.g., "blog/index.html" or just "blog/")
    // or if we have one segment that's not empty and not a file at root,
    // we need to go up one level
    const isInSubdirectory = pathSegments.length > 1 ||
        (pathSegments.length === 1 && !pathSegments[0].endsWith('.html'));

    const rootPath = isInSubdirectory
        ? '../components/header.html'
        : 'components/header.html';

    // Load the header component
    loadComponent('header', rootPath);
});