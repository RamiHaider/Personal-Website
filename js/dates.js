function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function getLastUpdated(filePath) {
    try {
        const username = 'RamiHaider';
        const repo = 'Personal-Website';
        
        const response = await fetch(
            `https://api.github.com/repos/${username}/${repo}/commits?path=${filePath}&page=1&per_page=1`,
            {
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        
        console.log('API Response:', response.status);
        
        if (!response.ok) {
            throw new Error(`GitHub API returned ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Commit data:', data);
        
        if (data && data[0]) {
            return formatDate(data[0].commit.committer.date);
        }
        return 'Not available';
    } catch (error) {
        console.error('Error fetching last update:', error);
        return 'Not available';
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    const dateElements = document.querySelectorAll('.date-info');
    
    for (const element of dateElements) {
        const filePath = element.getAttribute('data-file-path');
        if (filePath) {
            console.log('Fetching updates for:', filePath);
            const lastUpdate = await getLastUpdated(filePath);
            const updateElement = element.querySelector('.update-date');
            if (updateElement) {
                updateElement.textContent = lastUpdate;
            }
        }
    }
}); 