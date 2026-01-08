/**
 * View Counter using CounterAPI.dev
 * Tracks and displays article view counts
 */

const ViewCounter = {
    namespace: 'ramihaider-blog',

    /**
     * Get the article slug from a filename or current page
     */
    getSlug(filename) {
        if (filename) {
            return filename.replace('.html', '').replace(/[^a-zA-Z0-9-]/g, '-');
        }
        const path = window.location.pathname;
        const match = path.match(/\/blog\/([^\/]+)\.html/);
        return match ? match[1] : null;
    },

    /**
     * Format view count for display
     */
    formatCount(count) {
        if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'k';
        }
        return count.toString();
    },

    /**
     * Increment and get view count (for article pages)
     */
    async incrementAndGetViews(slug) {
        if (!slug) return null;
        try {
            // CounterAPI.dev - up endpoint increments and returns count
            const response = await fetch(`https://api.counterapi.dev/v1/${this.namespace}/${slug}/up`);
            if (!response.ok) throw new Error('API error');
            const data = await response.json();
            return data.count;
        } catch (error) {
            console.warn('View counter unavailable:', error);
            return null;
        }
    },

    /**
     * Get view count without incrementing (for index page)
     */
    async getViews(slug) {
        if (!slug) return null;
        try {
            // CounterAPI.dev - get endpoint just returns count
            const response = await fetch(`https://api.counterapi.dev/v1/${this.namespace}/${slug}`);
            if (!response.ok) {
                // Counter might not exist yet, return 0
                if (response.status === 404) return 0;
                throw new Error('API error');
            }
            const data = await response.json();
            return data.count;
        } catch (error) {
            console.warn('View counter unavailable:', error);
            return null;
        }
    },

    /**
     * Update a single view counter element
     */
    updateElement(element, count) {
        if (count !== null && count !== undefined && count > 0) {
            element.textContent = `${this.formatCount(count)} views`;
            element.style.display = '';
        } else {
            element.style.display = 'none';
        }
    },

    /**
     * Initialize view counter on article page (increment + display)
     */
    async initArticlePage() {
        const slug = this.getSlug();
        if (!slug) return;

        const viewElement = document.querySelector('.article-views');
        if (!viewElement) return;

        const count = await this.incrementAndGetViews(slug);
        this.updateElement(viewElement, count);
    },

    /**
     * Initialize view counters on blog index page (display only)
     */
    async initIndexPage() {
        const viewElements = document.querySelectorAll('.post-views[data-article]');
        if (viewElements.length === 0) return;

        // Fetch all counts in parallel
        const promises = Array.from(viewElements).map(async (element) => {
            const article = element.getAttribute('data-article');
            const slug = this.getSlug(article);
            const count = await this.getViews(slug);
            this.updateElement(element, count);
        });

        await Promise.all(promises);
    }
};

// Auto-initialize based on page type
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    if (path.includes('/blog/') && !path.endsWith('/blog/') && !path.endsWith('/blog/index.html')) {
        // Individual article page
        ViewCounter.initArticlePage();
    } else if (path.includes('/blog')) {
        // Blog index page
        ViewCounter.initIndexPage();
    }
});
