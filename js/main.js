document.addEventListener('DOMContentLoaded', function() {
    function loadComponent(id, url) {
        const element = document.getElementById(id);
        if (element) {
            console.log(`Attempting to load component: ${url}`); // Debug log
            fetch(url)
                .then(response => {
                    console.log(`Response status for ${url}:`, response.status); // Debug log
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.text();
                })
                .then(data => {
                    console.log(`Successfully loaded component: ${url}`); // Debug log
                    element.innerHTML = data;
                })
                .catch(error => {
                    console.error('Error loading component:', error);
                    element.innerHTML = `Error loading ${id}. Please refresh the page.`;
                });
        } else {
            console.error(`Element with id ${id} not found`); // Debug log
        }
    }

    // Get the current path and log it
    const currentPath = window.location.pathname;
    console.log('Current path:', currentPath);
    
    // Check if we're on GitHub Pages
    const isGitHubPages = window.location.hostname.includes('github.io');
    
    // Determine the root path
    let rootPath = './';
    if (currentPath.includes('/blog/') || 
        currentPath.includes('/portfolio/') || 
        currentPath.includes('/activities/') || 
        currentPath.includes('/contact/')) {
        rootPath = '../';
    }
    
    // If on GitHub Pages and there's a repository name in the path, adjust accordingly
    if (isGitHubPages) {
        const repoName = currentPath.split('/')[1];
        if (repoName && repoName !== '') {
            rootPath = currentPath.includes('/blog/') || 
                      currentPath.includes('/portfolio/') || 
                      currentPath.includes('/activities/') || 
                      currentPath.includes('/contact/') 
                ? `/${repoName}/` 
                : './';
        }
    }

    loadComponent('header', `${rootPath}components/header.html`);
});