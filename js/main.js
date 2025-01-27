document.addEventListener('DOMContentLoaded', function() {
    function loadComponent(id, url) {
        const element = document.getElementById(id);
        if (element) {
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
                    console.error('Error loading component:', error);
                    element.innerHTML = `Error loading ${id}. Please refresh the page.`;
                });
        }
    }

    // Get the current path
    const currentPath = window.location.pathname;
    
    // Check if we're on GitHub Pages
    const isGitHubPages = window.location.hostname.includes('github.io');
    
    // Determine the root path
    let rootPath = './';
    if (currentPath.includes('/blog/') || currentPath.includes('/portfolio/') || currentPath.includes('/activities/')) {
        rootPath = '../';
    }
    
    // If on GitHub Pages and there's a repository name in the path, adjust accordingly
    if (isGitHubPages) {
        const repoName = currentPath.split('/')[1]; // This will get the repository name if it exists
        if (repoName && repoName !== '') {
            rootPath = currentPath.includes('/blog/') || currentPath.includes('/portfolio/') 
                ? `/${repoName}/` 
                : './';
        }
    }

    loadComponent('header', `${rootPath}components/header.html`);
});