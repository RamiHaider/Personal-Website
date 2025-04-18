// posthog-custom.js - A more robust implementation designed for static sites
document.addEventListener('DOMContentLoaded', function() {
  // Define error handler first
  window.addEventListener('error', function(e) {
    if (e.filename && e.filename.includes('posthog')) {
      console.warn('PostHog error detected:', e.message);
    }
  });

  // Create a random ID if we need one
  function generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Get or create persistent ID
  var userId = localStorage.getItem('posthog_distinct_id');
  if (!userId) {
    userId = generateId();
    localStorage.setItem('posthog_distinct_id', userId);
  }

  // Load PostHog script manually
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.crossOrigin = 'anonymous';
  script.async = true;
  script.src = 'https://us-assets.i.posthog.com/static/array.js';
  script.onload = function() {
    // Initialize PostHog after script loads
    window.posthog.init('phc_LtwigGiWJKo91NSjtyY09ghDDwX82VPy7quao5TEMJB', {
      api_host: 'https://us.i.posthog.com',
      persistence: 'localStorage',
      cross_subdomain_cookie: false,
      loaded: function(ph) {
        // Force identification with our manually created ID
        ph.identify(userId);
        console.log('PostHog initialized with ID:', ph.get_distinct_id());
        
        // Re-capture pageview to ensure it has our ID
        setTimeout(function() {
          ph.capture('$pageview');
        }, 500);
      }
    });
    
    // Enable debug mode
    window.posthog.debug(true);
  };
  
  // Add script to page
  document.head.appendChild(script);
}); 