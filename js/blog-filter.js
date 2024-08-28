document.addEventListener('DOMContentLoaded', function() {
    const tags = document.querySelectorAll('.tag-filter .tag');
    const portfolioCards = document.querySelectorAll('.portfolio-card');

    // Set 'All' tag as selected by default
    document.querySelector('.tag-filter .tag.all').classList.add('selected');

    tags.forEach(tag => {
        tag.addEventListener('click', function() {
            // Remove 'selected' class from all tags
            tags.forEach(t => t.classList.remove('selected'));
            
            // Add 'selected' class to clicked tag
            this.classList.add('selected');

            const selectedTag = this.textContent.toLowerCase();
            
            portfolioCards.forEach(card => {
                const cardTags = card.querySelectorAll('.tag');
                if (selectedTag === 'all') {
                    card.style.display = 'flex';
                } else {
                    let shouldShow = false;
                    cardTags.forEach(cardTag => {
                        if (cardTag.textContent.toLowerCase() === selectedTag) {
                            shouldShow = true;
                        }
                    });
                    card.style.display = shouldShow ? 'flex' : 'none';
                }
            });
        });
    });
});